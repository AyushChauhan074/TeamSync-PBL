import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFetch from '../utils/api';

const FacultyDashboard = () => {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [facultyViewMode, setFacultyViewMode] = useState('mentor');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchAssignedTeams();
    }
  }, [user, facultyViewMode]);

  const fetchAssignedTeams = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/faculty/assigned-teams?viewMode=${facultyViewMode}`);
      setTeams(data.teams || []);
    } catch (error) {
      console.error('Failed to fetch assigned teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(team => {
    const query = searchQuery.toLowerCase().trim();
    return (
      (team.name && team.name.toLowerCase().includes(query)) ||
      (team.project_name && team.project_name.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#6b7280' }}>Loading Faculty Dashboard...</div>;
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '2rem 0' }}>
      
      {/* Header Panel */}
      <div style={{ background: '#1e3a8a', padding: '2rem', color: 'white', marginBottom: '2rem', marginTop: '-2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', letterSpacing: '-0.5px' }}>FACULTY CONTROL PANEL</h1>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Welcome back, {user?.name} | Manage Your Mentored & Evaluated Teams.</p>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '2rem', padding: '0 2rem' }}>
        
        {/* Central Column (60%) */}
        <div style={{ flex: '0 0 65%' }}>
          
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(10px)', 
            borderRadius: '16px', 
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
            border: '1px solid rgba(255,255,255,0.4)'
          }}>
            {/* Segmented Control */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => setFacultyViewMode('mentor')}
                style={{
                  padding: '0.8rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: facultyViewMode === 'mentor' ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                  color: facultyViewMode === 'mentor' ? 'white' : '#4b5563',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: facultyViewMode === 'mentor' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                }}>
                My Mentored Teams
              </button>
              <button 
                onClick={() => setFacultyViewMode('evaluator')}
                style={{
                  padding: '0.8rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: facultyViewMode === 'evaluator' ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                  color: facultyViewMode === 'evaluator' ? 'white' : '#4b5563',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: facultyViewMode === 'evaluator' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                }}>
                My Evaluated Teams
              </button>
            </div>

            {/* Filter Bar */}
            <div style={{ marginBottom: '2rem' }}>
              <input 
                type="text" 
                placeholder="Search teams by name or project title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  fontSize: '1rem',
                  background: 'white',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                  color: '#111827',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Teams Table */}
            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ padding: '1rem', color: '#374151', fontWeight: '600' }}>Team ID</th>
                    <th style={{ padding: '1rem', color: '#374151', fontWeight: '600' }}>Team Name</th>
                    <th style={{ padding: '1rem', color: '#374151', fontWeight: '600' }}>Project Title</th>
                    <th style={{ padding: '1rem', color: '#374151', fontWeight: '600' }}>Roster Size</th>
                    <th style={{ padding: '1rem', color: '#374151', fontWeight: '600' }}>GitHub Repo</th>
                    <th style={{ padding: '1rem', color: '#374151', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.length > 0 ? (
                    filteredTeams.map((team, idx) => (
                      <tr key={team.id} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                        <td style={{ padding: '1rem' }}>{team.id}</td>
                        <td style={{ padding: '1rem', fontWeight: '500', color: '#111827' }}>{team.name}</td>
                        <td style={{ padding: '1rem' }}>{team.project_name || 'N/A'}</td>
                        <td style={{ padding: '1rem' }}>{team.roster_size}</td>
                        <td style={{ padding: '1rem' }}>
                          {team.github_repo_url ? (
                            <a href={team.github_repo_url} target="_blank" rel="noopener noreferrer" style={{ color: '#24292e' }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                            </a>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>No Repo</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                          <button style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid #d1d5db',
                            background: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}>
                            Review Workspace
                          </button>
                          {facultyViewMode === 'evaluator' && (
                            <button 
                              onClick={() => navigate('/faculty/evaluations')}
                              style={{
                              padding: '0.5rem 1rem',
                              border: '1px solid #10b981',
                              color: '#10b981',
                              background: 'rgba(16, 185, 129, 0.05)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '500'
                            }}>
                              Grade
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        No {facultyViewMode} teams found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Recent Activity Log */}
          <div style={{ 
            marginTop: '2rem',
            background: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(10px)', 
            borderRadius: '16px', 
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
            border: '1px solid rgba(255,255,255,0.4)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#111827' }}>RECENT ACTIVITY</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></div>
                <div>
                  <p style={{ margin: 0, fontWeight: '500', color: '#111827' }}>AI Research Team pushed 12 new commits</p>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>2 minutes ago</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                <div>
                  <p style={{ margin: 0, fontWeight: '500', color: '#111827' }}>Mobile App Innovators submitted Milestone 1</p>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>1 hour ago</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar Column (35%) */}
        <div style={{ flex: '0 0 35%' }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.9)', 
            borderRadius: '16px', 
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
            border: '1px solid rgba(255,255,255,0.4)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#111827', fontSize: '1.1rem' }}>SYSTEM ACTION ITEMS & NOTIFICATIONS</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: '#991b1b' }}>Grading Deadline: Milestone 2</h4>
                  <span style={{ background: '#ef4444', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>Red alert</span>
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#7f1d1d' }}>Grading Deadline: Milestone 2<br/>Milestone ago</p>
              </div>

              <div style={{ background: '#fefce8', border: '1px solid #fde047', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: '#854d0e' }}>Team 'Origins' submitted review request</h4>
                  <span style={{ background: '#f59e0b', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>Pending</span>
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#713f12' }}>Team 'Origins' 2 months ago</p>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: '#166534' }}>Verify Repo: 'demo2' team</h4>
                  <span style={{ background: '#10b981', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>Reminder</span>
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#14532d' }}>Verify repo: "demo2" demo2 in your<br/>2 months ago</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FacultyDashboard;
