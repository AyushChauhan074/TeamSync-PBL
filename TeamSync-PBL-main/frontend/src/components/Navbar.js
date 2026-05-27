import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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
            src="/assets/HeaderLogo.png" 
            alt="TeamSync PBL" 
            style={{
              height: '50px',
              width: 'auto'
            }}
          />
          {user && (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                  letterSpacing: '0.5px'
                }}
              >
                {getInitials(user.name)}
              </button>
              
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '54px',
                  right: '0',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  padding: '0.75rem',
                  minWidth: '220px',
                  zIndex: 9999,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ 
                    borderBottom: '1px solid #f3f4f6', 
                    paddingBottom: '0.75rem', 
                    marginBottom: '0.5rem',
                    padding: '0.5rem'
                  }}>
                    <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>{user.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{user.roll_number}</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.25rem', textTransform: 'capitalize' }}>{user.role}</div>
                  </div>
                  <Link 
                    to="/profile" 
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 0.75rem', 
                      textDecoration: 'none', 
                      color: '#374151',
                      fontWeight: '500',
                      borderRadius: '8px',
                      transition: 'background 0.2s',
                      fontSize: '0.9rem'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      padding: '0.65rem 0.75rem',
                      width: '100%',
                      textAlign: 'left',
                      fontWeight: '500',
                      borderRadius: '8px',
                      transition: 'background 0.2s',
                      fontSize: '0.9rem'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
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
            

          </>
        ) : (
          <Link to="/login" style={{
            padding: '0.6rem 1.4rem',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '0.95rem',
            boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            transition: 'all 0.2s'
          }}>
            Login
          </Link>
        )}
      </div>
      </nav>
    </>
  );
};

export default Navbar;
