import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [isHovered, setIsHovered] = useState(false);
  const [students, setStudents] = useState([
    { id: 1, name: 'Abhishek Giri', rollNumber: '230111589', branch: 'CSE', year: '3rd', status: 'Active', email: '230111589@gehu.ac.in', cgpa: '8.7' },
    { id: 2, name: 'Deepali Chauhan', rollNumber: '230111588', branch: 'CSE', year: '3rd', status: 'Active', email: '230111588@gehu.ac.in', cgpa: '8.9' },
    { id: 3, name: 'Sidh Khurana', rollNumber: '230111587', branch: 'CSE', year: '3rd', status: 'Active', email: '230111587@gehu.ac.in', cgpa: '8.5' },
    { id: 4, name: 'Ayush Chauhan', rollNumber: '230111586', branch: 'CSE', year: '3rd', status: 'Active', email: '230111586@gehu.ac.in', cgpa: '8.3' },
    { id: 5, name: 'Abhay Kanojia', rollNumber: '230111585', branch: 'CSE', year: '3rd', status: 'Active', email: '230111585@gehu.ac.in', cgpa: '8.6' },
    { id: 6, name: 'Harsh Rawat', rollNumber: '230111584', branch: 'CSE', year: '3rd', status: 'Active', email: '230111584@gehu.ac.in', cgpa: '8.4' },
    { id: 7, name: 'Ayush Chamoli', rollNumber: '230111583', branch: 'CSE', year: '3rd', status: 'Active', email: '230111583@gehu.ac.in', cgpa: '8.2' },
    { id: 8, name: 'Ayush Bhatt', rollNumber: '230111582', branch: 'CSE', year: '3rd', status: 'Active', email: '230111582@gehu.ac.in', cgpa: '8.8' },
    { id: 9, name: 'Muskan Sharma', rollNumber: '230111581', branch: 'CSE', year: '3rd', status: 'Active', email: '230111581@gehu.ac.in', cgpa: '9.0' },
    { id: 10, name: 'Kashish Sharma', rollNumber: '230111580', branch: 'CSE', year: '3rd', status: 'Active', email: '230111580@gehu.ac.in', cgpa: '8.7' },
    { id: 11, name: 'Harsh Pal', rollNumber: '230111579', branch: 'CSE', year: '3rd', status: 'Active', email: '230111579@gehu.ac.in', cgpa: '8.1' },
    { id: 12, name: 'Sachin Bisht', rollNumber: '230111578', branch: 'CSE', year: '3rd', status: 'Active', email: '230111578@gehu.ac.in', cgpa: '8.5' }
  ]);
  const [faculty, setFaculty] = useState([
    { id: 1, name: 'Sushant Chamoli', empId: '234555999', department: 'CSE', designation: 'Professor', email: '234555999@gehu.ac.in', courses: 5 },
    { id: 2, name: 'Amit Gupta', empId: '234555998', department: 'CSE', designation: 'Associate Professor', email: '234555998@gehu.ac.in', courses: 4 },
    { id: 3, name: 'Ashok Kumar', empId: '234555997', department: 'CSE', designation: 'Senior Professor', email: '234555997@gehu.ac.in', courses: 6 }
  ]);
  const [teams, setTeams] = useState([
    { id: 1, name: 'AI Research Team', members: 4, project: 'Machine Learning Algorithms', status: 'Active', progress: 75 },
    { id: 2, name: 'Web Dev Squad', members: 3, project: 'E-Commerce Platform', status: 'Active', progress: 90 },
    { id: 3, name: 'Mobile Innovators', members: 5, project: 'Health Tracking App', status: 'Active', progress: 60 },
    { id: 4, name: 'Data Science Squad', members: 3, project: 'Analytics Dashboard', status: 'Active', progress: 45 }
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role === 'admin') {
        setUser(parsedUser);
      } else {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const deleteStudent = (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(s => s.id !== id));
      alert('Student deleted successfully');
    }
  };

  const deleteFaculty = (id) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      setFaculty(faculty.filter(f => f.id !== id));
      alert('Faculty deleted successfully');
    }
  };

  const deleteTeam = (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      setTeams(teams.filter(t => t.id !== id));
      alert('Team deleted successfully');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
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
            src="/assets/HeaderLogo.png" 
            alt="TeamSync PBL" 
            style={{
              height: '50px',
              width: 'auto'
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
            { key: 'analytics', label: 'Analytics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
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
          <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, color: '#2c3e50' }}>Student Management</h2>
              <button style={{ padding: '0.75rem 1.5rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Add New Student</button>
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
                    <td style={{ padding: '1rem' }}>{student.rollNumber}</td>
                    <td style={{ padding: '1rem' }}>{student.name}</td>
                    <td style={{ padding: '1rem' }}>{student.branch}</td>
                    <td style={{ padding: '1rem' }}>{student.year}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: '#27ae60', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem' }}>{student.status}</span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button style={{ padding: '0.5rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '0.5rem' }}>Edit</button>
                      <button onClick={() => deleteStudent(student.id)} style={{ padding: '0.5rem 1rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Faculty Section */}
        {activeSection === 'faculty' && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, color: '#2c3e50' }}>Faculty Management</h2>
              <button style={{ padding: '0.75rem 1.5rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Add New Faculty</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Employee ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Department</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Designation</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map(member => (
                  <tr key={member.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '1rem' }}>{member.empId}</td>
                    <td style={{ padding: '1rem' }}>{member.name}</td>
                    <td style={{ padding: '1rem' }}>{member.department}</td>
                    <td style={{ padding: '1rem' }}>{member.designation}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button style={{ padding: '0.5rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '0.5rem' }}>Edit</button>
                      <button onClick={() => deleteFaculty(member.id)} style={{ padding: '0.5rem 1rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Teams Section */}
        {activeSection === 'teams' && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, color: '#2c3e50' }}>Team Management</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {teams.map(team => (
                <div key={team.id} style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '10px', border: '1px solid #dee2e6' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>{team.name}</h3>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Project: {team.project}</p>
                  <p style={{ margin: '0 0 1rem 0', color: '#666' }}>Members: {team.members}</p>
                  <span style={{ background: '#27ae60', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem' }}>{team.status}</span>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button style={{ flex: 1, padding: '0.5rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>View</button>
                    <button onClick={() => deleteTeam(team.id)} style={{ flex: 1, padding: '0.5rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {activeSection === 'analytics' && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '2rem', color: '#2c3e50' }}>System Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h3 style={{ marginBottom: '1rem' }}>User Growth</h3>
                <div style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', color: '#3498db', marginBottom: '0.5rem' }}>↗</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' }}>+24%</div>
                  <div style={{ color: '#666' }}>This Month</div>
                </div>
              </div>
              <div>
                <h3 style={{ marginBottom: '1rem' }}>Active Projects</h3>
                <div style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', color: '#27ae60', marginBottom: '0.5rem' }}>✓</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' }}>156</div>
                  <div style={{ color: '#666' }}>In Progress</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '2rem', color: '#2c3e50' }}>System Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '10px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Email Notifications</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="checkbox" defaultChecked />
                  <span>Send email notifications to users</span>
                </label>
              </div>
              <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '10px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>System Maintenance</h3>
                <button style={{ padding: '0.75rem 1.5rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Enable Maintenance Mode</button>
              </div>
              <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '10px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Database Backup</h3>
                <button style={{ padding: '0.75rem 1.5rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Create Backup Now</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;