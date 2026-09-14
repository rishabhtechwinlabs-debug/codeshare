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

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript (Node.js)', extension: '.js', mode: 'javascript' },
  { id: 'typescript', label: 'TypeScript', extension: '.ts', mode: 'javascript' },
  { id: 'python', label: 'Python 3', extension: '.py', mode: 'python' },
  { id: 'cpp', label: 'C++', extension: '.cpp', mode: 'text/x-c++src' },
  { id: 'c', label: 'C', extension: '.c', mode: 'text/x-csrc' },
  { id: 'java', label: 'Java', extension: '.java', mode: 'text/x-java' },
  { id: 'go', label: 'Go', extension: '.go', mode: 'go' },
  { id: 'rust', label: 'Rust', extension: '.rs', mode: 'rust' },
  { id: 'html', label: 'HTML5', extension: '.html', mode: 'htmlmixed' },
  { id: 'css', label: 'CSS3', extension: '.css', mode: 'css' },
  { id: 'sql', label: 'SQL (SQLite)', extension: '.sql', mode: 'sql' },
  { id: 'markdown', label: 'Markdown', extension: '.md', mode: 'markdown' },
  { id: 'shell', label: 'Bash / Shell', extension: '.sh', mode: 'shell' }
];

const THEMES = [
  { id: 'dracula', label: 'Dracula (Dark)' },
  { id: 'monokai', label: 'Monokai' },
  { id: 'material', label: 'Material' },
  { id: 'nord', label: 'Nord' },
  { id: 'one-dark', label: 'One Dark' },
  { id: 'eclipse', label: 'Eclipse (Light)' }
];

function getCodeMirrorMode(languageId) {
  const item = LANGUAGES.find(l => l.id === languageId);
  return item ? item.mode : 'javascript';
}

