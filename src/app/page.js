'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Link2, 
  Plus, 
  ArrowRight, 
  RotateCw, 
  Building2, 
  Lock, 
  Users, 
  Zap, 
  MessageSquare, 
  Heart,
  LogIn
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [activeRooms, setActiveRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const isMountedRef = useRef(true);

  const fetchActiveRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (isMountedRef.current && data && data.rooms) {
        setActiveRooms(data.rooms);
      }
    } catch (e) {
      console.error('Error fetching rooms:', e);
    } finally {
      if (isMountedRef.current) {
        setLoadingRooms(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Load saved nickname if exists
    const savedName = sessionStorage.getItem('nickname');
    if (savedName) {
      setNickname(savedName);
    }

    fetchActiveRooms();
    const interval = setInterval(fetchActiveRooms, 5000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  function generateRoomId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function getCleanRoomId(inputVal) {
    if (!inputVal) return '';
    let val = inputVal.trim();

    // 1. Remove protocol if present (http, https, ws, wss)
    val = val.replace(/^(https?:\/\/)?(wss?:\/\/)?/, '');

    // 2. If it contains a "/room/" subpath, extract what's after it
    const roomIndex = val.indexOf('/room/');
    if (roomIndex !== -1) {
      val = val.substring(roomIndex + 6);
    }

    // 3. Remove any leading/trailing slashes
    val = val.replace(/^\/+|\/+$/g, '');

    // 4. Remove any query parameters or hash fragments
    val = val.split(/[?#]/)[0];

    return val.trim();
  }

  function validateNickname() {
    const name = nickname.trim();
    if (!name) {
      setNicknameError('Nickname is required to enter a room');
      return null;
    }
    setNicknameError('');
    sessionStorage.setItem('nickname', name);
    return name;
  }

  function handleCreateRoom() {
    const validName = validateNickname();
    if (!validName) return;

    const newRoomId = generateRoomId();
    router.push(`/room/${newRoomId}`);
  }

  function handleJoinRoom() {
    const validName = validateNickname();
    if (!validName) return;

    const cleanId = getCleanRoomId(roomIdInput);
    if (!cleanId) {
      setRoomError('Please enter a valid Room ID or link');
      return;
    }
    setRoomError('');

    router.push(`/room/${cleanId}`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glow-bg"></div>

      <main className="landing-container">
        <header className="logo-area">
          <div className="logo">
            <span className="logo-bracket">&lt;</span>
            <span className="logo-text">HiveCode</span>
            <span className="logo-bracket">/&gt;</span>
          </div>
          <p className="tagline">Collaborate, edit, and share code with anyone, anywhere in real-time.</p>
        </header>

        <div className="landing-grid">
          {/* Join / Create Card */}
          <div className="glass-card form-card">
            <div className="card-header">
              <h2>Enter HiveCode Studio</h2>
              <p>Choose your username and start coding together.</p>
            </div>

            <div className="form-group">
              <label htmlFor="nickname">Your Nickname</label>
              <div className="input-wrapper">
                <span className="input-icon"><User size={16} /></span>
                <input
                  type="text"
                  id="nickname"
                  placeholder="e.g. CaptainCoder"
                  maxLength={15}
                  autoComplete="off"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    if (e.target.value.trim()) setNicknameError('');
                  }}
                  className={nicknameError ? 'error' : ''}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (roomIdInput.trim()) {
                        handleJoinRoom();
                      } else {
                        handleCreateRoom();
                      }
                    }
                  }}
                />
              </div>
              {nicknameError && <span className="error-message">{nicknameError}</span>}
            </div>

            <div className="action-divider">
              <span>Create a New Room</span>
            </div>

            <button id="create-room-btn" className="btn btn-primary" onClick={handleCreateRoom} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>Create Studio Room</span>
              <Plus size={18} />
            </button>

            <div className="action-divider">
              <span>Or Join Existing Room</span>
            </div>

            <div className="join-area">
              <div className="input-wrapper">
                <span className="input-icon"><Link2 size={16} /></span>
                <input
                  type="text"
                  id="room-id"
                  placeholder="Enter Room ID or link"
                  autoComplete="off"
                  value={roomIdInput}
                  onChange={(e) => {
                    setRoomIdInput(e.target.value);
                    if (e.target.value.trim()) setRoomError('');
                  }}
                  className={roomError ? 'error' : ''}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleJoinRoom();
                    }
                  }}
                />
              </div>
              <button id="join-room-btn" className="btn btn-secondary" onClick={handleJoinRoom} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Join</span>
                <LogIn size={16} />
              </button>
            </div>
            {roomError && <span className="error-message">{roomError}</span>}
          </div>

          {/* Active Rooms list */}
          <div className="glass-card active-rooms-card active-studios-card">
            <div className="card-header active-studios-header">
              <div>
                <h2>Active Studios</h2>
                <p>Join an ongoing live collaboration room instantly.</p>
              </div>
              <button className="refresh-btn" onClick={fetchActiveRooms} title="Refresh Room List" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <RotateCw size={14} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingRooms ? (
              <div className="dashboard-status">
                <div className="spinner"></div>
                <span>Scanning active studios...</span>
              </div>
            ) : activeRooms.length === 0 ? (
              <div className="dashboard-empty">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', opacity: 0.8 }}>
                  <Building2 size={44} />
                </div>
                <h3>No active studios right now</h3>
                <p>Create a studio room on the left to start collaborating!</p>
              </div>
            ) : (
              <div className="studios-list-scroll">
                {activeRooms.map(room => (
                  <div 
                    key={room.id} 
                    className="studio-list-item"
                    onClick={() => {
                      const validName = validateNickname();
                      if (!validName) return;
                      router.push(`/room/${room.id}`);
                    }}
                  >
                    <div className="studio-info-meta">
                      <span className="studio-id-tag">#{room.id}</span>
                      {room.isLocked && (
                        <span className="lock-icon-tag" title="Password Protected" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={12} /> Locked
                        </span>
                      )}
                    </div>
                    <div className="studio-join-indicator">
                      <span className="user-count-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={13} /> {room.userCount} active
                      </span>
                      <span className="join-action-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Join Studio <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="features">
          <div className="feature-card">
            <div className="feature-icon"><Zap size={24} color="#38bdf8" /></div>
            <h3>Real-time Sync</h3>
            <p>Lightning-fast document sharing powered by raw WebSockets.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Users size={24} color="#a855f7" /></div>
            <h3>Presence Tracking</h3>
            <p>Watch others type with real-time cursor tracking and name tags.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><MessageSquare size={24} color="#10b981" /></div>
            <h3>Live Chat</h3>
            <p>Discuss the code and ideas instantly with built-in group chat.</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          HiveCode © 2026. Made with <Heart size={14} color="#ef4444" fill="#ef4444" /> for developers.
        </p>
      </footer>
    </div>
  );
}
