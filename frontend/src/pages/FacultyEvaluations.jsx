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
      <div className="w-[70%] flex flex-col overflow-y-auto bg-gray-50">
        {!selectedTeam || !workspaceData ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-lg">
            Select a team from the left pane to open the evaluation radar portal.
          </div>
        ) : (
          <div className="p-8 max-w-[1200px] mx-auto w-full">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="m-0 text-slate-900 text-3xl font-bold">{selectedTeam.name} Workspace</h1>
              <p className="mt-2 text-slate-500">{selectedTeam.project_name || 'No Project Title'} • {workspaceData.team.github_repo_url || 'No Repository'}</p>
            </div>

            {/* A. Milestone Phase Navigation Bar */}
            <div className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="m-0 mb-4 text-slate-800 font-semibold">Active Milestone Phase</h3>
              <div className="flex gap-4">
                {['planning', 'development', 'evaluation'].map(phase => (
                  <button
                    key={phase}
                    onClick={() => handlePhaseChange(phase)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold capitalize transition-all duration-200 ${
                      selectedPhase === phase 
                        ? 'bg-[#1d4ed8] text-white shadow-md' 
                        : 'bg-[#f3f4f6] text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {phase}
                  </button>
                ))}
              </div>
            </div>

            {/* B. Dual-Column Structural Control Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
              
              {/* Left Sub-Column (2/5 Width) - Meetup Scheduler Card */}
              <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col">
                <h3 className="m-0 mb-4 text-slate-800 font-semibold">Schedule Milestone Presentation</h3>
                
                <div className="flex-1 flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Current Schedule: <span className="text-slate-900 font-semibold">{getScheduledTimeText()}</span>
                    </label>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Select Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={meetupTime}
                      onChange={(e) => setMeetupTime(e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-300 outline-none text-[#111827] !important bg-slate-50" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">📝 Meetup Agenda / Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Lab 3, CSE Block"
                      value={meetupLocation}
                      onChange={(e) => setMeetupLocation(e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-300 outline-none text-[#111827] !important bg-slate-50"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleScheduleMeetup}
                  className="mt-6 w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors"
                >
                  ⚡ [ Save Meetup Appointment ]
                </button>
              </div>

              {/* Right Sub-Column (3/5 Width) - Individual Role Grading Matrix */}
              <div className="lg:col-span-3 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="m-0 mb-4 text-slate-800 font-semibold">Individual Role-Based Evaluation</h3>
                
                <div className="flex flex-col gap-4">
                  {workspaceData.members.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-lg text-slate-500 text-center">
                      No students currently assigned to this team.
                    </div>
                  ) : (
                    workspaceData.members.map((student) => (
                      <div key={student.id} className="flex flex-col sm:flex-row sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-200 gap-4">
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-slate-900">{student.name}</span>
                            <span className="text-xs font-mono px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200">
                              🏷️ {student.project_role || "Unassigned Track"}
                            </span>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Evaluator feedback..." 
                            value={gradesInput[student.id]?.feedback || ''}
                            onChange={(e) => handleGradeChange(student.id, 'feedback', e.target.value)}
                            className="w-full p-2 text-sm rounded border border-slate-300 outline-none focus:border-blue-500 text-[#111827] !important bg-white"
                          />
                        </div>

                        <div className="w-full sm:w-[120px] flex flex-col sm:items-end gap-1">
                          <label className="text-xs text-slate-500 font-medium">Score: [ / 100 ]</label>
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={gradesInput[student.id]?.score || ''}
                            onChange={(e) => handleGradeChange(student.id, 'score', e.target.value)}
                            className="w-[80px] p-2 text-base font-semibold text-center rounded border border-slate-300 text-[#111827] !important outline-none focus:border-blue-500 bg-white" 
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* C. Global Submit Footer Action */}
                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={handleSubmitGrades}
                    className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-lg font-semibold cursor-pointer shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    🚀 [ Submit All Phase Individual Grades ]
                  </button>
                </div>

              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyEvaluations;
