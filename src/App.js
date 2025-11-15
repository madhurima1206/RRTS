import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import LoginDropdown from './components/LoginDropdown';
import SimpleLogin from './components/SimpleLogin';
import ResidentDashboard from './components/ResidentDashboard';
import ClerkDashboard from './components/ClerkDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import AdministratorDashboard from './components/AdministratorDashboard';
import MayorDashboard from './components/MayorDashboard';
import WorkerDashboard from './components/WorkerDashboard';
import ComplaintForm from './components/ComplaintForm';
import AboutSection from './components/AboutSection';
import ContactSection from './components/ContactSection';

function App() {
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSimpleLogin, setShowSimpleLogin] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [complaints, setComplaints] = useState([]);

  // Sample initial complaints data
  const initialComplaints = [
    {
      id: 1,
      title: "Pothole on Main Street",
      description: "Large pothole causing traffic issues",
      location: "Main Street and 5th Avenue",
      status: "reported",
      priority: "high",
      type: "pothole",
      createdAt: new Date('2024-01-15'),
      createdBy: "john@example.com",
      assignedTo: null,
      updates: []
    },
    {
      id: 2,
      title: "Broken Street Light",
      description: "Street light not working for 3 days",
      location: "Oak Avenue near park",
      status: "in-progress",
      priority: "medium",
      type: "street_light",
      createdAt: new Date('2024-01-10'),
      createdBy: "sarah@example.com",
      assignedTo: "worker@city.gov",
      updates: [
        {
          id: 1,
          message: "Worker assigned to inspect",
          createdAt: new Date('2024-01-12'),
          createdBy: "clerk@city.gov"
        }
      ]
    },
    {
      id: 3,
      title: "Drainage Issue",
      description: "Water accumulation during rains",
      location: "Maple Road intersection",
      status: "completed",
      priority: "medium",
      type: "drainage",
      createdAt: new Date('2024-01-05'),
      createdBy: "mike@example.com",
      assignedTo: "worker@city.gov",
      updates: [
        {
          id: 1,
          message: "Drain cleaned and unclogged",
          createdAt: new Date('2024-01-08'),
          createdBy: "worker@city.gov"
        }
      ]
    }
  ];

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      const user = JSON.parse(userData);
      setUser(user);
      
      // Load appropriate complaints based on user role
      loadComplaints(user.role);
    } else {
      // Load public complaints for non-logged in users
      setComplaints(initialComplaints.filter(comp => comp.status === 'completed'));
    }
  }, []);

  const loadComplaints = (role) => {
    switch (role) {
      case 'resident':
        setComplaints(initialComplaints.filter(comp => 
          comp.createdBy === user?.email || comp.status === 'completed'
        ));
        break;
      case 'clerk':
      case 'supervisor':
      case 'administrator':
        setComplaints(initialComplaints);
        break;
      case 'worker':
        setComplaints(initialComplaints.filter(comp => 
          comp.assignedTo === user?.email || !comp.assignedTo
        ));
        break;
      case 'mayor':
        setComplaints(initialComplaints);
        break;
      default:
        setComplaints(initialComplaints.filter(comp => comp.status === 'completed'));
    }
  };

  const toggleLoginDropdown = () => {
    setShowLoginDropdown(!showLoginDropdown);
  };

  const closeLoginDropdown = () => {
    setShowLoginDropdown(false);
  };

  const handleUserLogin = (userRole) => {
    setShowLoginDropdown(false);
    setSelectedRole(userRole);
    setShowSimpleLogin(true);
  };

  const handleBackFromLogin = () => {
    setShowSimpleLogin(false);
    setSelectedRole('');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowSimpleLogin(false);
    setSelectedRole('');
    setActiveSection('home');
    loadComplaints(userData.role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveSection('home');
    setComplaints(initialComplaints.filter(comp => comp.status === 'completed'));
  };

  const handleNewComplaint = (complaint) => {
    const newComplaint = {
      ...complaint,
      id: complaints.length + 1,
      createdAt: new Date(),
      status: 'reported',
      updates: []
    };
    setComplaints(prev => [newComplaint, ...prev]);
  };

  const handleComplaintUpdate = (complaintId, update) => {
    setComplaints(prev => prev.map(comp => {
      if (comp.id === complaintId) {
        return {
          ...comp,
          ...update,
          updates: [...(comp.updates || []), {
            id: (comp.updates?.length || 0) + 1,
            message: update.message || 'Status updated',
            createdAt: new Date(),
            createdBy: user.email
          }]
        };
      }
      return comp;
    }));
  };

  // 🟢 Render appropriate content based on active section and user role
  const renderContent = () => {
    if (user) {
      // User is logged in - show dashboard
      return renderDashboard();
    } else {
      // User is not logged in - show public sections
      switch (activeSection) {
        case 'home':
          return (
            <Hero 
              complaints={complaints}
              onLoginClick={toggleLoginDropdown}
            />
          );
        case 'about':
          return <AboutSection />;
        case 'contact':
          return <ContactSection />;
        default:
          return (
            <Hero 
              complaints={complaints}
              onLoginClick={toggleLoginDropdown}
            />
          );
      }
    }
  };

  // 🟢 Render dashboards for each role
  const renderDashboard = () => {
    if (!user) return null;

    const commonProps = {
      user,
      complaints,
      onComplaintUpdate: handleComplaintUpdate,
      onNewComplaint: handleNewComplaint
    };

    switch (user.role) {
      case 'resident':
        return (
          <ResidentDashboard {...commonProps}>
            <ComplaintForm 
              user={user} 
              role="resident" 
              onSubmit={handleNewComplaint}
            />
          </ResidentDashboard>
        );

      case 'clerk':
        return (
          <ClerkDashboard {...commonProps}>
            <ComplaintForm 
              user={user} 
              role="clerk" 
              onSubmit={handleNewComplaint}
            />
          </ClerkDashboard>
        );

      case 'supervisor':
        return <SupervisorDashboard {...commonProps} />;

      case 'administrator':
        return <AdministratorDashboard {...commonProps} />;

      case 'mayor':
        return <MayorDashboard {...commonProps} />;

      case 'worker':
        return <WorkerDashboard {...commonProps} />;

      default:
        return <Hero complaints={complaints} onLoginClick={toggleLoginDropdown} />;
    }
  };

  return (
    <div className="App" onClick={showLoginDropdown ? closeLoginDropdown : undefined}>
      <Header
        onLoginClick={toggleLoginDropdown}
        isLoginOpen={showLoginDropdown}
        user={user}
        onLogout={handleLogout}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {showLoginDropdown && (
        <LoginDropdown onClose={closeLoginDropdown} onUserLogin={handleUserLogin} />
      )}

      {showSimpleLogin && (
        <SimpleLogin
          onLoginSuccess={handleLoginSuccess}
          onBack={handleBackFromLogin}
          userRole={selectedRole}
        />
      )}

      <main className="main-content">
        {renderContent()}
      </main>

      
    </div>
  );
}

export default App;