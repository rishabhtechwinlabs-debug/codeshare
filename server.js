const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

// Map of roomId -> { code: string, language: string, users: Map(ws -> { id: string, name: string, color: string, cursor: { line: number, ch: number } }) }
const rooms = new Map();

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

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', (ws) => {
    let currentRoomId = null;
    let userId = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'join': {
            const { roomId, nickname } = data;
            currentRoomId = roomId;
            userId = Math.random().toString(36).substring(2, 9);
            
            if (!rooms.has(roomId)) {
              rooms.set(roomId, {
                code: '// Welcome to CodeSync! Share this URL with others to collaborate.\n',
                users: new Map()
              });
            }
            
            const room = rooms.get(roomId);
            const userObj = {
              id: userId,
              name: nickname || `User-${userId}`,
              color: getRandomColor(),
              cursor: null
            };
            
            room.users.set(ws, userObj);

            // Send current state to the joining user
            ws.send(JSON.stringify({
              type: 'init',
              code: room.code,
              userId: userId,
              users: getUserList(roomId)
            }));

            // Notify existing room members of the new join
            broadcastToRoom(roomId, {
              type: 'user-joined',
              user: userObj,
              users: getUserList(roomId)
            }, ws);

            break;
          }

          case 'code-update': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (room) {
              room.code = data.code;
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
                user.cursor = data.cursor; // { line, ch } or null
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
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (room) {
              const user = room.users.get(ws);
              if (user) {
                broadcastToRoom(currentRoomId, {
                  type: 'chat-message',
                  sender: user.name,
                  color: user.color,
                  text: data.text,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
              }
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
          
          // If room is empty, clean it up
          if (room.users.size === 0) {
            rooms.delete(currentRoomId);
          } else {
            // Notify remaining users
            broadcastToRoom(currentRoomId, {
              type: 'user-left',
              userId: userId,
              userName: departingUser.name,
              users: getUserList(currentRoomId)
            });
          }
        }
      }
    });
  });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url);

    // Only handle upgrades on our custom websocket endpoint /api/ws
    if (pathname === '/api/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> CodeSync Next.js Server ready on http://localhost:${PORT}`);
  });
});
