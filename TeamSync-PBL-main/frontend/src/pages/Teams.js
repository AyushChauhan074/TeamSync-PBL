import React, { useState, useEffect, useCallback } from 'react';
import { teamsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Teams = () => {
  const { user } = useAuth();
  const [allTeams, setAllTeams] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '', max_members: 6, required_skills: [] });
  const [skillInput, setSkillInput] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const loadTeams = useCallback(async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        teamsAPI.getAll(search),
        teamsAPI.getMy(),
      ]);
      setAllTeams(allRes.teams || []);
      setMyTeams(myRes.teams || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setActionMsg('');
    try {
      await teamsAPI.join(joinCode.trim().toUpperCase());
      setJoinCode('');
      setActionMsg('✅ Joined team successfully!');
      loadTeams();
    } catch (err) {
      setActionMsg(`❌ ${err.message}`);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async (teamId, teamName) => {
    if (!window.confirm(`Leave "${teamName}"?`)) return;
    try {
      await teamsAPI.leave(teamId);
      setActionMsg(`✅ Left ${teamName}`);
      loadTeams();
    } catch (err) {
      setActionMsg(`❌ ${err.message}`);
    }
  };

  const handleCreate = async () => {
    if (!newTeam.name.trim()) return;
    try {
      await teamsAPI.create(newTeam);
      setShowCreateModal(false);
      setNewTeam({ name: '', description: '', max_members: 6, required_skills: [] });
      setActionMsg('✅ Team created!');
      loadTeams();
    } catch (err) {
      setActionMsg(`❌ ${err.message}`);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !newTeam.required_skills.includes(skillInput.trim())) {
      setNewTeam(prev => ({ ...prev, required_skills: [...prev.required_skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const myTeamIds = new Set(myTeams.map(t => t.id));

  if (loading) return <div className="container"><p>Loading teams...</p></div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', padding: '2.5rem', borderRadius: '20px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>Teams</h1>
            <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>Collaborate with your team members</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setShowCreateModal(true)}
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.3)', padding: '0.7rem 1.4rem', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}>
              + Create Team
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Team code (6 chars)"
                style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: 'none', outline: 'none', width: '160px' }} />
              <button onClick={handleJoin} disabled={joinLoading}
                style={{ background: 'white', color: '#2563eb', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                {joinLoading ? '...' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div style={{ padding: '0.75rem 1rem', background: actionMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2', borderRadius: '8px', marginBottom: '1rem', color: actionMsg.startsWith('✅') ? '#065f46' : '#dc2626' }}>
          {actionMsg}
        </div>
      )}

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search teams by name..."
        style={{ width: '100%', padding: '0.9rem 1rem', border: '2px solid #e5e7eb', borderRadius: '12px', marginBottom: '2rem', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />

      {/* My Teams */}
      {myTeams.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: '#111827' }}>My Teams</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {myTeams.map(team => (
              <TeamCard key={team.id} team={team} isMember={true} onLeave={handleLeave} />
            ))}
          </div>
        </div>
      )}

      {/* All Teams */}
      <h2 style={{ marginBottom: '1rem', color: '#111827' }}>
        {search ? `Search Results (${allTeams.length})` : 'All Teams'}
      </h2>
      {allTeams.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No teams found.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {allTeams.filter(t => !myTeamIds.has(t.id)).map(team => (
            <TeamCard key={team.id} team={team} isMember={false} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowCreateModal(false)}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '500px', width: '90%' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create New Team</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Team Name *</label>
              <input value={newTeam.name} onChange={e => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="Enter team name"
                style={{ width: '100%', padding: '0.8rem', border: '2px solid #e5e7eb', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Description</label>
              <textarea value={newTeam.description} onChange={e => setNewTeam({ ...newTeam, description: e.target.value })}
                placeholder="What is this team working on?"
                style={{ width: '100%', padding: '0.8rem', border: '2px solid #e5e7eb', borderRadius: '10px', outline: 'none', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Max Members</label>
              <input type="number" min="2" max="10" value={newTeam.max_members}
                onChange={e => setNewTeam({ ...newTeam, max_members: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '0.8rem', border: '2px solid #e5e7eb', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Required Skills</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Add skill and press Enter"
                  style={{ flex: 1, padding: '0.7rem', border: '2px solid #e5e7eb', borderRadius: '8px', outline: 'none' }} />
                <button onClick={addSkill} style={{ padding: '0.7rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Add</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {newTeam.required_skills.map(s => (
                  <span key={s} style={{ background: '#dbeafe', color: '#1e40af', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                    onClick={() => setNewTeam(prev => ({ ...prev, required_skills: prev.required_skills.filter(x => x !== s) }))}>
                    {s} ×
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreateModal(false)}
                style={{ padding: '0.8rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                Cancel
              </button>
              <button onClick={handleCreate}
                style={{ padding: '0.8rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function TeamCard({ team, isMember, onLeave }) {
  const memberCount = parseInt(team.member_count) || 0;
  const pct = Math.round((memberCount / team.max_members) * 100);

  return (
    <div style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, color: '#111827', fontSize: '1.1rem' }}>{team.name}</h3>
        <span style={{ background: team.status === 'active' ? '#d1fae5' : '#fef3c7', color: team.status === 'active' ? '#065f46' : '#92400e', padding: '0.25rem 0.7rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
          {team.status}
        </span>
      </div>

      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem', minHeight: '2.5rem' }}>
        {team.description || 'No description provided.'}
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#374151' }}>
          <span>Members</span>
          <span style={{ fontWeight: '700', color: '#2563eb' }}>{memberCount}/{team.max_members}</span>
        </div>
        <div style={{ background: '#f3f4f6', borderRadius: '8px', height: '6px' }}>
          <div style={{ background: '#2563eb', height: '100%', borderRadius: '8px', width: `${pct}%` }} />
        </div>
      </div>

      {team.required_skills?.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {team.required_skills.slice(0, 4).map(s => (
            <span key={s} style={{ background: '#eff6ff', color: '#1e40af', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #bfdbfe' }}>{s}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', background: '#111827', color: 'white', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.85rem', letterSpacing: '1px' }}>
          {team.team_code}
        </span>
        {isMember ? (
          <button onClick={() => onLeave(team.id, team.name)}
            style={{ padding: '0.5rem 1rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
            Leave
          </button>
        ) : (
          <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Use code to join</span>
        )}
      </div>
    </div>
  );
}

export default Teams;
