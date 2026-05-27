import React from 'react';
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
import './App.css';

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
  return (
    <Router>
      <div className="App">
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