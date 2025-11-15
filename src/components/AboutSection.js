import React from 'react';
import './AboutSection.css';

const AboutSection = () => {
  const features = [
    {
      icon: "📍",
      title: "Real-time Tracking",
      description: "Monitor road repair progress in real-time with live updates and status notifications"
    },
    {
      icon: "📱",
      title: "Easy Reporting",
      description: "Report road issues quickly through our intuitive mobile-friendly interface"
    },
    {
      icon: "👥",
      title: "Community Driven",
      description: "Join a community dedicated to improving local infrastructure and public safety"
    },
    {
      icon: "📊",
      title: "Analytics & Insights",
      description: "Access detailed reports and statistics on road maintenance activities"
    },
    {
      icon: "⚡",
      title: "Quick Response",
      description: "Fast processing and assignment of complaints to relevant departments"
    },
    {
      icon: "🛠️",
      title: "Work Management",
      description: "Efficient work allocation and progress tracking for repair teams"
    }
  ];

  const teamRoles = [
    {
      role: "Residents",
      description: "Report road issues and track repair progress in their neighborhoods"
    },
    {
      role: "Clerks",
      description: "Review and process incoming complaints, assign priority levels"
    },
    {
      role: "Supervisors",
      description: "Oversee work distribution and monitor team performance"
    },
    {
      role: "Workers",
      description: "Receive assigned tasks and update repair progress"
    },
    {
      role: "Administrators",
      description: "Manage system users and generate analytical reports"
    },
    {
      role: "Mayor",
      description: "Monitor overall city infrastructure status and public satisfaction"
    }
  ];

  return (
    <section id="about" className="about-section">
      <div className="container">
        <div className="section-header">
          <h1>About RoadRepair Tracker</h1>
          <p>Transforming how communities manage and track road maintenance efficiently</p>
        </div>

        <div className="about-content">
          <div className="mission-section">
            <h2>Our Mission</h2>
            <p className="mission-text">
              RoadRepair Tracker is dedicated to creating safer, better-maintained roads 
              by empowering communities with transparent, real-time information about 
              road maintenance and repair activities. We bridge the gap between citizens 
              and municipal authorities to ensure timely resolution of infrastructure issues.
            </p>
          </div>

          <div className="features-section">
            <h2>Why Choose RoadRepair Tracker?</h2>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="workflow-section">
            <h2>How It Works</h2>
            <div className="process-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Report Issue</h4>
                  <p>Citizens report road issues with photos and location details</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Review & Prioritize</h4>
                  <p>Clerks verify and prioritize based on severity and impact</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Assign Work</h4>
                  <p>Supervisors assign tasks to available work crews</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Track Progress</h4>
                  <p>Real-time updates on repair status and completion</p>
                </div>
              </div>
            </div>
          </div>

          <div className="team-section">
            <h2>Team Roles & Responsibilities</h2>
            <div className="team-grid">
              {teamRoles.map((team, index) => (
                <div key={index} className="team-card">
                  <h4>{team.role}</h4>
                  <p>{team.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="stats-section">
            <h2>Our Impact</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">10,000+</div>
                <div className="stat-label">Issues Resolved</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Cities Served</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">95%</div>
                <div className="stat-label">Satisfaction Rate</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;