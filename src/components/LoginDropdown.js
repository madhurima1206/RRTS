import React from 'react';
import './LoginDropdown.css';

const LoginDropdown = ({ onClose, onUserLogin }) => {
  const users = [
    {
      id: 1,
      role: 'Resident',
      description: 'Report road issues and track repair status',
      loginUrl: '/login/resident'
    },
    {
      id: 2,
      role: 'Clerk',
      description: 'Manage complaints and assign initial review',
      loginUrl: '/login/clerk'
    },
    {
      id: 3,
      role: 'Supervisor',
      description: 'Assess severity, set priority, and schedule repairs',
      loginUrl: '/login/supervisor'
    },
    {
      id: 4,
      role: 'Administrator',
      description: 'Manage resources and system configuration',
      loginUrl: '/login/administrator'
    },
    {
      id: 5,
      role: 'Mayor',
      description: 'View city-wide statistics and reports',
      loginUrl: '/login/mayor'
    },
    {
      id: 6,
      role: 'Worker',
      description: 'Receive assignments and update work progress',
      loginUrl: '/login/worker'
    }
  ];

  const handleUserLogin = (userRole, e) => {
    e.stopPropagation();
    onUserLogin(userRole);
  };

  return (
    <div className="login-dropdown-overlay" onClick={onClose}>
      <div className="login-dropdown" onClick={(e) => e.stopPropagation()}>
        <div className="dropdown-header">
          <h3>Select Your Role to Login</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="users-grid">
          {users.map(user => (
            <div 
              key={user.id} 
              className="user-card"
              onClick={(e) => handleUserLogin(user.role, e)}
            >
              <div className="user-icon">
                {user.role.charAt(0)}
              </div>
              <h4>{user.role}</h4>
              <p>{user.description}</p>
              <button className="login-user-btn">
                Login as {user.role}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginDropdown;