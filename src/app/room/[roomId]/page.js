'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Copy,
  Check,
  Folder,
  Play,
  Loader2,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  Wrench,
  ChevronDown,
  History,
  Camera,
  Lock,
  Unlock,
  ClipboardList,
  Share2,
  MessageSquare,
  Crown,
  Columns2,
  Rows2,
  Minus,
  Maximize2,
  Plus,
  Trash2,
  X,
  FileCode,
  Terminal,
  Clock,
  Reply,
  Smile,
  Send,
  Search,
  Code,
  RotateCcw,
  Volume2,
  Zap,
  Radio,
  ExternalLink,
  Wifi,
  Circle,
  AlertCircle
} from 'lucide-react';

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
  const [speakingUsers, setSpeakingUsers] = useState({});
  const [connectionStats, setConnectionStats] = useState({});
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [peerConnectionStates, setPeerConnectionStates] = useState({});

  // UI Redesign & Responsive States
  const [isVideoShelfMinimized, setIsVideoShelfMinimized] = useState(false);
  const [stageDockPosition, setStageDockPosition] = useState('side'); // 'side' (Google Meet style) | 'top'
  const [spotlightUser, setSpotlightUser] = useState(null); // peerId or 'local' for large view modal
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState('editor'); // 'editor' | 'files' | 'chat' | 'terminal'
  const [copiedRoomId, setCopiedRoomId] = useState(false);

  const audioElementsRef = useRef({});
  const activeCallUsersRef = useRef([]);
  const makingOfferRef = useRef({});
  const isSettingRemoteAnswerPendingRef = useRef({});
  const signalingQueueRef = useRef({});
  const watchdogTimersRef = useRef({});
  const reconnectAttemptsRef = useRef({});
  const reconnectDebounceRef = useRef({});
  const iceServersRef = useRef([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:openrelay.metered.ca:80' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]);

  // Fetch dynamic WebRTC ICE configuration
  useEffect(() => {
    fetch('/api/turn')
      .then(res => res.json())
      .then(data => {
        if (data && data.iceServers && data.iceServers.length > 0) {
          iceServersRef.current = data.iceServers;
        }
      })
      .catch(e => console.warn('Could not load dynamic ICE config:', e));
  }, []);

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
              if (data.callActiveUsers) {
                activeCallUsersRef.current = data.callActiveUsers;
                setCallActiveUsers(data.callActiveUsers);
              }

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
              addActivityLog(`Joined room "${roomId}" as "${nicknameRef.current}"`);
              break;
            }

            case 'call-status-update': {
              const newActiveUsers = data.callActiveUsers || [];
              activeCallUsersRef.current = newActiveUsers;
              setCallActiveUsers(newActiveUsers);

              // 1. Clean up peer connections, audio elements, and streams for users who left
              Object.keys(peerConnectionsRef.current).forEach(peerId => {
                if (!newActiveUsers.includes(peerId)) {
                  if (peerConnectionsRef.current[peerId]) {
                    try { peerConnectionsRef.current[peerId].close(); } catch (e) {}
                    delete peerConnectionsRef.current[peerId];
                  }
                  if (audioElementsRef.current[peerId]) {
                    try {
                      audioElementsRef.current[peerId].pause();
                      audioElementsRef.current[peerId].srcObject = null;
                    } catch (e) {}
                    delete audioElementsRef.current[peerId];
                  }
                  if (watchdogTimersRef.current[peerId]) {
                    clearTimeout(watchdogTimersRef.current[peerId]);
                    delete watchdogTimersRef.current[peerId];
                  }
                  delete makingOfferRef.current[peerId];
                  delete isSettingRemoteAnswerPendingRef.current[peerId];
                  delete signalingQueueRef.current[peerId];
                  delete pendingIceCandidatesRef.current[peerId];
                  setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[peerId];
                    return next;
                  });
                  setPeerConnectionStates(prev => {
                    const next = { ...prev };
                    delete next[peerId];
                    return next;
                  });
                }
              });

              // 2. Deterministically initiate peer connections to any active call participants
              if (isInCallRef.current && localStreamRef.current) {
                newActiveUsers.forEach(peerId => {
                  if (peerId !== myUserIdRef.current && myUserIdRef.current < peerId) {
                    const existingPc = peerConnectionsRef.current[peerId];
                    const isConnectingOrConnected = existingPc &&
                      existingPc.signalingState !== 'closed' &&
                      (existingPc.connectionState === 'connected' || existingPc.connectionState === 'connecting' ||
                       existingPc.iceConnectionState === 'connected' || existingPc.iceConnectionState === 'checking');

                    // Lower userId initiates to higher userId only if not already connecting or connected
                    if (!isConnectingOrConnected) {
                      createPeerConnection(peerId, true);
                    }
                  }
                });
              }

              if (data.joinedUserName) {
                showToast(`${data.joinedUserName} joined the voice call!`, 'join');
              } else if (data.leftUserName) {
                showToast(`${data.leftUserName} left the call.`, 'leave');
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

              showToast(data.isPresenterMode ? `Presenter Mode activated by ${data.hostName}` : `Presenter Mode disabled by ${data.hostName}`, 'join');
              addActivityLog(data.isPresenterMode ? 'Presenter Mode enabled' : 'Presenter Mode disabled');
              break;
            }

            case 'snapshot-created': {
              setSnapshots(data.snapshots);
              addActivityLog(`Version snapshot saved by ${data.snapshot.author}`);
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
              addActivityLog(`New file created: "${data.filename}"`);
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
              addActivityLog(`File deleted: "${data.filename}"`);
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
              addActivityLog(`File renamed: "${data.oldFilename}" → "${data.newFilename}"`);
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
              addActivityLog(`Language changed for "${data.filename}": ${data.language}`);
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
              showToast(`${data.user.name} joined the studio!`, 'join');
              setUsers(data.users);
              addActivityLog(`User "${data.user.name}" joined the studio`);
              break;
            }

            case 'user-left': {
              showToast(`${data.userName} left the studio.`, 'leave');
              setUsers(data.users);
              addActivityLog(`User "${data.userName}" left the studio`);

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
                showToast('You are now the Room Host!', 'join');
              }
              setHostName(data.newHostName);
              addActivityLog(`Host reassigned to "${data.newHostName}"`);
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
              showToast(data.isLocked ? 'Room is now password protected!' : 'Room is now unlocked!', 'join');
              addActivityLog(data.isLocked ? 'Password protection enabled for this room' : 'Password protection disabled');
              break;
            }
          }
        } catch (err) {
          console.error('Error processing websocket message:', err);
        }
      };

      socket.onclose = () => {
        if (!isComponentMounted) return;
        showToast('Connection lost. Retrying...', 'leave');
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
      showToast('Version snapshot saved!', 'join');
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
      showToast(`Restored version snapshot (${snapshot.timestamp})`, 'join');
    }
  };

  // WebRTC Audio / Video Call Handlers
  const ensureLocalTracksOnPeerConnection = (pc) => {
    if (!localStreamRef.current || !pc || pc.signalingState === 'closed') return;
    const senders = pc.getSenders();
    localStreamRef.current.getTracks().forEach(track => {
      const existingSender = senders.find(s => s.track && s.track.kind === track.kind);
      if (existingSender) {
        if (existingSender.track.id !== track.id) {
          try {
            existingSender.replaceTrack(track);
          } catch (e) {
            console.warn('Error replacing track on PC:', e);
          }
        }
      } else {
        try {
          pc.addTrack(track, localStreamRef.current);
        } catch (e) {
          console.warn('Error adding track to PC:', e);
        }
      }
    });
  };

  const addIceCandidateSafely = async (pc, targetUserId, candidateData) => {
    if (!candidateData) return;
    if (pc && pc.signalingState === 'closed') return;
    try {
      const iceCandidate = (typeof RTCIceCandidate !== 'undefined' && candidateData.candidate)
        ? new RTCIceCandidate(candidateData)
        : candidateData;

      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(iceCandidate);
      } else {
        if (!pendingIceCandidatesRef.current[targetUserId]) {
          pendingIceCandidatesRef.current[targetUserId] = [];
        }
        pendingIceCandidatesRef.current[targetUserId].push(candidateData);
      }
    } catch (e) {
      console.warn(`[WebRTC] addIceCandidate error for ${targetUserId}:`, e);
    }
  };

  const flushPendingIceCandidates = async (pc, targetUserId) => {
    if (!pc || pc.signalingState === 'closed') return;
    const candidates = pendingIceCandidatesRef.current[targetUserId] || [];
    pendingIceCandidatesRef.current[targetUserId] = [];
    for (const cand of candidates) {
      if (!pc || pc.signalingState === 'closed') return;
      if (!cand || !cand.candidate) continue;
      try {
        const iceCandidate = (typeof RTCIceCandidate !== 'undefined' && cand.candidate)
          ? new RTCIceCandidate(cand)
          : cand;
        await pc.addIceCandidate(iceCandidate);
      } catch (e) {
        console.warn(`[WebRTC] flush candidate error for ${targetUserId}:`, e);
      }
    }
  };

  const handleToggleCall = async () => {
    if (isInCall) {
      // Leave call: clean up local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      // Close all watchdog timers
      Object.keys(watchdogTimersRef.current).forEach(peerId => {
        clearTimeout(watchdogTimersRef.current[peerId]);
        delete watchdogTimersRef.current[peerId];
      });
      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => {
        try { pc.close(); } catch (e) {}
      });
      peerConnectionsRef.current = {};
      pendingIceCandidatesRef.current = {};
      makingOfferRef.current = {};
      isSettingRemoteAnswerPendingRef.current = {};
      signalingQueueRef.current = {};
      reconnectAttemptsRef.current = {};
      reconnectDebounceRef.current = {};

      // Stop and clean up all persistent consumer audio elements
      Object.values(audioElementsRef.current).forEach(audio => {
        try {
          audio.pause();
          audio.srcObject = null;
        } catch (e) {}
      });
      audioElementsRef.current = {};

      setRemoteStreams({});
      setPeerConnectionStates({});
      setIsInCall(false);
      isInCallRef.current = false;
      setIsVideoOn(false);
      setIsMuted(false);

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'leave-call' }));
      }
      showToast('Left the voice call.', 'leave');
      return;
    }

    // Producer: Resume AudioContext on user gesture to unlock browser audio autoplay
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
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: true
        });
        if (!isVideoOn) {
          const vt = stream.getVideoTracks()[0];
          if (vt) vt.enabled = false;
        }
      } catch (e) {
        // Fallback to audio-only if camera is unavailable or permission denied
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        setIsVideoOn(false);
      }

      // Producer: Ensure audio track is enabled
      const at = stream.getAudioTracks()[0];
      if (at) at.enabled = true;

      localStreamRef.current = stream;
      setIsInCall(true);
      isInCallRef.current = true;
      setIsMuted(false);
      showToast('Joined voice call!', 'join');

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'join-call' }));
      }

      // Connect with all active participants using ref to avoid React state closure stale data
      const activePeers = activeCallUsersRef.current && activeCallUsersRef.current.length > 0
        ? activeCallUsersRef.current
        : callActiveUsers;

      activePeers.forEach(targetId => {
        if (targetId !== myUserIdRef.current && myUserIdRef.current < targetId) {
          const existingPc = peerConnectionsRef.current[targetId];
          const isConnectingOrConnected = existingPc &&
            existingPc.signalingState !== 'closed' &&
            (existingPc.connectionState === 'connected' || existingPc.connectionState === 'connecting' ||
             existingPc.iceConnectionState === 'connected' || existingPc.iceConnectionState === 'checking');

          if (!isConnectingOrConnected) {
            createPeerConnection(targetId, true);
          }
        }
      });
    } catch (err) {
      console.error('getUserMedia error:', err);
      alert('Could not access microphone/camera: ' + err.message);
    }
  };

  const sendOffer = async (targetUserId, isIceRestart = false) => {
    const pc = peerConnectionsRef.current[targetUserId];
    if (!pc || pc.signalingState === 'closed') return;

    // In Perfect Negotiation, an offer can only be sent from the stable state
    if (pc.signalingState !== 'stable') {
      console.warn(`[WebRTC] Cannot send offer to ${targetUserId}: signalingState is ${pc.signalingState}`);
      return;
    }

    try {
      makingOfferRef.current[targetUserId] = true;
      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      };
      if (isIceRestart) {
        try { pc.restartIce(); } catch (e) {}
        offerOptions.iceRestart = true;
      }
      const offer = await pc.createOffer(offerOptions);
      if (pc.signalingState !== 'stable') {
        console.warn(`[WebRTC] Aborting setLocalDescription for ${targetUserId}: state transitioned to ${pc.signalingState}`);
        return;
      }
      await pc.setLocalDescription(offer);

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'webrtc-signal',
          targetUserId: targetUserId,
          signal: { type: 'offer', offer: pc.localDescription }
        }));
      }
    } catch (err) {
      console.error(`[WebRTC] Error sending offer to ${targetUserId}:`, err);
    } finally {
      makingOfferRef.current[targetUserId] = false;
    }
  };

  const queueSendOffer = (targetUserId, isIceRestart = false) => {
    signalingQueueRef.current[targetUserId] = (signalingQueueRef.current[targetUserId] || Promise.resolve())
      .then(() => sendOffer(targetUserId, isIceRestart))
      .catch(err => console.error(`[WebRTC] Error in queued sendOffer for ${targetUserId}:`, err));
  };

  const reconnectPeer = (targetUserId, forceFullReset = false) => {
    if (!isInCallRef.current || !localStreamRef.current) return;
    if (myUserIdRef.current >= targetUserId) return; // Only deterministic initiator recovers

    // Debounce to prevent duplicate triggers from simultaneous connectionState and iceConnectionState events
    const now = Date.now();
    if (reconnectDebounceRef.current[targetUserId] && now - reconnectDebounceRef.current[targetUserId] < 2000) {
      return;
    }
    reconnectDebounceRef.current[targetUserId] = now;

    const attempts = reconnectAttemptsRef.current[targetUserId] || 0;
    if (attempts >= 2) {
      console.warn(`[WebRTC] Reconnection attempts exceeded (2) for ${targetUserId}. Waiting for network resolution.`);
      setPeerConnectionStates(prev => ({ ...prev, [targetUserId]: 'failed' }));
      return;
    }
    reconnectAttemptsRef.current[targetUserId] = attempts + 1;

    const pc = peerConnectionsRef.current[targetUserId];
    // If connection is still in a stable signaling state, prefer clean ICE restart over destructive reset
    if (!forceFullReset && pc && pc.signalingState === 'stable' && attempts === 0) {
      console.log(`[WebRTC] Attempting clean ICE restart for ${targetUserId} (attempt ${attempts + 1})...`);
      queueSendOffer(targetUserId, true);
      return;
    }

    console.log(`[WebRTC] Reconnecting peer session to ${targetUserId} (attempt ${attempts + 1})...`);

    // 1. Notify remote peer to reset its PC
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'webrtc-signal',
        targetUserId: targetUserId,
        signal: { type: 'reset-peer' }
      }));
    }

    // 2. Clean up local PC
    const oldPc = peerConnectionsRef.current[targetUserId];
    if (oldPc) {
      try { oldPc.close(); } catch (e) {}
      delete peerConnectionsRef.current[targetUserId];
    }
    delete pendingIceCandidatesRef.current[targetUserId];
    delete makingOfferRef.current[targetUserId];
    delete isSettingRemoteAnswerPendingRef.current[targetUserId];

    // 3. Delay slightly to allow reset-peer message to reach responder before fresh offer
    setTimeout(() => {
      if (isInCallRef.current && localStreamRef.current) {
        createPeerConnection(targetUserId, true);
      }
    }, 250);
  };

  const createPeerConnection = (targetUserId, isInitiator) => {
    let pc = peerConnectionsRef.current[targetUserId];
    if (pc && pc.signalingState !== 'closed' && pc.connectionState !== 'failed' && pc.iceConnectionState !== 'failed') {
      ensureLocalTracksOnPeerConnection(pc);
      return pc;
    }

    if (pc) {
      try { pc.close(); } catch (e) {}
      delete peerConnectionsRef.current[targetUserId];
    }

    // Dynamic STUN and TURN configuration for multi-device NAT & firewall traversal
    pc = new RTCPeerConnection({
      iceServers: iceServersRef.current,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    peerConnectionsRef.current[targetUserId] = pc;
    ensureLocalTracksOnPeerConnection(pc);

    const clearWatchdog = () => {
      if (watchdogTimersRef.current[targetUserId]) {
        clearTimeout(watchdogTimersRef.current[targetUserId]);
        delete watchdogTimersRef.current[targetUserId];
      }
    };

    const startWatchdog = () => {
      // ONLY the initiator (lower userId) runs watchdog recovery to prevent race conditions
      if (myUserIdRef.current >= targetUserId) return;
      if (watchdogTimersRef.current[targetUserId]) return;

      // Generous 25s window for ICE gathering and TURN relay allocation across mobile networks/NATs
      watchdogTimersRef.current[targetUserId] = setTimeout(() => {
        delete watchdogTimersRef.current[targetUserId];
        const currentPc = peerConnectionsRef.current[targetUserId];
        if (!currentPc || currentPc.signalingState === 'closed') return;

        const cState = currentPc.connectionState;
        const iState = currentPc.iceConnectionState;
        if (cState !== 'connected' && iState !== 'connected' && iState !== 'completed') {
          console.warn(`[WebRTC Watchdog] Initiator ${myUserIdRef.current} detected stalled connection to ${targetUserId} (${cState}/${iState}). Attempting recovery...`);
          reconnectPeer(targetUserId);
        }
      }, 25000);
    };

    // Track WebRTC connection lifecycle states
    const updateConnState = () => {
      const connState = pc.connectionState;
      const iceState = pc.iceConnectionState;
      if (connState === 'connected' || iceState === 'connected' || iceState === 'completed') {
        clearWatchdog();
        delete reconnectAttemptsRef.current[targetUserId];
        delete reconnectDebounceRef.current[targetUserId];
        setPeerConnectionStates(prev => ({ ...prev, [targetUserId]: 'connected' }));
      } else if (connState === 'failed' || iceState === 'failed') {
        clearWatchdog();
        setPeerConnectionStates(prev => ({ ...prev, [targetUserId]: 'failed' }));
      } else if (connState === 'connecting' || iceState === 'checking') {
        startWatchdog();
        setPeerConnectionStates(prev => ({ ...prev, [targetUserId]: 'connecting' }));
      }
    };

    pc.onconnectionstatechange = () => {
      updateConnState();
      if (pc.connectionState === 'failed') {
        console.warn(`[WebRTC] PeerConnection to ${targetUserId} failed.`);
        if (myUserIdRef.current < targetUserId) {
          reconnectPeer(targetUserId);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      updateConnState();
      if (pc.iceConnectionState === 'failed') {
        console.warn(`[WebRTC] ICE connection to ${targetUserId} failed.`);
        if (myUserIdRef.current < targetUserId) {
          reconnectPeer(targetUserId);
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const candJson = event.candidate.toJSON ? event.candidate.toJSON() : {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        };
        socketRef.current.send(JSON.stringify({
          type: 'webrtc-signal',
          targetUserId: targetUserId,
          signal: {
            type: 'candidate',
            candidate: candJson
          }
        }));
      }
    };

    // Consumer: Ingest incoming audio & video tracks
    pc.ontrack = (event) => {
      if (event.track) {
        event.track.enabled = true;
      }

      // 1. Consumer Audio Pipeline: Persistent HTMLAudioElement
      let audioTrack = null;
      if (event.track && event.track.kind === 'audio') {
        audioTrack = event.track;
      } else if (event.streams && event.streams[0]) {
        audioTrack = event.streams[0].getAudioTracks()[0];
      }

      if (audioTrack) {
        let audioEl = audioElementsRef.current[targetUserId];
        if (!audioEl) {
          audioEl = new Audio();
          audioEl.autoplay = true;
          audioEl.playsInline = true;
          audioEl.muted = false;
          audioEl.volume = 1.0;
          audioElementsRef.current[targetUserId] = audioEl;
        }

        const existingTrack = audioEl.srcObject?.getAudioTracks()?.[0];
        if (!existingTrack || existingTrack.id !== audioTrack.id) {
          audioEl.srcObject = new MediaStream([audioTrack]);
          audioEl.play().catch(e => {
            if (e.name !== 'AbortError') {
              console.warn('Audio autoplay blocked by browser policy:', e);
            }
          });
        }
      }

      // 2. Video Track State for UI Video Cards
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
      queueSendOffer(targetUserId, false);
    }

    return pc;
  };

  const processIncomingSignal = async (senderUserId, signal) => {
    let pc = peerConnectionsRef.current[senderUserId];
    // In standard W3C Perfect Negotiation:
    // Initiator (myUserId < senderUserId) is IMPOLITE.
    // Responder (myUserId > senderUserId) is POLITE.
    const isPolite = myUserIdRef.current > senderUserId;

    try {
      if (signal.type === 'offer') {
        if (!isInCallRef.current || !localStreamRef.current) return;

        if (!pc || pc.signalingState === 'closed' || pc.connectionState === 'failed') {
          if (pc) {
            try { pc.close(); } catch (e) {}
            delete peerConnectionsRef.current[senderUserId];
          }
          pc = createPeerConnection(senderUserId, false);
        }

        ensureLocalTracksOnPeerConnection(pc);

        // Perfect Negotiation Collision Check
        const readyForOffer = !makingOfferRef.current[senderUserId] &&
          (pc.signalingState === 'stable' || isSettingRemoteAnswerPendingRef.current[senderUserId]);
        const isOfferCollision = !readyForOffer;

        if (isOfferCollision) {
          if (!isPolite) {
            console.log(`[WebRTC] Collision: impolite peer ${myUserIdRef.current} ignoring offer from ${senderUserId}`);
            return;
          }
          // Polite peer yields: ONLY rollback if local offer is actually pending
          if (pc.signalingState === 'have-local-offer') {
            console.log(`[WebRTC] Collision: polite peer ${myUserIdRef.current} rolling back local offer for ${senderUserId}`);
            await pc.setLocalDescription({ type: 'rollback' });
          }
        }

        if (pc.signalingState !== 'stable') {
          console.warn(`[WebRTC] PC for ${senderUserId} in unexpected state ${pc.signalingState}, resetting connection to accept offer.`);
          try { pc.close(); } catch (e) {}
          delete peerConnectionsRef.current[senderUserId];
          pc = createPeerConnection(senderUserId, false);
          ensureLocalTracksOnPeerConnection(pc);
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));

        if (pc.signalingState === 'have-remote-offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: 'webrtc-signal',
              targetUserId: senderUserId,
              signal: { type: 'answer', answer: pc.localDescription }
            }));
          }
        }

        await flushPendingIceCandidates(pc, senderUserId);
      } else if (signal.type === 'answer') {
        if (!pc || pc.signalingState === 'closed') return;

        // An answer is only valid when waiting for remote answer (have-local-offer)
        if (pc.signalingState === 'have-local-offer') {
          isSettingRemoteAnswerPendingRef.current[senderUserId] = true;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
            await flushPendingIceCandidates(pc, senderUserId);
          } finally {
            isSettingRemoteAnswerPendingRef.current[senderUserId] = false;
          }
        } else {
          console.warn(`[WebRTC] Ignoring unexpected answer from ${senderUserId} in state: ${pc.signalingState}`);
        }
      } else if (signal.type === 'candidate') {
        await addIceCandidateSafely(pc, senderUserId, signal.candidate);
      } else if (signal.type === 'reset-peer') {
        console.log(`[WebRTC] Peer ${senderUserId} requested connection reset.`);
        if (pc) {
          try { pc.close(); } catch (e) {}
          delete peerConnectionsRef.current[senderUserId];
        }
        delete pendingIceCandidatesRef.current[senderUserId];
        delete makingOfferRef.current[senderUserId];
        delete isSettingRemoteAnswerPendingRef.current[senderUserId];
        setPeerConnectionStates(prev => ({ ...prev, [senderUserId]: 'connecting' }));
      }
    } catch (err) {
      console.error(`[WebRTC] Error processing signal from ${senderUserId}:`, err);
    }
  };

  const handleIncomingSignal = (senderUserId, signal) => {
    signalingQueueRef.current[senderUserId] = (signalingQueueRef.current[senderUserId] || Promise.resolve())
      .then(() => processIncomingSignal(senderUserId, signal))
      .catch(err => console.error(`[WebRTC] Queue error for ${senderUserId}:`, err));
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

          // Add new video track to all active peer connections and renegotiate safely
          Object.entries(peerConnectionsRef.current).forEach(([targetId, pc]) => {
            if (pc && pc.signalingState !== 'closed') {
              try {
                pc.addTrack(newTrack, localStreamRef.current);
              } catch (e) {
                console.warn('Error adding video track to PC:', e);
              }
              queueSendOffer(targetId, false);
            }
          });

          setIsVideoOn(true);
        } catch (e) {
          alert('Could not enable camera: ' + e.message);
        }
      }
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
      showToast('Editor is empty!', 'leave');
      return;
    }

    setIsRunningCode(true);
    setShowTerminal(true);
    setTerminalResult({ output: 'Compiling and executing code in sandbox...', executionTime: 0 });

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

  const handleCopyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId).then(() => {
      setCopiedRoomId(true);
      showToast('Room ID copied to clipboard!', 'join');
      setTimeout(() => setCopiedRoomId(false), 2000);
    }).catch(err => {
      console.error('Failed to copy Room ID: ', err);
    });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showToolsMenu && !e.target.closest('.tools-menu-wrapper')) {
        setShowToolsMenu(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showToolsMenu]);

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Link copied to clipboard!', 'join');
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

  const renderVideoCards = (isSideLayout = false) => {
    const totalParticipants = Object.keys(remoteStreams).length + (isVideoOn && localStreamRef.current ? 1 : 0);
    const sizeClass = totalParticipants <= 1 ? 'card-large' : totalParticipants === 2 ? 'card-medium' : 'card-standard';

    return (
      <>
        {/* Local Camera Preview */}
        {isVideoOn && localStreamRef.current && (
          <div 
            className={`webrtc-video-card local-video-card ${sizeClass} ${speakingUsers[myUserIdRef.current] ? 'is-speaking' : ''}`}
            onClick={() => setSpotlightUser('local')}
            title="Click to view in Large Spotlight View"
          >
            {speakingUsers[myUserIdRef.current] && (
              <span className="webrtc-speaker-indicator" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Mic size={12} /> Speaking...
              </span>
            )}
            <button 
              type="button"
              className="card-enlarge-btn"
              onClick={(e) => {
                e.stopPropagation();
                setSpotlightUser('local');
              }}
              title="Large View (Google Meet Spotlight)"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Maximize2 size={11} /> Large View
            </button>
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

        {/* Remote Video / Audio Cards */}
        {(() => {
          const remotePeerIds = Array.from(new Set([
            ...callActiveUsers.filter(id => id !== myUserIdRef.current),
            ...Object.keys(remoteStreams)
          ]));

          return remotePeerIds.map((peerId) => {
            const stream = remoteStreams[peerId];
            const peerUser = users.find(u => u.id === peerId);
            const isPeerSpeaking = speakingUsers[peerId];
            const stats = connectionStats[peerId];
            const connState = peerConnectionStates[peerId] || (stream ? 'connected' : 'connecting');
            const hasVideoTrack = stream && stream.getVideoTracks && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;
            return (
              <div 
                key={peerId} 
                className={`webrtc-video-card ${sizeClass} ${isPeerSpeaking ? 'is-speaking' : ''}`}
                onClick={() => setSpotlightUser(peerId)}
                title="Click to view in Large Spotlight View"
              >
                {isPeerSpeaking && (
                  <span className="webrtc-speaker-indicator" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Mic size={12} /> Speaking...
                  </span>
                )}
                <button 
                  type="button"
                  className="card-enlarge-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpotlightUser(peerId);
                  }}
                  title="Large View (Google Meet Spotlight)"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Maximize2 size={11} /> Large View
                </button>
                <span className={`webrtc-connection-badge badge-${connState}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Circle size={8} fill={connState === 'connected' ? '#10b981' : connState === 'connecting' ? '#f59e0b' : '#ef4444'} color="transparent" />
                  {connState === 'connected' ? 'Connected' : connState === 'connecting' ? 'Connecting' : connState}
                </span>
                {stats && (
                  <span className="webrtc-ping-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Wifi size={10} /> {stats.rtt}ms
                  </span>
                )}
                {hasVideoTrack ? (
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
                ) : (
                  <div className="audio-only-avatar-card">
                    <div 
                      className={`audio-avatar-circle ${isPeerSpeaking ? 'pulse-speaking' : ''}`} 
                      style={{ backgroundColor: peerUser?.color || '#3b82f6' }}
                    >
                      {peerUser ? peerUser.name.substring(0, 2).toUpperCase() : 'PE'}
                    </div>
                    <span className="audio-status-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {connState === 'connected' ? (
                        <>
                          <Volume2 size={12} />
                          {isPeerSpeaking ? 'Speaking...' : 'Audio Active'}
                        </>
                      ) : connState === 'connecting' ? 'Connecting...' : 'Connection Failed'}
                    </span>
                  </div>
                )}
                <span className="webrtc-peer-name">{peerUser ? peerUser.name : 'Peer'}</span>
              </div>
            );
          });
        })()}
      </>
    );
  };

  const renderStageHeader = (isSideLayout = false) => (
    <div className="shelf-header">
      <div className="shelf-title">
        <span className="live-dot" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Circle size={8} fill="#10b981" color="transparent" />
        </span>
        <span>{isSideLayout ? 'MEET STAGE' : 'STUDIO STAGE'} ({Object.keys(remoteStreams).length + (isVideoOn ? 1 : 0)})</span>
      </div>
      <div className="shelf-actions">
        {/* Google Meet Side vs Top Layout Switcher */}
        <div className="dock-switcher" title="Switch Video Layout">
          <button 
            type="button"
            className={`dock-btn ${stageDockPosition === 'side' ? 'active' : ''}`}
            onClick={() => setStageDockPosition('side')}
            title="Side Layout (Google Meet style)"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Columns2 size={13} />
            <span>Side</span>
          </button>
          <button 
            type="button"
            className={`dock-btn ${stageDockPosition === 'top' ? 'active' : ''}`}
            onClick={() => setStageDockPosition('top')}
            title="Top Banner Layout"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Rows2 size={13} />
            <span>Top</span>
          </button>
        </div>

        <button 
          type="button"
          className="shelf-ctrl-btn" 
          onClick={() => setIsVideoShelfMinimized(true)}
          title="Minimize to Floating Pill"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Minus size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="room-body">
      <div className="glow-bg"></div>

      {/* Header */}
      <header className="room-header">
        {/* Left Zone: Logo & Room Pill & Explorer Toggle */}
        <div className="header-left">
          <a href="/" className="logo-link" title="HiveCode Home">
            <div className="logo header-logo">
              <span className="logo-bracket">&lt;</span>
              <span className="logo-text">HiveCode</span>
              <span className="logo-bracket">/&gt;</span>
            </div>
          </a>

          <div className="room-badge-pill" onClick={handleCopyRoomId} title="Click to copy Room ID">
            <span className="room-badge-label">ROOM</span>
            <span className="room-badge-id">{roomId || '--------'}</span>
            <span className="room-badge-copy-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
              {copiedRoomId ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
            </span>
          </div>

          <button 
            className={`header-icon-btn ${showFileExplorer ? 'active' : ''} desktop-only-btn`}
            onClick={() => setShowFileExplorer(!showFileExplorer)} 
            title={showFileExplorer ? "Hide Files Explorer" : "Show Files Explorer"}
          >
            <Folder size={15} />
            <span className="btn-label">Files</span>
          </button>
        </div>

        {/* Center Zone: Run Code & Call Capsule */}
        <div className="header-center">
          {/* Run Code Primary CTA */}
          <button 
            className="run-code-action-btn" 
            onClick={handleRunCode} 
            disabled={isRunningCode} 
            title="Execute Code in Sandbox Console (Ctrl+Enter)"
          >
            <span className="run-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
              {isRunningCode ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} fill="currentColor" />}
            </span>
            <span className="run-text">{isRunningCode ? 'Running...' : 'Run Code'}</span>
          </button>

          {/* WebRTC Call Capsule */}
          <div className="call-capsule">
            {!isInCall ? (
              <button 
                className={`call-pill-btn ${callActiveUsers.length > 0 ? 'call-pulse' : ''}`}
                onClick={handleToggleCall}
                title={callActiveUsers.length > 0 ? `Join Call (${callActiveUsers.length} Active)` : "Start Voice/Video Call"}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {callActiveUsers.length > 0 ? <PhoneCall size={15} /> : <Mic size={15} />}
                </span>
                <span className="pill-text">
                  {callActiveUsers.length > 0 ? `Join Call (${callActiveUsers.length})` : 'Start Call'}
                </span>
              </button>
            ) : (
              <div className="call-active-toolbar">
                <button 
                  className={`call-ctrl-btn ${isMuted ? 'btn-danger' : 'btn-active'}`}
                  onClick={handleToggleMute} 
                  title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
                <button 
                  className={`call-ctrl-btn ${isVideoOn ? 'btn-active' : ''}`}
                  onClick={handleToggleVideo} 
                  title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isVideoOn ? <Video size={15} /> : <VideoOff size={15} />}
                </button>
                <button 
                  className="call-ctrl-btn desktop-only"
                  onClick={handleOpenDeviceModal} 
                  title="Audio & Video Settings"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Settings size={15} />
                </button>
                <button 
                  className="call-ctrl-btn btn-leave-call"
                  onClick={handleToggleCall} 
                  title="Cancel and Leave Call"
                >
                  <span className="leave-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <PhoneOff size={14} />
                  </span>
                  <span className="leave-text">End</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Zone: Selectors, Tools Menu, Chat Toggle, Presence Avatars */}
        <div className="header-right">
          {/* Language Selector */}
          <div className="select-pill-wrapper desktop-only">
            <select 
              className="header-compact-select"
              value={files[activeFile]?.language || 'javascript'}
              onChange={(e) => handleLanguageChange(e.target.value)}
              title="Select Programming Language"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.label}</option>
              ))}
            </select>
          </div>

          {/* Theme Selector */}
          <div className="select-pill-wrapper desktop-only">
            <select 
              className="header-compact-select"
              value={editorTheme}
              onChange={(e) => handleThemeChange(e.target.value)}
              title="Select Editor Theme"
            >
              {THEMES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Tools / More Menu Dropdown */}
          <div className="tools-menu-wrapper">
            <button 
              className={`header-icon-btn ${showToolsMenu ? 'active' : ''}`}
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              title="Studio Tools & Settings"
            >
              <Wrench size={15} />
              <span className="btn-label desktop-only">Tools</span>
              <ChevronDown size={12} />
            </button>

            {showToolsMenu && (
              <div className="tools-dropdown-menu">
                <button 
                  className="tools-menu-item"
                  onClick={() => {
                    setShowToolsMenu(false);
                    setShowHistoryModal(true);
                    if (snapshots.length && !selectedSnapshot) setSelectedSnapshot(snapshots[0]);
                  }}
                >
                  <History size={18} color="#38bdf8" />
                  <div>
                    <div className="item-title">Version History</div>
                    <div className="item-desc">View code diffs & checkpoints</div>
                  </div>
                </button>

                <button 
                  className="tools-menu-item"
                  onClick={() => {
                    setShowToolsMenu(false);
                    handleSaveSnapshot();
                  }}
                >
                  <Camera size={18} color="#a855f7" />
                  <div>
                    <div className="item-title">Save Snapshot</div>
                    <div className="item-desc">Create immediate restore point</div>
                  </div>
                </button>

                <button 
                  className="tools-menu-item"
                  onClick={() => {
                    setShowToolsMenu(false);
                    setShowLockModal(true);
                  }}
                >
                  {isRoomLocked ? <Lock size={18} color="#ef4444" /> : <Unlock size={18} color="#10b981" />}
                  <div>
                    <div className="item-title">{isRoomLocked ? 'Room Protected' : 'Room Security'}</div>
                    <div className="item-desc">{isRoomLocked ? 'Change password' : 'Lock with password'}</div>
                  </div>
                </button>

                <button 
                  className="tools-menu-item"
                  onClick={() => {
                    setShowToolsMenu(false);
                    setShowLogsModal(true);
                  }}
                >
                  <ClipboardList size={18} color="#f59e0b" />
                  <div>
                    <div className="item-title">Activity Logs</div>
                    <div className="item-desc">Real-time room events</div>
                  </div>
                </button>

                {isHost && (
                  <button 
                    className="tools-menu-item highlight-item"
                    onClick={() => {
                      setShowToolsMenu(false);
                      handleTogglePresenterMode();
                    }}
                  >
                    {isPresenterMode ? <Unlock size={18} color="#ef4444" /> : <Lock size={18} color="#38bdf8" />}
                    <div>
                      <div className="item-title">{isPresenterMode ? 'End Presenter Mode' : 'Start Presenter Mode'}</div>
                      <div className="item-desc">{isPresenterMode ? 'Allow guests to edit' : 'Lock guest editing'}</div>
                    </div>
                  </button>
                )}

                {/* Mobile View: Quick Theme & Language inside Menu */}
                <div className="mobile-menu-options mobile-only">
                  <div className="menu-divider"></div>
                  <div className="mobile-menu-select-row">
                    <label>Language:</label>
                    <select 
                      value={files[activeFile]?.language || 'javascript'}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.id} value={lang.id}>{lang.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mobile-menu-select-row">
                    <label>Theme:</label>
                    <select 
                      value={editorTheme}
                      onChange={(e) => handleThemeChange(e.target.value)}
                    >
                      {THEMES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Share Button */}
          <button className="header-primary-btn" onClick={handleShare} title="Copy Share Link">
            <Share2 size={15} />
            <span className="btn-label desktop-only">Share</span>
          </button>

          {/* Chat Toggle Button */}
          <button 
            className={`header-icon-btn chat-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                setIsSidebarOpen(true);
                setMobileActiveView(mobileActiveView === 'chat' ? 'editor' : 'chat');
              } else {
                setIsSidebarOpen(!isSidebarOpen);
              }
            }} 
            title={isSidebarOpen ? "Hide Chat Sidebar" : "Show Chat Sidebar"}
          >
            <MessageSquare size={15} />
            <span className="btn-label desktop-only">Chat</span>
            {chatMessages.length > 0 && (
              <span className="chat-badge-counter">{chatMessages.length}</span>
            )}
          </button>

          {/* User Presence Avatar Stack */}
          <div className="user-avatar-stack">
            {users.slice(0, 4).map(u => {
              const inCall = callActiveUsers.includes(u.id);
              const isSpeaking = speakingUsers[u.id];
              return (
                <div 
                  key={u.id} 
                  className={`user-avatar ${inCall ? 'in-call-avatar' : ''} ${isSpeaking ? 'speaking-active' : ''}`} 
                  style={{ backgroundColor: u.color }}
                >
                  {u.name.substring(0, 2).toUpperCase()}
                  {inCall && (
                    <span className="call-badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSpeaking ? <Zap size={10} color="#fbbf24" fill="#fbbf24" /> : <Mic size={10} color="#fff" />}
                    </span>
                  )}
                  <span className="tooltip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {u.name}
                    {u.id === myUserIdRef.current ? ' (You)' : ''}
                    {u.id === (isHost ? myUserIdRef.current : '') && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#fbbf24' }}>
                        <Crown size={12} /> Host
                      </span>
                    )}
                    {isSpeaking ? ' (Speaking...)' : inCall ? ' (In Call)' : ''}
                  </span>
                </div>
              );
            })}
            {users.length > 4 && (
              <div className="user-avatar overflow-avatar" title={`${users.length - 4} more users online`}>
                +{users.length - 4}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Guest Read-Only Presenter Banner */}
      {isPresenterMode && !isHost && (
        <div className="presenter-banner">
          <div className="presenter-banner-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={15} />
            <span>PRESENTER MODE ACTIVE - Code editing is currently restricted to Host ({hostName}). You are in view-only Watch Party mode.</span>
          </div>
        </div>
      )}

      {/* WebRTC Video Call: Minimized Floating Pill or Top Banner Shelf */}
      {isInCall && (Object.keys(remoteStreams).length > 0 || (isVideoOn && localStreamRef.current)) && (
        isVideoShelfMinimized ? (
          <div className="webrtc-minimized-pill">
            <div 
              className="pill-clickable-area"
              onClick={() => setIsVideoShelfMinimized(false)}
              title="Expand Video Stage"
            >
              <span className="live-dot" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <Circle size={8} fill="#10b981" color="transparent" />
              </span>
              <span>Stage ({Object.keys(remoteStreams).length + (isVideoOn ? 1 : 0)})</span>
              <span className="pill-expand-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <Maximize2 size={13} />
              </span>
            </div>
            <button 
              className="pill-leave-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleCall();
              }}
              title="Cancel and Leave Call"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <PhoneOff size={13} />
              <span>End</span>
            </button>
          </div>
        ) : stageDockPosition === 'top' ? (
          <div className="webrtc-video-shelf">
            {renderStageHeader(false)}
            <div className="shelf-cards-scroll">
              {renderVideoCards(false)}
            </div>
          </div>
        ) : null
      )}

      {/* Workspace */}
      <div className="workspace" data-mobile-view={mobileActiveView}>
        {/* File Explorer Sidebar */}
        {showFileExplorer && (
          <div className="file-explorer-sidebar">
            <div className="file-explorer-header">
              <span>FILES</span>
              <button 
                className="add-file-btn" 
                onClick={handleCreateFile} 
                title="Create New File"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="file-list">
              {Object.keys(files).map(filename => (
                <div 
                  key={filename}
                  className={`file-item ${filename === activeFile ? 'active' : ''}`}
                  onClick={() => handleSwitchFile(filename)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FileCode size={14} />
                    <span>{filename}</span>
                  </span>
                  <div className="file-item-actions">
                    <button 
                      className="file-action-icon" 
                      onClick={(e) => handleDeleteFile(filename, e)} 
                      title="Delete File"
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={13} />
                    </button>
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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <FileCode size={13} />
                  <span>{tabFile}</span>
                </span>
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
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={12} />
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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal size={15} />
                  <span>LIVE CONSOLE OUTPUT ({files[activeFile]?.language?.toUpperCase() || 'SANDBOX'})</span>
                </span>
                <button className="close-picker-btn" onClick={() => setShowTerminal(false)} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <X size={15} />
                </button>
              </div>
              <div className="terminal-output">
                {isRunningCode ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#60a5fa' }}>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Executing code in remote sandbox...</span>
                  </div>
                ) : terminalResult ? (
                  <div>
                    {terminalResult.stdout && <div className="terminal-stdout">{terminalResult.stdout}</div>}
                    {terminalResult.stderr && <div className="terminal-stderr">{terminalResult.stderr}</div>}
                    {!terminalResult.stdout && !terminalResult.stderr && (
                      <div style={{ color: '#94a3b8' }}>{terminalResult.output || 'Code executed with no output returned.'}</div>
                    )}
                    {terminalResult.error && <div className="terminal-stderr">{terminalResult.error}</div>}
                    <div className="terminal-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} />
                      <span>Runtime: {terminalResult.executionTime || 0}ms | Exit Code: {terminalResult.code ?? 0}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                    <span>Click</span>
                    <Play size={12} fill="currentColor" />
                    <span>Run Code in the top bar to execute code.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Google Meet Style Video Side Rail */}
        {isInCall && !isVideoShelfMinimized && stageDockPosition === 'side' && (Object.keys(remoteStreams).length > 0 || (isVideoOn && localStreamRef.current)) && (
          <div className="webrtc-side-rail">
            {renderStageHeader(true)}
            <div className="side-rail-scroll">
              {renderVideoCards(true)}
            </div>
          </div>
        )}

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
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-color)', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} /> LIVE STUDIO CHAT
            </span>
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
                      <button className="reply-action-btn" onClick={() => setReplyingTo(msg)} title="Reply" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Reply size={13} />
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
                  <button className="cancel-reply-btn" onClick={() => setReplyingTo(null)} title="Cancel reply" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={13} />
                  </button>
                </div>
              )}

              <div className="chat-input-area">
                <button className="input-picker-btn emoji-btn" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }} title="Add Emoji" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smile size={18} />
                </button>
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
                <button className="send-msg-btn" onClick={() => handleSendChat()} title="Send message" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={15} />
                </button>
              </div>
            </div>

            {/* Emojis Selector Overlay */}
            {showEmojiPicker && (
              <div className="emoji-picker-panel glass-card">
                <div className="picker-header">
                  <span>Emojis</span>
                  <button className="close-picker-btn" onClick={() => setShowEmojiPicker(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </button>
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
                  <button className="close-picker-btn" onClick={() => setShowGifPicker(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </button>
                </div>
                <div className="gif-search-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search Giphy..." 
                    value={gifQuery}
                    onChange={(e) => handleGifSearch(e.target.value)}
                    style={{ paddingLeft: '32px' }}
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

      {/* Mobile View Switcher Tab Bar (< 768px) */}
      <nav className="mobile-nav-bar" aria-label="Mobile Navigation">
        <button 
          className={`mobile-nav-item ${mobileActiveView === 'editor' ? 'active' : ''}`}
          onClick={() => setMobileActiveView('editor')}
        >
          <span className="nav-icon"><Code size={20} /></span>
          <span className="nav-label">Code</span>
        </button>

        <button 
          className={`mobile-nav-item ${mobileActiveView === 'files' ? 'active' : ''}`}
          onClick={() => setMobileActiveView('files')}
        >
          <span className="nav-icon"><Folder size={20} /></span>
          <span className="nav-label">Files</span>
          {Object.keys(files).length > 0 && (
            <span className="nav-badge">{Object.keys(files).length}</span>
          )}
        </button>

        <button 
          className={`mobile-nav-item ${mobileActiveView === 'chat' ? 'active' : ''}`}
          onClick={() => {
            setIsSidebarOpen(true);
            setMobileActiveView('chat');
          }}
        >
          <span className="nav-icon"><MessageSquare size={20} /></span>
          <span className="nav-label">Chat</span>
          {chatMessages.length > 0 && (
            <span className="nav-badge">{chatMessages.length}</span>
          )}
        </button>

        <button 
          className={`mobile-nav-item ${mobileActiveView === 'terminal' ? 'active' : ''}`}
          onClick={() => {
            setShowTerminal(true);
            setMobileActiveView('terminal');
          }}
        >
          <span className="nav-icon"><Terminal size={20} /></span>
          <span className="nav-label">Console</span>
        </button>
      </nav>

      {/* Version History Timeline & Diff Modal */}
      <div className={`modal ${showHistoryModal ? 'open' : ''}`}>
        <div className="modal-content glass-card history-modal">
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} /> Version History & Code Diff
            </h3>
            <button className="close-picker-btn" onClick={() => setShowHistoryModal(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          </div>

          <div className="history-container">
            <div className="history-timeline">
              <div style={{ padding: '0.5rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)' }}>
                SNAPSHOTS ({snapshots.length})
              </div>
              {snapshots.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                  No snapshots saved yet. Click "Snapshot" in the top bar to save one.
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
                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => handleRestoreSnapshot(selectedSnapshot)}>
                      <RotateCcw size={13} /> Restore This Version
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
          <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} /> Password Required
          </h3>
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
            <h3 style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} /> Room Security
            </h3>
            <button className="close-picker-btn" onClick={() => setShowLockModal(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          </div>
          
          {isRoomLocked ? (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>This room is currently password protected.</p>
              <button className="btn btn-secondary" onClick={handleRemoveLock} style={{ width: '100%', marginTop: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Unlock size={14} /> Remove Password Protection
              </button>
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
            <h3 style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={18} /> Activity Logs
            </h3>
            <button className="close-picker-btn" onClick={() => setShowLogsModal(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
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
            <button className="btn btn-secondary" onClick={() => setActivityLogs([])} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Trash2 size={14} /> Clear Logs
            </button>
            <button className="btn btn-primary" onClick={() => setShowLogsModal(false)} style={{ flex: 1 }}>Close</button>
          </div>
        </div>
      </div>

      {/* Device Selector Settings Modal */}
      <div className={`modal ${showDeviceModal ? 'open' : ''}`}>
        <div className="modal-content glass-card" style={{ maxWidth: '420px' }}>
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} /> Media Device Settings
            </h3>
            <button className="close-picker-btn" onClick={() => setShowDeviceModal(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
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

      {/* Google Meet Large View / Spotlight Cinema Modal */}
      {spotlightUser && isInCall && (
        <div className="spotlight-overlay" onClick={() => setSpotlightUser(null)}>
          <div className="spotlight-container" onClick={(e) => e.stopPropagation()}>
            <div className="spotlight-header">
              <div className="spotlight-user-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-dot" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <Circle size={8} fill="#10b981" color="transparent" />
                </span>
                <span className="spotlight-user-name">
                  {spotlightUser === 'local' ? 'You (Camera)' : (users.find(u => u.id === spotlightUser)?.nickname || 'Participant')}
                </span>
                {spotlightUser !== 'local' && connectionStats[spotlightUser] && (
                  <span className="webrtc-ping-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Wifi size={10} /> {connectionStats[spotlightUser].rtt || connectionStats[spotlightUser].latencyMs}ms
                  </span>
                )}
                {speakingUsers[spotlightUser === 'local' ? myUserIdRef.current : spotlightUser] && (
                  <span className="webrtc-speaker-indicator" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Mic size={12} color="#10b981" /> Speaking...
                  </span>
                )}
              </div>
              <button 
                type="button"
                className="spotlight-close-btn"
                onClick={() => setSpotlightUser(null)}
                title="Exit Large View (Esc)"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <X size={15} /> Close Large View
              </button>
            </div>

            <div className="spotlight-body">
              {spotlightUser === 'local' ? (
                localStreamRef.current && isVideoOn ? (
                  <video
                    autoPlay
                    playsInline
                    muted
                    ref={el => {
                      if (el && el.srcObject !== localStreamRef.current) {
                        el.srcObject = localStreamRef.current;
                      }
                    }}
                    className="spotlight-video"
                  />
                ) : (
                  <div className="spotlight-avatar-placeholder">
                    <div className="large-avatar-circle" style={{ backgroundColor: '#10b981' }}>
                      {nickname ? nickname.slice(0, 2).toUpperCase() : 'ME'}
                    </div>
                    <span className="spotlight-avatar-name">{nickname || 'You'} (Camera Off)</span>
                  </div>
                )
              ) : (
                (() => {
                  const stream = remoteStreams[spotlightUser];
                  const hasVideo = stream && stream.getVideoTracks && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;
                  const peer = users.find(u => u.id === spotlightUser);
                  return hasVideo ? (
                    <video
                      autoPlay
                      playsInline
                      ref={el => {
                        if (el && el.srcObject !== stream) {
                          el.srcObject = stream;
                          el.play().catch(e => console.warn('Spotlight play error:', e));
                        }
                      }}
                      className="spotlight-video"
                    />
                  ) : (
                    <div className="spotlight-avatar-placeholder">
                      <div className="large-avatar-circle" style={{ backgroundColor: peer?.color || '#3b82f6' }}>
                        {peer ? peer.name.substring(0, 2).toUpperCase() : 'PE'}
                      </div>
                      <span className="spotlight-avatar-name">{peer ? peer.name : 'Participant'} (Audio Only)</span>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type === 'leave' ? 'system-leave' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {t.type === 'leave' ? <AlertCircle size={15} color="#ef4444" /> : <Check size={15} color="#10b981" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
