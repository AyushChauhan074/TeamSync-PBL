import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, githubAPI } from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [githubConnecting, setGithubConnecting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      github_username: user.github_username || '',
      linkedin_url: user.linkedin_url || '',
      bio: user.bio || '',
      skills: user.skills || [],
      interests: user.interests || [],
    });

    Promise.all([
      usersAPI.getStats(),
      usersAPI.getContributions(null, 10),
    ]).then(([statsRes, contribRes]) => {
      setStats(statsRes.stats);
      setContributions(contribRes.contributions || []);
    }).catch(console.error);
  }, [user]);

  // Handle GitHub OAuth callback code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('github_code');
    if (code) {
      window.history.replaceState({}, '', '/profile');
      setGithubConnecting(true);
      githubAPI.connect(code)
        .then(res => {
          setMsg(`✅ GitHub connected: @${res.github_login}`);
          usersAPI.getProfile().then(r => updateUser(r.user));
        })
        .catch(err => setMsg(`❌ ${err.message}`))
        .finally(() => setGithubConnecting(false));
    }
  }, [updateUser]);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const updated = await usersAPI.updateProfile(formData);
      updateUser(updated.user);
      setIsEditing(false);
      setMsg('✅ Profile updated successfully');
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGithub = async () => {
    try {
      const res = await githubAPI.getOAuthUrl();
      window.location.href = res.url;
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-container">
      {/* Header Card */}
      <div className="profile-header-card">
        <div className="profile-banner" />
        <div className="profile-header-content">
          <div className="profile-avatar">
            {user.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          <div className="profile-header-info">
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-headline">{user.bio || 'No bio yet'}</p>
            <p className="profile-meta">{user.branch} · {user.roll_number}</p>
            <div className="profile-links">
              {user.github_username && (
                <a href={`https://github.com/${user.github_username}`} target="_blank" rel="noopener noreferrer" className="profile-link">
                  GitHub: @{user.github_username}
                </a>
              )}
              {user.linkedin_url && (
                <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="profile-link">LinkedIn</a>
              )}
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: msg.startsWith('✅') ? '#d1fae5' : '#fee2e2', borderRadius: '8px', margin: '1rem 0', color: msg.startsWith('✅') ? '#065f46' : '#dc2626' }}>
          {msg}
        </div>
      )}

      <div className="profile-grid">
        {/* Left Column */}
        <div className="profile-left">
          {/* About */}
          <div className="profile-card">
            <div className="card-header">
              <h2>About</h2>
              <button onClick={() => setIsEditing(!isEditing)} className="btn-edit">
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div className="card-content">
              {isEditing ? (
                <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  className="input-textarea" rows="4" placeholder="Tell us about yourself..." />
              ) : (
                <p className="about-text">{user.bio || 'No bio yet. Click Edit to add one.'}</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="profile-card">
            <div className="card-header"><h2>Skills</h2></div>
            <div className="card-content">
              {isEditing && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Add skill" style={{ flex: 1, padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                  <button onClick={addSkill} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add</button>
                </div>
              )}
              <div className="skills-grid">
                {(isEditing ? formData.skills : user.skills || []).map(skill => (
                  <span key={skill} className="skill-tag" style={{ cursor: isEditing ? 'pointer' : 'default' }}
                    onClick={() => isEditing && setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))}>
                    {skill}{isEditing ? ' ×' : ''}
                  </span>
                ))}
                {(isEditing ? formData.skills : user.skills || []).length === 0 && (
                  <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No skills added yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="profile-card">
            <div className="card-header"><h2>Activity</h2></div>
            <div className="card-content">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{stats?.activeTeams ?? '—'}</div>
                  <div className="stat-label">Active Teams</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats?.completedProjects ?? '—'}</div>
                  <div className="stat-label">Projects Done</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats?.totalContributions ?? '—'}</div>
                  <div className="stat-label">Contributions</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats?.contributionScore ?? '—'}</div>
                  <div className="stat-label">Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="profile-right">
          {/* Contact Info */}
          <div className="profile-card">
            <div className="card-header"><h2>Contact Information</h2></div>
            <div className="card-content">
              {isEditing ? (
                <>
                  {[
                    { label: 'Name', key: 'name', type: 'text' },
                    { label: 'Email', key: 'email', type: 'email' },
                    { label: 'Phone', key: 'phone', type: 'tel' },
                    { label: 'LinkedIn URL', key: 'linkedin_url', type: 'url' },
                    { label: 'GitHub Username', key: 'github_username', type: 'text' },
                  ].map(({ label, key, type }) => (
                    <div key={key} style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.3rem' }}>{label}</label>
                      <input type={type} value={formData[key] || ''} onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #e5e7eb', borderRadius: '6px', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="contact-item">
                    <div className="contact-label">Email</div>
                    <div className="contact-value">{user.email}</div>
                  </div>
                  <div className="contact-item">
                    <div className="contact-label">Roll Number</div>
                    <div className="contact-value">{user.roll_number}</div>
                  </div>
                  {user.phone && (
                    <div className="contact-item">
                      <div className="contact-label">Phone</div>
                      <div className="contact-value">{user.phone}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* GitHub Connection */}
          <div className="profile-card">
            <div className="card-header"><h2>GitHub Integration</h2></div>
            <div className="card-content">
              {user.github_username ? (
                <div>
                  <p style={{ color: '#065f46', background: '#d1fae5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    ✅ Connected as <strong>@{user.github_username}</strong>
                  </p>
                  <a href={`https://github.com/${user.github_username}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.9rem' }}>
                    View GitHub Profile →
                  </a>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Connect your GitHub account to enable contribution tracking.
                  </p>
                  <button onClick={handleConnectGithub} disabled={githubConnecting}
                    style={{ padding: '0.75rem 1.5rem', background: '#111827', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {githubConnecting ? 'Connecting...' : '🔗 Connect GitHub'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Contributions */}
          {contributions.length > 0 && (
            <div className="profile-card">
              <div className="card-header"><h2>Recent Contributions</h2></div>
              <div className="card-content">
                {contributions.map(c => (
                  <div key={c.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ background: '#eff6ff', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' }}>
                        {c.contribution_type.replace('_', ' ')}
                      </span>
                      <small style={{ color: '#9ca3af' }}>{new Date(c.contribution_date).toLocaleDateString()}</small>
                    </div>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', color: '#374151' }}>{c.title}</p>
                    {c.project_title && <small style={{ color: '#6b7280' }}>{c.project_title}</small>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Bar */}
      {isEditing && (
        <div className="save-bar">
          <button onClick={handleSave} className="btn-save" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={() => setIsEditing(false)} className="btn-cancel">Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Profile;
