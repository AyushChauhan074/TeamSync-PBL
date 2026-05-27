import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    roll_number: '', name: '', email: '', password: '',
    confirmPassword: '', role: 'student', branch: '', year: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = formData;
      if (payload.year) payload.year = parseInt(payload.year);
      await register(payload);
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="card">
          <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
            Join TeamSync PBL
          </h2>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Roll Number *</label>
                <input name="roll_number" value={formData.roll_number} onChange={handleChange}
                  placeholder="e.g., 230111589" required />
              </div>
              <div className="form-group">
                <label>Full Name *</label>
                <input name="name" value={formData.name} onChange={handleChange}
                  placeholder="Your full name" required />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="your@gehu.ac.in" required />
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label>Role *</label>
                <select name="role" value={formData.role} onChange={handleChange} required>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
              <div className="form-group">
                <label>Branch</label>
                <input name="branch" value={formData.branch} onChange={handleChange}
                  placeholder="e.g., Computer Science" />
              </div>
            </div>

            {formData.role === 'student' && (
              <div className="form-group">
                <label>Year</label>
                <select name="year" value={formData.year} onChange={handleChange}>
                  <option value="">Select year</option>
                  {[1,2,3,4].map(y => <option key={y} value={y}>{y}{['st','nd','rd','th'][y-1]} Year</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-2">
              <div className="form-group">
                <label>Password *</label>
                <input type="password" name="password" value={formData.password}
                  onChange={handleChange} placeholder="Min 6 characters" required />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} placeholder="Repeat password" required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#666' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
