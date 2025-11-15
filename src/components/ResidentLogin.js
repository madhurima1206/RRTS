import React, { useState } from 'react';
import axios from 'axios';
import './ResidentLogin.css';

const API_BASE_URL = 'http://localhost:5001/api';

const ResidentLogin = ({ onLoginSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { 
            email: formData.email, 
            password: formData.password, 
            role: 'resident' 
          }
        : { 
            ...formData, 
            role: 'resident' 
          };

      console.log('Sending to:', `${API_BASE_URL}${endpoint}`);
      
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setMessage(isLogin ? 'Login successful!' : 'Registration successful!');
      
      setTimeout(() => {
        onLoginSuccess(response.data.user);
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      setMessage(
        error.response?.data?.message || 
        error.message || 
        'Network Error - Check if backend is running on port 5001'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resident-login-overlay">
      <div className="resident-login-container">
        <button className="back-btn" onClick={onBack}>← Back</button>
        
        <div className="login-header">
          <h2>{isLogin ? 'Resident Login' : 'Resident Registration'}</h2>
          <p>
            {isLogin 
              ? 'Login to submit and track road repair complaints' 
              : 'Create an account to report road issues in your area'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              
              
               

                 

                  
            </>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
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
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

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
  );
};

export default ResidentLogin;