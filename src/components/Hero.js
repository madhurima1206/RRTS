import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Road Repair Tracking System</h1>
        <p>
          A comprehensive platform for tracking, managing, and monitoring 
          road repair activities across the city. Streamline communication 
          between residents, workers, and administration.
        </p>
        <div className="hero-features">
          <div className="feature">
            <h3>Real-time Tracking</h3>
            <p>Monitor repair progress in real-time with live updates</p>
          </div>
          <div className="feature">
            <h3>Multi-role Access</h3>
            <p>Dedicated interfaces for all stakeholders</p>
          </div>
          <div className="feature">
            <h3>Efficient Management</h3>
            <p>Streamline repair workflows and communication</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;