import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import gehuLogo from '../assets/GEHU_LOGO.png';
import './AdminDashboard.css';


const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [isHovered, setIsHovered] = useState(false);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Student Form State
  const [studentFormMode, setStudentFormMode] = useState('view'); // 'view', 'add', 'edit'
  
  // Faculty Form State
  const [facultyFormMode, setFacultyFormMode] = useState('view');
  const [selectedFacultyId, setSelectedFacultyId] = useState(null);
  const [facultyFormData, setFacultyFormData] = useState({
    name: '', roll_number: '', email: '', password: '', 
    branch: 'Computer Science', designation: 'Assistant Professor'
  });
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentFormData, setStudentFormData] = useState({
    name: '', roll_number: '', email: '', password: '', 
    branch: 'Computer Science', year: '1', section: '', github_username: '', skills: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success', isFading: false });

  // Team Form State
  const [teamFormMode, setTeamFormMode] = useState('view');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamFormData, setTeamFormData] = useState({
    name: '', project: '', mentor_id: '', evaluator_id: ''
  });

  // System Settings State
  const [settings, setSettings] = useState({
    allow_email_alerts: true,
    maintenance_mode: false,
    active_term: 'B.Tech Even Semester 2026',
    evaluation_threshold: 3,
    min_team_size: 3,
    max_team_size: 4,
    github_sync_interval: 'daily',
    last_backup_time: null
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async (token) => {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [studentsRes, facultyRes, teamsRes] = await Promise.all([
          fetch(import.meta.env.VITE_API_URL + '/api/v1/admin/users?role=student', { headers }),
          fetch(import.meta.env.VITE_API_URL + '/api/v1/admin/users?role=faculty', { headers }),
          fetch(import.meta.env.VITE_API_URL + '/api/v1/admin/teams', { headers })
        ]);

        if (studentsRes.ok) {
          const data = await studentsRes.json();
          setStudents(data.users || []);
        } else {
          console.error('Failed to fetch students:', studentsRes.status);
          setStudents([]);
        }
        
        if (facultyRes.ok) {
          const data = await facultyRes.json();
          setFaculty(data.users || []);
        } else {
          console.error('Failed to fetch faculty:', facultyRes.status);
          setFaculty([]);
        }
        
        if (teamsRes.ok) {
          const data = await teamsRes.json();
          setTeams(data.teams || []);
        } else {
          console.error('Failed to fetch teams:', teamsRes.status);
          setTeams([]);
        }
      } catch (error) {
        console.error('Failed to fetch admin data', error);
      } finally {
        setLoading(false);
      }
    };

    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role === 'admin') {
        setUser(parsedUser);
        fetchAdminData(localStorage.getItem('token'));
        fetchSettingsData(); // Load system settings
      } else {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type, isFading: false });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isFading: true }));
      setTimeout(() => {
        setToast({ show: false, message: '', type: 'success', isFading: false });
      }, 400); // Matches CSS animation time
    }, 3000);
  };

  const openTeamEditMode = (team) => {
    setTeamFormMode('edit');
    setSelectedTeamId(team.id);
    setTeamFormData({
      name: team.name || '',
      project: team.project || '',
      mentor_id: team.mentor_id || '',
      evaluator_id: team.evaluator_id || ''
    });
    setFormErrors({});
  };

  const handleCloseTeamForm = () => {
    setTeamFormMode('view');
    setSelectedTeamId(null);
    setTeamFormData({ name: '', project: '', mentor_id: '', evaluator_id: '' });
    setFormErrors({});
  };

  const handleTeamFormChange = (e) => {
    setTeamFormData({ ...teamFormData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: null });
    }
  };

  const handleTeamFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!teamFormData.mentor_id) errors.mentor_id = 'Mentor is required';
    if (!teamFormData.evaluator_id) errors.evaluator_id = 'Evaluator is required';
    if (teamFormData.mentor_id && teamFormData.mentor_id === teamFormData.evaluator_id) {
      errors.evaluator_id = 'Mentor and Evaluator cannot be the same person';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/v1/admin/teams/${selectedTeamId}/allocate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          mentorId: teamFormData.mentor_id,
          evaluatorId: teamFormData.evaluator_id
        })
      });

      const mentor = faculty.find(f => f.id == teamFormData.mentor_id);
      const evaluator = faculty.find(f => f.id == teamFormData.evaluator_id);

      if (response.ok) {
        setTeams(teams.map(t => {
          if (t.id === selectedTeamId) {
            return {
              ...t,
              mentor_id: teamFormData.mentor_id,
              evaluator_id: teamFormData.evaluator_id,
              mentor_name: mentor ? mentor.name : '',
              evaluator_name: evaluator ? evaluator.name : ''
            };
          }
          return t;
        }));
        
        showToast(`Team assigned successfully: Mentor ${mentor?.name} & Evaluator ${evaluator?.name} linked.`, 'success');
        handleCloseTeamForm();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to allocate team', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error: Failed to update database', 'error');
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    // Identify user name for toast
    let userName = 'User';
    const student = students.find(s => s.id === id);
    if (student) userName = student.name;
    else {
      const fac = faculty.find(f => f.id === id);
      if (fac) userName = fac.name;
    }

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/v1/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      if (response.ok) {
        const { user: updatedUser } = await response.json();
        setStudents(students.map(s => s.id === id ? { ...s, is_active: updatedUser.is_active } : s));
        setFaculty(faculty.map(f => f.id === id ? { ...f, is_active: updatedUser.is_active } : f));
        showToast(`${userName} is now ${currentStatus ? 'inactive' : 'active'}.`, 'success');
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error("Error updating user status", error);
      showToast('Network error: Failed to update database', 'error');
    }
  };

  const openAddMode = () => {
    setStudentFormData({
      name: '', roll_number: '', email: '', password: '', 
      branch: 'Computer Science', year: '1', section: '', github_username: '', skills: ''
    });
    setFormErrors({});
    setSelectedStudentId(null);
    setStudentFormMode('add');
  };

  const openEditMode = (student) => {
    console.log("Opening edit mode for:", student);
    setStudentFormData({
      name: student?.name || '',
      roll_number: student?.roll_number || '',
      email: student?.email || '',
      password: '', // never prefill password
      branch: student?.branch || 'Computer Science',
      year: student?.year ? student.year.toString() : '1',
      section: student?.section || '',
      github_username: student?.github_username || '',
      skills: Array.isArray(student?.skills) ? student.skills.join(', ') : (student?.skills || '')
    });
    setFormErrors({});
    setSelectedStudentId(student?.id);
    setStudentFormMode('edit');
  };

  const handleCloseForm = () => {
    setStudentFormMode('view');
  };

  const handleStudentFormChange = (e) => {
    const { name, value } = e.target;
    setStudentFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStudentFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!studentFormData.name) errors.name = 'Name is required';
    if (!studentFormData.roll_number) errors.roll_number = 'Roll Number is required';
    if (!studentFormData.email || !studentFormData.email.includes('@')) errors.email = 'Valid email is required';
    if (studentFormMode === 'add' && !studentFormData.password) errors.password = 'Password is required for new students';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const url = studentFormMode === 'add' 
        ? import.meta.env.VITE_API_URL + '/api/v1/admin/students'
        : import.meta.env.VITE_API_URL + `/api/v1/admin/students/${selectedStudentId}`;
        
      const method = studentFormMode === 'add' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(studentFormData)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedStudent = data.user || {
          id: studentFormMode === 'add' ? Date.now() : selectedStudentId,
          ...studentFormData,
          year: parseInt(studentFormData.year),
          is_active: true
        };
        
        if (studentFormMode === 'add') {
          setStudents([...students, updatedStudent]);
        } else {
          setStudents(students.map(s => s.id === selectedStudentId ? { ...s, ...updatedStudent } : s));
        }
        showToast(`Student ${studentFormData.name} ${studentFormMode === 'add' ? 'created' : 'updated'} successfully.`, 'success');
        handleCloseForm();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || `Failed to ${studentFormMode === 'add' ? 'create' : 'update'} student`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error: Failed to update database', 'error');
    }
  };

  const openFacultyAddMode = () => {
    setFacultyFormData({
      name: '', roll_number: '', email: '', password: '', 
      branch: 'Computer Science', designation: 'Assistant Professor'
    });
    setFormErrors({});
    setSelectedFacultyId(null);
    setFacultyFormMode('add');
  };

  const openFacultyEditMode = (member) => {
    setFacultyFormData({
      name: member?.name || '',
      roll_number: member?.roll_number || '',
      email: member?.email || '',
      password: '',
      branch: member?.branch || 'Computer Science',
      designation: member?.designation || 'Assistant Professor'
    });
    setFormErrors({});
    setSelectedFacultyId(member?.id);
    setFacultyFormMode('edit');
  };

  const handleCloseFacultyForm = () => {
    setFacultyFormMode('view');
  };

  const handleFacultyFormChange = (e) => {
    const { name, value } = e.target;
    setFacultyFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFacultyFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!facultyFormData.name) errors.name = 'Name is required';
    if (!facultyFormData.roll_number) errors.roll_number = 'Employee ID is required';
    if (!facultyFormData.email || !facultyFormData.email.includes('@')) errors.email = 'Valid email is required';
    if (facultyFormMode === 'add' && !facultyFormData.password) errors.password = 'Password is required for new faculty';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const url = facultyFormMode === 'add' 
        ? import.meta.env.VITE_API_URL + '/api/v1/admin/faculty'
        : import.meta.env.VITE_API_URL + `/api/v1/admin/faculty/${selectedFacultyId}`;
        
      const method = facultyFormMode === 'add' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(facultyFormData)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedFaculty = data.faculty || data.user || {
          id: facultyFormMode === 'add' ? Date.now() : selectedFacultyId,
          ...facultyFormData,
          is_active: true
        };
        
        if (facultyFormMode === 'add') {
          setFaculty([...faculty, updatedFaculty]);
        } else {
          setFaculty(faculty.map(f => f.id === selectedFacultyId ? { ...f, ...updatedFaculty } : f));
        }
        showToast(`Faculty ${facultyFormData.name} ${facultyFormMode === 'add' ? 'created' : 'updated'} successfully.`, 'success');
        handleCloseFacultyForm();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || `Failed to ${facultyFormMode === 'add' ? 'create' : 'update'} faculty`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error: Failed to update database', 'error');
    }
  };

  const deleteTeam = async (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        const response = await fetch(import.meta.env.VITE_API_URL + `/api/v1/admin/teams/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          setTeams(teams.filter(t => t.id !== id));
          alert('Team deleted successfully');
        } else {
          alert('Failed to delete team');
        }
      } catch (error) {
        console.error("Error deleting team", error);
        alert('An error occurred');
      }
    }
  };

  const fetchSettingsData = async () => {
    try {
      setSettingsLoading(true);
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/admin/settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    // Optimistic update
    const previousSettings = { ...settings };
    setSettings({ ...settings, [key]: value });

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ [key]: value })
      });

      if (!response.ok) {
        throw new Error('Failed to save setting');
      }
      
      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      showToast('Setting updated successfully', 'success');
      
      // If maintenance mode was toggled, broadcast to connected sockets
      if (key === 'maintenance_mode' && value === true) {
        const socket = io(socketUrl, { withCredentials: true });
        socket.emit('triggerMaintenance', { role: 'admin' });
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      setSettings(previousSettings); // Revert on failure
      showToast('Failed to update setting', 'error');
    }
  };

  const handleMaintenanceMode = () => {
    const isCurrentlyActive = settings.maintenance_mode;
    if (isCurrentlyActive) {
      if (window.confirm("Are you sure you want to disable maintenance mode? Students and faculty will regain access.")) {
        handleSettingChange('maintenance_mode', false);
      }
    } else {
      if (window.confirm("Are you sure you want to enable global maintenance mode? This will lock out all non-admin users immediately.")) {
        handleSettingChange('maintenance_mode', true);
      }
    }
  };

  const handleBackup = async () => {
    try {
      showToast('Initiating database backup...', 'success');
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/admin/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...settings, last_backup_time: data.timestamp });
        showToast('Database backup completed successfully', 'success');
      } else {
        showToast('Failed to initiate backup', 'error');
      }
    } catch (error) {
      console.error('Backup error:', error);
      showToast('An error occurred during backup request.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user || loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem', color: '#1e3a8a' }}>Loading System Data...</div>;

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Toast Notification */}
      {toast.show && (
        <div className={`admin-toast ${toast.type} ${toast.isFading ? 'fade-out' : ''}`}>
          {toast.type === 'success' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f9f0ff 0%, #f0f9f0ff 100%)',
        padding: '0.8rem 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <img 
            src={gehuLogo} 
            alt="TeamSync PBL" 
            style={{
              height: '80px',
              width: 'auto',
              marginLeft: '1rem'
            }}
          />
          <button
            onClick={handleLogout}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              background: isHovered ? '#f5f5f5' : 'transparent',
              color: '#333',
              border: '2px solid #555',
              padding: '0.5rem 1.2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginRight: '50px',
              transition: 'all 0.3s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Professional Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        padding: '3rem 2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
        
        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
            <div>
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '700' }}>Admin Control Panel</h1>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>Welcome back, {user.name} | Manage TeamSync PBL System</p>
            </div>
            <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.2)', padding: '1.5rem 2rem', borderRadius: '15px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>Last Login</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.25rem' }}>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-container">
        <nav className="admin-nav">
          {[
            { key: 'overview', label: 'Overview', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
            { key: 'students', label: 'Students', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
            { key: 'faculty', label: 'Faculty', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            { key: 'teams', label: 'Teams', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            { key: 'settings', label: 'Settings', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/></svg> }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`nav-btn ${activeSection === key ? 'active' : ''}`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div>
            {/* Stats Grid */}
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon students">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>{students.length}</h3>
                  <p>Total Students</p>
                  <span className="stat-change positive">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="18 15 12 9 6 15"/>
                    </svg>
                    12% from last month
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon faculty">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>{faculty.length}</h3>
                  <p>Faculty Members</p>
                  <span className="stat-change positive">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="18 15 12 9 6 15"/>
                    </svg>
                    1 new this month
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon teams">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>{teams.length}</h3>
                  <p>Active Teams</p>
                  <span className="stat-change positive">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="18 15 12 9 6 15"/>
                    </svg>
                    2 new teams
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon projects">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>24</h3>
                  <p>Total Projects</p>
                  <span className="stat-change positive">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="18 15 12 9 6 15"/>
                    </svg>
                    8 active projects
                  </span>
                </div>
              </div>
            </section>

            {/* Content Grid */}
            <section className="content-grid">
              {/* Recent Activities */}
              <div className="content-card">
                <div className="card-header">
                  <h2>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    Recent Activities
                  </h2>
                  <button className="btn-secondary">View All</button>
                </div>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon student">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <line x1="20" y1="8" x2="20" y2="14"/>
                        <line x1="23" y1="11" x2="17" y2="11"/>
                      </svg>
                    </div>
                    <div className="activity-content">
                      <h4>New Student Registered</h4>
                      <p>Abhishek Giri (230111589) joined CSE department</p>
                      <span className="activity-time">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        2 hours ago
                      </span>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon team">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <div className="activity-content">
                      <h4>Team Created</h4>
                      <p>AI Research Team formed with 4 members</p>
                      <span className="activity-time">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        5 hours ago
                      </span>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon project">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <div className="activity-content">
                      <h4>Project Submitted</h4>
                      <p>Web Dev Squad completed E-Commerce Platform project</p>
                      <span className="activity-time">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        1 day ago
                      </span>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon faculty">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div className="activity-content">
                      <h4>Faculty Added</h4>
                      <p>Prof. Ashok Kumar joined as Senior Professor</p>
                      <span className="activity-time">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        2 days ago
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="content-card">
                <div className="card-header">
                  <h2>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    System Health
                  </h2>
                  <div className="status-indicator online">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                    <span>All Systems Operational</span>
                  </div>
                </div>
                <div className="health-metrics">
                  <div className="metric-item">
                    <div className="metric-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                        <line x1="6" y1="6" x2="6.01" y2="6"/>
                        <line x1="6" y1="18" x2="6.01" y2="18"/>
                      </svg>
                      <span>Server Status</span>
                      <div className="status-dot online"></div>
                    </div>
                    <div className="metric-details">
                      <p>Uptime: 99.8% | Response: 45ms</p>
                    </div>
                  </div>

                  <div className="metric-item">
                    <div className="metric-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <ellipse cx="12" cy="5" rx="9" ry="3"/>
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                      </svg>
                      <span>Database</span>
                      <div className="status-dot healthy"></div>
                    </div>
                    <div className="metric-details">
                      <p>Connections: 24/100 | Storage: 2.4GB/10GB</p>
                    </div>
                  </div>

                  <div className="metric-item">
                    <div className="metric-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      <span>API Response</span>
                      <div className="status-dot fast"></div>
                    </div>
                    <div className="metric-details">
                      <p>Avg Response: 120ms | Requests: 1.2K/hour</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Students Section */}
        {activeSection === 'students' && (
          <div className="students-split-layout">
            <div className={`student-table-container ${studentFormMode !== 'view' ? 'split-width' : 'full-width'}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>Student Management</h2>
                <button onClick={openAddMode} style={{ padding: '0.75rem 1.5rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Add New Student</button>
              </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Roll Number</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Branch</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Year</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '1rem' }}>{student.roll_number}</td>
                    <td style={{ padding: '1rem' }}>{student.name}</td>
                    <td style={{ padding: '1rem' }}>{student.branch || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>{student.year || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: student.is_active ? '#27ae60' : '#e74c3c', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={() => openEditMode(student)} style={{ padding: '0.5rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Edit
                      </button>
                      <button onClick={() => toggleUserStatus(student.id, student.is_active)} style={{ padding: '0.5rem 1rem', background: student.is_active ? '#e74c3c' : '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        {student.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Inline Student Form Side Panel */}
            {studentFormMode !== 'view' && (
              <div className="student-side-panel">
                <h3>{studentFormMode === 'add' ? 'Add New Student' : 'Edit Student'}</h3>
                <form onSubmit={handleStudentFormSubmit}>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="name" value={studentFormData.name || ''} onChange={handleStudentFormChange} className="glass-input" placeholder="e.g. John Doe" />
                    {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>GEHU Roll Number *</label>
                    <input type="text" name="roll_number" value={studentFormData.roll_number || ''} onChange={handleStudentFormChange} className="glass-input" placeholder="e.g. 230111000" />
                    {formErrors.roll_number && <span className="error-text">{formErrors.roll_number}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>University Email *</label>
                    <input type="email" name="email" value={studentFormData.email || ''} onChange={handleStudentFormChange} className="glass-input" placeholder="e.g. student@gehu.ac.in" />
                    {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                  </div>
                  
                  {studentFormMode === 'add' && (
                    <div className="form-group">
                      <label>Password *</label>
                      <input type="password" name="password" value={studentFormData.password} onChange={handleStudentFormChange} className="glass-input" placeholder="Min 6 characters" />
                      {formErrors.password && <span className="error-text">{formErrors.password}</span>}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Branch / Course</label>
                    <select name="branch" value={studentFormData.branch} onChange={handleStudentFormChange} className="glass-input">
                      <option value="Computer Science">B.Tech CSE</option>
                      <option value="Mechanical Engineering">B.Tech ME</option>
                      <option value="Civil Engineering">B.Tech CE</option>
                      <option value="Electronics">B.Tech ECE</option>
                      <option value="BCA">BCA</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Year</label>
                      <select name="year" value={studentFormData.year} onChange={handleStudentFormChange} className="glass-input">
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Section</label>
                      <input type="text" name="section" value={studentFormData.section} onChange={handleStudentFormChange} className="glass-input" placeholder="e.g. A" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>GitHub Username</label>
                    <input type="text" name="github_username" value={studentFormData.github_username} onChange={handleStudentFormChange} className="glass-input" placeholder="e.g. johndoe99" />
                  </div>

                  <div className="form-group">
                    <label>Core Technical Skills</label>
                    <input type="text" name="skills" value={studentFormData.skills} onChange={handleStudentFormChange} className="glass-input" placeholder="e.g. React, Node.js, Python" />
                  </div>

                  <div className="panel-actions">
                    <button type="button" onClick={handleCloseForm} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">{studentFormMode === 'add' ? 'Create Student' : 'Save Changes'}</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Faculty Section */}
        {activeSection === 'faculty' && (
          <div className="students-split-layout">
            <div className={`student-table-container ${facultyFormMode !== 'view' ? 'split-width' : 'full-width'}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>Faculty Management</h2>
                <button onClick={openFacultyAddMode} style={{ padding: '0.75rem 1.5rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Add New Faculty</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Employee ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Department</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Designation</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.map(member => (
                    <tr key={member.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '1rem' }}>{member.roll_number}</td>
                      <td style={{ padding: '1rem' }}>{member.name}</td>
                      <td style={{ padding: '1rem' }}>{member.branch || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{member.designation || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ background: member.is_active ? '#27ae60' : '#e74c3c', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => openFacultyEditMode(member)} style={{ padding: '0.5rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => toggleUserStatus(member.id, member.is_active)} style={{ padding: '0.5rem 1rem', background: member.is_active ? '#e74c3c' : '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                          {member.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inline Faculty Form Side Panel */}
            {facultyFormMode !== 'view' && (
              <div className="student-side-panel">
                <h3>{facultyFormMode === 'add' ? 'Add New Faculty' : 'Edit Faculty'}</h3>
                <form onSubmit={handleFacultyFormSubmit}>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="name" value={facultyFormData.name || ''} onChange={handleFacultyFormChange} className="glass-input" placeholder="e.g. Amit Gupta" />
                    {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Employee ID *</label>
                    <input type="text" name="roll_number" value={facultyFormData.roll_number || ''} onChange={handleFacultyFormChange} className="glass-input" placeholder="e.g. 234555000" />
                    {formErrors.roll_number && <span className="error-text">{formErrors.roll_number}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Institutional Email *</label>
                    <input type="email" name="email" value={facultyFormData.email || ''} onChange={handleFacultyFormChange} className="glass-input" placeholder="e.g. faculty@gehu.ac.in" />
                    {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                  </div>
                  
                  {facultyFormMode === 'add' && (
                    <div className="form-group">
                      <label>Password *</label>
                      <input type="password" name="password" value={facultyFormData.password} onChange={handleFacultyFormChange} className="glass-input" placeholder="Min 6 characters" />
                      {formErrors.password && <span className="error-text">{formErrors.password}</span>}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Department</label>
                    <select name="branch" value={facultyFormData.branch} onChange={handleFacultyFormChange} className="glass-input">
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Electronics">Electronics</option>
                      <option value="BCA">BCA</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Designation</label>
                    <select name="designation" value={facultyFormData.designation} onChange={handleFacultyFormChange} className="glass-input">
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="HOD">Head of Department</option>
                    </select>
                  </div>

                  <div className="panel-actions">
                    <button type="button" onClick={handleCloseFacultyForm} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">{facultyFormMode === 'add' ? 'Create Faculty' : 'Save Changes'}</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Teams Section */}
        {activeSection === 'teams' && (
          <div className={`students-split-layout ${teamFormMode !== 'view' ? 'split-width' : ''}`}>
            <div className="student-table-container" style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>Teams Management</h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Team ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Team Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Project Title</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Mentor</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Evaluator</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Members</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => (
                    <tr key={team.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '1rem' }}>{team.id}</td>
                      <td style={{ padding: '1rem' }}>{team.name}</td>
                      <td style={{ padding: '1rem' }}>{team.project || 'N/A'}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {team.mentor_name ? (
                          <span style={{ background: '#20c997', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '15px', fontSize: '0.85rem' }}>{team.mentor_name}</span>
                        ) : (
                          <span style={{ background: 'rgba(52, 152, 219, 0.2)', color: '#3498db', padding: '0.4rem 0.8rem', borderRadius: '15px', fontSize: '0.85rem', backdropFilter: 'blur(4px)' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {team.evaluator_name ? (
                          <span style={{ background: '#9b59b6', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '15px', fontSize: '0.85rem' }}>{team.evaluator_name}</span>
                        ) : (
                          <span style={{ background: 'rgba(155, 89, 182, 0.2)', color: '#9b59b6', padding: '0.4rem 0.8rem', borderRadius: '15px', fontSize: '0.85rem', backdropFilter: 'blur(4px)' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>{team.members}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => openTeamEditMode(team)} style={{ padding: '0.5rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => deleteTeam(team.id)} style={{ padding: '0.5rem 1rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inline Team Form Side Panel */}
            {teamFormMode !== 'view' && (
              <div className="student-side-panel">
                <h3>{teamFormMode === 'add' ? 'Add New Team' : 'Add/Edit Team Allocation'}</h3>
                <form onSubmit={handleTeamFormSubmit}>
                  <div className="form-group">
                    <label>Team Name</label>
                    <input type="text" name="name" value={teamFormData.name} onChange={handleTeamFormChange} className="glass-input" disabled />
                  </div>
                  <div className="form-group">
                    <label>Project Title</label>
                    <select name="project" value={teamFormData.project} onChange={handleTeamFormChange} className="glass-input" disabled>
                      <option value={teamFormData.project}>{teamFormData.project || 'No Project Assigned'}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assigned Mentor</label>
                    <select name="mentor_id" value={teamFormData.mentor_id || ''} onChange={handleTeamFormChange} className="glass-input">
                      <option value="">Select Mentor...</option>
                      {faculty.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    {formErrors.mentor_id && <span className="error-text">{formErrors.mentor_id}</span>}
                  </div>
                  <div className="form-group">
                    <label>Assigned Evaluator</label>
                    <select name="evaluator_id" value={teamFormData.evaluator_id || ''} onChange={handleTeamFormChange} className="glass-input">
                      <option value="">Select Evaluator...</option>
                      {faculty.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    {formErrors.evaluator_id && <span className="error-text">{formErrors.evaluator_id}</span>}
                  </div>
                  <div className="panel-actions">
                    <button type="button" onClick={handleCloseTeamForm} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Confirm Allocation</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}



        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="settings-container" style={{ position: 'relative' }}>
            <h2 style={{ marginBottom: '2rem', color: '#1f2937', fontSize: '1.75rem', fontWeight: '800' }}>System Settings</h2>
            
            {settingsLoading && (
              <div style={{ position: 'absolute', top: 0, right: 0, color: '#3b82f6', fontWeight: '600' }}>Loading...</div>
            )}

            <div className="settings-grid">
              {/* COLUMN 1 */}
              <div className="settings-column">
                
                {/* Card 1: App Toggles */}
                <div className="settings-card">
                  <h3 className="settings-card-title">Application Toggles & Automation</h3>
                  <p className="settings-card-subtitle">Manage global system behaviors</p>
                  
                  <div className="setting-row">
                    <div className="setting-label-group">
                      <h4 className="setting-label">Email Notifications Master Toggle</h4>
                      <p className="setting-description">Allow system to dispatch automated mailers to students and faculty regarding project approvals, team formations, and grading deadlines.</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={settings.allow_email_alerts} 
                        onChange={(e) => handleSettingChange('allow_email_alerts', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <hr className="settings-card-divider" />

                  <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div className="setting-label-group" style={{ marginBottom: '1rem' }}>
                      <h4 className="setting-label">System Maintenance Mode</h4>
                      <p className="setting-description">Block authentication routes for non-admin accounts. Safe redirection to maintenance landing page.</p>
                    </div>
                    <button 
                      onClick={handleMaintenanceMode} 
                      className={`maintenance-btn ${settings.maintenance_mode ? 'active' : 'inactive'}`}
                    >
                      {settings.maintenance_mode ? 'System Under Maintenance (Click to Disable)' : 'Enable Maintenance Mode'}
                    </button>
                  </div>
                </div>

                {/* Card 2: Academic Params */}
                <div className="settings-card">
                  <h3 className="settings-card-title">Global Academic Parameters</h3>
                  <p className="settings-card-subtitle">Configure institutional boundaries and constraints</p>
                  
                  <div className="settings-form-group">
                    <label className="settings-form-label">Active Term Bounds</label>
                    <select 
                      className="settings-select"
                      value={settings.active_term}
                      onChange={(e) => handleSettingChange('active_term', e.target.value)}
                    >
                      <option value="B.Tech Odd Semester 2025">B.Tech Odd Semester 2025</option>
                      <option value="B.Tech Even Semester 2026">B.Tech Even Semester 2026</option>
                      <option value="MCA Odd Semester 2026">MCA Odd Semester 2026</option>
                      <option value="Summer Term 2026">Summer Term 2026</option>
                    </select>
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label">Milestone Evaluation Threshold</label>
                    <input 
                      type="number" 
                      className="settings-input"
                      value={settings.evaluation_threshold}
                      onChange={(e) => handleSettingChange('evaluation_threshold', parseInt(e.target.value))}
                      min="1" max="10"
                    />
                    <p className="setting-description" style={{ marginTop: '0.5rem' }}>Defines the physical project presentation deadline count.</p>
                  </div>

                  <div className="settings-inline-group">
                    <div className="settings-form-group">
                      <label className="settings-form-label">Min Headcount</label>
                      <input 
                        type="number" 
                        className="settings-input"
                        value={settings.min_team_size}
                        onChange={(e) => handleSettingChange('min_team_size', parseInt(e.target.value))}
                        min="1" max="10"
                      />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-form-label">Max Headcount</label>
                      <input 
                        type="number" 
                        className="settings-input"
                        value={settings.max_team_size}
                        onChange={(e) => handleSettingChange('max_team_size', parseInt(e.target.value))}
                        min="2" max="15"
                      />
                    </div>
                  </div>
                  <p className="setting-description" style={{ marginTop: '0.5rem', marginBottom: '1.25rem' }}>Group formation rules for student rosters.</p>

                  <div className="settings-form-group" style={{ marginBottom: 0 }}>
                    <label className="settings-form-label">GitHub Metadata Sync Interval</label>
                    <select 
                      className="settings-select"
                      value={settings.github_sync_interval}
                      onChange={(e) => handleSettingChange('github_sync_interval', e.target.value)}
                    >
                      <option value="every_6_hours">Every 6 Hours</option>
                      <option value="every_12_hours">Every 12 Hours</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* COLUMN 2 */}
              <div className="settings-column">
                
                {/* Card 3: Danger Zone */}
                <div className="settings-card danger-zone">
                  <h3 className="settings-card-title">Danger Zone Utilities</h3>
                  <p className="settings-card-subtitle">Critical system operations</p>
                  
                  <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div className="setting-label-group" style={{ marginBottom: '1.25rem' }}>
                      <h4 className="setting-label">Manual Database Backup</h4>
                      <p className="setting-description">Fires an immediate, synchronous request to snapshot all current PostgreSQL table architectures and data rows.</p>
                    </div>
                    
                    <button onClick={handleBackup} className="backup-btn">
                      Create Backup Now
                    </button>
                    {settings.last_backup_time && (
                      <span className="backup-timestamp">
                        Last Backup Run: {new Date(settings.last_backup_time).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;