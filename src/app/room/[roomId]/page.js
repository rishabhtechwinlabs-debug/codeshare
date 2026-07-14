'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

const EMOJIS = ['😀', '😂', '😍', '👍', '🎉', '🔥', '❤️', '👏', '🚀', '💡', '😢', '😮', '🤔', '🙌', '👀', '💯', '✨', '⚡', '💻', '🎨'];

const DEFAULT_DEVELOPER_GIFS = [
  { title: "Welcome / Hello", url: "https://user-images.githubusercontent.com/74038190/213866269-5d00981c-7c98-46d7-8a8e-16f462f15227.gif" },
  { title: "HTML Code Animation", url: "https://user-images.githubusercontent.com/74038190/212257454-16e3712e-945a-4ca2-b238-408ad0bf87e6.gif" },
  { title: "CSS Styles Animation", url: "https://user-images.githubusercontent.com/74038190/212257472-08e52665-c503-4bd9-aa20-f5a4dae769b5.gif" },
  { title: "JS Script Animation", url: "https://user-images.githubusercontent.com/74038190/212257468-1e9a91f1-b626-4baa-b15d-5c385dfa7ed2.gif" },
  { title: "React Components", url: "https://user-images.githubusercontent.com/74038190/212257465-7ce8d493-cac5-494e-982a-5a9deb852c4b.gif" },
  { title: "Coding Octocat", url: "https://user-images.githubusercontent.com/74038190/212741999-016fddbd-617a-4448-8042-0ecf907aea25.gif" },
  { title: "Python Scripting", url: "https://user-images.githubusercontent.com/74038190/212281756-450d3ffa-9335-4b98-a965-db8a18fee927.gif" },
  { title: "Typescript Dev", url: "https://user-images.githubusercontent.com/74038190/212280805-9bcb336b-8c55-46a8-abf8-ff286ab55472.gif" },
  { title: "Docker Devops", url: "https://user-images.githubusercontent.com/74038190/212280823-79088828-a258-4a4d-8d6c-96315d5a07af.gif" },
  { title: "Git Version Control", url: "https://user-images.githubusercontent.com/74038190/212281763-e6ecd7ef-c4aa-45b6-a97c-f33f6bb592bd.gif" },
  { title: "Node JS Backend", url: "https://user-images.githubusercontent.com/74038190/212281775-b468df30-4edc-4bf8-a4ee-f52e1aaddc86.gif" },
  { title: "Database Schema", url: "https://user-images.githubusercontent.com/74038190/212281780-0afd9616-8310-46e9-a898-c4f5269f1387.gif" }
];

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

  // Chat Advanced States
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  // Authentication & Room Lock States
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [newRoomPassword, setNewRoomPassword] = useState('');

  // Refs for tracking typing status
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const gifCacheRef = useRef({});
  const gifDebounceTimeoutRef = useRef(null);

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
          const savedPw = sessionStorage.getItem('room_pw_' + roomId) || '';
          socket.send(JSON.stringify({
            type: 'join',
            roomId: roomId,
            nickname: nickname,
            password: savedPw
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
                if (data.messages) {
                  setChatMessages(data.messages);
                }
                if (data.typingUsers) {
                  setTypingUsers(data.typingUsers.filter(u => u.id !== data.userId));
                }
                
                setIsAuthRequired(false);
                setAuthError('');
                setIsRoomLocked(!!data.isLocked);
                if (authPassword) {
                  sessionStorage.setItem('room_pw_' + roomId, authPassword);
                }
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
                setChatMessages(prev => [...prev, data.message]);
                break;
              }

              case 'chat-reaction-update': {
                setChatMessages(prev => prev.map(msg => {
                  if (msg.id === data.messageId) {
                    return { ...msg, reactions: data.reactions };
                  }
                  return msg;
                }));
                break;
              }

              case 'typing-update': {
                setTypingUsers(data.typingUsers.filter(u => u.id !== myUserIdRef.current));
                break;
              }

              case 'auth-required': {
                setIsAuthRequired(true);
                if (data.error) {
                  setAuthError(data.error);
                }
                break;
              }

              case 'room-lock-status': {
                setIsRoomLocked(data.isLocked);
                if (!data.isLocked) {
                  sessionStorage.removeItem('room_pw_' + roomId);
                  setAuthPassword('');
                }
                showToast(data.isLocked ? '🔒 Room is now password protected!' : '🔓 Room is now unlocked!', 'join');
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
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (gifDebounceTimeoutRef.current) {
        clearTimeout(gifDebounceTimeoutRef.current);
      }
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

  // Typing state control
  const sendTypingStart = () => {
    if (!isTypingRef.current && socketRef.current && socketRef.current.readyState === 1) {
      isTypingRef.current = true;
      socketRef.current.send(JSON.stringify({ type: 'typing-start' }));
    }
  };

  const sendTypingStop = () => {
    if (isTypingRef.current && socketRef.current && socketRef.current.readyState === 1) {
      isTypingRef.current = false;
      socketRef.current.send(JSON.stringify({ type: 'typing-stop' }));
    }
  };

  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
    if (e.target.value.trim().length > 0) {
      sendTypingStart();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStop();
      }, 2000);
    } else {
      sendTypingStop();
    }
  };

  const handleReact = (messageId, emoji) => {
    if (!socketRef.current || socketRef.current.readyState !== 1) return;
    socketRef.current.send(JSON.stringify({
      type: 'chat-reaction',
      messageId,
      emoji
    }));
  };

  const handleEmojiClick = (emoji) => {
    setChatInput(prev => prev + emoji);
    setShowEmojiPicker(false);
    sendTypingStart();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop();
    }, 2000);
  };

  const loadDefaultGifs = async () => {
    setLoadingGifs(true);
    const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'dc6zaTOxFJmzC';
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=coding&limit=6`);
      const result = await res.json();
      if (result.data && result.data.length > 0) {
        setGifs(result.data.map(item => ({
          title: item.title,
          url: item.images.downsized_medium?.url || item.images.original?.url
        })));
      } else {
        setGifs(DEFAULT_DEVELOPER_GIFS);
      }
    } catch (e) {
      console.error('Error preloading default gifs:', e);
      setGifs(DEFAULT_DEVELOPER_GIFS);
    } finally {
      setLoadingGifs(false);
    }
  };

  const handleGifSearch = (query) => {
    setGifQuery(query);
    
    if (gifDebounceTimeoutRef.current) {
      clearTimeout(gifDebounceTimeoutRef.current);
    }

    if (!query.trim()) {
      loadDefaultGifs();
      return;
    }

    // Debounce API requests by 500ms
    gifDebounceTimeoutRef.current = setTimeout(async () => {
      // Check client-side query cache first
      const normalizedQuery = query.trim().toLowerCase();
      if (gifCacheRef.current[normalizedQuery]) {
        setGifs(gifCacheRef.current[normalizedQuery]);
        return;
      }

      setLoadingGifs(true);
      const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'dc6zaTOxFJmzC';
      try {
        const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=6`);
        const result = await res.json();
        if (result.data && result.data.length > 0) {
          const formatted = result.data.map(item => ({
            title: item.title,
            url: item.images.downsized_medium?.url || item.images.original?.url
          }));
          
          // Cache the formatted result set
          gifCacheRef.current[normalizedQuery] = formatted;
          setGifs(formatted);
        } else {
          // Fallback to client-side local search filtering
          const filtered = DEFAULT_DEVELOPER_GIFS.filter(gif =>
            gif.title.toLowerCase().includes(query.toLowerCase())
          );
          setGifs(filtered);
        }
      } catch (e) {
        console.error('Error searching Giphy, falling back to local query filtering:', e);
        const filtered = DEFAULT_DEVELOPER_GIFS.filter(gif =>
          gif.title.toLowerCase().includes(query.toLowerCase())
        );
        setGifs(filtered);
      } finally {
        setLoadingGifs(false);
      }
    }, 500);
  };

  const handleSendGif = (url) => {
    handleSendChat(url, true);
    setShowGifPicker(false);
  };

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`chat-msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-flash');
      setTimeout(() => el.classList.remove('highlight-flash'), 1500);
    }
  };

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
  const handleSendChat = (customText = null, isGif = false) => {
    const textObj = customText !== null ? customText : chatInput;
    const text = typeof textObj === 'string' ? textObj.trim() : '';
    if (!text || !socketRef.current || socketRef.current.readyState !== 1) return;

    socketRef.current.send(JSON.stringify({
      type: 'chat-message',
      text: text,
      isGif: isGif,
      replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender, text: replyingTo.text } : null
    }));

    if (customText === null) {
      setChatInput('');
    }
    setReplyingTo(null);
    sendTypingStop();
  };

  const handleAuthSubmit = (e) => {
    if (e) e.preventDefault();
    if (!authPassword.trim()) return;

    if (socketRef.current && socketRef.current.readyState === 1) {
      socketRef.current.send(JSON.stringify({
        type: 'join',
        roomId: roomId,
        nickname: nickname,
        password: authPassword
      }));
    }
  };

  const handleSetLockSubmit = (e) => {
    if (e) e.preventDefault();
    if (!newRoomPassword.trim()) return;

    if (socketRef.current && socketRef.current.readyState === 1) {
      socketRef.current.send(JSON.stringify({
        type: 'set-room-password',
        password: newRoomPassword
      }));
    }
    sessionStorage.setItem('room_pw_' + roomId, newRoomPassword);
    setNewRoomPassword('');
    setShowLockModal(false);
  };

  const handleRemoveLock = () => {
    if (socketRef.current && socketRef.current.readyState === 1) {
      socketRef.current.send(JSON.stringify({
        type: 'remove-room-password'
      }));
    }
    setShowLockModal(false);
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
              <span className="logo-text">HiveCode</span>
              <span className="logo-bracket">/&gt;</span>
            </div>
          </a>
          <div className="room-info">
            <span className="room-label">ROOM:</span>
            <span className="room-id">{roomId || '--------'}</span>
            <button className="header-btn" onClick={handleShare} title="Copy Share Link">
              <span className="btn-text">Share Link</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <button className={`header-btn lock-btn ${isRoomLocked ? 'locked' : ''}`} onClick={() => setShowLockModal(true)} title={isRoomLocked ? "Room is Password Protected" : "Set Password"}>
              <span>{isRoomLocked ? '🔒 Locked' : '🔓 Unlocked'}</span>
            </button>
            <button className="header-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title={isSidebarOpen ? "Hide Chat" : "Show Chat"}>
              <span>💬</span>
              <span className="btn-text">{isSidebarOpen ? ' Hide Chat' : ' Show Chat'}</span>
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

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative' }}>
            <div className="chat-messages">
              <div className="chat-bubble system">
                Welcome to the room chat! Messages here are shared with everyone in the room.
              </div>
              {chatMessages.map((msg, index) => (
                <div key={msg.id || index} id={`chat-msg-${msg.id}`} className={`chat-bubble ${msg.sender === nickname ? 'me' : ''}`}>
                  {msg.replyTo && (
                    <div className="quoted-reply-box" onClick={() => scrollToMessage(msg.replyTo.id)}>
                      <div className="quoted-reply-sender">{msg.replyTo.sender}</div>
                      <div className="quoted-reply-text">{msg.replyTo.text}</div>
                    </div>
                  )}
                  
                  <div className="bubble-meta">
                    <span style={{ color: msg.color }}>{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>

                  {msg.isGif ? (
                    <img src={msg.text} alt="gif" className="chat-gif-img" />
                  ) : (
                    <div className="chat-msg-text">{msg.text}</div>
                  )}

                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="message-reactions-badges">
                      {Object.entries(msg.reactions).map(([emoji, usersWhoReacted]) => {
                        const hasMyReaction = usersWhoReacted.includes(nickname);
                        return (
                          <button 
                            key={emoji} 
                            className={`reaction-badge ${hasMyReaction ? 'active' : ''}`}
                            onClick={() => handleReact(msg.id, emoji)}
                            title={usersWhoReacted.join(', ')}
                          >
                            <span>{emoji}</span>
                            <span className="reaction-count">{usersWhoReacted.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {msg.id && (
                    <div className="message-hover-actions">
                      <div className="reactions-quick-bar">
                        {['👍', '❤️', '😂', '🎉', '😢', '😮'].map(emoji => (
                          <button key={emoji} onClick={() => handleReact(msg.id, emoji)}>{emoji}</button>
                        ))}
                      </div>
                      <button className="reply-action-btn" onClick={() => setReplyingTo(msg)} title="Reply">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-5l-5 5v-5z"></path></svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {typingUsers.length > 0 && (
              <div className="typing-indicator-container">
                <div className="typing-indicator-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">
                  {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}

            <div className="chat-input-wrapper">
              {replyingTo && (
                <div className="replying-to-preview">
                  <div className="preview-left">
                    <span className="reply-label">Replying to:</span>
                    <span className="reply-sender">{replyingTo.sender}</span>
                    <span className="reply-text-snippet">{replyingTo.isGif ? '[GIF]' : replyingTo.text}</span>
                  </div>
                  <button className="cancel-reply-btn" onClick={() => setReplyingTo(null)}>✕</button>
                </div>
              )}

              <div className="chat-input-area">
                <button className="input-picker-btn emoji-btn" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }} title="Add Emoji">😀</button>
                <button className="input-picker-btn gif-btn" onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); if (!gifs.length) loadDefaultGifs(); }} title="Share GIF">GIF</button>
                
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={handleChatInputChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSendChat();
                  }}
                  onBlur={() => {
                    setTimeout(sendTypingStop, 500);
                  }}
                />
                <button className="send-msg-btn" onClick={() => handleSendChat()}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </div>
            </div>

            {/* Emojis Selector Overlay */}
            {showEmojiPicker && (
              <div className="emoji-picker-panel glass-card">
                <div className="picker-header">
                  <span>Emojis</span>
                  <button className="close-picker-btn" onClick={() => setShowEmojiPicker(false)}>✕</button>
                </div>
                <div className="emojis-grid">
                  {EMOJIS.map(emoji => (
                    <button key={emoji} className="emoji-item" onClick={() => handleEmojiClick(emoji)}>{emoji}</button>
                  ))}
                </div>
              </div>
            )}

            {/* GIFs Search Overlay */}
            {showGifPicker && (
              <div className="gif-picker-panel glass-card">
                <div className="picker-header">
                  <span>Select a GIF</span>
                  <button className="close-picker-btn" onClick={() => setShowGifPicker(false)}>✕</button>
                </div>
                <div className="gif-search-wrapper">
                  <input 
                    type="text" 
                    placeholder="Search Giphy..." 
                    value={gifQuery}
                    onChange={(e) => handleGifSearch(e.target.value)}
                  />
                </div>
                <div className="gifs-grid-container">
                  {loadingGifs ? (
                    <div className="gifs-loading">Searching...</div>
                  ) : gifs.length === 0 ? (
                    <div className="gifs-no-results">No GIFs found</div>
                  ) : (
                    <div className="gifs-grid">
                      {gifs.map((gif, index) => (
                        <div key={index} className="gif-grid-item" onClick={() => handleSendGif(gif.url)}>
                          <img src={gif.url} alt={gif.title || "gif"} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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

      {/* Password Authentication Modal */}
      <div className={`modal ${isAuthRequired ? 'open' : ''}`}>
        <form className="modal-content glass-card" onSubmit={handleAuthSubmit}>
          <h3>🔒 Password Required</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>This room is locked. Please enter the password to join.</p>
          <input
            type="password"
            placeholder="Room Password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            className={authError ? 'error' : ''}
            autoFocus
          />
          {authError && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>{authError}</div>}
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>Authenticate</button>
        </form>
      </div>

      {/* Lock Settings Modal */}
      <div className={`modal ${showLockModal ? 'open' : ''}`}>
        <div className="modal-content glass-card">
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Room Security</h3>
            <button className="close-picker-btn" onClick={() => setShowLockModal(false)}>✕</button>
          </div>
          
          {isRoomLocked ? (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>This room is currently password protected.</p>
              <button className="btn btn-secondary" onClick={handleRemoveLock} style={{ width: '100%', marginTop: '1rem' }}>🔓 Remove Password Protection</button>
            </div>
          ) : (
            <form onSubmit={handleSetLockSubmit}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Set a password to lock this room. Anyone trying to join will be prompted for it.</p>
              <input
                type="password"
                placeholder="Set Password"
                value={newRoomPassword}
                onChange={(e) => setNewRoomPassword(e.target.value)}
                style={{ width: '100%', marginTop: '0.5rem' }}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Lock Room</button>
            </form>
          )}
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
