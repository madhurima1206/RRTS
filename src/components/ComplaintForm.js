import React, { useState } from 'react';
import axios from 'axios';
import './ComplaintForm.css';

const API_BASE_URL = 'http://localhost:5001/api';

const ComplaintForm = ({ user, role }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problemType: 'pothole',
    severity: 'medium',
    location: {
      area: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      landmark: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Predefined areas for selection
  const areas = [
    'Downtown',
    'Northside',
    'Southside', 
    'East End',
    'West Hills',
    'Central Business District',
    'Residential Zone A',
    'Residential Zone B',
    'Industrial Area',
    'Commercial District'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value
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
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/complaints`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('Complaint submitted successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        problemType: 'pothole',
        severity: 'medium',
        location: {
          area: '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          landmark: ''
        }
      });
      
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setMessage(error.response?.data?.message || 'Error submitting complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complaint-form-container">
      <form onSubmit={handleSubmit} className="complaint-form">
        <div className="form-section">
          <h3>Complaint Details</h3>
          
          <div className="form-group">
            <label>Complaint Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Brief description of the problem"
            />
          </div>

          <div className="form-group">
            <label>Problem Type *</label>
            <select
              name="problemType"
              value={formData.problemType}
              onChange={handleChange}
              required
            >
              <option value="pothole">Pothole</option>
              <option value="cracked_road">Cracked Road</option>
              <option value="flooding">Flooding</option>
              <option value="poor_drainage">Poor Drainage</option>
              <option value="sidewalk_issue">Sidewalk Issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Severity *</label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Detailed description of the road problem..."
              rows="4"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Location Details</h3>
          
          <div className="form-group">
            <label>Area *</label>
            <select
              name="location.area"
              value={formData.location.area}
              onChange={handleChange}
              required
            >
              <option value="">Select Area</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Street Address *</label>
            <input
              type="text"
              name="location.street"
              value={formData.location.street}
              onChange={handleChange}
              required
              placeholder="Street name and number"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                name="location.city"
                value={formData.location.city}
                onChange={handleChange}
                required
                placeholder="City"
              />
            </div>

            <div className="form-group">
              <label>State *</label>
              <input
                type="text"
                name="location.state"
                value={formData.location.state}
                onChange={handleChange}
                required
                placeholder="State"
              />
            </div>

            <div className="form-group">
              <label>ZIP Code *</label>
              <input
                type="text"
                name="location.zipCode"
                value={formData.location.zipCode}
                onChange={handleChange}
                required
                placeholder="ZIP Code"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Landmark (Optional)</label>
            <input
              type="text"
              name="location.landmark"
              value={formData.location.landmark}
              onChange={handleChange}
              placeholder="Nearby landmark for easy identification"
            />
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
    </div>
  );
};

export default ComplaintForm;