function generateSimpleDiff(oldText = '', newText = '') {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const maxLen = Math.max(oldLines.length, newLines.length);
  const diffLines = [];

  for (let i = 0; i < maxLen; i++) {
    const oldL = oldLines[i];
    const newL = newLines[i];

    if (oldL === newL) {
      if (newL !== undefined) diffLines.push({ type: 'normal', text: `  ${newL}` });
    } else {
      if (oldL !== undefined) diffLines.push({ type: 'removed', text: `- ${oldL}` });
      if (newL !== undefined) diffLines.push({ type: 'added', text: `+ ${newL}` });
    }
  }

  return diffLines;
}

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

  // Multi-File & Customizer States
  const [files, setFiles] = useState({
    'index.js': { content: '// Welcome to HiveCode!\nconsole.log("Hello World");\n', language: 'javascript' }
  });
  const [activeFile, setActiveFile] = useState('index.js');
  const [openTabs, setOpenTabs] = useState(['index.js']);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [editorTheme, setEditorTheme] = useState('dracula');

  // Presenter Mode States
  const [isHost, setIsHost] = useState(false);
  const [hostName, setHostName] = useState('');
  const [isPresenterMode, setIsPresenterMode] = useState(false);

  // Version History States
  const [snapshots, setSnapshots] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  // WebRTC Call States
  const [callActiveUsers, setCallActiveUsers] = useState([]);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({});

  // Advanced WebRTC Studio Call States
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState({});
  const [connectionStats, setConnectionStats] = useState({});
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');

  const screenStreamRef = useRef(null);

  // Code Execution States
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalResult, setTerminalResult] = useState(null);

  // Chat Advanced States
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  // Activity Logs States
  const [activityLogs, setActivityLogs] = useState([]);
  const [showLogsModal, setShowLogsModal] = useState(false);

  // Sidebar Resizable States
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartWidthRef = useRef(360);
  const dragStartXRef = useRef(0);

  // Authentication & Room Lock States
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [newRoomPassword, setNewRoomPassword] = useState('');

  // Refs for tracking mutable states inside listeners
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const gifCacheRef = useRef({});
  const gifDebounceTimeoutRef = useRef(null);

  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const myUserIdRef = useRef(null);
  const isRemoteChangeRef = useRef(false);
  const remoteCursorsRef = useRef(new Map());
  const nicknameRef = useRef('');

  const activeFileRef = useRef('index.js');
  const filesRef = useRef(files);
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef({});
  const isInCallRef = useRef(false);

  useEffect(() => {
    isInCallRef.current = isInCall;
  }, [isInCall]);

  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

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

  // Refresh CodeMirror layout on resize or sidebar collapse
  useEffect(() => {
    if (editorRef.current) {
      const timer = setTimeout(() => {
        editorRef.current.refresh();
      }, 310);
      return () => clearTimeout(timer);
    }
  }, [isSidebarOpen, showFileExplorer, showTerminal]);

  // Toast Helper
  const showToast = (message, type = 'system-join') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3300);
  };

  // Activity Logging Helper
  const addActivityLog = (text) => {
    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 99)]);
  };

  // Main Editor & Socket initialization
  useEffect(() => {
    if (!nickname || !roomId) return;

    let checkInterval = null;
    let reconnectTimeout = null;
    let isComponentMounted = true;

    const connectWebSocket = () => {
      if (!isComponentMounted) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      const socket = new WebSocket(wsUrl);
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

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          const editor = editorRef.current;

          switch (data.type) {
            case 'init': {
              myUserIdRef.current = data.userId;
              setIsHost(!!data.isHost);
              setHostName(data.hostName || 'Host');
              setIsPresenterMode(!!data.isPresenterMode);
              if (data.snapshots) setSnapshots(data.snapshots);
              if (data.callActiveUsers) setCallActiveUsers(data.callActiveUsers);

              if (data.files && Object.keys(data.files).length > 0) {
                setFiles(data.files);
                const firstFile = data.activeFile || Object.keys(data.files)[0];
                setActiveFile(firstFile);
                setOpenTabs([firstFile]);

                if (editor) {
                  isRemoteChangeRef.current = true;
                  editor.setValue(data.files[firstFile]?.content || '');
                  editor.setOption('mode', getCodeMirrorMode(data.files[firstFile]?.language));
                  if (data.isPresenterMode && !data.isHost) {
                    editor.setOption('readOnly', 'nocursor');
                  } else {
                    editor.setOption('readOnly', false);
                  }
                  isRemoteChangeRef.current = false;
                }
              }

              if (data.theme) {
                setEditorTheme(data.theme);
                if (editor) editor.setOption('theme', data.theme);
              }

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
              addActivityLog(`✨ Joined room "${roomId}" as "${nicknameRef.current}"`);
              break;
            }

            case 'call-status-update': {
              const newActiveUsers = data.callActiveUsers || [];
              setCallActiveUsers(newActiveUsers);

              // Clean up peer connections and streams for users who left the call
              Object.keys(peerConnectionsRef.current).forEach(peerId => {
                if (!newActiveUsers.includes(peerId)) {
                  if (peerConnectionsRef.current[peerId]) {
                    peerConnectionsRef.current[peerId].close();
                    delete peerConnectionsRef.current[peerId];
                  }
                  delete pendingIceCandidatesRef.current[peerId];
                  setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[peerId];
                    return next;
                  });
                }
              });

              if (data.joinedUserName) {
                showToast(`🎙️ ${data.joinedUserName} joined the voice call!`, 'join');
              } else if (data.leftUserName) {
                showToast(`📞 ${data.leftUserName} left the call.`, 'leave');
              }
              break;
            }

            case 'presenter-mode-update': {
              setIsPresenterMode(data.isPresenterMode);
              setHostName(data.hostName || 'Host');

              if (editor) {
                if (data.isPresenterMode && myUserIdRef.current !== data.hostUserId && !isHost) {
                  editor.setOption('readOnly', 'nocursor');
                } else {
                  editor.setOption('readOnly', false);
                }
              }

              showToast(data.isPresenterMode ? `🔒 Presenter Mode activated by ${data.hostName}` : `🔓 Presenter Mode disabled by ${data.hostName}`, 'join');
              addActivityLog(data.isPresenterMode ? `🔒 Presenter Mode enabled` : `🔓 Presenter Mode disabled`);
              break;
            }

            case 'snapshot-created': {
              setSnapshots(data.snapshots);
              addActivityLog(`📸 Version snapshot saved by ${data.snapshot.author}`);
              break;
            }

            case 'code-update': {
              if (data.userId === myUserIdRef.current) return;
              
              const filename = data.filename || activeFileRef.current;
              
              setFiles(prev => {
                const currentFileObj = prev[filename] || { language: 'javascript' };
                return {
                  ...prev,
                  [filename]: { ...currentFileObj, content: data.code }
                };
              });

              if (filename === activeFileRef.current && editor) {
                isRemoteChangeRef.current = true;
                const cursor = editor.getCursor();
                const scrollInfo = editor.getScrollInfo();

                editor.setValue(data.code);

                editor.setCursor(cursor);
                editor.scrollTo(scrollInfo.left, scrollInfo.top);
                isRemoteChangeRef.current = false;
              }
              break;
            }

            case 'webrtc-signal': {
              handleIncomingSignal(data.senderUserId, data.signal);
              break;
            }

            case 'file-create': {
              setFiles(prev => ({
                ...prev,
                [data.filename]: { content: data.content || '', language: data.language || 'javascript' }
              }));
              setOpenTabs(prev => prev.includes(data.filename) ? prev : [...prev, data.filename]);
              setActiveFile(data.filename);

              if (editor) {
                isRemoteChangeRef.current = true;
                editor.setValue(data.content || '');
                editor.setOption('mode', getCodeMirrorMode(data.language));
                isRemoteChangeRef.current = false;
              }
              addActivityLog(`📄 New file created: "${data.filename}"`);
              break;
            }

            case 'file-delete': {
              setFiles(prev => {
                const updated = { ...prev };
                delete updated[data.filename];
                return updated;
              });
              setOpenTabs(prev => prev.filter(t => t !== data.filename));
              if (data.activeFile) {
                setActiveFile(data.activeFile);
                if (editor) {
                  isRemoteChangeRef.current = true;
                  const targetContent = filesRef.current[data.activeFile]?.content || '';
                  editor.setValue(targetContent);
                  editor.setOption('mode', getCodeMirrorMode(filesRef.current[data.activeFile]?.language));
                  isRemoteChangeRef.current = false;
                }
              }
              addActivityLog(`🗑️ File deleted: "${data.filename}"`);
              break;
            }

            case 'file-rename': {
              setFiles(prev => {
                const updated = { ...prev };
                if (updated[data.oldFilename]) {
                  updated[data.newFilename] = updated[data.oldFilename];
                  delete updated[data.oldFilename];
                }
                return updated;
              });
              setOpenTabs(prev => prev.map(t => t === data.oldFilename ? data.newFilename : t));
              if (activeFileRef.current === data.oldFilename) {
                setActiveFile(data.newFilename);
              }
              addActivityLog(`✏️ File renamed: "${data.oldFilename}" → "${data.newFilename}"`);
              break;
            }

            case 'language-update': {
              setFiles(prev => {
                if (!prev[data.filename]) return prev;
                return {
                  ...prev,
                  [data.filename]: { ...prev[data.filename], language: data.language }
                };
              });
              if (data.filename === activeFileRef.current && editor) {
                editor.setOption('mode', getCodeMirrorMode(data.language));
              }
              addActivityLog(`🔤 Language changed for "${data.filename}": ${data.language}`);
              break;
            }

            case 'theme-update': {
              setEditorTheme(data.theme);
              if (editor) {
                editor.setOption('theme', data.theme);
              }
              break;
            }

            case 'user-joined': {
              showToast(`👥 ${data.user.name} joined the studio!`, 'join');
              setUsers(data.users);
              addActivityLog(`👤 User "${data.user.name}" joined the studio`);
              break;
            }

            case 'user-left': {
              showToast(`🚪 ${data.userName} left the studio.`, 'leave');
              setUsers(data.users);
              addActivityLog(`🚪 User "${data.userName}" left the studio`);

              if (remoteCursorsRef.current.has(data.userId)) {
                remoteCursorsRef.current.get(data.userId).clear();
                remoteCursorsRef.current.delete(data.userId);
              }

              if (peerConnectionsRef.current[data.userId]) {
                peerConnectionsRef.current[data.userId].close();
                delete peerConnectionsRef.current[data.userId];
                setRemoteStreams(prev => {
                  const copy = { ...prev };
                  delete copy[data.userId];
                  return copy;
                });
              }
              break;
            }

            case 'host-reassigned': {
              if (data.newHostUserId === myUserIdRef.current) {
                setIsHost(true);
                showToast('👑 You are now the Room Host!', 'join');
              }
              setHostName(data.newHostName);
              addActivityLog(`👑 Host reassigned to "${data.newHostName}"`);
              break;
            }

            case 'cursor-update': {
              if (data.userId === myUserIdRef.current || !editor) return;
              if (data.filename === activeFileRef.current) {
                updateRemoteCursor(editor, data.userId, data.cursor, data.color, data.name);
              }
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
              addActivityLog(data.isLocked ? '🔒 Password protection enabled for this room' : '🔓 Password protection disabled');
              break;
            }
          }
        } catch (err) {
          console.error('Error processing websocket message:', err);
        }
      };

      socket.onclose = () => {
        if (!isComponentMounted) return;
        showToast('⚠️ Connection lost. Retrying...', 'leave');
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };
    };

    const setupEditorAndConnect = () => {
      if (typeof window !== 'undefined' && window.CodeMirror) {
        clearInterval(checkInterval);

        if (!editorRef.current) {
          const editor = window.CodeMirror.fromTextArea(document.getElementById('code-editor'), {
            lineNumbers: true,
            theme: editorTheme,
            mode: getCodeMirrorMode(filesRef.current[activeFileRef.current]?.language || 'javascript'),
            tabSize: 2,
            lineWrapping: true,
            matchBrackets: true,
            autoCloseBrackets: true
          });
          editorRef.current = editor;

          editor.on('change', () => {
            if (isRemoteChangeRef.current || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
            socketRef.current.send(JSON.stringify({
              type: 'code-update',
              filename: activeFileRef.current,
              code: editor.getValue()
            }));
          });

          editor.on('cursorActivity', () => {
            if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
            socketRef.current.send(JSON.stringify({
              type: 'cursor-update',
              filename: activeFileRef.current,
              cursor: editor.getCursor()
            }));
          });
        }

        connectWebSocket();
      }
    };

    if (typeof window !== 'undefined' && window.CodeMirror) {
      setupEditorAndConnect();
    } else {
      checkInterval = setInterval(setupEditorAndConnect, 50);
    }

    return () => {
      isComponentMounted = false;
      clearInterval(checkInterval);
      clearTimeout(reconnectTimeout);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (gifDebounceTimeoutRef.current) {
        clearTimeout(gifDebounceTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
        socketRef.current = null;
      }
      if (editorRef.current) {
        editorRef.current.toTextArea();
        editorRef.current = null;
      }
      remoteCursorsRef.current.forEach(bookmark => {
        if (bookmark && typeof bookmark.clear === 'function') bookmark.clear();
      });
      remoteCursorsRef.current.clear();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    };
  }, [nickname, roomId]);

  // Active Speaker Detection (Web Audio API AnalyserNode)
  useEffect(() => {
    if (!isInCall) {
      setSpeakingUsers({});
      return;
    }

    let audioCtx = null;
    let interval = null;

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
        const analysers = {};

        const setupAnalyser = (id, stream) => {
          if (!stream || !stream.getAudioTracks().length) return;
          try {
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            source.connect(analyser);
            analysers[id] = analyser;
          } catch (e) {}
        };

        if (localStreamRef.current && !isMuted) {
          setupAnalyser(myUserIdRef.current, localStreamRef.current);
        }

        Object.entries(remoteStreams).forEach(([id, stream]) => {
          setupAnalyser(id, stream);
        });

        interval = setInterval(() => {
          const dataArray = new Uint8Array(64);
          const activeMap = {};

          Object.entries(analysers).forEach(([id, analyser]) => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            if (avg > 14) {
              activeMap[id] = true;
            }
          });

          setSpeakingUsers(activeMap);
        }, 120);
      }
    } catch (e) {
      console.warn('AudioAnalyser error:', e);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (audioCtx) {
        try { audioCtx.close(); } catch (e) {}
      }
    };
  }, [isInCall, isMuted, remoteStreams]);

  // Real-time Connection Quality Stats (RTT / Ping)
  useEffect(() => {
    if (!isInCall) {
      setConnectionStats({});
      return;
    }

    const interval = setInterval(() => {
      Object.entries(peerConnectionsRef.current).forEach(async ([peerId, pc]) => {
        if (!pc || pc.signalingState === 'closed') return;
        try {
          const stats = await pc.getStats();
          stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              const rtt = report.currentRoundTripTime ? Math.round(report.currentRoundTripTime * 1000) : 22;
              setConnectionStats(prev => ({
                ...prev,
                [peerId]: { rtt, quality: rtt < 80 ? 'Good' : rtt < 200 ? 'Fair' : 'Poor' }
              }));
            }
          });
        } catch (e) {}
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isInCall]);

  // Scroll chat messages to bottom on updates (only if user is near bottom)
  useEffect(() => {
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 150;
      if (isNearBottom) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [chatMessages]);

  // Presenter Mode Toggle Handler
  const handleTogglePresenterMode = () => {
    if (!isHost || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({
      type: 'toggle-presenter-mode',
      isPresenterMode: !isPresenterMode
    }));
  };

  // Save Version Snapshot Handler
  const handleSaveSnapshot = () => {
    const currentCode = editorRef.current ? editorRef.current.getValue() : files[activeFile]?.content;
    const note = prompt('Enter a note for this version snapshot:', 'Version Checkpoint');
    if (note === null) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'create-snapshot',
        filename: activeFile,
        code: currentCode,
        note: note || 'Version Checkpoint'
      }));
      showToast('📸 Version snapshot saved!', 'join');
    }
  };

  // Restore Version Snapshot Handler
  const handleRestoreSnapshot = (snapshot) => {
    if (!confirm(`Restore version "${snapshot.note}" (${snapshot.timestamp})? Current code will be replaced.`)) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'restore-snapshot',
        filename: snapshot.filename,
        code: snapshot.code
      }));
      setShowHistoryModal(false);
      showToast(`↺ Restored version snapshot (${snapshot.timestamp})`, 'join');
    }
  };

  // WebRTC Audio / Video Call Handlers
  const ensureLocalTracksOnPeerConnection = (pc) => {
    if (!localStreamRef.current || !pc || pc.signalingState === 'closed') return;
    const senders = pc.getSenders();
    localStreamRef.current.getTracks().forEach(track => {
      const alreadyAdded = senders.some(s => s.track && s.track.id === track.id);
      if (!alreadyAdded) {
        try {
          pc.addTrack(track, localStreamRef.current);
        } catch (e) {
          console.warn('Error adding track to PC:', e);
        }
      }
    });
  };

  const addIceCandidateSafely = async (pc, targetUserId, candidate) => {
    if (pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding ICE candidate:', e);
      }
    } else {
      if (!pendingIceCandidatesRef.current[targetUserId]) {
        pendingIceCandidatesRef.current[targetUserId] = [];
      }
      pendingIceCandidatesRef.current[targetUserId].push(candidate);
    }
  };

  const flushPendingIceCandidates = async (pc, targetUserId) => {
    const candidates = pendingIceCandidatesRef.current[targetUserId] || [];
    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error flushing candidate:', e);
      }
    }
    pendingIceCandidatesRef.current[targetUserId] = [];
  };

  const handleToggleCall = async () => {
    if (isInCall) {
      // Leave call
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      peerConnectionsRef.current = {};
      pendingIceCandidatesRef.current = {};
      setRemoteStreams({});
      setIsInCall(false);
      isInCallRef.current = false;
      setIsVideoOn(false);
      setIsMuted(false);

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'leave-call' }));
      }
      showToast('📞 Left the voice call.', 'leave');
      return;
    }

    // Resume AudioContext on user gesture to unlock browser audio autoplay
    if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
      } catch (e) {}
    }

    try {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (!isVideoOn) {
          const vt = stream.getVideoTracks()[0];
          if (vt) vt.enabled = false;
        }
      } catch (e) {
        // Fallback to audio-only if camera is unavailable or permission denied
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsVideoOn(false);
      }

      // Ensure audio track is enabled
      const at = stream.getAudioTracks()[0];
      if (at) at.enabled = true;

      localStreamRef.current = stream;
      setIsInCall(true);
      isInCallRef.current = true;
      setIsMuted(false);
      showToast('🎙️ Joined voice call!', 'join');

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'join-call' }));
      }

      // Initiate WebRTC peer connections with all current active call participants
      callActiveUsers.forEach(targetId => {
        if (targetId !== myUserIdRef.current) {
          createPeerConnection(targetId, true);
        }
      });
    } catch (err) {
      alert('Could not access microphone/camera: ' + err.message);
    }
  };

  const createPeerConnection = (targetUserId, isInitiator) => {
    let pc = peerConnectionsRef.current[targetUserId];
    if (pc && pc.signalingState !== 'closed') {
      ensureLocalTracksOnPeerConnection(pc);
      return pc;
    }

    pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    ensureLocalTracksOnPeerConnection(pc);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'webrtc-signal',
          targetUserId: targetUserId,
          signal: { type: 'candidate', candidate: event.candidate }
        }));
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
        pc.createOffer({ iceRestart: true }).then(offer => {
          pc.setLocalDescription(offer);
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: 'webrtc-signal',
              targetUserId: targetUserId,
              signal: { type: 'offer', offer: offer }
            }));
          }
        }).catch(err => console.error('Error restarting ICE:', err));
      }
    };

    pc.ontrack = (event) => {
      if (event.track) {
        event.track.enabled = true;
      }
      const handleTrackUpdate = () => {
        if (event.streams && event.streams[0]) {
          const tracks = event.streams[0].getTracks();
          tracks.forEach(t => { t.enabled = true; });
          setRemoteStreams(prev => ({
            ...prev,
            [targetUserId]: new MediaStream(tracks)
          }));
        } else if (event.track) {
          setRemoteStreams(prev => {
            const existingTracks = prev[targetUserId] ? prev[targetUserId].getTracks() : [];
            if (!existingTracks.some(t => t.id === event.track.id)) {
              return {
                ...prev,
                [targetUserId]: new MediaStream([...existingTracks, event.track])
              };
            }
            return prev;
          });
        }
      };

      handleTrackUpdate();

      if (event.streams && event.streams[0]) {
        event.streams[0].onaddtrack = handleTrackUpdate;
        event.streams[0].onremovetrack = handleTrackUpdate;
      }
    };

    if (isInitiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'webrtc-signal',
            targetUserId: targetUserId,
            signal: { type: 'offer', offer: offer }
          }));
        }
      }).catch(err => console.error('Error creating SDP offer:', err));
    }

    peerConnectionsRef.current[targetUserId] = pc;
    return pc;
  };

  const handleIncomingSignal = async (senderUserId, signal) => {
    let pc = peerConnectionsRef.current[senderUserId];
    const isPolite = myUserIdRef.current < senderUserId;

    try {
      if (signal.type === 'offer') {
        // Only process answer if local user is in the call
        if (!isInCallRef.current || !localStreamRef.current) return;

        if (!pc || pc.signalingState === 'closed') {
          pc = createPeerConnection(senderUserId, false);
        }

        ensureLocalTracksOnPeerConnection(pc);

        const isCollision = pc.signalingState !== 'stable';
        if (isCollision) {
          if (!isPolite) {
            // Impolite peer ignores incoming offer during glare
            return;
          }
          // Polite peer rolls back local offer to accept remote offer
          await pc.setLocalDescription({ type: 'rollback' });
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
        await flushPendingIceCandidates(pc, senderUserId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'webrtc-signal',
            targetUserId: senderUserId,
            signal: { type: 'answer', answer: answer }
          }));
        }
      } else if (signal.type === 'answer') {
        if (pc && pc.signalingState !== 'closed') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
          await flushPendingIceCandidates(pc, senderUserId);
        }
      } else if (signal.type === 'candidate') {
        if (pc && pc.signalingState !== 'closed') {
          await addIceCandidateSafely(pc, senderUserId, signal.candidate);
        } else {
          if (!pendingIceCandidatesRef.current[senderUserId]) {
            pendingIceCandidatesRef.current[senderUserId] = [];
          }
          pendingIceCandidatesRef.current[senderUserId].push(signal.candidate);
        }
      }
    } catch (err) {
      console.error(`Error handling WebRTC signal from ${senderUserId}:`, err);
    }
  };

  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const handleToggleVideo = async () => {
    if (!isInCall) {
      setIsVideoOn(!isVideoOn);
      return;
    }

    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      } else {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newTrack = videoStream.getVideoTracks()[0];
          localStreamRef.current.addTrack(newTrack);

          // Add new video track to all active peer connections and renegotiate
          Object.entries(peerConnectionsRef.current).forEach(([targetId, pc]) => {
            if (pc && pc.signalingState !== 'closed') {
              pc.addTrack(newTrack, localStreamRef.current);
              pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                  socketRef.current.send(JSON.stringify({
                    type: 'webrtc-signal',
                    targetUserId: targetId,
                    signal: { type: 'offer', offer: offer }
                  }));
                }
              });
            }
          });

          setIsVideoOn(true);
        } catch (e) {
          alert('Could not enable camera: ' + e.message);
        }
      }
    }
  };

  const handleToggleScreenShare = async () => {
    if (!isInCall) {
      alert('Please join the call first before sharing your screen!');
      return;
    }

    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);

      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        Object.values(peerConnectionsRef.current).forEach(pc => {
          if (pc && pc.signalingState !== 'closed') {
            const senders = pc.getSenders();
            const videoSender = senders.find(s => s.track && s.track.kind === 'video');
            if (videoSender) videoSender.replaceTrack(cameraTrack);
          }
        });
      }
      showToast('🖥️ Screen sharing stopped.', 'leave');
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);
      showToast('🖥️ Started screen sharing!', 'join');

      screenTrack.onended = () => {
        setIsScreenSharing(false);
        screenStreamRef.current = null;
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        if (camTrack) {
          Object.values(peerConnectionsRef.current).forEach(pc => {
            if (pc && pc.signalingState !== 'closed') {
              const senders = pc.getSenders();
              const videoSender = senders.find(s => s.track && s.track.kind === 'video');
              if (videoSender) videoSender.replaceTrack(camTrack);
            }
          });
        }
      };

      Object.values(peerConnectionsRef.current).forEach(pc => {
        if (pc && pc.signalingState !== 'closed') {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          } else {
            pc.addTrack(screenTrack, screenStream);
          }
        }
      });
    } catch (err) {
      console.warn('Screen share error:', err);
    }
  };

  const handleOpenDeviceModal = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioIns = devices.filter(d => d.kind === 'audioinput');
      const videoIns = devices.filter(d => d.kind === 'videoinput');
      setAudioInputDevices(audioIns);
      setVideoInputDevices(videoIns);
      if (audioIns.length && !selectedAudioDevice) setSelectedAudioDevice(audioIns[0].deviceId);
      if (videoIns.length && !selectedVideoDevice) setSelectedVideoDevice(videoIns[0].deviceId);
      setShowDeviceModal(true);
    } catch (e) {
      alert('Could not enumerate devices: ' + e.message);
    }
  };

  // Handle Switch Active File
  const handleSwitchFile = (filename) => {
    if (!files[filename]) return;
    setActiveFile(filename);
    if (!openTabs.includes(filename)) {
      setOpenTabs(prev => [...prev, filename]);
    }
    if (editorRef.current) {
      isRemoteChangeRef.current = true;
      editorRef.current.setValue(files[filename].content || '');
      editorRef.current.setOption('mode', getCodeMirrorMode(files[filename].language));
      isRemoteChangeRef.current = false;
    }
  };

  // Handle Create File
  const handleCreateFile = () => {
    const filename = prompt('Enter new filename (e.g. app.py, script.js, styles.css):');
    if (!filename || !filename.trim()) return;

    const cleanName = filename.trim();
    if (files[cleanName]) {
      alert('A file with this name already exists!');
      return;
    }

    const ext = cleanName.substring(cleanName.lastIndexOf('.')).toLowerCase();
    const matchedLang = LANGUAGES.find(l => l.extension === ext);
    const langId = matchedLang ? matchedLang.id : 'javascript';

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'file-create',
        filename: cleanName,
        content: '',
        language: langId
      }));
    }
  };

  // Handle Delete File
  const handleDeleteFile = (filename, e) => {
    if (e) e.stopPropagation();
    if (Object.keys(files).length <= 1) {
      alert('Cannot delete the only file in the project!');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'file-delete',
        filename: filename
      }));
    }
  };

  // Handle Language Change
  const handleLanguageChange = (newLanguage) => {
    if (!files[activeFile]) return;
    setFiles(prev => ({
      ...prev,
      [activeFile]: { ...prev[activeFile], language: newLanguage }
    }));
    if (editorRef.current) {
      editorRef.current.setOption('mode', getCodeMirrorMode(newLanguage));
    }
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'language-update',
        filename: activeFile,
        language: newLanguage
      }));
    }
  };

  // Handle Theme Change
  const handleThemeChange = (newTheme) => {
    setEditorTheme(newTheme);
    if (editorRef.current) {
      editorRef.current.setOption('theme', newTheme);
    }
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'theme-update',
        theme: newTheme
      }));
    }
  };

  // Handle Code Execution (Piston API Runner)
  const handleRunCode = async () => {
    const currentCode = editorRef.current ? editorRef.current.getValue() : files[activeFile]?.content;
    const currentLang = files[activeFile]?.language || 'javascript';

    if (!currentCode || !currentCode.trim()) {
      showToast('⚠️ Editor is empty!', 'leave');
      return;
    }

    setIsRunningCode(true);
    setShowTerminal(true);
    setTerminalResult({ output: '🚀 Compiling and executing code in sandbox...', executionTime: 0 });

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: currentLang,
          code: currentCode,
          filename: activeFile
        })
      });

      const data = await res.json();
      setTerminalResult(data);
    } catch (err) {
      setTerminalResult({
        output: '',
        stderr: `Execution Error: ${err.message}`,
        executionTime: 0
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  // Update Remote User Cursor
  function updateRemoteCursor(editor, userId, cursor, color, name) {
    const cursorsMap = remoteCursorsRef.current;

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
    if (!isTypingRef.current && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      isTypingRef.current = true;
      socketRef.current.send(JSON.stringify({ type: 'typing-start' }));
    }
  };

  const sendTypingStop = () => {
    if (isTypingRef.current && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
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

  const handleResizerMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = sidebarWidth;
    document.body.classList.add('resizing');
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartXRef.current;
      const newWidth = dragStartWidthRef.current - deltaX;
      
      if (newWidth >= 300 && newWidth <= 650) {
        setSidebarWidth(newWidth);
        if (editorRef.current) {
          editorRef.current.refresh();
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.classList.remove('resizing');
      if (editorRef.current) {
        editorRef.current.refresh();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleReact = (messageId, emoji) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
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
      if (!res.ok) throw new Error(`Giphy fetch error: ${res.status}`);
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

    gifDebounceTimeoutRef.current = setTimeout(async () => {
      const normalizedQuery = query.trim().toLowerCase();
      if (gifCacheRef.current[normalizedQuery]) {
        setGifs(gifCacheRef.current[normalizedQuery]);
        return;
      }

      setLoadingGifs(true);
      const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'dc6zaTOxFJmzC';
      try {
        const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=48&rating=r`);
        if (!res.ok) throw new Error(`Giphy API response error: ${res.status}`);
        const result = await res.json();
        if (result.data && result.data.length > 0) {
          const formatted = result.data.map(item => ({
            title: item.title,
            url: item.images.downsized_medium?.url || item.images.original?.url
          }));
          
          gifCacheRef.current[normalizedQuery] = formatted;
          setGifs(formatted);
        } else {
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

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('📋 Link copied to clipboard!', 'join');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const handleSendChat = (customText = null, isGif = false) => {
    const textObj = customText !== null ? customText : chatInput;
    const text = typeof textObj === 'string' ? textObj.trim() : '';
    if (!text || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(JSON.stringify({
      type: 'chat-message',
      text: text,
      isGif: isGif,
      replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender, text: replyingTo.text, isGif: !!replyingTo.isGif } : null
    }));

    if (customText === null) {
      setChatInput('');
    }
    setReplyingTo(null);
    sendTypingStop();
  };

  const handleAuthSubmit = (e) => {
    if (e) e.preventDefault();
    const pw = authPassword.trim();
    if (!pw) return;

    sessionStorage.setItem('room_pw_' + roomId, pw);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'join',
        roomId: roomId,
        nickname: nickname,
        password: pw
      }));
    }
  };

  const handleSetLockSubmit = (e) => {
    if (e) e.preventDefault();
    if (!newRoomPassword.trim()) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
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
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'remove-room-password'
      }));
    }
    setShowLockModal(false);
  };

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

            {/* Run Code Button */}
            <button className="header-btn run-code-btn" onClick={handleRunCode} disabled={isRunningCode} title="Execute Code in Sandbox Console">
              <span>{isRunningCode ? '⏳ Running...' : '▶️ Run Code'}</span>
            </button>

            {/* WebRTC Audio / Video Call Controls */}
            <div className="webrtc-call-bar">
              <button 
                className={`header-btn ${isInCall ? 'call-btn-active' : callActiveUsers.length > 0 ? 'run-code-btn' : ''}`}
                onClick={handleToggleCall} 
                title={isInCall ? "Leave Call" : callActiveUsers.length > 0 ? "Join Ongoing Call" : "Start Voice Call"}
              >
                <span>{isInCall ? '❌ Leave Call' : callActiveUsers.length > 0 ? `📞 Join Call (${callActiveUsers.length} Active)` : '🎙️ Start Call'}</span>
              </button>
              {isInCall && (
                <>
                  <button className="header-btn" onClick={handleToggleMute} title={isMuted ? "Unmute Mic" : "Mute Mic"}>
                    <span>{isMuted ? '🔇 Muted' : '🎙️ Mic On'}</span>
                  </button>
                  <button className="header-btn" onClick={handleToggleVideo} title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}>
                    <span>{isVideoOn ? '📹 Cam On' : '📷 Cam Off'}</span>
                  </button>
                  <button className={`header-btn ${isScreenSharing ? 'run-code-btn' : ''}`} onClick={handleToggleScreenShare} title={isScreenSharing ? "Stop Screen Share" : "Share Screen / Desktop"}>
                    <span>{isScreenSharing ? '🛑 Stop Share' : '🖥️ Share Screen'}</span>
                  </button>
                  <button className="header-btn" onClick={handleOpenDeviceModal} title="Audio & Video Settings">
                    <span>⚙️ Devices</span>
                  </button>
                </>
              )}
            </div>

            {/* Language Selector */}
            <select 
              className="header-select"
              value={files[activeFile]?.language || 'javascript'}
              onChange={(e) => handleLanguageChange(e.target.value)}
              title="Select Programming Language"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.label}</option>
              ))}
            </select>

            {/* Theme Selector */}
            <select 
              className="header-select"
              value={editorTheme}
              onChange={(e) => handleThemeChange(e.target.value)}
              title="Select Editor Theme"
            >
              {THEMES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>

            {/* Host Presenter Mode Toggle */}
            {isHost && (
              <button 
                className={`header-btn ${isPresenterMode ? 'lock-btn locked' : ''}`} 
                onClick={handleTogglePresenterMode}
                title={isPresenterMode ? "Disable Presenter Mode" : "Enable Presenter Mode (Lock Editing for Guests)"}
              >
                <span>{isPresenterMode ? '🔒 Presenting ON' : '🔓 Presenting OFF'}</span>
              </button>
            )}

            {/* Version History Button */}
            <button className="header-btn" onClick={() => { setShowHistoryModal(true); if (snapshots.length && !selectedSnapshot) setSelectedSnapshot(snapshots[0]); }} title="Version History Snapshots">
              <span>⏱️ History</span>
            </button>

            <button className="header-btn" onClick={handleSaveSnapshot} title="Save Version Checkpoint">
              <span>📸 Snapshot</span>
            </button>

            <button className="header-btn" onClick={handleShare} title="Copy Share Link">
              <span className="btn-text">Share</span>
            </button>

            <button className={`header-btn lock-btn ${isRoomLocked ? 'locked' : ''}`} onClick={() => setShowLockModal(true)} title={isRoomLocked ? "Room is Password Protected" : "Set Password"}>
              <span>{isRoomLocked ? '🔒 Locked' : '🔓 Unlocked'}</span>
            </button>

            <button className="header-btn" onClick={() => setShowFileExplorer(!showFileExplorer)} title={showFileExplorer ? "Hide Files" : "Show Files"}>
              <span>📁 Files</span>
            </button>

            <button className="header-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title={isSidebarOpen ? "Hide Chat" : "Show Chat"}>
              <span>💬 Chat</span>
            </button>

            <button className="header-btn log-toggle-btn" onClick={() => setShowLogsModal(true)} title="Activity Logs">
              <span>📋 Logs</span>
            </button>
          </div>
        </div>

        <div className="header-right">
          <div className="user-presence">
            {users.map(u => {
              const inCall = callActiveUsers.includes(u.id);
              const isSpeaking = speakingUsers[u.id];
              return (
                <div key={u.id} className={`user-avatar ${inCall ? 'in-call-avatar' : ''} ${isSpeaking ? 'speaking-active' : ''}`} style={{ backgroundColor: u.color }}>
                  {u.name.substring(0, 2).toUpperCase()}
                  {inCall && <span className="call-badge">{isSpeaking ? '⚡' : '🎙️'}</span>}
                  <span className="tooltip">
                    {u.name}
                    {u.id === myUserIdRef.current ? ' (You)' : ''}
                    {u.id === (isHost ? myUserIdRef.current : '') ? ' 👑 Host' : ''}
                    {isSpeaking ? ' 🎙️ (Speaking...)' : inCall ? ' 🎙️ (In Call)' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Guest Read-Only Presenter Banner */}
      {isPresenterMode && !isHost && (
        <div className="presenter-banner">
          <div className="presenter-banner-text">
            <span>🔒 PRESENTER MODE ACTIVE</span>
            <span>- Code editing is currently restricted to Host ({hostName}). You are in view-only Watch Party mode.</span>
          </div>
        </div>
      )}

      {/* Background Audio Streams (Guarantees voice audio playback) */}
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <audio
          key={`audio-${peerId}`}
          autoPlay
          playsInline
          onLoadedMetadata={(e) => {
            if (e.target) {
              e.target.muted = false;
              e.target.volume = 1.0;
              e.target.play().catch(err => console.warn('Audio metadata play trigger:', err));
            }
          }}
          ref={el => {
            if (el) {
              if (el.srcObject !== stream) {
                el.srcObject = stream;
              }
              el.muted = false;
              el.volume = 1.0;
              el.play().catch(err => console.warn('Audio play trigger warning:', err));
            }
          }}
        />
      ))}

      {/* WebRTC Video Call Floating Overlay */}
      {isInCall && (Object.keys(remoteStreams).length > 0 || (isVideoOn && localStreamRef.current) || isScreenSharing) && (
        <div className="webrtc-video-grid">
          {/* Local Screen Share Preview Card */}
          {isScreenSharing && screenStreamRef.current && (
            <div className="webrtc-video-card local-video-card">
              <video
                autoPlay
                playsInline
                muted
                ref={el => {
                  if (el && el.srcObject !== screenStreamRef.current) {
                    el.srcObject = screenStreamRef.current;
                  }
                }}
              />
              <span className="webrtc-peer-name">You (Screen Share)</span>
            </div>
          )}

          {/* Local Camera Preview */}
          {isVideoOn && localStreamRef.current && (
            <div className={`webrtc-video-card local-video-card ${speakingUsers[myUserIdRef.current] ? 'is-speaking' : ''}`}>
              {speakingUsers[myUserIdRef.current] && (
                <span className="webrtc-speaker-indicator">🎙️ Speaking...</span>
              )}
              <video
                autoPlay
                playsInline
                muted
                ref={el => {
                  if (el && el.srcObject !== localStreamRef.current) {
                    el.srcObject = localStreamRef.current;
                  }
                }}
              />
              <span className="webrtc-peer-name">You (Camera)</span>
            </div>
          )}

          {/* Remote Video Cards */}
          {Object.entries(remoteStreams).map(([peerId, stream]) => {
            const peerUser = users.find(u => u.id === peerId);
            const isPeerSpeaking = speakingUsers[peerId];
            const stats = connectionStats[peerId];
            return (
              <div key={peerId} className={`webrtc-video-card ${isPeerSpeaking ? 'is-speaking' : ''}`}>
                {isPeerSpeaking && (
                  <span className="webrtc-speaker-indicator">🎙️ Speaking...</span>
                )}
                {stats && (
                  <span className="webrtc-ping-badge">📶 {stats.rtt}ms</span>
                )}
                <video 
                  autoPlay 
                  playsInline 
                  muted
                  ref={el => {
                    if (el && el.srcObject !== stream) {
                      el.srcObject = stream;
                      el.play().catch(err => console.warn('Video play trigger warning:', err));
                    }
                  }} 
                />
                <span className="webrtc-peer-name">{peerUser ? peerUser.name : 'Peer'}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Workspace */}
      <div className="workspace">
        {/* File Explorer Sidebar */}
        {showFileExplorer && (
          <div className="file-explorer-sidebar">
            <div className="file-explorer-header">
              <span>FILES</span>
              <button className="add-file-btn" onClick={handleCreateFile} title="Create New File">+</button>
            </div>
            <div className="file-list">
              {Object.keys(files).map(filename => (
                <div 
                  key={filename}
                  className={`file-item ${filename === activeFile ? 'active' : ''}`}
                  onClick={() => handleSwitchFile(filename)}
                >
                  <span>📄 {filename}</span>
                  <div className="file-item-actions">
                    <button className="file-action-icon" onClick={(e) => handleDeleteFile(filename, e)} title="Delete File">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editor Pane */}
        <div className="pane editor-pane" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* File Tab Strip */}
          <div className="file-tab-bar">
            {openTabs.map(tabFile => (
              <div 
                key={tabFile}
                className={`file-tab ${tabFile === activeFile ? 'active' : ''}`}
                onClick={() => handleSwitchFile(tabFile)}
              >
                <span>📄 {tabFile}</span>
                {openTabs.length > 1 && (
                  <button 
                    className="file-tab-close" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTabs(prev => prev.filter(t => t !== tabFile));
                      if (activeFile === tabFile) {
                        const remaining = openTabs.filter(t => t !== tabFile);
                        if (remaining.length > 0) handleSwitchFile(remaining[0]);
                      }
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <textarea id="code-editor" style={{ display: 'none' }}></textarea>
          </div>

          {/* Live Terminal Console Drawer */}
          {showTerminal && (
            <div className="terminal-drawer">
              <div className="terminal-header">
                <span>🖥️ LIVE CONSOLE OUTPUT ({files[activeFile]?.language?.toUpperCase() || 'SANDBOX'})</span>
                <button className="close-picker-btn" onClick={() => setShowTerminal(false)}>✕</button>
              </div>
              <div className="terminal-output">
                {isRunningCode ? (
                  <div style={{ color: '#60a5fa' }}>⏳ Executing code in remote sandbox...</div>
                ) : terminalResult ? (
                  <div>
                    {terminalResult.stdout && <div className="terminal-stdout">{terminalResult.stdout}</div>}
                    {terminalResult.stderr && <div className="terminal-stderr">{terminalResult.stderr}</div>}
                    {!terminalResult.stdout && !terminalResult.stderr && (
                      <div style={{ color: '#94a3b8' }}>{terminalResult.output || 'Code executed with no output returned.'}</div>
                    )}
                    {terminalResult.error && <div className="terminal-stderr">{terminalResult.error}</div>}
                    <div className="terminal-meta">
                      ⏱️ Runtime: {terminalResult.executionTime || 0}ms | Exit Code: {terminalResult.code ?? 0}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8' }}>Click "▶️ Run Code" in the top bar to execute code.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Resizer Handle */}
        {isSidebarOpen && (
          <div 
            className={`sidebar-resizer ${isDragging ? 'dragging' : ''}`} 
            onMouseDown={handleResizerMouseDown}
          />
        )}

        {/* Sidebar Pane (Chat Only, Collapsible) */}
        <div 
          className={`pane sidebar-pane ${isSidebarOpen ? '' : 'collapsed'} ${isDragging ? 'no-transition' : ''}`}
          style={{ 
            width: isSidebarOpen ? `${sidebarWidth}px` : undefined,
            minWidth: isSidebarOpen ? `${sidebarWidth}px` : undefined
          }}
        >
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
                      <div className="quoted-reply-text">
                        {msg.replyTo.isGif ? (
                          <div className="quoted-reply-gif-container">
                            <img src={msg.replyTo.text} alt="Quoted GIF" className="quoted-reply-gif-img" />
                            <span className="quoted-reply-gif-label">GIF</span>
                          </div>
                        ) : (
                          msg.replyTo.text
                        )}
                      </div>
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

      {/* Version History Timeline & Diff Modal */}
      <div className={`modal ${showHistoryModal ? 'open' : ''}`}>
        <div className="modal-content glass-card history-modal">
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>⏱️ Version History & Code Diff</h3>
            <button className="close-picker-btn" onClick={() => setShowHistoryModal(false)}>✕</button>
          </div>

          <div className="history-container">
            <div className="history-timeline">
              <div style={{ padding: '0.5rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)' }}>
                SNAPSHOTS ({snapshots.length})
              </div>
              {snapshots.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                  No snapshots saved yet. Click "📸 Snapshot" in top bar to save one.
                </div>
              ) : (
                snapshots.map(s => (
                  <div 
                    key={s.id} 
                    className={`snapshot-item ${selectedSnapshot?.id === s.id ? 'active' : ''}`}
                    onClick={() => setSelectedSnapshot(s)}
                  >
                    <div className="snapshot-time">{s.timestamp}</div>
                    <div className="snapshot-author">{s.note}</div>
                    <div className="snapshot-file">by {s.author} ({s.filename})</div>
                  </div>
                ))
              )}
            </div>

            <div className="diff-view-pane">
              {selectedSnapshot ? (
                <>
                  <div className="diff-view-header">
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{selectedSnapshot.note}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({selectedSnapshot.filename})</span>
                    </div>
                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleRestoreSnapshot(selectedSnapshot)}>
                      ↺ Restore This Version
                    </button>
                  </div>
                  <div className="diff-content">
                    {generateSimpleDiff(selectedSnapshot.code, files[selectedSnapshot.filename]?.content || '').map((line, idx) => (
                      <span key={idx} className={line.type === 'added' ? 'diff-line-added' : line.type === 'removed' ? 'diff-line-removed' : ''}>
                        {line.text}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Select a version snapshot on the left to view code diffs.
                </div>
              )}
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

      {/* Activity Logs Modal */}
      <div className={`modal ${showLogsModal ? 'open' : ''}`}>
        <div className="modal-content glass-card activity-logs-modal" style={{ maxWidth: '480px' }}>
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>📋 Activity Logs</h3>
            <button className="close-picker-btn" onClick={() => setShowLogsModal(false)}>✕</button>
          </div>
          
          <div className="logs-list-container" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.25rem' }}>
            {activityLogs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0' }}>
                No activity logged yet. Join and leave events will appear here in real-time.
              </div>
            ) : (
              <div className="logs-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {activityLogs.map((log) => (
                  <div key={log.id} className="log-item" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', gap: '0.6rem', borderLeft: '3px solid var(--primary-color)' }}>
                    <span className="log-time" style={{ color: 'var(--primary-color)', opacity: 0.8, fontWeight: 700 }}>{log.time}</span>
                    <span className="log-text" style={{ color: '#fff' }}>{log.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setActivityLogs([])} style={{ flex: 1 }}>Clear Logs</button>
            <button className="btn btn-primary" onClick={() => setShowLogsModal(false)} style={{ flex: 1 }}>Close</button>
          </div>
        </div>
      </div>

      {/* Device Selector Settings Modal */}
      <div className={`modal ${showDeviceModal ? 'open' : ''}`}>
        <div className="modal-content glass-card" style={{ maxWidth: '420px' }}>
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>⚙️ Media Device Settings</h3>
            <button className="close-picker-btn" onClick={() => setShowDeviceModal(false)}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Microphone Device:</label>
              <select 
                className="header-select" 
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px' }}
                value={selectedAudioDevice}
                onChange={(e) => setSelectedAudioDevice(e.target.value)}
              >
                {audioInputDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone (${d.deviceId.substring(0, 5)})`}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Camera Device:</label>
              <select 
                className="header-select" 
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px' }}
                value={selectedVideoDevice}
                onChange={(e) => setSelectedVideoDevice(e.target.value)}
              >
                {videoInputDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera (${d.deviceId.substring(0, 5)})`}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => setShowDeviceModal(false)} style={{ width: '100%' }}>Done</button>
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
