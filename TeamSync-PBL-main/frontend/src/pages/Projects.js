import React, { useState, useEffect, useCallback } from 'react';
import { projectsAPI, teamsAPI, githubAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  planning:    { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  design:      { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  development: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  testing:     { bg: '#fed7aa', text: '#9a3412', border: '#fdba74' },
  completed:   { bg: '#e5e7eb', text: '#374151', border: '#d1d5db' },
};

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', team_id: '', github_repo_url: '', due_date: '' });
  const [actionMsg, setActionMsg] = useState('');
  const [syncingId, setSyncingId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [projRes, teamsRes] = await Promise.all([
        projectsAPI.getMy(),
        teamsAPI.getMy(),
      ]);
      setProjects(projRes.projects || []);
      setMyTeams(teamsRes.teams || []);
    } catch (err) {
      setActionMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    if (!newProject.title.trim() || !newProject.team_id) {
      return setActionMsg('❌ Title and team are required');
    }
    try {
      await projectsAPI.create({ ...newProject, team_id: parseInt(newProject.team_id) });
      setShowCreate(false);
      setNewProject({ title: '', description: '', team_id: '', github_repo_url: '', due_date: '' });
      setActionMsg('✅ Project created!');
      loadData();
    } catch (err) {
      setActionMsg(`❌ ${err.message}`);
    }
  };

  const handleSync = async (projectId) => {
    setSyncingId(projectId);
    try {
      const res = await githubAPI.sync(projectId);
      setActionMsg(`✅ Synced ${res.synced} contributions from ${res.repo}`);
      loadData();
    } catch (err) {
      setActionMsg(`❌ ${err.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  const handleProgressUpdate = async (projectId, progress, status) => {
    try {
      await projectsAPI.updateProgress(projectId, { progress: parseInt(progress), status });
      loadData();
    } catch (err) {
      setActionMsg(`❌ ${err.message}`);
    }
  };

  if (loading) return <div className="container"><p>Loading projects...</p></div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', padding: '2.5rem', borderRadius: '20px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>Projects</h1>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>Manage and track your team projects</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.3)', padding: '0.7rem 1.4rem', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}>
          + New Project
        </button>
      </div>

      {actionMsg && (
        <div style={{ padding: '0.75rem 1rem', background: actionMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2', borderRadius: '8px', marginBottom: '1rem', color: actionMsg.startsWith('✅') ? '#065f46' : '#dc2626' }}>
          {actionMsg}
          <button onClick={() => setActionMsg('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>×</button>
        </div>
      )}

      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px', color: '#6b7280' }}>
          <p style={{ fontSize: '1.1rem' }}>No projects yet.</p>
          <p>Create a project or join a team that has one.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {projects.map(project => {
            const colors = STATUS_COLORS[project.status] || STATUS_COLORS.planning;
            return (
              <div key={project.id} style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, color: '#111827', fontSize: '1.15rem', flex: 1 }}>{project.title}</h3>
                    <span style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', marginLeft: '0.75rem', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                      {project.status}
                    </span>
                  </div>

                  <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {project.description || 'No description.'}
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#374151' }}>
                    <span>👥 {project.team_name}</span>
                    {project.due_date && <span>📅 {new Date(project.due_date).toLocaleDateString()}</span>}
                    <span>🔧 {project.total_contributions || 0} contributions</span>
                  </div>

                  {/* Progress */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '600' }}>Progress</span>
                      <span style={{ color: '#2563eb', fontWeight: '700' }}>{project.progress}%</span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: '8px', height: '8px' }}>
                      <div style={{ background: 'linear-gradient(90deg, #3b82f6, #2563eb)', height: '100%', borderRadius: '8px', width: `${project.progress}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {project.github_repo_url ? (
                      <>
                        <a href={project.github_repo_url} target="_blank" rel="noopener noreferrer"
                          style={{ padding: '0.6rem 1rem', background: '#111827', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
                          GitHub
                        </a>
                        <button onClick={() => handleSync(project.id)} disabled={syncingId === project.id}
                          style={{ padding: '0.6rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                          {syncingId === project.id ? 'Syncing...' : '🔄 Sync GitHub'}
                        </button>
                      </>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No GitHub repo linked</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowCreate(false)}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '520px', width: '90%' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create New Project</h2>

            {[
              { label: 'Project Title *', key: 'title', type: 'text', placeholder: 'e.g., Smart Campus System' },
              { label: 'GitHub Repo URL', key: 'github_repo_url', type: 'url', placeholder: 'https://github.com/user/repo' },
              { label: 'Due Date', key: 'due_date', type: 'date' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>{label}</label>
                <input type={type} value={newProject[key]} onChange={e => setNewProject({ ...newProject, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '0.8rem', border: '2px solid #e5e7eb', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Team *</label>
              <select value={newProject.team_id} onChange={e => setNewProject({ ...newProject, team_id: e.target.value })}
                style={{ width: '100%', padding: '0.8rem', border: '2px solid #e5e7eb', borderRadius: '10px', outline: 'none' }}>
                <option value="">Select your team</option>
                {myTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Description</label>
              <textarea value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Describe the project..."
                style={{ width: '100%', padding: '0.8rem', border: '2px solid #e5e7eb', borderRadius: '10px', outline: 'none', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)}
                style={{ padding: '0.8rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                Cancel
              </button>
              <button onClick={handleCreate}
                style={{ padding: '0.8rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
