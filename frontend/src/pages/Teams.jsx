import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFetch from '../utils/api';
import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        navigate('/login');
        return;
      }
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      try {
        const userId = parsedUser.id || parsedUser.userId;
        const data = await apiFetch(`/teams/my-teams/${userId}`);
        setTeams(data.teams || []);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, [navigate]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [newTeam, setNewTeam] = useState({ name: '', projectName: '', githubRepoUrl: '', description: '', maxMembers: 4, skills: [] });
  const [joinCode, setJoinCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(socketUrl, {
      withCredentials: true
    });

    socketRef.current.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, {
        id: message.id,
        sender: message.sender_name,
        message: message.message_text,
        time: new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Fetch chat history when opening chat for a team
  useEffect(() => {
    if (showChatModal && selectedTeam && user) {
      const fetchHistory = async () => {
        try {
          const data = await apiFetch(`/messages/team/${selectedTeam.id}`);
          const formattedMessages = data.messages.map(m => ({
            id: m.id,
            sender: m.sender_id === (user.userId || user.id) ? 'You' : m.sender_name,
            message: m.message_text,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(formattedMessages);
          
          // Join socket room
          socketRef.current.emit('joinTeamRoom', selectedTeam.id);
        } catch (error) {
          console.error('Failed to fetch chat history', error);
        }
      };
      fetchHistory();
    }
  }, [showChatModal, selectedTeam, user]);

  const generateTeamCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generateQRCode = (code) => {
    // Mock QR code generation - in real app, use a QR library
    return `data:image/svg+xml;base64,${btoa(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#000"/><text x="50" y="50" fill="#fff" text-anchor="middle" dy=".3em">${code}</text></svg>`)}`;
  };

  const createTeam = async () => {
    try {
      const response = await apiFetch('/teams', {
        method: 'POST',
        body: {
          name: newTeam.name,
          projectName: newTeam.projectName,
          githubRepoUrl: newTeam.githubRepoUrl,
          description: newTeam.description,
          maxMembers: parseInt(newTeam.maxMembers),
          requiredSkills: newTeam.skills
        }
      });
      
      setTeams([...teams, response.team]);
      setNewTeam({ name: '', projectName: '', githubRepoUrl: '', description: '', maxMembers: 4, skills: [] });
      setShowCreateModal(false);
      alert(`Team created successfully! Code: ${response.team.code}`);
    } catch (error) {
      alert(`Failed to create team: ${error.message}`);
    }
  };

  const joinTeamByCode = async () => {
    if (!joinCode) return;
    
    try {
      await apiFetch(`/teams/${joinCode.toUpperCase()}/join`, {
        method: 'POST',
        body: { userId: user.userId }
      });
      
      alert('Joined team successfully!');
      setJoinCode('');
      
      // Refresh teams
      const data = await apiFetch(`/teams/my-teams/${user.userId}`);
      setTeams(data.teams || []);
    } catch (error) {
      alert(`Failed to join team: ${error.message}`);
    }
  };

  const sendInvite = () => {
    if (inviteEmail && selectedTeam) {
      alert(`Invitation sent to ${inviteEmail} for ${selectedTeam.name}!`);
      setInviteEmail('');
    }
  };

  const sendMessage = () => {
    if (chatMessage.trim() && selectedTeam && user) {
      // Emit to server
      socketRef.current.emit('sendMessage', {
        teamId: selectedTeam.id,
        senderId: user.userId || user.id,
        senderName: user.name,
        messageText: chatMessage.trim()
      });
      
      setChatMessage('');
    }
  };

  const startVideoCall = () => {
    const videoWindow = window.open('', 'VideoCall', 'width=800,height=600');
    videoWindow.document.write(`
      <html>
        <head><title>Video Call - ${selectedTeam?.name}</title></head>
        <body style="margin:0; background:#2c3e50; color:white; font-family:Arial; display:flex; align-items:center; justify-content:center; height:100vh;">
          <div style="text-align:center;">
            <h2>Video Call Active</h2>
            <p>Connected to ${selectedTeam?.name}</p>
            <div style="width:300px; height:200px; background:#34495e; margin:20px auto; border-radius:10px; display:flex; align-items:center; justify-content:center;">
              <span>Your Video</span>
            </div>
            <button onclick="window.close()" style="padding:10px 20px; background:#e74c3c; color:white; border:none; border-radius:5px; cursor:pointer;">End Call</button>
          </div>
        </body>
      </html>
    `);
  };

  const startVoiceCall = () => {
    const audioWindow = window.open('', 'VoiceCall', 'width=400,height=300');
    audioWindow.document.write(`
      <html>
        <head><title>Voice Call - ${selectedTeam?.name}</title></head>
        <body style="margin:0; background:#27ae60; color:white; font-family:Arial; display:flex; align-items:center; justify-content:center; height:100vh;">
          <div style="text-align:center;">
            <h2>Voice Call Active</h2>
            <p>Connected to ${selectedTeam?.name}</p>
            <div style="width:100px; height:100px; background:#2ecc71; margin:20px auto; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2rem;">MIC</div>
            <button onclick="window.close()" style="padding:10px 20px; background:#c0392b; color:white; border:none; border-radius:5px; cursor:pointer;">End Call</button>
          </div>
        </body>
      </html>
    `);
  };

  const openWhiteboard = () => {
    const whiteboardWindow = window.open('', 'Whiteboard', 'width=1000,height=700');
    whiteboardWindow.document.write(`
      <html>
        <head><title>Whiteboard - ${selectedTeam?.name}</title></head>
        <body style="margin:0; background:#ecf0f1; font-family:Arial;">
          <div style="background:#2c3e50; color:white; padding:10px; display:flex; justify-content:space-between; align-items:center;">
            <h3 style="margin:0;">Team Whiteboard - ${selectedTeam?.name}</h3>
            <button onclick="window.close()" style="padding:5px 15px; background:#e74c3c; color:white; border:none; border-radius:3px; cursor:pointer;">Close</button>
          </div>
          <canvas id="whiteboard" width="1000" height="650" style="background:white; cursor:crosshair; display:block;"></canvas>
          <script>
            const canvas = document.getElementById('whiteboard');
            const ctx = canvas.getContext('2d');
            let drawing = false;
            
            canvas.addEventListener('mousedown', () => drawing = true);
            canvas.addEventListener('mouseup', () => drawing = false);
            canvas.addEventListener('mousemove', (e) => {
              if (!drawing) return;
              ctx.lineWidth = 2;
              ctx.lineCap = 'round';
              ctx.strokeStyle = '#2c3e50';
              ctx.lineTo(e.clientX, e.clientY - 50);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(e.clientX, e.clientY - 50);
            });
          </script>
        </body>
      </html>
    `);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#666' }}>Loading your teams...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        color: 'white',
        padding: '3rem 2.5rem',
        borderRadius: '20px',
        marginBottom: '2rem',
        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '150px',
          height: '150px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          filter: 'blur(30px)'
        }}></div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.2rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Teams</h1>
            <p style={{ margin: 0, fontSize: '1.05rem', opacity: 0.9 }}>Collaborate with your team members on projects</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setShowCreateModal(true)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create New Team
            </button>
            
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', padding: '0.3rem', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
              <input
                type="text"
                placeholder="Enter team code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                style={{
                  padding: '0.6rem 1rem',
                  border: 'none',
                  borderRadius: '10px',
                  outline: 'none',
                  background: 'rgba(255,255,255,0.9)',
                  fontSize: '0.95rem',
                  minWidth: '180px'
                }}
              />
              <button 
                onClick={joinTeamByCode}
                style={{
                  background: 'white',
                  color: '#2563eb',
                  border: 'none',
                  padding: '0.6rem 1.5rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {teams.map(team => (
          <div key={team.id} style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            {(user?.userId || user?.id) === team.creator_id ? (
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(59, 130, 246, 0.2)' }}>Leader</div>
            ) : (
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Joined</div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                  {team.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <h3 style={{ color: '#111827', margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: '700' }}>{team.name}</h3>
                  <span style={{
                    background: team.status === 'active' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {team.status}
                  </span>
                </div>
              </div>
            </div>
            
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>{team.description}</p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#111827', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Members
                </span>
                <span style={{ color: '#3b82f6', fontWeight: '700', fontSize: '1rem' }}>{team.current_members || 0}/{team.max_members || 6}</span>
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  height: '100%',
                  borderRadius: '10px',
                  width: `${((team.current_members || 0) / (team.max_members || 6)) * 100}%`,
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ color: '#111827', fontWeight: '600', fontSize: '0.9rem' }}>Team Code:</span>
                <span style={{
                  background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
                  color: 'white',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  letterSpacing: '1px'
                }}>
                  {team.code}
                </span>
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
                <span style={{ color: '#111827', fontWeight: '600', fontSize: '0.9rem' }}>Skills Required:</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {team.required_skills && team.required_skills.map(skill => (
                  <span key={skill} style={{
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    color: '#1e40af',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    border: '1px solid #bfdbfe'
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => alert(`Joined ${team.name}!`)}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.85rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Join Team
              </button>
              <button 
                onClick={() => { setSelectedTeam(team); setShowTeamModal(true); }}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.85rem 1.2rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Open
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setShowCreateModal(false)}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '0', maxWidth: '550px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', padding: '2rem', borderRadius: '20px 20px 0 0', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ margin: '0 0 0.25rem 0', color: 'white', fontSize: '1.75rem', fontWeight: '700' }}>Create New Team</h2>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>Set up your team and start collaborating</p>
                </div>
              </div>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '600', color: '#111827', fontSize: '0.95rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Team Name
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                  placeholder="Enter team name"
                  style={{ width: '100%', padding: '0.9rem 1rem', border: '2px solid #e5e7eb', borderRadius: '12px', outline: 'none', fontSize: '1rem', color: '#111827', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '600', color: '#111827', fontSize: '0.95rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                  Project Name
                </label>
                <input
                  type="text"
                  value={newTeam.projectName}
                  onChange={(e) => setNewTeam({...newTeam, projectName: e.target.value})}
                  placeholder="Enter project title or scope"
                  style={{ width: '100%', padding: '0.9rem 1rem', border: '2px solid #e5e7eb', borderRadius: '12px', outline: 'none', fontSize: '1rem', color: '#111827', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '600', color: '#111827', fontSize: '0.95rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Description
                </label>
                <textarea
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                  placeholder="Describe your team's purpose and goals"
                  style={{ width: '100%', padding: '0.9rem 1rem', border: '2px solid #e5e7eb', borderRadius: '12px', outline: 'none', minHeight: '100px', fontSize: '1rem', color: '#111827', resize: 'vertical', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '600', color: '#111827', fontSize: '0.95rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                  Project GitHub Repository Link
                </label>
                <input
                  type="url"
                  value={newTeam.githubRepoUrl}
                  onChange={(e) => setNewTeam({...newTeam, githubRepoUrl: e.target.value})}
                  placeholder="https://github.com/username/repository"
                  style={{ width: '100%', padding: '0.9rem 1rem', border: '2px solid #e5e7eb', borderRadius: '12px', outline: 'none', fontSize: '1rem', color: '#111827', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '600', color: '#111827', fontSize: '0.95rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Max Members
                </label>
                <input
                  type="number"
                  value={newTeam.maxMembers}
                  onChange={(e) => setNewTeam({...newTeam, maxMembers: parseInt(e.target.value)})}
                  min="2"
                  max="10"
                  style={{ width: '100%', padding: '0.9rem 1rem', border: '2px solid #e5e7eb', borderRadius: '12px', outline: 'none', fontSize: '1rem', color: '#111827', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Admin limit enforces max capacity</p>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '0.85rem 1.75rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                  onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
                >
                  Cancel
                </button>
                <button 
                  onClick={createTeam}
                  style={{ padding: '0.85rem 1.75rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Create Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Chat Modal */}
      {showChatModal && selectedTeam && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#f5f5f5', zIndex: 1001, display: 'flex', flexDirection: 'column' }}>
          {/* Chat Header */}
          <div style={{ background: '#2c3e50', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', background: '#3498db', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {selectedTeam.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedTeam.name}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>{selectedTeam.members} members • {selectedTeam.status}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button onClick={startVideoCall} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }} title="Video Call">📹</button>
              <button onClick={startVoiceCall} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }} title="Voice Call">📞</button>
              <button onClick={openWhiteboard} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }} title="Whiteboard">🎨</button>
              <button onClick={() => setShowChatModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem', padding: '0.5rem' }}>×</button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'You' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '70%', display: 'flex', flexDirection: msg.sender === 'You' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '0.5rem' }}>
                    {msg.sender !== 'You' && (
                      <div style={{ width: '35px', height: '35px', background: '#95a5a6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {msg.sender.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div style={{ background: msg.sender === 'You' ? '#3498db' : 'white', color: msg.sender === 'You' ? 'white' : '#333', padding: '0.75rem 1rem', borderRadius: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative' }}>
                      {msg.sender !== 'You' && (
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#3498db' }}>{msg.sender}</div>
                      )}
                      <div style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>{msg.message}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem', textAlign: msg.sender === 'You' ? 'right' : 'left' }}>{msg.time}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div style={{ background: 'white', padding: '1rem 2rem', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && file.size <= 5 * 1024 * 1024) {
                    const fileMsg = {
                      id: Date.now(),
                      sender: 'You',
                      message: `📎 ${file.name}`,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    setMessages(prev => [...prev, fileMsg]);
                  } else {
                    alert('File size must be less than 5MB');
                  }
                }}
                style={{ display: 'none' }}
                id="fileInput"
              />
              <label htmlFor="fileInput" style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#666' }}>📎</label>
            </div>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid #e0e0e0', borderRadius: '25px', outline: 'none', fontSize: '1rem' }}
            />
            <button 
              onClick={sendMessage}
              disabled={!chatMessage.trim()}
              style={{ 
                background: chatMessage.trim() ? '#3498db' : '#bdc3c7', 
                color: 'white', 
                border: 'none', 
                borderRadius: '50%', 
                width: '45px', 
                height: '45px', 
                cursor: chatMessage.trim() ? 'pointer' : 'not-allowed', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '1.2rem'
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {showTeamModal && selectedTeam && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '800px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ color: '#2c3e50', margin: 0 }}>{selectedTeam.name}</h2>
              <button 
                onClick={() => setShowTeamModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Team Navigation */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #ecf0f1' }}>
              {['chat', 'members', 'invite', 'qr'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    background: activeTab === tab ? '#3498db' : 'transparent',
                    color: activeTab === tab ? 'white' : '#666',
                    borderRadius: '10px 10px 0 0',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}
                >
                  {tab === 'qr' ? 'QR Code' : tab}
                </button>
              ))}
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <button onClick={startVideoCall} style={{ padding: '0.5rem 1rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Video Call</button>
                  <button onClick={startVoiceCall} style={{ padding: '0.5rem 1rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Voice Call</button>
                  <button onClick={openWhiteboard} style={{ padding: '0.5rem 1rem', background: '#9b59b6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Whiteboard</button>
                  <button onClick={() => { setShowChatModal(true); setShowTeamModal(false); }} style={{ padding: '0.5rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Open Full Chat</button>
                </div>
                <div style={{ height: '200px', border: '2px solid #ecf0f1', borderRadius: '10px', padding: '1rem', overflowY: 'auto', marginBottom: '1rem' }}>
                  {messages.slice(-3).map(msg => (
                    <div key={msg.id} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: msg.sender === 'You' ? '#3498db' : '#ecf0f1', borderRadius: '8px', color: msg.sender === 'You' ? 'white' : '#333' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{msg.sender} <span style={{ opacity: 0.7, fontSize: '0.7rem' }}>{msg.time}</span></div>
                      <div style={{ fontSize: '0.9rem' }}>{msg.message}</div>
                    </div>
                  ))}
                </div>
                <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>Click "Open Full Chat" for complete chat experience</p>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>Team Members ({selectedTeam.members}/{selectedTeam.maxMembers})</h3>
                {selectedTeam.membersList.map((member, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '10px', marginBottom: '0.5rem' }}>
                    <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #3498db, #2980b9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', marginRight: '1rem' }}>
                      {member.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{member}</div>
                      <div style={{ color: '#666', fontSize: '0.9rem' }}>{index === 0 ? 'Team Leader' : 'Member'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Invite Tab */}
            {activeTab === 'invite' && (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>Invite Members</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email Address</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      style={{ flex: 1, padding: '0.75rem', border: '2px solid #3498db', borderRadius: '10px', outline: 'none' }}
                    />
                    <button onClick={sendInvite} style={{ padding: '0.75rem 1.5rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Send Invite</button>
                  </div>
                </div>
                <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '10px' }}>
                  <strong>Share Team Code:</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <span style={{ background: '#2c3e50', color: 'white', padding: '0.5rem 1rem', borderRadius: '10px', fontFamily: 'monospace', fontSize: '1.2rem' }}>{selectedTeam.code}</span>
                    <button onClick={() => navigator.clipboard.writeText(selectedTeam.code)} style={{ padding: '0.5rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Copy</button>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Tab */}
            {activeTab === 'qr' && (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '1rem' }}>Team QR Code</h3>
                <div style={{ display: 'inline-block', padding: '2rem', background: '#f8f9fa', borderRadius: '15px' }}>
                  <img src={selectedTeam.qrCode} alt="Team QR Code" style={{ width: '200px', height: '200px', border: '2px solid #3498db', borderRadius: '10px' }} />
                </div>
                <p style={{ marginTop: '1rem', color: '#666' }}>Scan this QR code to join the team</p>
                <div style={{ marginTop: '1rem' }}>
                  <strong>Team Code: </strong>
                  <span style={{ background: '#2c3e50', color: 'white', padding: '0.5rem 1rem', borderRadius: '10px', fontFamily: 'monospace' }}>{selectedTeam.code}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;