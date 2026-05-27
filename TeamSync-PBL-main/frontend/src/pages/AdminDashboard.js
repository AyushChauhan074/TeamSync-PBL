import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, teamsAPI, projectsAPI } from '../services/api';
import './AdminDashboard.css';

// Admin-only user management API calls
const adminAPI = {
  deactivateUser: (userId) =>
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/users/${userId}/deactivate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    }).then(r => r.json()),
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  // Real data state
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Search state
  const [studentSearch, setStudentSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, facultyRes, teamsRes, projectsRes] = await Promise.all([
        usersAPI.getAll('student', ''),
        usersAPI.getAll('faculty', ''),
        teamsAPI.getAll(''),
        projectsAPI.getAll(),
      ]);
      setStudents(studentsRes.users || []);
      setFaculty(facultyRes.users || []);
      setTeams(teamsRes.teams || []);
      setProjects(projectsRes.projects || []);
    } catch (err) {
      setMsg(`❌ Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/home'); return; }
    loadData();
  }, [user, navigate, loadData]);

  const handleLogout = async () => {
    await logout(); // Uses AuthContext — revokes token via API
    navigate('/login');
  };

  const handleDeactivateUser = async (userId, userName) => {
    if (!window.confirm(`Deactivate account for "${userName}"? They will not be able to log in.`)) return;
    try {
      const res = await adminAPI.deactivateUser(userId);
      if (res.error) throw new Error(res.error);
      setMsg(`✅ ${userName} deactivated`);
      loadData();
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Delete team "${teamName}"? This cannot be undone.`)) return;
    try {
      // Mark team inactive via leave — admin leaves as last member
      // For now use the teams endpoint directly
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/teams/${teamId}/leave`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete team');
      }
      setMsg(`✅ Team "${teamName}" removed`);
      loadData();
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  };

  // Computed analytics from real data
  const analytics = {
    totalStudents: students.length,
    totalFaculty: faculty.length,
    totalTeams: teams.length,
    totalProjects: projects.length,
    activeTeams: teams.filter(t => t.status === 'active').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    avgProgress: projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0,
  };

  const filteredStudents = students.filter(s =>
    !studentSearch ||
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredTeams = teams.filter(t =>
    !teamSearch || t.name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'white', fontSize: '1.75rem', fontWeight: '700' }}>Admin Control Panel</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
            Welcome, {user.name} · TeamSync PBL
          </p>
        </div>
        <button onClick={handleLogout}
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 2rem', background: msg.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: msg.startsWith('✅') ? '#065f46' : '#dc2626', display: 'flex', justifyContent: 'space-between' }}>
          {msg}
          <button onClick={() => setMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>×</button>
        </div>
      )}

      <div className="admin-container">
        {/* Sidebar Nav */}
        <nav className="admin-nav">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'students', label: 'Students' },
            { key: 'faculty', label: 'Faculty' },
            { key: 'teams', label: 'Teams' },
            { key: 'projects', label: 'Projects' },
            { key: 'analytics', label: 'Analytics' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveSection(key)}
              className={`nav-btn ${activeSection === key ? 'active' : ''}`}>
              {label}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1, padding: '2rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>Loading data...</div>
          ) : (
            <>
              {/* Overview */}
              {activeSection === 'overview' && (
                <div>
                  <section className="stats-grid">
                    {[
                      { label: 'Total Students', value: analytics.totalStudents, color: '#3b82f6' },
                      { label: 'Faculty Members', value: analytics.totalFaculty, color: '#10b981' },
                      { label: 'Active Teams', value: analytics.activeTeams, color: '#f59e0b' },
                      { label: 'Total Projects', value: analytics.totalProjects, color: '#8b5cf6' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="stat-card">
                        <div className="stat-content">
                          <h3 style={{ color }}>{value}</h3>
                          <p>{label}</p>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section className="content-grid" style={{ marginTop: '2rem' }}>
                    <div className="content-card">
                      <div className="card-header"><h2>Recent Teams</h2></div>
                      {teams.slice(0, 5).map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}>
                          <span style={{ fontWeight: '600' }}>{t.name}</span>
                          <span style={{ background: t.status === 'active' ? '#d1fae5' : '#fef3c7', color: t.status === 'active' ? '#065f46' : '#92400e', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="content-card">
                      <div className="card-header"><h2>Project Status</h2></div>
                      {['planning', 'design', 'development', 'testing', 'completed'].map(status => {
                        const count = projects.filter(p => p.status === status).length;
                        return (
                          <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                            <span style={{ textTransform: 'capitalize', color: '#374151' }}>{status}</span>
                            <strong style={{ color: '#2563eb' }}>{count}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}

              {/* Students */}
              {activeSection === 'students' && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Students ({filteredStudents.length})</h2>
                    <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                      placeholder="Search by name or roll number..."
                      style={{ padding: '0.6rem 1rem', border: '2px solid #e5e7eb', borderRadius: '8px', outline: 'none', minWidth: '250px' }} />
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e5e7eb' }}>
                          {['Roll Number', 'Name', 'Branch', 'Year', 'GitHub', 'Status', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280', fontWeight: '600' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map(student => (
                          <tr key={student.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '0.9rem 1rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>{student.roll_number}</td>
                            <td style={{ padding: '0.9rem 1rem', fontWeight: '600' }}>{student.name}</td>
                            <td style={{ padding: '0.9rem 1rem', color: '#6b7280' }}>{student.branch || '—'}</td>
                            <td style={{ padding: '0.9rem 1rem', color: '#6b7280' }}>{student.year ? `Year ${student.year}` : '—'}</td>
                            <td style={{ padding: '0.9rem 1rem' }}>
                              {student.github_username
                                ? <a href={`https://github.com/${student.github_username}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>@{student.github_username}</a>
                                : <span style={{ color: '#9ca3af' }}>Not connected</span>}
                            </td>
                            <td style={{ padding: '0.9rem 1rem' }}>
                              <span style={{ background: student.is_active ? '#d1fae5' : '#fee2e2', color: student.is_active ? '#065f46' : '#dc2626', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                                {student.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td style={{ padding: '0.9rem 1rem' }}>
                              {student.is_active && (
                                <button onClick={() => handleDeactivateUser(student.id, student.name)}
                                  style={{ padding: '0.4rem 0.8rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                                  Deactivate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredStudents.length === 0 && (
                      <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No students found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Faculty */}
              {activeSection === 'faculty' && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                  <h2 style={{ marginBottom: '1.5rem' }}>Faculty ({faculty.length})</h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e5e7eb' }}>
                        {['Employee ID', 'Name', 'Branch', 'Designation', 'GitHub', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280', fontWeight: '600' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {faculty.map(f => (
                        <tr key={f.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.9rem 1rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>{f.roll_number}</td>
                          <td style={{ padding: '0.9rem 1rem', fontWeight: '600' }}>{f.name}</td>
                          <td style={{ padding: '0.9rem 1rem', color: '#6b7280' }}>{f.branch || '—'}</td>
                          <td style={{ padding: '0.9rem 1rem', color: '#6b7280' }}>{f.designation || '—'}</td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            {f.github_username
                              ? <a href={`https://github.com/${f.github_username}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>@{f.github_username}</a>
                              : <span style={{ color: '#9ca3af' }}>Not connected</span>}
                          </td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <span style={{ background: f.is_active ? '#d1fae5' : '#fee2e2', color: f.is_active ? '#065f46' : '#dc2626', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                              {f.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            {f.is_active && (
                              <button onClick={() => handleDeactivateUser(f.id, f.name)}
                                style={{ padding: '0.4rem 0.8rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                                Deactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Teams */}
              {activeSection === 'teams' && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Teams ({filteredTeams.length})</h2>
                    <input value={teamSearch} onChange={e => setTeamSearch(e.target.value)}
                      placeholder="Search teams..."
                      style={{ padding: '0.6rem 1rem', border: '2px solid #e5e7eb', borderRadius: '8px', outline: 'none', minWidth: '220px' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredTeams.map(team => (
                      <div key={team.id} style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>{team.name}</h3>
                          <span style={{ background: team.status === 'active' ? '#d1fae5' : '#fef3c7', color: team.status === 'active' ? '#065f46' : '#92400e', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                            {team.status}
                          </span>
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                          {team.member_count || 0}/{team.max_members} members
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'monospace', background: '#111827', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '5px', fontSize: '0.8rem' }}>
                            {team.team_code}
                          </span>
                          <button onClick={() => handleDeleteTeam(team.id, team.name)}
                            style={{ padding: '0.4rem 0.8rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredTeams.length === 0 && (
                      <p style={{ color: '#9ca3af', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>No teams found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Projects */}
              {activeSection === 'projects' && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                  <h2 style={{ marginBottom: '1.5rem' }}>All Projects ({projects.length})</h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e5e7eb' }}>
                        {['Title', 'Team', 'Status', 'Progress', 'Due Date', 'Contributions'].map(h => (
                          <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280', fontWeight: '600' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.9rem 1rem', fontWeight: '600', maxWidth: '200px' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: '#6b7280' }}>{p.team_name || '—'}</td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <span style={{ background: '#eff6ff', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '4px', height: '6px' }}>
                                <div style={{ background: '#2563eb', height: '100%', borderRadius: '4px', width: `${p.progress}%` }} />
                              </div>
                              <span style={{ fontSize: '0.8rem', color: '#6b7280', minWidth: '30px' }}>{p.progress}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: '#6b7280', fontSize: '0.85rem' }}>
                            {p.due_date ? new Date(p.due_date).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: '#2563eb', fontWeight: '600' }}>
                            {p.total_contributions || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Analytics */}
              {activeSection === 'analytics' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {[
                      { label: 'Total Users', value: analytics.totalStudents + analytics.totalFaculty, sub: `${analytics.totalStudents} students, ${analytics.totalFaculty} faculty` },
                      { label: 'Active Teams', value: analytics.activeTeams, sub: `of ${analytics.totalTeams} total` },
                      { label: 'Completed Projects', value: analytics.completedProjects, sub: `of ${analytics.totalProjects} total` },
                      { label: 'Avg Project Progress', value: `${analytics.avgProgress}%`, sub: 'across all projects' },
                    ].map(({ label, value, sub }) => (
                      <div key={label} style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#2563eb', marginBottom: '0.5rem' }}>{value}</div>
                        <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>{label}</div>
                        <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Skills distribution */}
                  <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Top Skills Across Students</h3>
                    {(() => {
                      const skillCount = {};
                      students.forEach(s => (s.skills || []).forEach(skill => {
                        skillCount[skill] = (skillCount[skill] || 0) + 1;
                      }));
                      return Object.entries(skillCount)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([skill, count]) => (
                          <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                            <span style={{ minWidth: '140px', fontSize: '0.9rem', color: '#374151' }}>{skill}</span>
                            <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '6px', height: '8px' }}>
                              <div style={{ background: '#2563eb', height: '100%', borderRadius: '6px', width: `${(count / students.length) * 100}%` }} />
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#6b7280', minWidth: '30px' }}>{count}</span>
                          </div>
                        ));
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
