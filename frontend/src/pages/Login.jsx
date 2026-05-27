import gehuLogo from '../assets/GEHU_LOGO.png';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './Login.css';

const Login = () => {
  const [userType, setUserType] = useState('student');
  const [formData, setFormData] = useState({
    rollNumber: '',
    username: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userType === 'student' && formData.rollNumber && formData.password) {
      // Call backend API for authentication
      try {
        const response = await fetch('http://localhost:8000/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rollNumber: formData.rollNumber,
            password: formData.password
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          localStorage.setItem('user', JSON.stringify({
            ...data.user,
            isLoggedIn: true,
            userType: data.user.role
          }));
          localStorage.setItem('token', data.token);
          navigate('/home');
        } else {
          alert(data.error || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }
    } else if (userType === 'admin' && formData.username && formData.password) {
      // Admin login
      try {
        const response = await fetch('http://localhost:8000/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rollNumber: formData.username,
            password: formData.password
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.user.role === 'admin') {
          localStorage.setItem('user', JSON.stringify({
            ...data.user,
            isLoggedIn: true,
            userType: 'admin'
          }));
          localStorage.setItem('token', data.token);
          navigate('/admin-dashboard');
        } else {
          alert(data.error || 'Admin login failed');
        }
      } catch (error) {
        console.error('Admin login error:', error);
        alert('Admin login failed. Please try again.');
      }
    }
  };



  return (
    <div className="login-container">
      <div className="login-content">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="brand-content">
            <img src={gehuLogo} alt="GEHU Logo" className="gehu-logo" />
            <h1>Welcome Back</h1>
            <p>Sign in to continue to your dashboard</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-container">
          <div className="login-form-card">
            {/* User Type Selector */}
            <div className="user-type-selector">
              <button 
                className={`type-btn ${userType === 'student' ? 'active' : ''}`}
                onClick={() => setUserType('student')}
              >
                <div className="type-icon student-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                  </svg>
                </div>
                <div>
                  <div className="type-title">Student / Faculty</div>
                  <div className="type-desc">Access your forms & submissions</div>
                </div>
              </button>
              
              <button 
                className={`type-btn ${userType === 'admin' ? 'active' : ''}`}
                onClick={() => setUserType('admin')}
              >
                <div className="type-icon admin-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                  </svg>
                </div>
                <div>
                  <div className="type-title">Administrator</div>
                  <div className="type-desc">Manage system settings</div>
                </div>
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="login-form">
              {userType === 'student' ? (
                <>
                  <p className="form-subtitle">
                    Use your Student ID as both username and password to login.
                  </p>
                  
                  <div className="form-group">
                    <input
                      type="text"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleChange}
                      placeholder="Enter your student ID (e.g., 230111589)"
                      title="Use your Student ID as both username and password"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  
                  <button type="submit" className="login-btn">
                    Sign in as Student
                  </button>
                  
                  <p className="security-note">
                    Secured with OAuth 2.0
                  </p>
                </>
              ) : (
                <>
                  <p className="form-subtitle">Protected admin access</p>
                  
                  <div className="form-group">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  
                  <button type="submit" className="login-btn admin-btn">
                    Sign in as Admin
                  </button>

                  <p className="security-note">
                    Secured with OAuth 2.0
                  </p>
                </>
              )}
            </form>
            
            {/* Demo Credentials */}
            {userType === 'student' && (
              <div className="demo-credentials" style={{ display: 'none' }}>
                <h4>Demo Login</h4>
                <p><strong>Roll:</strong> 2021BCS001</p>
                <p><strong>Pass:</strong> student123</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="login-footer">
            © 2026 TeamSync - Project-Based Learning Platform
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;