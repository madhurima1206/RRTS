import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WorkerDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;


const WorkerDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('assigned-tasks');
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [progressData, setProgressData] = useState({
    progress: 0,
    notes: '',
    issues: '',
    photos: []
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchWorkerData();
    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAssignedTasks(),
        fetchCompletedTasks(),
        fetchResources(),
        fetchNotifications()
      ]);
    } catch (error) {
      console.error('Error fetching worker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter tasks assigned to this worker with status 'assigned'
      const workerTasks = response.data.filter(complaint => 
        complaint.status === 'assigned' && 
        complaint.assignedWorkers?.includes(user.id)
      );
      setAssignedTasks(workerTasks);
    } catch (error) {
      console.error('Error fetching assigned tasks:', error);
    }
  };

  const fetchCompletedTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter completed tasks by this worker
      const completed = response.data.filter(complaint => 
        complaint.status === 'completed' && 
        complaint.completedBy === user.id
      );
      setCompletedTasks(completed);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
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

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/notifications/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const sortedNotifications = response.data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(notifications.map(notification =>
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/notifications/user/${user.id}/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true
      })));
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatLocation = (location) => {
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location !== null) {
      return `${location.street}, ${location.area}, ${location.city}`;
    }
    return 'Unknown Location';
  };

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const startProgressUpdate = (task) => {
    setSelectedTask(task);
    setProgressData({
      progress: task.progress || 0,
      notes: '',
      issues: '',
      photos: []
    });
    setShowProgressForm(true);
  };

  const updateTaskProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Update task progress
      await axios.patch(`${API_BASE_URL}/complaints/${selectedTask.id}`, 
        {
          progress: progressData.progress,
          workerNotes: progressData.notes,
          reportedIssues: progressData.issues,
          lastUpdated: new Date().toISOString(),
          updatedBy: user.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // If progress is 100%, mark as completed
      if (progressData.progress === 100) {
        await axios.patch(`${API_BASE_URL}/complaints/${selectedTask.id}`, 
          {
            status: 'completed',
            completedAt: new Date().toISOString(),
            completedBy: user.id,
            completionNotes: progressData.notes
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Create work log entry
      try {
        await axios.post(`${API_BASE_URL}/work-logs`, 
          {
            complaintId: selectedTask.id,
            workerId: user.id,
            progress: progressData.progress,
            notes: progressData.notes,
            issues: progressData.issues,
            workDate: new Date().toISOString()
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (logError) {
        console.log('Work logs endpoint not available, skipping...');
      }

      setShowProgressForm(false);
      setSelectedTask(null);
      fetchWorkerData();
      alert('Progress updated successfully!');
      
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error updating progress. Please try again.');
    }
  };

  const reportIssue = async (taskId, issueDescription) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/issues`, 
        {
          complaintId: taskId,
          reportedBy: user.id,
          description: issueDescription,
          status: 'reported',
          priority: 'high'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Issue reported successfully! Supervisor has been notified.');
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert('Error reporting issue. Please try again.');
    }
  };

  const getAssignedResources = (task) => {
    if (!task.assignedResources) return [];
    return resources.filter(resource => 
      task.assignedResources.includes(resource.id)
    );
  };

  const getTaskStats = () => {
    return {
      totalAssigned: assignedTasks.length,
      totalCompleted: completedTasks.length,
      inProgress: assignedTasks.filter(task => task.progress > 0 && task.progress < 100).length,
      notStarted: assignedTasks.filter(task => !task.progress || task.progress === 0).length
    };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="worker-dashboard">
        <div className="dashboard-header">
          <div className="container">
            <h1>Worker Dashboard</h1>
            <p>Welcome, {user.name}</p>
          </div>
        </div>
        <div className="loading">Loading your tasks...</div>
      </div>
    );
  }

  return (
    <div className="worker-dashboard">
      {/* Header with Notification Bell */}
      <div className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div className="header-text">
              <h1>Field Worker Dashboard</h1>
              <p>Welcome, {user.name} | {user.role}</p>
            </div>
            <div className="notification-section">
              <div className="notification-bell" onClick={() => setActiveTab('notifications')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="container">
          {/* Quick Stats */}
          <div className="worker-stats">
            <div className="stat-card">
              <div className="stat-icon assigned">📋</div>
              <div className="stat-info">
                <div className="stat-number">{stats.totalAssigned}</div>
                <div className="stat-label">Assigned Tasks</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon progress">🚧</div>
              <div className="stat-info">
                <div className="stat-number">{stats.inProgress}</div>
                <div className="stat-label">In Progress</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon completed">✅</div>
              <div className="stat-info">
                <div className="stat-number">{stats.totalCompleted}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon notifications">🔔</div>
              <div className="stat-info">
                <div className="stat-number">{unreadCount}</div>
                <div className="stat-label">New Notifications</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="worker-tabs">
            <button 
              className={`tab-btn ${activeTab === 'assigned-tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('assigned-tasks')}
            >
              Assigned Tasks ({assignedTasks.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'completed-tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed-tasks')}
            >
              Completed Work ({completedTasks.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              Available Resources
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Assigned Tasks Tab */}
            {activeTab === 'assigned-tasks' && (
              <div className="tasks-section">
                <h2>Your Assigned Repair Tasks</h2>
                
                {assignedTasks.length === 0 ? (
                  <div className="no-tasks">
                    <div className="no-tasks-icon">📝</div>
                    <h3>No Tasks Assigned</h3>
                    <p>You don't have any assigned repair tasks at the moment.</p>
                  </div>
                ) : (
                  <div className="tasks-grid">
                    {assignedTasks.map(task => (
                      <div key={task.id} className="task-card">
                        <div className="task-header">
                          <h4>{task.title}</h4>
                          <div className="task-priority">
                            <span className={`priority-badge ${task.priority}`}>
                              {task.priority}
                            </span>
                            <span className={`severity-badge ${task.severity}`}>
                              {task.severity}
                            </span>
                          </div>
                        </div>
                        
                        <div className="task-details">
                          <p><strong>Location:</strong> {formatLocation(task.location)}</p>
                          <p><strong>Problem:</strong> {task.problemType}</p>
                          <p><strong>Description:</strong> {task.description}</p>
                          <p><strong>Assigned On:</strong> {new Date(task.updatedAt).toLocaleDateString()}</p>
                        </div>

                        {/* Progress Bar */}
                        <div className="progress-section">
                          <div className="progress-header">
                            <span>Progress</span>
                            <span>{task.progress || 0}%</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${task.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Assigned Resources */}
                        {task.assignedResources && (
                          <div className="assigned-resources">
                            <strong>Assigned Resources:</strong>
                            <div className="resources-list">
                              {getAssignedResources(task).map(resource => (
                                <span key={resource.id} className="resource-tag">
                                  {resource.name} ({resource.quantity})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="task-actions">
                          <button 
                            className="btn btn-view"
                            onClick={() => openTaskDetails(task)}
                          >
                            View Details
                          </button>
                          <button 
                            className="btn btn-progress"
                            onClick={() => startProgressUpdate(task)}
                          >
                            Update Progress
                          </button>
                          <button 
                            className="btn btn-issue"
                            onClick={() => {
                              const issue = prompt('Describe the issue:');
                              if (issue) reportIssue(task.id, issue);
                            }}
                          >
                            Report Issue
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Completed Tasks Tab */}
            {activeTab === 'completed-tasks' && (
              <div className="completed-section">
                <h2>Your Completed Work</h2>
                
                {completedTasks.length === 0 ? (
                  <div className="no-tasks">
                    <div className="no-tasks-icon">🎉</div>
                    <h3>No Completed Tasks Yet</h3>
                    <p>Complete your assigned tasks to see them here.</p>
                  </div>
                ) : (
                  <div className="completed-grid">
                    {completedTasks.map(task => (
                      <div key={task.id} className="completed-card">
                        <div className="completed-header">
                          <h4>{task.title}</h4>
                          <span className="status-badge completed">Completed</span>
                        </div>
                        
                        <div className="completed-details">
                          <p><strong>Location:</strong> {formatLocation(task.location)}</p>
                          <p><strong>Problem:</strong> {task.problemType}</p>
                          <p><strong>Completed On:</strong> {new Date(task.completedAt).toLocaleDateString()}</p>
                          {task.completionNotes && (
                            <p><strong>Completion Notes:</strong> {task.completionNotes}</p>
                          )}
                        </div>

                        <div className="completion-metrics">
                          <div className="metric">
                            <span className="metric-label">Time Taken:</span>
                            <span className="metric-value">
                              {Math.ceil((new Date(task.completedAt) - new Date(task.updatedAt)) / (1000 * 60 * 60 * 24))} days
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="notifications-section">
                <div className="notifications-header">
                  <h2>Your Notifications</h2>
                  {notifications.length > 0 && (
                    <button 
                      className="btn btn-secondary"
                      onClick={markAllNotificationsAsRead}
                      disabled={unreadCount === 0}
                    >
                      Mark All as Read
                    </button>
                  )}
                </div>
                
                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <div className="no-notifications-icon">📭</div>
                    <h3>No Notifications</h3>
                    <p>You don't have any notifications at the moment.</p>
                  </div>
                ) : (
                  <div className="notifications-list">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="notification-icon">
                          {notification.type === 'task_assignment' && '📋'}
                          {notification.type === 'progress_update' && '🔄'}
                          {notification.type === 'system' && '⚙️'}
                        </div>
                        <div className="notification-content">
                          <div className="notification-title">
                            {notification.title}
                            {!notification.read && <span className="unread-dot"></span>}
                          </div>
                          <div className="notification-message">
                            {notification.message}
                          </div>
                          <div className="notification-time">
                            {new Date(notification.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="notification-actions">
                          {notification.relatedId && (
                            <button 
                              className="btn btn-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Navigate to related task
                                const task = assignedTasks.find(t => t.id === notification.relatedId);
                                if (task) {
                                  setSelectedTask(task);
                                  setShowTaskDetails(true);
                                }
                              }}
                            >
                              View Task
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="resources-section">
                <h2>Available Resources & Equipment</h2>
                
                <div className="resources-grid">
                  {resources.filter(r => r.available).map(resource => (
                    <div key={resource.id} className="resource-card">
                      <div className="resource-header">
                        <h4>{resource.name}</h4>
                        <span className={`resource-type ${resource.type}`}>
                          {resource.type}
                        </span>
                      </div>
                      <div className="resource-details">
                        <p><strong>Quantity:</strong> {resource.quantity} {resource.unit}</p>
                        <p><strong>Status:</strong> 
                          <span className={`status-badge ${resource.available ? 'available' : 'unavailable'}`}>
                            {resource.available ? 'Available' : 'Unavailable'}
                          </span>
                        </p>
                        {resource.specifications && (
                          <p><strong>Specs:</strong> {resource.specifications}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-content task-details-modal">
            <div className="modal-header">
              <h3>Task Details: {selectedTask.title}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowTaskDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h4>Location Information</h4>
                <p><strong>Address:</strong> {formatLocation(selectedTask.location)}</p>
                {selectedTask.location?.landmark && (
                  <p><strong>Landmark:</strong> {selectedTask.location.landmark}</p>
                )}
              </div>

              <div className="detail-section">
                <h4>Problem Details</h4>
                <p><strong>Type:</strong> {selectedTask.problemType}</p>
                <p><strong>Severity:</strong> 
                  <span className={`severity-badge ${selectedTask.severity}`}>
                    {selectedTask.severity}
                  </span>
                </p>
                <p><strong>Description:</strong> {selectedTask.description}</p>
              </div>

              {selectedTask.estimatedMaterials && (
                <div className="detail-section">
                  <h4>Required Materials</h4>
                  <p>{selectedTask.estimatedMaterials}</p>
                </div>
              )}

              {selectedTask.specialInstructions && (
                <div className="detail-section">
                  <h4>Special Instructions</h4>
                  <p>{selectedTask.specialInstructions}</p>
                </div>
              )}

              <div className="detail-section">
                <h4>Work Progress</h4>
                <div className="progress-display">
                  <div className="progress-bar large">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${selectedTask.progress || 0}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{selectedTask.progress || 0}% Complete</span>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowTaskDetails(false)}
              >
                Close
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowTaskDetails(false);
                  startProgressUpdate(selectedTask);
                }}
              >
                Update Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {showProgressForm && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-content progress-modal">
            <div className="modal-header">
              <h3>Update Progress: {selectedTask.title}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowProgressForm(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Progress Percentage</label>
                <div className="progress-input">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={progressData.progress}
                    onChange={(e) => setProgressData({
                      ...progressData,
                      progress: parseInt(e.target.value)
                    })}
                    className="progress-slider"
                  />
                  <span className="progress-value">{progressData.progress}%</span>
                </div>
              </div>

              <div className="form-group">
                <label>Work Notes</label>
                <textarea
                  value={progressData.notes}
                  onChange={(e) => setProgressData({
                    ...progressData,
                    notes: e.target.value
                  })}
                  placeholder="Describe the work completed, materials used, etc."
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Issues Encountered (Optional)</label>
                <textarea
                  value={progressData.issues}
                  onChange={(e) => setProgressData({
                    ...progressData,
                    issues: e.target.value
                  })}
                  placeholder="Describe any problems or delays encountered"
                  rows="3"
                />
              </div>

              {progressData.progress === 100 && (
                <div className="completion-warning">
                  <strong>⚠️ Completing Task:</strong> Setting progress to 100% will mark this task as completed.
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowProgressForm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={updateTaskProgress}
                disabled={progressData.progress === 0}
              >
                {progressData.progress === 100 ? 'Complete Task' : 'Update Progress'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
