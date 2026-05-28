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
      <div style={{ width: '70%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {!selectedTeam || !workspaceData ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '1.1rem' }}>
            Select a team from the left pane to open the evaluation radar portal.
          </div>
        ) : (
          <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>{selectedTeam.name} Workspace</h1>
              <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>{selectedTeam.project_name || 'No Project Title'} • {workspaceData.team.github_repo_url || 'No Repository'}</p>
            </div>

            {/* Step 1: Active Milestone Phase Selector */}
            <div style={{ marginBottom: '2rem', background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>1. Active Milestone Phase</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {['planning', 'development', 'evaluation'].map(phase => (
                  <button
                    key={phase}
                    onClick={() => handlePhaseChange(phase)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: selectedPhase === phase ? '#3b82f6' : '#f1f5f9',
                      color: selectedPhase === phase ? 'white' : '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {phase}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Meetup Appointment Slot */}
            <div style={{ marginBottom: '2rem', background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>2. Meetup Appointment Slot</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                    Current Schedule: <span style={{ color: '#0f172a', fontWeight: '600' }}>{getScheduledTimeText()}</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    value={meetupTime}
                    onChange={(e) => setMeetupTime(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#111827', fontSize: '1rem', background: '#f8fafc' }} 
                    className="high-contrast-picker"
                  />
                </div>
                <button 
                  onClick={handleScheduleMeetup}
                  style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Confirm Slot
                </button>
              </div>
            </div>

            {/* Step 3: Role-Based Individual Grading Scorecard */}
            <div style={{ marginBottom: '2rem', background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>3. Role-Based Individual Grading Scorecard</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>Evaluate distinct component artifacts assigned to each member for this phase.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {workspaceData.members.length === 0 ? (
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', color: '#64748b', textAlign: 'center' }}>
                    No students currently assigned to this team.
                  </div>
                ) : (
                  workspaceData.members.map((student) => (
                    <div key={student.id} style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: '#111827' }}>{student.name}</span>
                          <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', padding: '0.2rem 0.5rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                            {student.project_role || "Unassigned Track"}
                          </span>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Evaluator feedback..." 
                          value={gradesInput[student.id]?.feedback || ''}
                          onChange={(e) => handleGradeChange(student.id, 'feedback', e.target.value)}
                          style={{ width: '90%', padding: '0.5rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}
                        />
                      </div>

                      <div style={{ width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>Score (0-100)</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          value={gradesInput[student.id]?.score || ''}
                          onChange={(e) => handleGradeChange(student.id, 'score', e.target.value)}
                          style={{ width: '80px', padding: '0.5rem', fontSize: '1rem', fontWeight: '600', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#111827', outline: 'none' }} 
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={handleSubmitGrades}
                  style={{ padding: '0.875rem 2rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06)', transition: 'background 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.background = '#4338ca'}
                  onMouseLeave={(e) => e.target.style.background = '#4f46e5'}
                >
                  ⚡ Compile and Dispatch Phase Grades
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
