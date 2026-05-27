import React, { useState } from 'react';

const Projects = () => {
  const [projects] = useState([
    {
      id: 1,
      title: "Smart Campus Management System",
      description: "A comprehensive system for managing campus resources and student activities",
      team: "AI Research Team",
      phase: "Development",
      progress: 65,
      dueDate: "2024-03-15",
      githubRepo: "https://github.com/team/smart-campus"
    },
    {
      id: 2,
      title: "E-Learning Platform",
      description: "Interactive online learning platform with video streaming and assessments",
      team: "Web Development Squad",
      phase: "Design",
      progress: 30,
      dueDate: "2024-04-20",
      githubRepo: "https://github.com/team/e-learning"
    },
    {
      id: 3,
      title: "Health Monitoring App",
      description: "Mobile app for tracking health metrics and connecting with healthcare providers",
      team: "Mobile App Creators",
      phase: "Planning",
      progress: 15,
      dueDate: "2024-05-10",
      githubRepo: "https://github.com/team/health-app"
    }
  ]);

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'Planning': return '#ffc107';
      case 'Design': return '#17a2b8';
      case 'Development': return '#28a745';
      case 'Testing': return '#fd7e14';
      case 'Completed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        color: 'white',
        padding: '3rem 2.5rem',
        borderRadius: '20px',
        marginBottom: '2rem',
        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.3)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '2.2rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Projects</h1>
              <p style={{ margin: 0, fontSize: '1.05rem', opacity: 0.9 }}>Manage and track your team projects</p>
            </div>
          </div>
          <button 
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.3)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create New Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {projects.map((project) => {
          const phaseColors = {
            'Planning': { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
            'Design': { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
            'Development': { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
            'Testing': { bg: '#fed7aa', border: '#fdba74', text: '#9a3412' },
            'Completed': { bg: '#e5e7eb', border: '#d1d5db', text: '#374151' }
          };
          const phaseColor = phaseColors[project.phase] || phaseColors['Completed'];
          
          return (
          <div key={project.id} style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            {/* Card Body */}
            <div style={{ padding: '2rem' }}>
              {/* Title and Phase */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <h3 style={{ color: '#111827', margin: 0, fontSize: '1.3rem', fontWeight: '700', flex: 1, lineHeight: '1.3' }}>{project.title}</h3>
                <span style={{
                  background: phaseColor.bg,
                  color: phaseColor.text,
                  padding: '0.4rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  border: `1px solid ${phaseColor.border}`,
                  whiteSpace: 'nowrap',
                  marginLeft: '1rem'
                }}>
                  {project.phase}
                </span>
              </div>
              
              <p style={{ color: '#6b7280', margin: '0 0 1.5rem 0', fontSize: '0.95rem', lineHeight: '1.6' }}>{project.description}</p>
              
              {/* Team and Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '500' }}>Team</span>
                  </div>
                  <span style={{ color: '#111827', fontWeight: '600', fontSize: '0.95rem' }}>{project.team}</span>
                </div>
                <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '500' }}>Due Date</span>
                  </div>
                  <span style={{ color: '#111827', fontWeight: '600', fontSize: '0.95rem' }}>{new Date(project.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Progress */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#111827', fontWeight: '600', fontSize: '0.9rem' }}>Progress</span>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#3b82f6' }}>{project.progress}%</span>
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                  <div style={{
                    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                    height: '100%',
                    width: `${project.progress}%`,
                    transition: 'width 0.5s ease',
                    borderRadius: '10px'
                  }}></div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.9rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View Project
                </button>
                <button 
                  onClick={() => window.open(project.githubRepo, '_blank')}
                  style={{
                    background: '#f9fafb',
                    color: '#111827',
                    border: '2px solid #e5e7eb',
                    padding: '0.9rem 1.5rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#111827';
                    e.target.style.color = 'white';
                    e.target.style.borderColor = '#111827';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f9fafb';
                    e.target.style.color = '#111827';
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>
            </div>
          </div>
        )})}
      </div>

      {/* Project Statistics */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h3 style={{ color: '#111827', margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: '700' }}>Project Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '16px', border: '2px solid #bfdbfe', textAlign: 'center', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem' }}>12</div>
            <div style={{ color: '#6b7280', fontWeight: '600', fontSize: '0.95rem' }}>Total Projects</div>
          </div>
          <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', borderRadius: '16px', border: '2px solid #6ee7b7', textAlign: 'center', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem' }}>8</div>
            <div style={{ color: '#6b7280', fontWeight: '600', fontSize: '0.95rem' }}>Active Projects</div>
          </div>
          <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '16px', border: '2px solid #fcd34d', textAlign: 'center', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem' }}>3</div>
            <div style={{ color: '#6b7280', fontWeight: '600', fontSize: '0.95rem' }}>Completed</div>
          </div>
          <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', borderRadius: '16px', border: '2px solid #fca5a5', textAlign: 'center', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem' }}>1</div>
            <div style={{ color: '#6b7280', fontWeight: '600', fontSize: '0.95rem' }}>Overdue</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;