'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [activeRooms, setActiveRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const fetchActiveRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data && data.rooms) {
        setActiveRooms(data.rooms);
      }
    } catch (e) {
      console.error('Error fetching rooms:', e);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    // Load saved nickname if exists
    const savedName = sessionStorage.getItem('nickname');
    if (savedName) {
      setNickname(savedName);
    }

    fetchActiveRooms();
    const interval = setInterval(fetchActiveRooms, 5000);
    return () => clearInterval(interval);
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
                <span className="input-icon">👤</span>
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

            <button id="create-room-btn" className="btn btn-primary" onClick={handleCreateRoom}>
              <span>Create Studio Room</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>

            <div className="action-divider">
              <span>Or Join Existing Room</span>
            </div>

            <div className="join-area">
              <div className="input-wrapper">
                <span className="input-icon">🔗</span>
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
              <button id="join-room-btn" className="btn btn-secondary" onClick={handleJoinRoom}>Join</button>
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
              <button className="refresh-btn" onClick={fetchActiveRooms} title="Refresh Room List">🔄 Refresh</button>
            </div>

            {loadingRooms ? (
              <div className="dashboard-status">
                <div className="spinner"></div>
                <span>Scanning active studios...</span>
              </div>
            ) : activeRooms.length === 0 ? (
              <div className="dashboard-empty">
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏢</div>
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
                      {room.isLocked && <span className="lock-icon-tag" title="Password Protected">🔒 Locked</span>}
                    </div>
                    <div className="studio-join-indicator">
                      <span className="user-count-tag">👥 {room.userCount} active</span>
                      <span className="join-action-text">Join Studio →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="features">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real-time Sync</h3>
            <p>Lightning-fast document sharing powered by raw WebSockets.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Presence Tracking</h3>
            <p>Watch others type with real-time cursor tracking and name tags.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Live Chat</h3>
            <p>Discuss the code and ideas instantly with built-in group chat.</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>HiveCode © 2026. Made with ❤️ for developers.</p>
      </footer>
    </div>
  );
}
