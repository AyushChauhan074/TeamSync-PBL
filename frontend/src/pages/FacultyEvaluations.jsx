import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFetch from '../utils/api';

const FacultyEvaluations = () => {
  const [user, setUser] = useState(null);
  const [assignedTeams, setAssignedTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  // Workspace State
  const [workspaceData, setWorkspaceData] = useState(null);
  const [selectedPhase, setSelectedPhase] = useState('planning');
  
  // Scheduling State
  const [meetupTime, setMeetupTime] = useState('');
  const [meetupLocation, setMeetupLocation] = useState('');
  
  // Grading State
  const [gradesInput, setGradesInput] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignedTeams = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        navigate('/login');
        return;
      }
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.role !== 'faculty') {
        navigate('/');
        return;
      }

      try {
        const data = await apiFetch('/faculty/assigned-teams?viewMode=evaluator');
        if (data.success) {
          setAssignedTeams(data.teams);
        }
      } catch (error) {
        console.error('Failed to fetch assigned teams:', error);
      }
    };
    fetchAssignedTeams();
  }, [navigate]);

  useEffect(() => {
    if (selectedTeam) {
      loadWorkspace(selectedTeam.id);
    }
  }, [selectedTeam]);

  const loadWorkspace = async (teamId) => {
    try {
      const data = await apiFetch(`/faculty/evaluation-workspace/${teamId}`);
      if (data.success) {
        setWorkspaceData(data);
        // Pre-fill grades state if existing grades exist for current phase
        initializeGradesState(data.members, data.grades, 'planning');
      }
    } catch (error) {
      console.error('Failed to load workspace:', error);
    }
  };

  const initializeGradesState = (members, existingGrades, phase) => {
    const initialState = {};
    members.forEach(m => {
      const existing = existingGrades.find(g => g.student_id === m.id && g.phase_name === phase);
      initialState[m.id] = {
        score: existing ? existing.score_acquired : '',
        feedback: existing ? existing.evaluator_feedback : ''
      };
    });
    setGradesInput(initialState);
  };

  const handlePhaseChange = (phase) => {
    setSelectedPhase(phase);
    if (workspaceData) {
      initializeGradesState(workspaceData.members, workspaceData.grades, phase);
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    setGradesInput(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleScheduleMeetup = async () => {
    if (!meetupTime) {
      alert("Please select a date and time");
      return;
    }
    
    try {
      const payload = {
        phase_name: selectedPhase,
        meetup_timestamp: meetupTime
      };
      
      const data = await apiFetch(`/faculty/schedule-meetup/${selectedTeam.id}`, {
        method: 'POST',
        body: payload
      });
      
      if (data.success) {
        alert("Meetup slot confirmed!");
        loadWorkspace(selectedTeam.id); // reload to get updated meetup list
      }
    } catch (error) {
      alert("Failed to schedule meetup: " + error.message);
    }
  };

  const handleSubmitGrades = async () => {
    // Validate bounds
    const gradesArray = Object.keys(gradesInput).map(studentId => {
      const g = gradesInput[studentId];
      let scoreNum = parseInt(g.score);
      if (isNaN(scoreNum)) scoreNum = 0;
      if (scoreNum < 0) scoreNum = 0;
      if (scoreNum > 100) scoreNum = 100;
      return {
        studentId: parseInt(studentId),
        score: scoreNum,
        feedback: g.feedback
      };
    });

    try {
      const payload = {
        phase_name: selectedPhase,
        grades: gradesArray
      };

      const data = await apiFetch(`/faculty/submit-individual-grades/${selectedTeam.id}`, {
        method: 'POST',
        body: payload
      });

      if (data.success) {
        alert(`Phase ${selectedPhase} grades successfully submitted!`);
        loadWorkspace(selectedTeam.id);
      }
    } catch (error) {
      alert("Failed to submit grades: " + error.message);
    }
  };

  const getScheduledTimeText = () => {
    if (!workspaceData) return "Not Scheduled";
    const meetup = workspaceData.meetups.find(m => m.phase_name === selectedPhase);
    if (meetup) {
      return new Date(meetup.meetup_timestamp).toLocaleString();
    }
    return "Not Scheduled";
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 70px)', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Left Control Pane - 30% */}
      <div style={{ width: '30%', borderRight: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Assigned for Evaluation</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Select a team to manage milestones</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {assignedTeams.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No teams assigned to you for evaluation.</div>
          ) : (
            assignedTeams.map(team => (
              <div 
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                style={{ 
                  padding: '1.25rem 1.5rem', 
                  borderBottom: '1px solid #f1f5f9', 
                  cursor: 'pointer',
                  background: selectedTeam?.id === team.id ? '#eff6ff' : 'white',
                  borderLeft: selectedTeam?.id === team.id ? '4px solid #3b82f6' : '4px solid transparent',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>{team.name}</div>
                <div style={{ fontSize: '0.875rem', color: '#475569' }}>{team.project_name || 'Unknown Project'}</div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#f1f5f9', color: '#475569', borderRadius: '4px' }}>
                    {team.roster_size || 0} Members
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Context Pane - 70% */}
      <div style={{ width: '70%', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#f8fafc' }}>
        {!selectedTeam || !workspaceData ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '1.1rem', flexDirection: 'column', gap: '1rem' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            Select a team from the left pane to open the evaluation workspace.
          </div>
        ) : (
          <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            
            {/* ── Workspace Header ── */}
            <div style={{ 
              background: 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: '16px', 
              padding: '1.5rem 2rem', 
              marginBottom: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.75rem', fontWeight: '700' }}>{selectedTeam.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{selectedTeam.project_name || 'No Project Title'}</span>
                {workspaceData.team.github_repo_url && (
                  <>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <a 
                      href={workspaceData.team.github_repo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#3b82f6', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                      Repository
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* ── A. Phase Selection Pill Ribbon ── */}
            <div style={{ 
              display: 'flex', 
              background: '#f1f5f9', 
              padding: '4px', 
              borderRadius: '12px', 
              gap: '4px', 
              marginBottom: '1.5rem',
              maxWidth: '480px'
            }}>
              {['planning', 'development', 'evaluation'].map(phase => (
                <button
                  key={phase}
                  onClick={() => handlePhaseChange(phase)}
                  style={{
                    flex: 1,
                    padding: '0.6rem 1rem',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s ease',
                    background: selectedPhase === phase ? '#2563eb' : 'transparent',
                    color: selectedPhase === phase ? 'white' : '#64748b',
                    boxShadow: selectedPhase === phase ? '0 2px 8px rgba(37,99,235,0.3)' : 'none'
                  }}
                >
                  {phase === 'planning' ? '📋 ' : phase === 'development' ? '⚡ ' : '🎯 '}{phase}
                </button>
              ))}
            </div>

            {/* ── B. Dual-Column Control Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '1.5rem', alignItems: 'start' }}>
              
              {/* ── Left Column: Meetup Scheduler Card ── */}
              <div style={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                border: '1px solid #e2e8f0', 
                borderRadius: '16px', 
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b', fontSize: '1rem', fontWeight: '700' }}>
                  📅 Schedule Milestone Presentation
                </h3>
                <p style={{ margin: '0 0 1.25rem 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  Current: <strong style={{ color: '#475569' }}>{getScheduledTimeText()}</strong>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                      Select Date & Time
                    </label>
                    <input 
                      type="datetime-local" 
                      value={meetupTime}
                      onChange={(e) => setMeetupTime(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '0.65rem', 
                        borderRadius: '10px', 
                        border: '1px solid #d1d5db', 
                        outline: 'none', 
                        color: '#111827', 
                        fontSize: '0.9rem', 
                        background: 'white',
                        boxSizing: 'border-box'
                      }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                      📝 Location / Agenda
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Lab 3, CSE Block"
                      value={meetupLocation}
                      onChange={(e) => setMeetupLocation(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '0.65rem', 
                        borderRadius: '10px', 
                        border: '1px solid #d1d5db', 
                        outline: 'none', 
                        color: '#111827', 
                        fontSize: '0.9rem', 
                        background: 'white',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleScheduleMeetup}
                  onMouseEnter={(e) => { e.target.style.background = '#1d4ed8'; }}
                  onMouseLeave={(e) => { e.target.style.background = '#2563eb'; }}
                  style={{ 
                    marginTop: '1.25rem', 
                    width: '100%', 
                    padding: '0.7rem', 
                    background: '#2563eb', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '10px', 
                    fontWeight: '600', 
                    fontSize: '0.85rem',
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Save Meetup Appointment
                </button>
              </div>

              {/* ── Right Column: Grading Matrix Card ── */}
              <div style={{ 
                background: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '16px', 
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <h3 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: '#0f172a', 
                  fontSize: '1.1rem', 
                  fontWeight: '700',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  📈 Individual Role-Based Evaluation
                </h3>
                <p style={{ margin: '0 0 1.25rem 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  Evaluate each member's distinct component for <strong style={{ color: '#475569', textTransform: 'capitalize' }}>{selectedPhase}</strong> phase.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {workspaceData.members.length === 0 ? (
                    <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '12px', color: '#94a3b8', textAlign: 'center', border: '1px dashed #e2e8f0' }}>
                      No students currently assigned to this team.
                    </div>
                  ) : (
                    workspaceData.members.map((student) => (
                      <div key={student.id} style={{ 
                        background: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '14px', 
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}>
                        {/* Student Header Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {/* Avatar Circle */}
                            <div style={{ 
                              width: '36px', height: '36px', borderRadius: '50%', 
                              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              color: 'white', fontWeight: '700', fontSize: '0.8rem' 
                            }}>
                              {student.name?.split(' ').map(n => n[0]).join('').substring(0,2)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>{student.name}</div>
                            </div>
                          </div>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            fontFamily: "'Courier New', monospace", 
                            padding: '0.3rem 0.65rem', 
                            background: '#eff6ff', 
                            color: '#1d4ed8', 
                            borderRadius: '20px', 
                            border: '1px solid #bfdbfe',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}>
                            🏷️ {student.project_role || "Unassigned Track"}
                          </span>
                        </div>

                        {/* Score + Feedback Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Score:</span>
                            <input 
                              type="number" 
                              min="0" 
                              max="100" 
                              value={gradesInput[student.id]?.score || ''}
                              onChange={(e) => handleGradeChange(student.id, 'score', e.target.value)}
                              style={{ 
                                width: '65px', 
                                padding: '0.45rem', 
                                fontSize: '1rem', 
                                fontWeight: '700', 
                                textAlign: 'center', 
                                borderRadius: '8px', 
                                border: '1px solid #d1d5db', 
                                color: '#111827', 
                                outline: 'none',
                                background: 'white'
                              }} 
                            />
                            <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#94a3b8' }}>/ 100</span>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Write evaluator feedback..." 
                            value={gradesInput[student.id]?.feedback || ''}
                            onChange={(e) => handleGradeChange(student.id, 'feedback', e.target.value)}
                            style={{ 
                              flex: 1, 
                              padding: '0.5rem 0.75rem', 
                              fontSize: '0.85rem', 
                              borderRadius: '8px', 
                              border: '1px solid #d1d5db', 
                              outline: 'none',
                              color: '#111827',
                              background: 'white'
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ── C. Global Submit Footer ── */}
                <button 
                  onClick={handleSubmitGrades}
                  onMouseEnter={(e) => { e.target.style.background = '#059669'; e.target.style.boxShadow = '0 6px 20px rgba(5,150,105,0.35)'; }}
                  onMouseLeave={(e) => { e.target.style.background = '#10b981'; e.target.style.boxShadow = '0 4px 14px rgba(16,185,129,0.3)'; }}
                  style={{ 
                    marginTop: '1.5rem', 
                    width: '100%', 
                    padding: '0.85rem 1.5rem', 
                    background: '#10b981', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    fontWeight: '700', 
                    fontSize: '0.9rem',
                    cursor: 'pointer', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🚀 Submit All Phase Individual Grades
                </button>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyEvaluations;
