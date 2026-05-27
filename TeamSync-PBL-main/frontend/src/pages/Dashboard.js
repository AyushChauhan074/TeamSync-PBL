import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, projectsAPI, teamsAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersAPI.getStats(),
      projectsAPI.getMy(),
      teamsAPI.getMy(),
      usersAPI.getContributions(null, 5),
    ])
      .then(([statsRes, projectsRes, teamsRes, contribRes]) => {
        setStats(statsRes.stats);
        setProjects(projectsRes.projects || []);
        setTeams(teamsRes.teams || []);
        setContributions(contribRes.contributions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container"><p>Loading dashboard...</p></div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1.5rem' }}>Dashboard</h1>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats?.activeTeams ?? 0}</div>
          <div className="stat-label">Active Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{projects.length}</div>
          <div className="stat-label">My Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.totalContributions ?? 0}</div>
          <div className="stat-label">Contributions</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.contributionScore ?? 0}</div>
          <div className="stat-label">Score</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Recent Contributions */}
        <div className="card">
          <h3>Recent Activity</h3>
          <div style={{ marginTop: '1rem' }}>
            {contributions.length === 0 ? (
              <p style={{ color: '#666' }}>No contributions yet. Link a GitHub repo to your project.</p>
            ) : (
              contributions.map(c => (
                <div key={c.id} style={{ padding: '0.75rem', borderLeft: '3px solid #2563eb', marginBottom: '0.75rem', background: '#f8f9fa', borderRadius: '0 8px 8px 0' }}>
                  <strong style={{ textTransform: 'capitalize' }}>{c.contribution_type.replace('_', ' ')}</strong>
                  <p style={{ margin: '0.25rem 0', color: '#555', fontSize: '0.9rem' }}>{c.title}</p>
                  <small style={{ color: '#999' }}>
                    {c.project_title} · {new Date(c.contribution_date).toLocaleDateString()}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('/teams')}>
              Browse & Join Teams
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/projects')}>
              View My Projects
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
              Update Profile
            </button>
          </div>

          {/* My Teams Summary */}
          {teams.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>My Teams</h4>
              {teams.slice(0, 3).map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                  <span>{t.name}</span>
                  <span style={{ background: t.status === 'active' ? '#d1fae5' : '#fef3c7', color: t.status === 'active' ? '#065f46' : '#92400e', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
