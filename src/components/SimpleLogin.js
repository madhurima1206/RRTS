import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SimpleLogin.css';

const API_BASE_URL = 'http://localhost:5001/api';

const SimpleLogin = ({ onLoginSuccess, onBack, userRole }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  // Reset form when switching between login/register
  useEffect(() => {
    setFormData({
      name: '',
      email: '',
      password: ''
    });
    setMessage('');
  }, [isLogin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Check if it's demo credentials and backend might not be running
    const isDemoUser = formData.email === `${userRole.toLowerCase()}@example.com` && 
                      formData.password === 'password123';

    if (isDemoUser) {
      // Create mock user for demo
      const mockUser = {
        id: Date.now(),
        name: `${userRole} Demo User`,
        email: formData.email,
        role: userRole.toLowerCase(),
        token: 'demo-token-' + Date.now()
      };
      
      localStorage.setItem('token', mockUser.token);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      setMessage('Demo login successful!');
      
      setTimeout(() => {
        onLoginSuccess(mockUser);
      }, 1000);
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Login
        const payload = {
          email: formData.email,
          password: formData.password,
          role: userRole.toLowerCase()
        };

        console.log('Logging in as:', userRole);
        
        const response = await axios.post(`${API_BASE_URL}/auth/login`, payload);
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setMessage('Login successful!');
        
        setTimeout(() => {
          onLoginSuccess(response.data.user);
        }, 1000);
      } else {
        // Register
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: userRole.toLowerCase()
        };

        console.log('Registering as:', userRole);
        
        const response = await axios.post(`${API_BASE_URL}/auth/register`, payload);
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setMessage('Registration successful!');
        
        setTimeout(() => {
          onLoginSuccess(response.data.user);
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error:', error);
      
      // If backend is down or user not found, offer demo login
      if (error.code === 'ERR_NETWORK' || error.response?.status === 404) {
        setMessage(
          `Backend not available. ${isDemoUser ? 
            'Using demo mode.' : 
            'Try using demo credentials or check if backend is running.'}`
        );
      } else {
        setMessage(
          error.response?.data?.message || 
          error.message || 
          'Login failed. Try demo credentials or check backend.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const fillDemoCredentials = () => {
    setFormData({
      name: `${userRole} User`,
      email: `${userRole.toLowerCase()}@example.com`,
      password: 'password123'
    });
    setShowDemoCredentials(false);
  };

  // Auto-login for demo users if backend seems unavailable
  const handleQuickDemoLogin = () => {
    const mockUser = {
      id: Date.now(),
      name: `${userRole} Demo User`,
      email: `${userRole.toLowerCase()}@example.com`,
      role: userRole.toLowerCase(),
      token: 'demo-token-' + Date.now()
    };
    
    localStorage.setItem('token', mockUser.token);
    localStorage.setItem('user', JSON.stringify(mockUser));
    onLoginSuccess(mockUser);
  };

  return (
    <div className="simple-login-overlay">
      <div className="simple-login-container">
        {/* Back Button */}
        <div className="login-header-with-back">
          <button className="back-btn" onClick={handleBack}>
            ← Back
          </button>
          <h2>{isLogin ? `${userRole} Login` : `${userRole} Registration`}</h2>
        </div>

        <div className="login-content">
          <div className="login-info">
            <p>
              {isLogin 
                ? `Enter your credentials to access the ${userRole.toLowerCase()} dashboard` 
                : `Create a new ${userRole.toLowerCase()} account`
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder={`Enter your email`}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                minLength="6"
              />
            </div>

            {message && (
              <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? `Login as ${userRole}` : `Register as ${userRole}`)}
            </button>
          </form>

          {/* Demo Credentials Section */}
          {isLogin && (
            <div className="demo-section">
              <button 
                type="button"
                className="demo-toggle-btn"
                onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              >
                {showDemoCredentials ? 'Hide Demo Credentials' : 'Show Demo Credentials'}
              </button>

              {showDemoCredentials && (
                <div className="demo-credentials-popup">
                  <h4>Demo Credentials:</h4>
                  <p><strong>Email:</strong> {userRole.toLowerCase()}@example.com</p>
                  <p><strong>Password:</strong> password123</p>
                  <div className="demo-buttons">
                    <button 
                      className="fill-demo-btn"
                      onClick={fillDemoCredentials}
                    >
                      Fill Demo Credentials
                    </button>
                    <button 
                      className="quick-demo-btn"
                      onClick={handleQuickDemoLogin}
                    >
                      Quick Demo Login
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="toggle-section">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span 
                className="toggle-link"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Register here' : 'Login here'}
              </span>
            </p>
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;