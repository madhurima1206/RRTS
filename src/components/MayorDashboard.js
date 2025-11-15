import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MayorDashboard.css';

const API_BASE_URL = 'http://localhost:5001/api';

const MayorDashboard = ({ user }) => {
  const [complaints, setComplaints] = useState([]);
  const [resources, setResources] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month, quarter
  const [areaFilter, setAreaFilter] = useState('all');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchComplaints(),
        fetchResources(),
        fetchAllocations()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const fetchAllocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/allocations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllocations(response.data);
    } catch (error) {
      console.error('Error fetching allocations:', error);
      setAllocations([]);
    }
  };

  // Helper function to format location
  const formatLocation = (location) => {
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location !== null) {
      return `${location.street}, ${location.area}, ${location.city}, ${location.state} ${location.zipCode}`;
    }
    return 'Unknown Location';
  };

  // Get area from complaint location
  const getComplaintArea = (complaint) => {
    const location = complaint.location;
    if (typeof location === 'object' && location !== null) {
      return location.area || 'Unknown Area';
    }
    return 'Unknown Area';
  };

  // Filter complaints based on time and area
  const getFilteredComplaints = () => {
    let filtered = [...complaints];

    // Apply time filter
    const now = new Date();
    if (timeFilter === 'week') {
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
      filtered = filtered.filter(complaint => new Date(complaint.createdAt) >= oneWeekAgo);
    } else if (timeFilter === 'month') {
      const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filtered = filtered.filter(complaint => new Date(complaint.createdAt) >= oneMonthAgo);
    } else if (timeFilter === 'quarter') {
      const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
      filtered = filtered.filter(complaint => new Date(complaint.createdAt) >= threeMonthsAgo);
    }

    // Apply area filter
    if (areaFilter !== 'all') {
      filtered = filtered.filter(complaint => getComplaintArea(complaint) === areaFilter);
    }

    return filtered;
  };

  // Comprehensive Statistics
  const getStatistics = () => {
    const filteredComplaints = getFilteredComplaints();
    const totalComplaints = filteredComplaints.length;

    // Status breakdown
    const statusBreakdown = {
      pending: filteredComplaints.filter(c => c.status === 'pending').length,
      under_review: filteredComplaints.filter(c => c.status === 'under_review').length,
      assigned: filteredComplaints.filter(c => c.status === 'assigned').length,
      completed: filteredComplaints.filter(c => c.status === 'completed').length
    };

    // Severity breakdown
    const severityBreakdown = {
      critical: filteredComplaints.filter(c => c.severity === 'critical').length,
      high: filteredComplaints.filter(c => c.severity === 'high').length,
      medium: filteredComplaints.filter(c => c.severity === 'medium').length,
      low: filteredComplaints.filter(c => c.severity === 'low').length
    };

    // Area-wise breakdown
    const areas = [...new Set(complaints.map(c => getComplaintArea(c)))];
    const areaBreakdown = areas.map(area => ({
      area,
      count: filteredComplaints.filter(c => getComplaintArea(c) === area).length,
      completed: filteredComplaints.filter(c => getComplaintArea(c) === area && c.status === 'completed').length,
      pending: filteredComplaints.filter(c => getComplaintArea(c) === area && c.status === 'pending').length
    })).sort((a, b) => b.count - a.count);

    // Completion rate
    const completionRate = totalComplaints > 0 
      ? (statusBreakdown.completed / totalComplaints * 100).toFixed(1)
      : 0;

    // Average resolution time (for completed complaints)
    const completedComplaints = filteredComplaints.filter(c => c.status === 'completed' && c.completedAt);
    const totalResolutionTime = completedComplaints.reduce((total, complaint) => {
      const created = new Date(complaint.createdAt);
      const completed = new Date(complaint.completedAt);
      return total + (completed - created);
    }, 0);
    const avgResolutionDays = completedComplaints.length > 0 
      ? (totalResolutionTime / (completedComplaints.length * 24 * 60 * 60 * 1000)).toFixed(1)
      : 0;

    // Resource utilization
    const totalResources = resources.length;
    const allocatedResources = resources.filter(r => !r.available || r.quantity === 0).length;
    const resourceUtilization = totalResources > 0 
      ? (allocatedResources / totalResources * 100).toFixed(1)
      : 0;

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      
      const monthComplaints = filteredComplaints.filter(complaint => {
        const complaintDate = new Date(complaint.createdAt);
        return complaintDate.getMonth() === date.getMonth() && 
               complaintDate.getFullYear() === date.getFullYear();
      });
      
      monthlyTrend.push({
        month: `${month} ${year}`,
        complaints: monthComplaints.length,
        completed: monthComplaints.filter(c => c.status === 'completed').length
      });
    }

    return {
      totalComplaints,
      statusBreakdown,
      severityBreakdown,
      areaBreakdown,
      completionRate,
      avgResolutionDays,
      resourceUtilization,
      monthlyTrend,
      totalResources,
      allocatedResources
    };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="mayor-dashboard">
        <div className="dashboard-header">
          <div className="container">
            <h1>Mayor Dashboard</h1>
            <p>Welcome, Mayor {user.name}</p>
          </div>
        </div>
        <div className="loading">Loading comprehensive statistics...</div>
      </div>
    );
  }

  return (
    <div className="mayor-dashboard">
      <div className="dashboard-header">
        <div className="container">
          <h1>Mayor Dashboard</h1>
          <p>Welcome, Mayor {user.name}</p>
          <p className="subtitle">Comprehensive Road Repair Analytics & City Infrastructure Overview</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="container">
          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label>Time Period:</label>
              <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 3 Months</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Area:</label>
              <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
                <option value="all">All Areas</option>
                {[...new Set(complaints.map(c => getComplaintArea(c)))].map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            <button className="btn-refresh" onClick={fetchAllData}>
              Refresh Data
            </button>
          </div>

          {/* Key Performance Indicators */}
          <div className="kpi-section">
            <h2>Key Performance Indicators</h2>
            <div className="kpi-grid">
              <div className="kpi-card primary">
                <div className="kpi-value">{stats.totalComplaints}</div>
                <div className="kpi-label">Total Complaints</div>
                <div className="kpi-trend">
                  {timeFilter === 'all' ? 'All Time' : `Last ${timeFilter}`}
                </div>
              </div>
              <div className="kpi-card success">
                <div className="kpi-value">{stats.completionRate}%</div>
                <div className="kpi-label">Completion Rate</div>
                <div className="kpi-trend">
                  {stats.statusBreakdown.completed} of {stats.totalComplaints} resolved
                </div>
              </div>
              <div className="kpi-card warning">
                <div className="kpi-value">{stats.avgResolutionDays}</div>
                <div className="kpi-label">Avg. Resolution (Days)</div>
                <div className="kpi-trend">
                  Based on {stats.statusBreakdown.completed} completed cases
                </div>
              </div>
              <div className="kpi-card info">
                <div className="kpi-value">{stats.resourceUtilization}%</div>
                <div className="kpi-label">Resource Utilization</div>
                <div className="kpi-trend">
                  {stats.allocatedResources} of {stats.totalResources} resources allocated
                </div>
              </div>
            </div>
          </div>

          {/* Status Overview */}
          <div className="status-section">
            <div className="status-card">
              <h3>Complaint Status Distribution</h3>
              <div className="status-bars">
                <div className="status-bar pending">
                  <div className="status-label">Pending</div>
                  <div className="status-count">{stats.statusBreakdown.pending}</div>
                  <div className="status-percentage">
                    {stats.totalComplaints > 0 ? ((stats.statusBreakdown.pending / stats.totalComplaints) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div className="status-bar under-review">
                  <div className="status-label">Under Review</div>
                  <div className="status-count">{stats.statusBreakdown.under_review}</div>
                  <div className="status-percentage">
                    {stats.totalComplaints > 0 ? ((stats.statusBreakdown.under_review / stats.totalComplaints) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div className="status-bar assigned">
                  <div className="status-label">Assigned</div>
                  <div className="status-count">{stats.statusBreakdown.assigned}</div>
                  <div className="status-percentage">
                    {stats.totalComplaints > 0 ? ((stats.statusBreakdown.assigned / stats.totalComplaints) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div className="status-bar completed">
                  <div className="status-label">Completed</div>
                  <div className="status-count">{stats.statusBreakdown.completed}</div>
                  <div className="status-percentage">
                    {stats.totalComplaints > 0 ? ((stats.statusBreakdown.completed / stats.totalComplaints) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </div>

            <div className="severity-card">
              <h3>Severity Distribution</h3>
              <div className="severity-bars">
                <div className="severity-bar critical">
                  <div className="severity-label">Critical</div>
                  <div className="severity-count">{stats.severityBreakdown.critical}</div>
                </div>
                <div className="severity-bar high">
                  <div className="severity-label">High</div>
                  <div className="severity-count">{stats.severityBreakdown.high}</div>
                </div>
                <div className="severity-bar medium">
                  <div className="severity-label">Medium</div>
                  <div className="severity-count">{stats.severityBreakdown.medium}</div>
                </div>
                <div className="severity-bar low">
                  <div className="severity-label">Low</div>
                  <div className="severity-count">{stats.severityBreakdown.low}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Area-wise Performance */}
          <div className="area-section">
            <h2>Area-wise Performance</h2>
            <div className="area-grid">
              {stats.areaBreakdown.map(area => (
                <div key={area.area} className="area-card">
                  <h4>{area.area}</h4>
                  <div className="area-stats">
                    <div className="area-stat">
                      <span className="stat-value">{area.count}</span>
                      <span className="stat-label">Total</span>
                    </div>
                    <div className="area-stat">
                      <span className="stat-value">{area.completed}</span>
                      <span className="stat-label">Completed</span>
                    </div>
                    <div className="area-stat">
                      <span className="stat-value">{area.pending}</span>
                      <span className="stat-label">Pending</span>
                    </div>
                  </div>
                  <div className="area-completion">
                    <div className="completion-bar">
                      <div 
                        className="completion-fill" 
                        style={{ width: `${area.count > 0 ? (area.completed / area.count * 100) : 0}%` }}
                      ></div>
                    </div>
                    <span className="completion-percentage">
                      {area.count > 0 ? ((area.completed / area.count) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="trends-section">
            <h2>Monthly Complaint Trends</h2>
            <div className="trends-grid">
              {stats.monthlyTrend.map(month => (
                <div key={month.month} className="trend-card">
                  <h4>{month.month}</h4>
                  <div className="trend-stats">
                    <div className="trend-stat">
                      <span className="trend-value">{month.complaints}</span>
                      <span className="trend-label">Filed</span>
                    </div>
                    <div className="trend-stat">
                      <span className="trend-value">{month.completed}</span>
                      <span className="trend-label">Resolved</span>
                    </div>
                  </div>
                  <div className="trend-efficiency">
                    Efficiency: {month.complaints > 0 ? ((month.completed / month.complaints) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Critical Complaints */}
          <div className="critical-section">
            <h2>Recent Critical & High Priority Complaints</h2>
            <div className="critical-list">
              {complaints
                .filter(c => c.severity === 'critical' || c.severity === 'high')
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map(complaint => (
                  <div key={complaint.id} className="critical-card">
                    <div className="critical-header">
                      <h4>{complaint.title}</h4>
                      <span className={`severity-badge ${complaint.severity}`}>
                        {complaint.severity}
                      </span>
                    </div>
                    <div className="critical-details">
                      <p><strong>Location:</strong> {formatLocation(complaint.location)}</p>
                      <p><strong>Status:</strong> <span className={`status-badge ${complaint.status}`}>{complaint.status}</span></p>
                      <p><strong>Reported:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Resource Overview */}
          <div className="resource-section">
            <h2>Resource Allocation Overview</h2>
            <div className="resource-grid">
              <div className="resource-type">
                <h4>Materials</h4>
                <div className="resource-count">
                  {resources.filter(r => r.type === 'material').length} types
                </div>
              </div>
              <div className="resource-type">
                <h4>Machines</h4>
                <div className="resource-count">
                  {resources.filter(r => r.type === 'machine').length} units
                </div>
              </div>
              <div className="resource-type">
                <h4>Personnel</h4>
                <div className="resource-count">
                  {resources.filter(r => r.type === 'personnel').length} teams
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MayorDashboard;