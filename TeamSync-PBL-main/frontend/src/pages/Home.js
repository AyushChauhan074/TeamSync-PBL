import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, teamsAPI } from '../services/api';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [msg, setMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load stats first (fastest), then users and teams in parallel
      const statsRes = await usersAPI.getStats();
      setStats(statsRes.stats);
      setLoading(false); // Show UI with stats immediately
      
      // Load heavy data in background
      const [usersRes, teamsRes] = await Promise.all([
        usersAPI.getAll('student', ''),
        teamsAPI.getAll(''),
      ]);
      setAllUsers((usersRes.users || []).filter(u => u.id !== user?.id));
      setAllTeams(teamsRes.teams || []);
    } catch (err) {
      console.error('Home load error:', err.message);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, [user, navigate, loadData]);

  // Filter in-memory based on search (data already loaded from DB)
  const filteredUsers = searchQuery.trim()
    ? allUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allUsers;

  const filteredTeams = searchQuery.trim()
    ? allTeams.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.required_skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allTeams;

  if (!user) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Welcome Header */}
      <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', padding: '2.5rem', borderRadius: '20px', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: '700' }}>
            Welcome back, {user.name}!
          </h1>
          <p style={{ margin: 0, opacity: 0.9 }}>Roll Number: {user.roll_number} · {user.branch || 'TeamSync PBL'}</p>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: msg.startsWith('✅') ? '#d1fae5' : '#fee2e2', borderRadius: '8px', marginBottom: '1rem', color: msg.startsWith('✅') ? '#065f46' : '#dc2626' }}>
          {msg}
          <button onClick={() => setMsg('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>×</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Main Content */}
        <div>
          {/* Search + Tabs */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { key: 'discover', label: 'Discover People' },
                { key: 'teams', label: 'Find Teams' },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => { setActiveTab(key); setSearchQuery(''); }}
                  style={{ padding: '0.7rem 1.4rem', border: activeTab === key ? '2px solid #3b82f6' : '2px solid #e5e7eb', borderRadius: '12px', background: activeTab === key ? '#eff6ff' : 'white', color: activeTab === key ? '#1e40af' : '#6b7280', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>
                  {label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder={activeTab === 'discover' ? 'Search by name, roll number, or skill...' : 'Search teams by name or skill...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.9rem 1rem', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />

            {allUsers.length === 0 && !loading ? (
              <p style={{ color: '#9ca3af', marginTop: '1rem' }}>Loading users...</p>
            ) : loading ? (
              <p style={{ color: '#9ca3af', marginTop: '1rem' }}>Loading...</p>
            ) : (
              <div style={{ marginTop: '1.5rem' }}>
                {activeTab === 'discover' ? (
                  filteredUsers.length === 0 ? (
                    <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>
                      {searchQuery ? 'No users match your search.' : 'No other users found.'}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {filteredUsers.slice(0, 20).map(person => (
                        <div key={person.id} style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', gap: '1rem' }}>
                          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1rem', flexShrink: 0, cursor: 'pointer' }}
                            onClick={() => setSelectedProfile(person)}>
                            {person.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: '0 0 0.2rem', fontWeight: '600', color: '#111827', cursor: 'pointer' }}
                              onClick={() => setSelectedProfile(person)}>{person.name}</p>
                            <p style={{ margin: '0 0 0.4rem', color: '#6b7280', fontSize: '0.85rem' }}>
                              {person.roll_number} · {person.branch || 'CSE'}
                            </p>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {(person.skills || []).slice(0, 3).map(skill => (
                                <span key={skill} style={{ background: '#eff6ff', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #bfdbfe' }}>{skill}</span>
                              ))}
                            </div>
                          </div>
                          {person.github_username && (
                            <a href={`https://github.com/${person.github_username}`} target="_blank" rel="noopener noreferrer"
                              style={{ padding: '0.5rem 0.9rem', background: '#111827', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '600', flexShrink: 0 }}>
                              GitHub
                            </a>
                          )}
                        </div>
                      ))}
                      {filteredUsers.length > 20 && (
                        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                          Showing 20 of {filteredUsers.length} results. Refine your search.
                        </p>
                      )}
                    </div>
                  )
                ) : (
                  filteredTeams.length === 0 ? (
                    <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>
                      {searchQuery ? 'No teams match your search.' : 'No teams available.'}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {filteredTeams.slice(0, 15).map(team => (
                        <div key={team.id} style={{ padding: '1.25rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0, color: '#111827' }}>{team.name}</h4>
                            <span style={{ background: team.status === 'active' ? '#d1fae5' : '#fef3c7', color: team.status === 'active' ? '#065f46' : '#92400e', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                              {team.status}
                            </span>
                          </div>
                          <p style={{ margin: '0 0 0.75rem', color: '#6b7280', fontSize: '0.85rem' }}>
                            {team.description || 'No description.'} · {team.member_count || 0}/{team.max_members} members
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {(team.required_skills || []).slice(0, 3).map(s => (
                                <span key={s} style={{ background: '#eff6ff', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #bfdbfe' }}>{s}</span>
                              ))}
                            </div>
                            <button onClick={() => navigate('/teams')}
                              style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                              Join via Teams
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Real Stats */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>My Stats</h3>
            {[
              { label: 'Active Teams', value: stats?.activeTeams ?? '—', color: '#3b82f6' },
              { label: 'Completed Projects', value: stats?.completedProjects ?? '—', color: '#10b981' },
              { label: 'Contributions', value: stats?.totalContributions ?? '—', color: '#f59e0b' },
              { label: 'Score', value: stats?.contributionScore ?? '—', color: '#8b5cf6' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#374151', fontSize: '0.9rem' }}>{label}</span>
                <strong style={{ color, fontSize: '1.1rem' }}>{value}</strong>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>Quick Actions</h3>
            {[
              { label: '→ My Teams', path: '/teams' },
              { label: '→ My Projects', path: '/projects' },
              { label: '→ Dashboard', path: '/dashboard' },
              { label: '→ My Profile', path: '/profile' },
            ].map(({ label, path }) => (
              <button key={path} onClick={() => navigate(path)}
                style={{ display: 'block', width: '100%', padding: '0.7rem 1rem', marginBottom: '0.5rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', color: '#2563eb', fontWeight: '600', fontSize: '0.9rem' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Platform Stats */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>Platform</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total Users</span>
              <strong style={{ color: '#111827' }}>{allUsers.length + 1}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Active Teams</span>
              <strong style={{ color: '#111827' }}>{allTeams.filter(t => t.status === 'active').length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelectedProfile(null)}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '480px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1.25rem', flexShrink: 0 }}>
                {selectedProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 0.25rem' }}>{selectedProfile.name}</h2>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                  {selectedProfile.roll_number} · {selectedProfile.branch || 'CSE'}
                </p>
              </div>
              <button onClick={() => setSelectedProfile(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            {selectedProfile.bio && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', color: '#374151' }}>About</h4>
                <p style={{ margin: 0, color: '#6b7280', lineHeight: '1.5', fontSize: '0.9rem' }}>{selectedProfile.bio}</p>
              </div>
            )}

            {(selectedProfile.skills || []).length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem', color: '#374151' }}>Skills</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedProfile.skills.map(skill => (
                    <span key={skill} style={{ background: '#eff6ff', color: '#1e40af', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #bfdbfe' }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedProfile.github_username && (
              <a href={`https://github.com/${selectedProfile.github_username}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '0.7rem 1.5rem', background: '#111827', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
                View GitHub Profile
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
