import React from 'react';
import './Header.css';

const Header = ({ onLoginClick, isLoginOpen, user, onLogout, activeSection, setActiveSection }) => {
  
  const handleNavClick = (section, e) => {
    e.preventDefault();
    setActiveSection(section);
  };

  const isActive = (section) => {
    return activeSection === section ? 'active' : '';
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <h2 onClick={() => setActiveSection('home')} style={{cursor: 'pointer'}}>RoadRepair Tracker</h2>
        </div>
        <nav className="nav">
          <ul>
            <li>
              <a 
                href="#home" 
                className={isActive('home')}
                onClick={(e) => handleNavClick('home', e)}
              >
                Home
              </a>
            </li>
            <li>
              <a 
                href="#about"
                className={isActive('about')}
                onClick={(e) => handleNavClick('about', e)}
              >
                About
              </a>
            </li>
            <li>
              <a 
                href="#contact"
                className={isActive('contact')}
                onClick={(e) => handleNavClick('contact', e)}
              >
                Contact
              </a>
            </li>
            {user ? (
              <li className="user-menu">
                <span>Welcome, {user.name || user.email}</span>
                <button className="logout-btn" onClick={onLogout}>
                  Logout
                </button>
              </li>
            ) : (
              <li>
                <button 
                  className={`login-btn ${isLoginOpen ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoginClick();
                  }}
                >
                  {isLoginOpen ? 'Close' : 'Login'}
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;