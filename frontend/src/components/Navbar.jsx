import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gehuLogo from '../assets/GEHU_LOGO.png';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Don't show navbar for admin
  if (user && user.role === 'admin') {
    return null;
  }

  return (
    <>
      {/* Top Header - Light Green */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f9f0ff 0%, #f0f9f0ff 100%)',
        padding: '0.8rem 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
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
              height: '50px',
              width: 'auto'
            }}
          />
          {user && (
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
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <nav style={{
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '0',
        borderBottom: '1px solid #f3f4f6'
      }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px'
      }}>
        <Link to={user ? "/home" : "/"} style={{
          color: '#111827',
          textDecoration: 'none',
          fontSize: '1.5rem',
          fontWeight: '700',
          letterSpacing: '-0.5px'
        }}>
          TeamSync PBL
        </Link>
        
        {user ? (
          <>
            <ul style={{
              display: 'flex',
              listStyle: 'none',
              gap: '0.5rem',
              margin: 0,
              padding: 0,
              alignItems: 'center'
            }}>
              <li>
                <Link to="/home" style={{
                  color: window.location.pathname === '/home' ? '#111827' : '#6b7280',
                  textDecoration: 'none',
                  padding: '0.65rem 1.2rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: window.location.pathname === '/home' ? '600' : '500',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  background: window.location.pathname === '/home' ? '#f9fafb' : 'transparent'
                }}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/teams" style={{
                  color: window.location.pathname === '/teams' ? '#111827' : '#6b7280',
                  textDecoration: 'none',
                  padding: '0.65rem 1.2rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: window.location.pathname === '/teams' ? '600' : '500',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  background: window.location.pathname === '/teams' ? '#f9fafb' : 'transparent'
                }}>
                  My Teams
                </Link>
              </li>
              <li>
                <Link to="/projects" style={{
                  color: window.location.pathname === '/projects' ? '#111827' : '#6b7280',
                  textDecoration: 'none',
                  padding: '0.65rem 1.2rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: window.location.pathname === '/projects' ? '600' : '500',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  background: window.location.pathname === '/projects' ? '#f9fafb' : 'transparent'
                }}>
                  Projects
                </Link>
              </li>
            </ul>
            
            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  background: '#111827',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}
              >
                {user.name.split(' ').map(n => n[0]).join('')}
              </button>
              
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  right: '0',
                  background: 'white',
                  borderRadius: '10px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  padding: '1rem',
                  minWidth: '200px',
                  zIndex: 1000
                }}>
                  <div style={{ 
                    borderBottom: '1px solid #e9ecef', 
                    paddingBottom: '0.5rem', 
                    marginBottom: '0.5rem' 
                  }}>
                    <strong>{user.name}</strong>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                      {user.roll_number}
                    </p>
                  </div>
                  <Link 
                    to="/profile" 
                    style={{ 
                      display: 'block', 
                      padding: '0.5rem 0', 
                      textDecoration: 'none', 
                      color: '#333' 
                    }}
                    onClick={() => setShowProfileMenu(false)}
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      padding: '0.5rem 0',
                      width: '100%',
                      textAlign: 'left'
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <ul style={{
            display: 'flex',
            listStyle: 'none',
            margin: 0,
            padding: 0
          }}>
            <li>
              <Link to="/login" style={{
                color: '#111827',
                textDecoration: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                fontWeight: '500',
                border: '2px solid #111827'
              }}>
                Login
              </Link>
            </li>
          </ul>
        )}
      </div>
      </nav>
    </>
  );
};

export default Navbar;
