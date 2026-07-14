'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId;

  const [nickname, setNickname] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalNickname, setModalNickname] = useState('');
  
  // App State
  const [users, setUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [toasts, setToasts] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Refs for tracking mutable states inside listeners
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const myUserIdRef = useRef(null);
  const isRemoteChangeRef = useRef(false);
  const remoteCursorsRef = useRef(new Map());
  const nicknameRef = useRef('');

  // Setup nickname on mount
  useEffect(() => {
    const savedName = sessionStorage.getItem('nickname');
    if (savedName) {
      setNickname(savedName);
      nicknameRef.current = savedName;
    } else {
      setShowModal(true);
    }
  }, []);

  // Refresh CodeMirror layout when sidebar collapses/expands to prevent layout glitches
  useEffect(() => {
    if (editorRef.current) {
      const timer = setTimeout(() => {
        editorRef.current.refresh();
      }, 310);
      return () => clearTimeout(timer);
    }
  }, [isSidebarOpen]);

  // Toast Helper
  const showToast = (message, type = 'system-join') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3300);
  };

  // Main Editor & Socket initialization
  useEffect(() => {
    if (!nickname || !roomId) return; // Wait for nickname and roomId

    let socket = null;
    let editor = null;
    let checkInterval = null;
    let reconnectTimeout = null;

    const initEditorAndWS = () => {
      if (typeof window !== 'undefined' && window.CodeMirror) {
        clearInterval(checkInterval);
        
        // Initialize CodeMirror
        editor = window.CodeMirror.fromTextArea(document.getElementById('code-editor'), {
          lineNumbers: true,
          theme: 'dracula',
          mode: null, // Plain Text mode
          tabSize: 2,
          lineWrapping: true,
          matchBrackets: true,
          autoCloseBrackets: true
        });
        editorRef.current = editor;

        // Protocol mapping
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws`;
        socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          socket.send(JSON.stringify({
            type: 'join',
            roomId: roomId,
            nickname: nickname
          }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'init': {
                myUserIdRef.current = data.userId;
                isRemoteChangeRef.current = true;
                editor.setValue(data.code);
                isRemoteChangeRef.current = false;

                setUsers(data.users);
                break;
              }

              case 'code-update': {
                if (data.userId === myUserIdRef.current) return;
                isRemoteChangeRef.current = true;
                const cursor = editor.getCursor();
                const scrollInfo = editor.getScrollInfo();
                
                editor.setValue(data.code);
                
                editor.setCursor(cursor);
                editor.scrollTo(scrollInfo.left, scrollInfo.top);
                isRemoteChangeRef.current = false;
                break;
              }

              case 'user-joined': {
                showToast(`👥 ${data.user.name} joined the studio!`, 'join');
                setUsers(data.users);
                break;
              }

              case 'user-left': {
                showToast(`🚪 ${data.userName} left the studio.`, 'leave');
                setUsers(data.users);
                
                // Clear their cursor bookmark
                if (remoteCursorsRef.current.has(data.userId)) {
                  remoteCursorsRef.current.get(data.userId).clear();
                  remoteCursorsRef.current.delete(data.userId);
                }
                break;
              }

              case 'cursor-update': {
                if (data.userId === myUserIdRef.current) return;
                updateRemoteCursor(editor, data.userId, data.cursor, data.color, data.name);
                break;
              }

              case 'chat-message': {
                setChatMessages(prev => [...prev, {
                  sender: data.sender,
                  text: data.text,
                  color: data.color,
                  time: data.time
                }]);
                break;
              }
            }
          } catch (err) {
            console.error('Error processing websocket message:', err);
          }
        };

        socket.onclose = () => {
          showToast('⚠️ Connection lost. Retrying...', 'leave');
          reconnectTimeout = setTimeout(initEditorAndWS, 3000);
        };

        // Editor local changes listeners
        editor.on('change', () => {
          if (isRemoteChangeRef.current || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
          socketRef.current.send(JSON.stringify({
            type: 'code-update',
            code: editor.getValue()
          }));
        });

        editor.on('cursorActivity', () => {
          if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
          socketRef.current.send(JSON.stringify({
            type: 'cursor-update',
            cursor: editor.getCursor()
          }));
        });
      }
    };

    if (typeof window !== 'undefined' && window.CodeMirror) {
      initEditorAndWS();
    } else {
      checkInterval = setInterval(initEditorAndWS, 50);
    }

    return () => {
      clearInterval(checkInterval);
      clearTimeout(reconnectTimeout);
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
      }
      socketRef.current = null;
      if (editor) {
        editor.toTextArea();
      }
      editorRef.current = null;
    };
  }, [nickname, roomId]);

  // Scroll chat messages to bottom on updates
  useEffect(() => {
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatMessages]);

  // Update Remote User Cursor
  function updateRemoteCursor(editor, userId, cursor, color, name) {
    const cursorsMap = remoteCursorsRef.current;
    
    // Clear old bookmark
    if (cursorsMap.has(userId)) {
      cursorsMap.get(userId).clear();
      cursorsMap.delete(userId);
    }

    if (cursor) {
      const cursorEl = document.createElement('span');
      cursorEl.className = 'remote-cursor';
      cursorEl.style.borderLeft = `2px solid ${color}`;
      
      const labelEl = document.createElement('span');
      labelEl.className = 'remote-cursor-label';
      labelEl.style.backgroundColor = color;
      labelEl.innerText = name;
      cursorEl.appendChild(labelEl);

      cursorEl.classList.add('remote-cursor-active');
      setTimeout(() => {
        cursorEl.classList.remove('remote-cursor-active');
      }, 1500);

      const bookmark = editor.setBookmark(cursor, { widget: cursorEl, insertLeft: true });
      cursorsMap.set(userId, bookmark);
    }
  }

  // Clipboard Copier
  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('📋 Link copied to clipboard!', 'join');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  // Send Messages inside Chat
  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(JSON.stringify({
      type: 'chat-message',
      text: text
    }));
    setChatInput('');
  };

  // Submit Modal Nickname Form
  const handleModalSubmit = () => {
    const nameVal = modalNickname.trim();
    if (nameVal) {
      setNickname(nameVal);
      nicknameRef.current = nameVal;
      sessionStorage.setItem('nickname', nameVal);
      setShowModal(false);
    } else {
      const modalInput = document.getElementById('modal-nickname');
      if (modalInput) {
        modalInput.classList.add('error');
        setTimeout(() => modalInput.classList.remove('error'), 1000);
      }
    }
  };

  return (
    <div className="room-body">
      <div className="glow-bg"></div>

      {/* Header */}
      <header className="room-header">
        <div className="header-left">
          <a href="/" className="logo-link">
            <div className="logo" style={{ fontSize: '1.4rem' }}>
              <span className="logo-bracket">&lt;</span>
              <span className="logo-text">CodeSync</span>
              <span className="logo-bracket">/&gt;</span>
            </div>
          </a>
          <div className="room-info">
            <span className="room-label">ROOM:</span>
            <span className="room-id">{roomId || '--------'}</span>
            <button className="header-btn" onClick={handleShare} title="Copy Share Link">
              <span>Share Link</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <button className="header-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title={isSidebarOpen ? "Hide Chat" : "Show Chat"}>
              <span>{isSidebarOpen ? '💬 Hide Chat' : '💬 Show Chat'}</span>
            </button>
          </div>
        </div>

        <div className="header-right">
          <div className="user-presence">
            {users.map(u => (
              <div key={u.id} className="user-avatar" style={{ backgroundColor: u.color }}>
                {u.name.substring(0, 2).toUpperCase()}
                <span className="tooltip">{u.name}{u.id === myUserIdRef.current ? ' (You)' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Workspace */}
      <div className="workspace">
        {/* Editor Pane */}
        <div className="pane editor-pane">
          <textarea id="code-editor" style={{ display: 'none' }}></textarea>
        </div>

        {/* Sidebar Pane (Chat Only, Collapsible) */}
        <div className={`pane sidebar-pane ${isSidebarOpen ? '' : 'collapsed'}`}>
          <div className="sidebar-tabs" style={{ display: 'flex', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-color)', letterSpacing: '0.05em' }}>💬 LIVE STUDIO CHAT</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div className="chat-messages">
              <div className="chat-bubble system">
                Welcome to the room chat! Messages here are shared with everyone in the room.
              </div>
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-bubble ${msg.sender === nickname ? 'me' : ''}`}>
                  <div className="bubble-meta">
                    <span style={{ color: msg.color }}>{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <div>{msg.text}</div>
                </div>
              ))}
            </div>
            <div className="chat-input-area">
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSendChat();
                }}
              />
              <button onClick={handleSendChat}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nickname Modal */}
      <div className={`modal ${showModal ? 'open' : ''}`}>
        <div className="modal-content glass-card">
          <h3>Enter Nickname</h3>
          <p>Please choose a nickname to join this room.</p>
          <input 
            type="text" 
            id="modal-nickname" 
            placeholder="e.g. CodeStar" 
            maxLength={15}
            value={modalNickname}
            onChange={(e) => setModalNickname(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleModalSubmit();
            }}
          />
          <button className="btn btn-primary" onClick={handleModalSubmit}>Join Room</button>
        </div>
      </div>

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type === 'leave' ? 'system-leave' : ''}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
