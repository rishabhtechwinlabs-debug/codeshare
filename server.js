const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');
const { supabase } = require('./src/lib/supabase');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

// Map of roomId -> { code: string, users: Map(ws -> { id: string, name: string, color: string, cursor: object }), messages: Array, typingUsers: Map, password: string|null }
const rooms = new Map();
const codeSaveDebounceTimers = new Map(); // roomId -> setTimeout handle

// Helper to generate a random bright color for users
function getRandomColor() {
  const colors = [
    '#ff5733', '#33ff57', '#3357ff', '#f3ff33', '#ff33f3',
    '#33fff3', '#ff8333', '#8333ff', '#33ff83', '#ff3383',
    '#00d4ff', '#ff007f', '#e0b0ff', '#39ff14', '#ff7518'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Broadcast to all clients in a room except optionally the sender
function broadcastToRoom(roomId, messageObj, excludeWs = null) {
  const room = rooms.get(roomId);
  if (!room) return;

  const rawMessage = JSON.stringify(messageObj);
  for (const clientWs of room.users.keys()) {
    if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(rawMessage);
    }
  }
}

// Get user list in a room as a clean array for serialization
function getUserList(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.users.values());
}

// Supabase DB Persistence Helpers
async function getOrLoadRoom(roomId) {
  if (rooms.has(roomId)) {
    return rooms.get(roomId);
  }

  const roomData = {
    code: '// Welcome to HiveCode! Share this URL with others to collaborate.\n',
    users: new Map(),
    messages: [],
    typingUsers: new Map(),
    password: null
  };

  if (supabase) {
    try {
      const { data: dbRoom } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (dbRoom) {
        roomData.code = dbRoom.code || roomData.code;
        roomData.password = dbRoom.password || null;

        const { data: dbMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (dbMessages && dbMessages.length > 0) {
          roomData.messages = dbMessages.map(m => ({
            id: m.id,
            sender: m.sender,
            senderId: m.sender_id,
            color: m.color,
            text: m.text,
            isGif: m.is_gif,
            replyTo: m.reply_to,
            reactions: m.reactions || {},
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
        }
      }
    } catch (err) {
      // Room load fallback
    }
  }

  rooms.set(roomId, roomData);
  return roomData;
}

function scheduleCodeSave(roomId, code) {
  if (!supabase) return;

  if (codeSaveDebounceTimers.has(roomId)) {
    clearTimeout(codeSaveDebounceTimers.get(roomId));
  }

  const timer = setTimeout(async () => {
    try {
      await supabase
        .from('rooms')
        .upsert({
          id: roomId,
          code: code,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (err) {
      console.error(`Error saving room code for ${roomId}:`, err.message);
    } finally {
      codeSaveDebounceTimers.delete(roomId);
    }
  }, 2000);

  codeSaveDebounceTimers.set(roomId, timer);
}

async function saveMessageToDB(roomId, msgObj) {
  if (!supabase) return;
  try {
    await supabase.from('rooms').upsert({ id: roomId }, { onConflict: 'id' });
    await supabase.from('messages').insert({
      id: msgObj.id,
      room_id: roomId,
      sender: msgObj.sender,
      sender_id: msgObj.senderId,
      color: msgObj.color,
      text: msgObj.text,
      is_gif: msgObj.isGif,
      reply_to: msgObj.replyTo,
      reactions: msgObj.reactions || {}
    });
  } catch (err) {
    console.error('Error saving message to Supabase:', err.message);
  }
}

async function updateMessageReactionsInDB(messageId, reactions) {
  if (!supabase) return;
  try {
    await supabase.from('messages').update({
      reactions: reactions || {}
    }).eq('id', messageId);
  } catch (err) {
    console.error('Error updating reactions in Supabase:', err.message);
  }
}

async function updateRoomPasswordInDB(roomId, password) {
  if (!supabase) return;
  try {
    await supabase.from('rooms').upsert({
      id: roomId,
      password: password,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Error updating room password in Supabase:', err.message);
  }
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    if (pathname === '/api/rooms') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      const activeRooms = Array.from(rooms.entries()).map(([id, room]) => ({
        id,
        userCount: room.users.size,
        isLocked: !!room.password
      }));
      res.end(JSON.stringify({ rooms: activeRooms }));
      return;
    }

    handle(req, res, parsedUrl);
  });

  const wss = new WebSocket.Server({ noServer: true });

  // Heartbeat ping interval (30s) to terminate dead/unresponsive connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', (ws) => {
    let currentRoomId = null;
    let userId = null;

    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case 'join': {
            const { roomId, nickname, password } = data;

            let isNewRoom = !rooms.has(roomId);
            const room = await getOrLoadRoom(roomId);

            // Verify Password
            if (room.password && password !== room.password) {
              ws.send(JSON.stringify({
                type: 'auth-required',
                error: password ? 'Incorrect password! Please try again.' : null
              }));

              if (isNewRoom && room.users.size === 0) {
                rooms.delete(roomId);
              }
              break;
            }

            currentRoomId = roomId;
            userId = Math.random().toString(36).substring(2, 9);
            const cleanNickname = (nickname || '').trim().substring(0, 20) || `User-${userId}`;

            const userObj = {
              id: userId,
              name: cleanNickname,
              color: getRandomColor(),
              cursor: null
            };

            room.users.set(ws, userObj);

            // Send current state to joining user
            ws.send(JSON.stringify({
              type: 'init',
              code: room.code,
              userId: userId,
              users: getUserList(roomId),
              messages: room.messages,
              typingUsers: Array.from(room.typingUsers.entries()).map(([id, name]) => ({ id, name })),
              isLocked: !!room.password
            }));

            // Notify existing room members of new join
            broadcastToRoom(roomId, {
              type: 'user-joined',
              user: userObj,
              users: getUserList(roomId)
            }, ws);

            break;
          }

          case 'code-update': {
            if (!currentRoomId || typeof data.code !== 'string' || data.code.length > 500000) return;
            const room = rooms.get(currentRoomId);
            if (room) {
              room.code = data.code;
              scheduleCodeSave(currentRoomId, data.code);
              broadcastToRoom(currentRoomId, {
                type: 'code-update',
                code: data.code,
                userId: userId
              }, ws);
            }
            break;
          }

          case 'cursor-update': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (room) {
              const user = room.users.get(ws);
              if (user) {
                user.cursor = data.cursor;
                broadcastToRoom(currentRoomId, {
                  type: 'cursor-update',
                  userId: userId,
                  cursor: data.cursor,
                  color: user.color,
                  name: user.name
                }, ws);
              }
            }
            break;
          }

          case 'chat-message': {
            if (!currentRoomId || typeof data.text !== 'string' || !data.text.trim() || data.text.length > 2000) return;
            const room = rooms.get(currentRoomId);
            if (room) {
              const user = room.users.get(ws);
              if (user) {
                const msgId = Math.random().toString(36).substring(2, 9);
                const messageObj = {
                  id: msgId,
                  sender: user.name,
                  senderId: userId,
                  color: user.color,
                  text: data.text.trim(),
                  isGif: !!data.isGif,
                  replyTo: data.replyTo || null,
                  reactions: {},
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };

                room.messages.push(messageObj);
                if (room.messages.length > 100) {
                  room.messages.shift();
                }

                saveMessageToDB(currentRoomId, messageObj);

                broadcastToRoom(currentRoomId, {
                  type: 'chat-message',
                  message: messageObj
                });
              }
            }
            break;
          }

          case 'chat-reaction': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (room) {
              const user = room.users.get(ws);
              if (user) {
                const { messageId, emoji } = data;
                const msgObj = room.messages.find(m => m.id === messageId);
                if (msgObj) {
                  if (!msgObj.reactions) {
                    msgObj.reactions = {};
                  }
                  if (!msgObj.reactions[emoji]) {
                    msgObj.reactions[emoji] = [];
                  }

                  const index = msgObj.reactions[emoji].indexOf(user.name);
                  if (index > -1) {
                    msgObj.reactions[emoji].splice(index, 1);
                    if (msgObj.reactions[emoji].length === 0) {
                      delete msgObj.reactions[emoji];
                    }
                  } else {
                    msgObj.reactions[emoji].push(user.name);
                  }

                  updateMessageReactionsInDB(messageId, msgObj.reactions);

                  broadcastToRoom(currentRoomId, {
                    type: 'chat-reaction-update',
                    messageId: messageId,
                    reactions: msgObj.reactions
                  });
                }
              }
            }
            break;
          }

          case 'typing-start': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (room) {
              const user = room.users.get(ws);
              if (user) {
                room.typingUsers.set(userId, user.name);
                broadcastToRoom(currentRoomId, {
                  type: 'typing-update',
                  typingUsers: Array.from(room.typingUsers.entries()).map(([id, name]) => ({ id, name }))
                }, ws);
              }
            }
            break;
          }

          case 'typing-stop': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (room) {
              room.typingUsers.delete(userId);
              broadcastToRoom(currentRoomId, {
                type: 'typing-update',
                typingUsers: Array.from(room.typingUsers.entries()).map(([id, name]) => ({ id, name }))
              }, ws);
            }
            break;
          }

          case 'set-room-password': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (room) {
              room.password = data.password;
              updateRoomPasswordInDB(currentRoomId, data.password);
              broadcastToRoom(currentRoomId, {
                type: 'room-lock-status',
                isLocked: true
              });
            }
            break;
          }

          case 'remove-room-password': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (room) {
              room.password = null;
              updateRoomPasswordInDB(currentRoomId, null);
              broadcastToRoom(currentRoomId, {
                type: 'room-lock-status',
                isLocked: false
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error('Error handling websocket message:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && rooms.has(currentRoomId)) {
        const room = rooms.get(currentRoomId);
        const departingUser = room.users.get(ws);

        if (departingUser) {
          room.users.delete(ws);
          if (userId) {
            room.typingUsers.delete(userId);
          }
        }

        if (room.users.size === 0) {
          // Flush pending debounced code saves immediately before deleting room from memory
          if (codeSaveDebounceTimers.has(currentRoomId)) {
            clearTimeout(codeSaveDebounceTimers.get(currentRoomId));
            codeSaveDebounceTimers.delete(currentRoomId);
            if (supabase) {
              supabase.from('rooms').upsert({
                id: currentRoomId,
                code: room.code,
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' }).then().catch(err => {
                console.error('Error flushing final code update on room close:', err.message);
              });
            }
          }
          rooms.delete(currentRoomId);
        } else if (departingUser) {
          broadcastToRoom(currentRoomId, {
            type: 'user-left',
            userId: userId,
            userName: departingUser.name,
            users: getUserList(currentRoomId)
          });
          broadcastToRoom(currentRoomId, {
            type: 'typing-update',
            typingUsers: Array.from(room.typingUsers.entries()).map(([id, name]) => ({ id, name }))
          });
        }
      }
    });
  });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url);

    if (pathname === '/api/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> HiveCode Next.js Server ready on http://localhost:${PORT}`);
  });
});
