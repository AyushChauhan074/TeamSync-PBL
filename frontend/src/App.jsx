import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Projects from './pages/Projects';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import { io } from 'socket.io-client';
import './App.css';

const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const user = localStorage.getItem('user');
  if (!user) return <Navigate to="/login" />;
  
  let userData;
  try {
    userData = JSON.parse(user);
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return <Navigate to="/login" />;
  }
  if (adminOnly && userData.userType !== 'admin') {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Layout component to conditionally show Navbar
const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavbar = ['/login', '/register'].includes(location.pathname);
  
  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
      {!hideNavbar && (
        <a
          href="mailto:abhishekgiri1978@gmail.com?subject=Support Request&body=Hello, I need help with..."
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(243, 156, 18, 0.5)',
            cursor: 'pointer',
            zIndex: 1000,
            textDecoration: 'none',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Contact Support"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <circle cx="9" cy="10" r="0.5" fill="white"/>
            <circle cx="12" cy="10" r="0.5" fill="white"/>
            <circle cx="15" cy="10" r="0.5" fill="white"/>
          </svg>
        </a>
      )}
    </>
  );
};

function App() {
  const [maintenanceMode, setMaintenanceMode] = useState({ active: false, message: '' });

  useEffect(() => {
    const socket = io(socketUrl, {
      withCredentials: true
    });

    socket.on('maintenanceMode', (data) => {
      if (data && data.active) {
        setMaintenanceMode({ active: true, message: data.message || 'System is in maintenance mode' });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Router>
      <div className="App" style={maintenanceMode.active ? { pointerEvents: 'none', opacity: 0.7 } : {}}>
        {maintenanceMode.active && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
            background: '#e74c3c', color: 'white', padding: '1rem',
            textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem',
            pointerEvents: 'auto'
          }}>
            ⚠️ {maintenanceMode.message}
          </div>
        )}
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/login" />} />
            
            {/* Student/Faculty Routes */}
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/teams" element={
              <ProtectedRoute>
                <Teams />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;