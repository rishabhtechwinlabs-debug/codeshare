const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');
const { supabase } = require('./src/lib/supabase');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

// Map of roomId -> { files: object, users: Map, messages: Array, typingUsers: Map, password: string|null, theme: string, hostUserId: string, isPresenterMode: boolean, snapshots: Array }
const rooms = new Map();
const fileSaveDebounceTimers = new Map();

function getRandomColor() {
  const colors = [
    '#ff5733', '#33ff57', '#3357ff', '#f3ff33', '#ff33f3',
    '#33fff3', '#ff8333', '#8333ff', '#33ff83', '#ff3383',
    '#00d4ff', '#ff007f', '#e0b0ff', '#39ff14', '#ff7518'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

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

function sendToUser(roomId, targetUserId, messageObj) {
  const room = rooms.get(roomId);
  if (!room) return;

  const rawMessage = JSON.stringify(messageObj);
  for (const [ws, user] of room.users.entries()) {
    if (user.id === targetUserId && ws.readyState === WebSocket.OPEN) {
      ws.send(rawMessage);
      break;
    }
  }
}

function getUserList(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.users.values());
}

async function getOrLoadRoom(roomId) {
  if (rooms.has(roomId)) {
    return rooms.get(roomId);
  }

  const defaultFiles = {
    'index.js': {
      content: '// Welcome to HiveCode! Share this URL with others to collaborate.\nconsole.log("Hello World from HiveCode!");\n',
      language: 'javascript'
    }
  };

  const roomData = {
    files: defaultFiles,
    activeFile: 'index.js',
    theme: 'dracula',
    users: new Map(),
    messages: [],
    typingUsers: new Map(),
    password: null,
    hostUserId: null,
    isPresenterMode: false,
    snapshots: []
  };

  if (supabase) {
    try {
      const { data: dbRoom } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (dbRoom) {
        if (dbRoom.files && Object.keys(dbRoom.files).length > 0) {
          roomData.files = dbRoom.files;
          roomData.activeFile = Object.keys(dbRoom.files)[0];
        } else if (dbRoom.code) {
          roomData.files = {
            'index.js': { content: dbRoom.code, language: 'javascript' }
          };
        }
        roomData.password = dbRoom.password || null;
        if (dbRoom.snapshots && Array.isArray(dbRoom.snapshots)) {
          roomData.snapshots = dbRoom.snapshots;
        }

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
      // Supabase fallback
    }
  }

  rooms.set(roomId, roomData);
  return roomData;
}

function scheduleFileSave(roomId, files) {
  if (!supabase) return;

  if (fileSaveDebounceTimers.has(roomId)) {
    clearTimeout(fileSaveDebounceTimers.get(roomId));
  }

  const timer = setTimeout(async () => {
    try {
      const defaultCode = files['index.js']?.content || Object.values(files)[0]?.content || '';
      await supabase
        .from('rooms')
        .upsert({
          id: roomId,
          files: files,
          code: defaultCode,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (err) {
      console.error(`Error saving room files for ${roomId}:`, err.message);
    } finally {
      fileSaveDebounceTimers.delete(roomId);
    }
  }, 2000);

  fileSaveDebounceTimers.set(roomId, timer);
}

async function saveSnapshotsToDB(roomId, snapshots) {
  if (!supabase) return;
  try {
    await supabase.from('rooms').upsert({
      id: roomId,
      snapshots: snapshots,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Error saving snapshots to Supabase:', err.message);
  }
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
        isLocked: !!room.password,
        isPresenterMode: room.isPresenterMode
      }));
      res.end(JSON.stringify({ rooms: activeRooms }));
      return;
    }

    handle(req, res, parsedUrl);
  });

  const wss = new WebSocket.Server({ noServer: true });

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

            if (!room.hostUserId || room.users.size === 1) {
              room.hostUserId = userId;
            }

            const hostUser = Array.from(room.users.values()).find(u => u.id === room.hostUserId);

            ws.send(JSON.stringify({
              type: 'init',
              files: room.files,
              activeFile: room.activeFile || Object.keys(room.files)[0],
              theme: room.theme || 'dracula',
              userId: userId,
              isHost: userId === room.hostUserId,
              hostUserId: room.hostUserId,
              hostName: hostUser ? hostUser.name : 'Host',
              isPresenterMode: room.isPresenterMode,
              snapshots: room.snapshots || [],
              users: getUserList(roomId),
              messages: room.messages,
              typingUsers: Array.from(room.typingUsers.entries()).map(([id, name]) => ({ id, name })),
              isLocked: !!room.password
            }));

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
              // Enforce presenter mode lock for non-hosts
              if (room.isPresenterMode && userId !== room.hostUserId) return;

              const filename = data.filename || room.activeFile || 'index.js';
              if (!room.files[filename]) {
                room.files[filename] = { content: '', language: 'javascript' };
              }
              room.files[filename].content = data.code;
              scheduleFileSave(currentRoomId, room.files);

              broadcastToRoom(currentRoomId, {
                type: 'code-update',
                filename: filename,
                code: data.code,
                userId: userId
              }, ws);
            }
            break;
          }

          case 'toggle-presenter-mode': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (room && userId === room.hostUserId) {
              room.isPresenterMode = !!data.isPresenterMode;
              const hostUser = room.users.get(ws);
              broadcastToRoom(currentRoomId, {
                type: 'presenter-mode-update',
                isPresenterMode: room.isPresenterMode,
                hostName: hostUser ? hostUser.name : 'Host'
              });
            }
            break;
          }

          case 'create-snapshot': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (room) {
              const user = room.users.get(ws);
              const snapshotObj = {
                id: Math.random().toString(36).substring(2, 9),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                filename: data.filename || room.activeFile,
                code: data.code || room.files[data.filename || room.activeFile]?.content || '',
                author: user ? user.name : 'System',
                note: data.note || 'Manual version snapshot'
              };

              room.snapshots.unshift(snapshotObj);
              if (room.snapshots.length > 50) room.snapshots.pop();
              saveSnapshotsToDB(currentRoomId, room.snapshots);

              broadcastToRoom(currentRoomId, {
                type: 'snapshot-created',
                snapshot: snapshotObj,
                snapshots: room.snapshots
              });
            }
            break;
          }

          case 'restore-snapshot': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (room) {
              if (room.isPresenterMode && userId !== room.hostUserId) return;

              const filename = data.filename || room.activeFile;
              if (room.files[filename]) {
                room.files[filename].content = data.code;
                scheduleFileSave(currentRoomId, room.files);

                broadcastToRoom(currentRoomId, {
                  type: 'code-update',
                  filename: filename,
                  code: data.code,
                  userId: userId
                });
              }
            }
            break;
          }

          case 'webrtc-signal': {
            if (!currentRoomId || !data.targetUserId) return;
            const user = rooms.get(currentRoomId)?.users.get(ws);
            sendToUser(currentRoomId, data.targetUserId, {
              type: 'webrtc-signal',
              senderUserId: userId,
              senderName: user ? user.name : 'Peer',
              signal: data.signal
            });
            break;
          }

          case 'file-create': {
            if (!currentRoomId || typeof data.filename !== 'string') return;
            const room = rooms.get(currentRoomId);
            if (room) {
              if (room.isPresenterMode && userId !== room.hostUserId) return;

              const filename = data.filename.trim();
              if (filename && !room.files[filename]) {
                room.files[filename] = {
                  content: data.content || '',
                  language: data.language || 'javascript'
                };
                room.activeFile = filename;
                scheduleFileSave(currentRoomId, room.files);

                broadcastToRoom(currentRoomId, {
                  type: 'file-create',
                  filename: filename,
                  content: room.files[filename].content,
                  language: room.files[filename].language,
                  userId: userId
                });
              }
            }
            break;
          }

          case 'file-delete': {
            if (!currentRoomId || typeof data.filename !== 'string') return;
            const room = rooms.get(currentRoomId);
            if (room) {
              if (room.isPresenterMode && userId !== room.hostUserId) return;

              const filename = data.filename.trim();
              if (room.files[filename] && Object.keys(room.files).length > 1) {
                delete room.files[filename];
                if (room.activeFile === filename) {
                  room.activeFile = Object.keys(room.files)[0];
                }
                scheduleFileSave(currentRoomId, room.files);

                broadcastToRoom(currentRoomId, {
                  type: 'file-delete',
                  filename: filename,
                  activeFile: room.activeFile,
                  userId: userId
                });
              }
            }
            break;
          }

          case 'file-rename': {
            if (!currentRoomId || typeof data.oldFilename !== 'string' || typeof data.newFilename !== 'string') return;
            const room = rooms.get(currentRoomId);
            if (room) {
              if (room.isPresenterMode && userId !== room.hostUserId) return;

              const oldName = data.oldFilename.trim();
              const newName = data.newFilename.trim();
              if (oldName && newName && room.files[oldName] && !room.files[newName]) {
                room.files[newName] = room.files[oldName];
                delete room.files[oldName];
                if (room.activeFile === oldName) {
                  room.activeFile = newName;
                }
                scheduleFileSave(currentRoomId, room.files);

                broadcastToRoom(currentRoomId, {
                  type: 'file-rename',
                  oldFilename: oldName,
                  newFilename: newName,
                  userId: userId
                });
              }
            }
            break;
          }

          case 'language-update': {
            if (!currentRoomId || typeof data.language !== 'string') return;
            const room = rooms.get(currentRoomId);
            if (room) {
              const filename = data.filename || room.activeFile || 'index.js';
              if (room.files[filename]) {
                room.files[filename].language = data.language;
                scheduleFileSave(currentRoomId, room.files);

                broadcastToRoom(currentRoomId, {
                  type: 'language-update',
                  filename: filename,
                  language: data.language,
                  userId: userId
                });
              }
            }
            break;
          }

          case 'theme-update': {
            if (!currentRoomId || typeof data.theme !== 'string') return;
            const room = rooms.get(currentRoomId);
            if (room) {
              room.theme = data.theme;
              broadcastToRoom(currentRoomId, {
                type: 'theme-update',
                theme: data.theme,
                userId: userId
              });
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
                  filename: data.filename || room.activeFile,
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

        // Reassign host if host left
        if (room.hostUserId === userId && room.users.size > 0) {
          const nextHost = Array.from(room.users.values())[0];
          room.hostUserId = nextHost.id;
          broadcastToRoom(currentRoomId, {
            type: 'host-reassigned',
            newHostUserId: nextHost.id,
            newHostName: nextHost.name
          });
        }

        if (room.users.size === 0) {
          if (fileSaveDebounceTimers.has(currentRoomId)) {
            clearTimeout(fileSaveDebounceTimers.get(currentRoomId));
            fileSaveDebounceTimers.delete(currentRoomId);
            if (supabase) {
              const defaultCode = room.files['index.js']?.content || Object.values(room.files)[0]?.content || '';
              supabase.from('rooms').upsert({
                id: currentRoomId,
                files: room.files,
                code: defaultCode,
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
