import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState({});
  const navigate = useNavigate();

  // Mock users data
  const mockUsers = [
    { id: 1, name: 'Deepali Chauhan', rollNumber: '230111588', branch: 'CSE', year: '3rd Year', skills: ['React', 'Node.js', 'MongoDB'], bio: 'Full-stack developer passionate about web technologies', github: 'deepali-dev', avatar: 'DC' },
    { id: 2, name: 'Sidh Khurana', rollNumber: '230111587', branch: 'CSE', year: '3rd Year', skills: ['Python', 'AI/ML', 'TensorFlow'], bio: 'AI enthusiast working on machine learning projects', github: 'sidh-ai', avatar: 'SK' },
    { id: 3, name: 'Ayush Chauhan', rollNumber: '230111586', branch: 'CSE', year: '3rd Year', skills: ['Java', 'Spring Boot', 'MySQL'], bio: 'Backend developer specializing in enterprise applications', github: 'ayush-backend', avatar: 'AC' },
    { id: 4, name: 'Abhay Kanojia', rollNumber: '230111585', branch: 'CSE', year: '3rd Year', skills: ['Flutter', 'Dart', 'Firebase'], bio: 'Mobile app developer creating cross-platform solutions', github: 'abhay-mobile', avatar: 'AK' },
    { id: 5, name: 'Harsh Rawat', rollNumber: '230111584', branch: 'CSE', year: '3rd Year', skills: ['React Native', 'JavaScript', 'Redux'], bio: 'Mobile developer focused on React Native apps', github: 'harsh-rn', avatar: 'HR' }
  ];

  // Mock teams data
  const mockTeams = [
    { id: 1, name: 'AI Research Team', project: 'Smart Campus System', members: 4, skills: ['Python', 'AI/ML', 'React'], description: 'Building an AI-powered campus management system' },
    { id: 2, name: 'Web Dev Warriors', project: 'E-Commerce Platform', members: 3, skills: ['React', 'Node.js', 'MongoDB'], description: 'Creating a modern e-commerce solution' },
    { id: 3, name: 'Mobile Innovators', project: 'Health Tracking App', members: 5, skills: ['Flutter', 'Firebase', 'Dart'], description: 'Developing a comprehensive health monitoring app' },
    { id: 4, name: 'Data Science Squad', project: 'Analytics Dashboard', members: 3, skills: ['Python', 'Data Science', 'Visualization'], description: 'Building advanced analytics and reporting tools' }
  ];

  // Mock friends/connections
  const mockConnections = [
    { id: 1, name: 'Deepali Chauhan', avatar: 'DC', status: 'online' },
    { id: 2, name: 'Sidh Khurana', avatar: 'SK', status: 'offline' },
    { id: 3, name: 'Ayush Chauhan', avatar: 'AC', status: 'online' }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      if (activeTab === 'discover') {
        const results = mockUsers.filter(u => 
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.rollNumber.includes(query) ||
          u.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
        );
        setSearchResults(results);
      } else {
        const results = mockTeams.filter(t => 
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.project.toLowerCase().includes(query.toLowerCase()) ||
          t.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
        );
        setSearchResults(results);
      }
    } else {
      setSearchResults([]);
    }
  };

  const openProfile = (person) => {
    setSelectedProfile(person);
  };

  const closeProfile = () => {
    setSelectedProfile(null);
  };

  const sendMessage = (userId) => {
    const friend = mockConnections.find(f => f.id === userId) || mockUsers.find(u => u.id === userId);
    setSelectedChat(friend);
    setChatOpen(true);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim() && selectedChat) {
      const newMessage = {
        id: Date.now(),
        text: chatMessage,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => ({
        ...prev,
        [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage]
      }));
      setChatMessage('');
    }
  };

  const addFriend = (userId) => {
    alert(`Friend request sent to user ${userId}!`);
  };

  const connectForTeam = (userId) => {
    alert(`Team collaboration request sent to user ${userId}!`);
  };

  const joinTeam = (teamId) => {
    alert(`Join request sent to team ${teamId}!`);
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Welcome Header */}
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
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.3)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '2.2rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Welcome back, {user.name}!</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1rem', opacity: 0.95 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Roll Number: {user.roll_number}
                </div>
              </div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '1.05rem', opacity: 0.9, fontWeight: '400' }}>Ready to collaborate on your next project?</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Main Content */}
        <div>
          {/* Search Section */}
          <div style={{ marginBottom: '2rem', background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => { setActiveTab('discover'); setSearchResults([]); setSearchQuery(''); }}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: activeTab === 'discover' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  background: activeTab === 'discover' ? '#eff6ff' : 'white',
                  color: activeTab === 'discover' ? '#1e40af' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Discover People
              </button>
              <button 
                onClick={() => { setActiveTab('teams'); setSearchResults([]); setSearchQuery(''); }}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: activeTab === 'teams' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  background: activeTab === 'teams' ? '#eff6ff' : 'white',
                  color: activeTab === 'teams' ? '#1e40af' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M3 21v-2a4 4 0 0 0 4-4h4a4 4 0 0 0 4 4v2"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  <path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
                </svg>
                Find Teams
              </button>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={activeTab === 'discover' ? "Search by name, roll number, or skills..." : "Search for teams by project or skills..."}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem 3rem 1rem 1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <svg style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ color: '#111827', marginBottom: '1rem' }}>Search Results ({searchResults.length})</h4>
                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                  {activeTab === 'discover' ? (
                    searchResults.map(person => (
                      <div key={person.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: '15px',
                        color: '#333',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div 
                          onClick={() => openProfile(person)}
                          style={{
                            width: '60px',
                            height: '60px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            marginRight: '1rem',
                            cursor: 'pointer',
                            fontSize: '1.2rem'
                          }}
                        >
                          {person.avatar}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 0.25rem 0', cursor: 'pointer' }} onClick={() => openProfile(person)}>{person.name}</h4>
                          <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>{person.rollNumber} • {person.branch}</p>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {person.skills.slice(0, 3).map(skill => (
                              <span key={skill} style={{
                                background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '15px',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                              }}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => sendMessage(person.id)} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', background: '#3b82f6', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                          </button>
                          <button onClick={() => addFriend(person.id)} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', background: '#10b981', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                              <circle cx="8.5" cy="7" r="4"/>
                              <line x1="20" y1="8" x2="20" y2="14"/>
                              <line x1="23" y1="11" x2="17" y2="11"/>
                            </svg>
                          </button>
                          <button onClick={() => connectForTeam(person.id)} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', background: '#6366f1', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    searchResults.map(team => (
                      <div key={team.id} style={{
                        padding: '1.5rem',
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: '15px',
                        color: '#333',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{team.name}</h4>
                            <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontWeight: '500' }}>{team.project}</p>
                            <p style={{ margin: '0 0 1rem 0', color: '#777', fontSize: '0.9rem' }}>{team.description}</p>
                          </div>
                          <span style={{ background: '#17a2b8', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '15px', fontSize: '0.8rem' }}>
                            {team.members} members
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {team.skills.map(skill => (
                              <span key={skill} style={{
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '15px',
                                fontSize: '0.8rem'
                              }}>
                                {skill}
                              </span>
                            ))}
                          </div>
                          <button 
                            onClick={() => joinTeam(team.id)}
                            style={{
                              padding: '0.75rem 1.5rem',
                              border: 'none',
                              borderRadius: '25px',
                              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            Join Team
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ color: '#111827', margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700' }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ width: '48px', height: '48px', background: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: '#111827', display: 'block', marginBottom: '0.25rem' }}>No recent activity</strong>
                  <p style={{ margin: '0 0 0.25rem 0', color: '#6b7280', fontSize: '0.9rem' }}>Start collaborating to see your activity here</p>
                  <small style={{ color: '#9ca3af' }}>Just now</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Friends & Connections */}
        <div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1rem' }}>
            <h3 style={{ color: '#111827', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              My Connections
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mockConnections.map(friend => (
                <div key={friend.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem', 
                  background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)', 
                  borderRadius: '12px', 
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{ position: 'relative', marginRight: '1rem' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'white', 
                      fontWeight: '700',
                      fontSize: '1rem',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                    }}>
                      {friend.avatar}
                    </div>
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '2px', 
                      right: '2px', 
                      width: '12px', 
                      height: '12px', 
                      background: friend.status === 'online' ? '#10b981' : '#9ca3af', 
                      borderRadius: '50%', 
                      border: '2px solid white',
                      boxShadow: '0 0 0 2px rgba(255,255,255,0.8)'
                    }}></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', color: '#111827', fontSize: '0.95rem' }}>{friend.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '6px', 
                        height: '6px', 
                        background: friend.status === 'online' ? '#10b981' : '#9ca3af', 
                        borderRadius: '50%'
                      }}></div>
                      <small style={{ 
                        color: friend.status === 'online' ? '#10b981' : '#9ca3af',
                        fontWeight: '500',
                        fontSize: '0.85rem',
                        textTransform: 'capitalize'
                      }}>{friend.status}</small>
                    </div>
                  </div>
                  <button 
                    onClick={() => sendMessage(friend.id)} 
                    style={{ 
                      padding: '0.6rem 1rem', 
                      border: 'none', 
                      borderRadius: '10px', 
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                      color: 'white', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                      e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = '0 2px 6px rgba(59, 130, 246, 0.3)';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Chat
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ color: '#111827', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Quick Stats
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <span style={{ color: '#1e40af', fontWeight: '600' }}>Teams Joined</span>
                </div>
                <strong style={{ color: '#1e40af', fontSize: '1.5rem', fontWeight: '700' }}>3</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', background: '#10b981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <span style={{ color: '#047857', fontWeight: '600' }}>Projects</span>
                </div>
                <strong style={{ color: '#047857', fontSize: '1.5rem', fontWeight: '700' }}>5</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', background: '#f59e0b', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <span style={{ color: '#b45309', fontWeight: '600' }}>Connections</span>
                </div>
                <strong style={{ color: '#b45309', fontSize: '1.5rem', fontWeight: '700' }}>12</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {chatOpen && selectedChat && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '380px', height: '500px', background: 'white', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          {/* Chat Header */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '16px 16px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', backdropFilter: 'blur(10px)' }}>
                  {selectedChat.avatar}
                </div>
                {selectedChat.status && (
                  <div style={{ position: 'absolute', bottom: '0', right: '0', width: '10px', height: '10px', background: selectedChat.status === 'online' ? '#10b981' : '#9ca3af', borderRadius: '50%', border: '2px solid white' }}></div>
                )}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '600', color: 'white', fontSize: '1rem' }}>{selectedChat.name}</p>
                {selectedChat.status && (
                  <small style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>{selectedChat.status}</small>
                )}
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', padding: '0', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
            >×</button>
          </div>
          
          {/* Chat Messages */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', background: '#f9fafb' }}>
            {(!chatMessages[selectedChat.id] || chatMessages[selectedChat.id].length === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No messages yet</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Start the conversation!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {chatMessages[selectedChat.id].map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'me' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: '12px', background: msg.sender === 'me' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'white', color: msg.sender === 'me' ? 'white' : '#111827', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', wordBreak: 'break-word' }}>{msg.text}</p>
                      <small style={{ fontSize: '0.75rem', opacity: 0.8 }}>{msg.timestamp}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Chat Input */}
          <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', background: 'white', borderRadius: '0 0 16px 16px' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '0.95rem', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                onClick={handleSendMessage}
                style={{ padding: '0.75rem 1.25rem', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {selectedProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeProfile}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.5rem', marginRight: '1rem' }}>
                {selectedProfile.avatar}
              </div>
              <div>
                <h2 style={{ margin: '0 0 0.25rem 0' }}>{selectedProfile.name}</h2>
                <p style={{ margin: '0 0 0.25rem 0', color: '#666' }}>{selectedProfile.rollNumber} • {selectedProfile.branch} • {selectedProfile.year}</p>
                <p style={{ margin: 0, color: '#999', fontSize: '0.9rem' }}>@{selectedProfile.github}</p>
              </div>
              <button onClick={closeProfile} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>About</h4>
              <p style={{ color: '#666', lineHeight: '1.5' }}>{selectedProfile.bio}</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Skills</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedProfile.skills.map(skill => (
                  <span key={skill} style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => sendMessage(selectedProfile.id)} style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '25px', background: '#007bff', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>💬 Message</button>
              <button onClick={() => addFriend(selectedProfile.id)} style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '25px', background: '#28a745', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>👥 Add Friend</button>
              <button onClick={() => connectForTeam(selectedProfile.id)} style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '25px', background: '#17a2b8', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>🤝 Connect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;