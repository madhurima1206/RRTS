import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ResidentDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const ResidentDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('new-complaint');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    problemType: 'potholes',
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

  // Helper function to format location
  const formatLocation = (location) => {
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location !== null) {
      return `${location.street}, ${location.area}, ${location.city}, ${location.state} ${location.zipCode}`;
    }
    return 'Unknown Location';
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // FIXED: Fetch only this resident's complaints
  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/complaints/my-complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      // If the specific endpoint doesn't exist, try to filter from all complaints
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/complaints`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filter complaints to show only this resident's complaints
        const myComplaints = response.data.filter(complaint => complaint.residentId === user.id);
        setComplaints(myComplaints);
      } catch (fallbackError) {
        console.error('Error fetching all complaints:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/complaints`, {
        ...newComplaint,
        residentId: user.id,
        status: 'pending'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Reset form
      setNewComplaint({
        title: '',
        description: '',
        problemType: 'potholes',
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
      
      // Refresh complaints list
      await fetchComplaints();
      setActiveTab('my-complaints');
      alert('Complaint submitted successfully!');
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Error submitting complaint: ' + (error.response?.data?.message || error.message));
    }
  };

  const getComplaintStats = () => {
    return {
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      underReview: complaints.filter(c => c.status === 'under_review').length,
      assigned: complaints.filter(c => c.status === 'assigned').length,
      completed: complaints.filter(c => c.status === 'completed').length,
    };
  };

  const complaintStats = getComplaintStats();

  if (loading) {
    return (
      <div className="resident-dashboard">
        <div className="dashboard-header">
          <div className="container">
            <h1>Resident Dashboard</h1>
            <p>Welcome, {user.name}</p>
          </div>
        </div>
        <div className="loading">Loading your complaints...</div>
      </div>
    );
  }

  return (
    <div className="resident-dashboard">
      <div className="dashboard-header">
        <div className="container">
          <h1>Resident Dashboard</h1>
          <p>Welcome, {user.name}</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="container">
          {/* Statistics Summary */}
          <div className="stats-summary">
            <div className="stat-card">
              <h3>Total Complaints</h3>
              <div className="stat-number">{complaintStats.total}</div>
            </div>
            <div className="stat-card">
              <h3>Pending</h3>
              <div className="stat-number">{complaintStats.pending}</div>
            </div>
            <div className="stat-card">
              <h3>In Progress</h3>
              <div className="stat-number">{complaintStats.underReview + complaintStats.assigned}</div>
            </div>
            <div className="stat-card">
              <h3>Completed</h3>
              <div className="stat-number">{complaintStats.completed}</div>
            </div>
          </div>

          <div className="dashboard-tabs">
            <button 
              className={`tab-btn ${activeTab === 'new-complaint' ? 'active' : ''}`}
              onClick={() => setActiveTab('new-complaint')}
            >
              Submit New Complaint
            </button>
            <button 
              className={`tab-btn ${activeTab === 'my-complaints' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-complaints')}
            >
              My Complaints ({complaints.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({complaintStats.pending})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'in-progress' ? 'active' : ''}`}
              onClick={() => setActiveTab('in-progress')}
            >
              In Progress ({complaintStats.underReview + complaintStats.assigned})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed ({complaintStats.completed})
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'new-complaint' && (
              <div className="new-complaint-section">
                <h2>Submit New Road Complaint</h2>
                <form onSubmit={submitComplaint} className="complaint-form">
                  <div className="form-group">
                    <label>Complaint Title *</label>
                    <input
                      type="text"
                      value={newComplaint.title}
                      onChange={(e) => setNewComplaint({...newComplaint, title: e.target.value})}
                      placeholder="Brief description of the problem"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Problem Description *</label>
                    <textarea
                      value={newComplaint.description}
                      onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                      placeholder="Detailed description of the road issue..."
                      rows="4"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Problem Type *</label>
                      <select
                        value={newComplaint.problemType}
                        onChange={(e) => setNewComplaint({...newComplaint, problemType: e.target.value})}
                        required
                      >
                        <option value="potholes">Potholes</option>
                        <option value="cracks">Road Cracks</option>
                        <option value="flooding">Water Flooding</option>
                        <option value="drainage">Drainage Issues</option>
                        <option value="safety">Safety Hazards</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Severity Level *</label>
                      <select
                        value={newComplaint.severity}
                        onChange={(e) => setNewComplaint({...newComplaint, severity: e.target.value})}
                        required
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="location-section">
                    <h3>Location Details</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Area/Locality *</label>
                        <input
                          type="text"
                          value={newComplaint.location.area}
                          onChange={(e) => setNewComplaint({
                            ...newComplaint, 
                            location: {...newComplaint.location, area: e.target.value}
                          })}
                          placeholder="Area or locality name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Street *</label>
                        <input
                          type="text"
                          value={newComplaint.location.street}
                          onChange={(e) => setNewComplaint({
                            ...newComplaint, 
                            location: {...newComplaint.location, street: e.target.value}
                          })}
                          placeholder="Street name and number"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>City *</label>
                        <input
                          type="text"
                          value={newComplaint.location.city}
                          onChange={(e) => setNewComplaint({
                            ...newComplaint, 
                            location: {...newComplaint.location, city: e.target.value}
                          })}
                          placeholder="City"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>State *</label>
                        <input
                          type="text"
                          value={newComplaint.location.state}
                          onChange={(e) => setNewComplaint({
                            ...newComplaint, 
                            location: {...newComplaint.location, state: e.target.value}
                          })}
                          placeholder="State"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>ZIP Code *</label>
                        <input
                          type="text"
                          value={newComplaint.location.zipCode}
                          onChange={(e) => setNewComplaint({
                            ...newComplaint, 
                            location: {...newComplaint.location, zipCode: e.target.value}
                          })}
                          placeholder="ZIP Code"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Landmark (Optional)</label>
                      <input
                        type="text"
                        value={newComplaint.location.landmark}
                        onChange={(e) => setNewComplaint({
                          ...newComplaint, 
                          location: {...newComplaint.location, landmark: e.target.value}
                        })}
                        placeholder="Nearby landmark for easy identification"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary">
                    Submit Complaint
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'my-complaints' && (
              <div className="my-complaints-section">
                <h2>All My Complaints ({complaints.length})</h2>
                {complaints.length === 0 ? (
                  <p>No complaints submitted yet.</p>
                ) : (
                  <div className="complaints-list">
                    {complaints.map(complaint => (
                      <div key={complaint.id} className={`complaint-card ${complaint.status}`}>
                        <div className="complaint-header">
                          <h4>{complaint.title}</h4>
                          <span className={`status-badge ${complaint.status}`}>
                            {complaint.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="complaint-details">
                          <p><strong>Description:</strong> {complaint.description}</p>
                          <p><strong>Location:</strong> {formatLocation(complaint.location)}</p>
                          <p><strong>Problem Type:</strong> {complaint.problemType}</p>
                          <p><strong>Severity:</strong> 
                            <span className={`severity-badge ${complaint.severity}`}>
                              {complaint.severity}
                            </span>
                          </p>
                        </div>
                        <div className="complaint-meta">
                          <p><strong>Submitted:</strong> {new Date(complaint.createdAt).toLocaleString()}</p>
                          <p><strong>Last Updated:</strong> {new Date(complaint.updatedAt).toLocaleString()}</p>
                        </div>
                        {complaint.estimatedMaterials && (
                          <div className="allocated-resources">
                            <p><strong>Resources Allocated:</strong> {complaint.estimatedMaterials}</p>
                          </div>
                        )}
                        {complaint.completionNotes && (
                          <div className="completion-notes">
                            <strong>Completion Notes:</strong> {complaint.completionNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pending' && (
              <div className="pending-complaints-section">
                <h2>Pending Complaints ({complaintStats.pending})</h2>
                {complaintStats.pending === 0 ? (
                  <p>No pending complaints.</p>
                ) : (
                  <div className="complaints-list">
                    {complaints
                      .filter(complaint => complaint.status === 'pending')
                      .map(complaint => (
                        <div key={complaint.id} className="complaint-card pending">
                          <div className="complaint-header">
                            <h4>{complaint.title}</h4>
                            <span className="status-badge pending">Pending</span>
                          </div>
                          <div className="complaint-details">
                            <p><strong>Description:</strong> {complaint.description}</p>
                            <p><strong>Location:</strong> {formatLocation(complaint.location)}</p>
                            <p><strong>Problem Type:</strong> {complaint.problemType}</p>
                            <p><strong>Severity:</strong> 
                              <span className={`severity-badge ${complaint.severity}`}>
                                {complaint.severity}
                              </span>
                            </p>
                          </div>
                          <div className="complaint-meta">
                            <p><strong>Submitted:</strong> {new Date(complaint.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {activeTab === 'in-progress' && (
              <div className="in-progress-complaints-section">
                <h2>Complaints In Progress ({complaintStats.underReview + complaintStats.assigned})</h2>
                {(complaintStats.underReview + complaintStats.assigned) === 0 ? (
                  <p>No complaints in progress.</p>
                ) : (
                  <div className="complaints-list">
                    {complaints
                      .filter(complaint => complaint.status === 'under_review' || complaint.status === 'assigned')
                      .map(complaint => (
                        <div key={complaint.id} className={`complaint-card ${complaint.status}`}>
                          <div className="complaint-header">
                            <h4>{complaint.title}</h4>
                            <span className={`status-badge ${complaint.status}`}>
                              {complaint.status === 'under_review' ? 'Under Review' : 'Assigned'}
                            </span>
                          </div>
                          <div className="complaint-details">
                            <p><strong>Description:</strong> {complaint.description}</p>
                            <p><strong>Location:</strong> {formatLocation(complaint.location)}</p>
                            <p><strong>Problem Type:</strong> {complaint.problemType}</p>
                            <p><strong>Severity:</strong> 
                              <span className={`severity-badge ${complaint.severity}`}>
                                {complaint.severity}
                              </span>
                            </p>
                            {complaint.estimatedMaterials && (
                              <p><strong>Resources Allocated:</strong> {complaint.estimatedMaterials}</p>
                            )}
                          </div>
                          <div className="complaint-meta">
                            <p><strong>Submitted:</strong> {new Date(complaint.createdAt).toLocaleString()}</p>
                            <p><strong>Last Updated:</strong> {new Date(complaint.updatedAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="completed-complaints-section">
                <h2>Completed Complaints ({complaintStats.completed})</h2>
                {complaintStats.completed === 0 ? (
                  <p>No completed complaints yet.</p>
                ) : (
                  <div className="complaints-list">
                    {complaints
                      .filter(complaint => complaint.status === 'completed')
                      .map(complaint => (
                        <div key={complaint.id} className="complaint-card completed">
                          <div className="complaint-header">
                            <h4>{complaint.title}</h4>
                            <span className="status-badge completed">Completed</span>
                          </div>
                          <div className="complaint-details">
                            <p><strong>Description:</strong> {complaint.description}</p>
                            <p><strong>Location:</strong> {formatLocation(complaint.location)}</p>
                            <p><strong>Problem Type:</strong> {complaint.problemType}</p>
                            <p><strong>Completion Notes:</strong> {complaint.completionNotes || "Work completed successfully"}</p>
                          </div>
                          <div className="complaint-meta">
                            <p><strong>Submitted:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
