import React from 'react';
import '../styles/NewHome.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="logo-container">
        <img 
          src="https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png" 
          alt="NWFTH Logo" 
          className="company-logo" 
        />
      </div>

      <h1 className="welcome-title">Welcome to NWFTH Document Management System</h1>
      <p className="welcome-subtitle">A system for managing various document forms within the organization</p>
      
      <p className="welcome-text">
        Please select the form you want to create from the menu on the left
      </p>
      
      <div className="features-container">
        <div className="feature-card">
          <div className="icon">📄</div>
          <h3>Various Types of Forms</h3>
          <p>Supporting multiple document formats including Purchase Request, Travel Request, and CAPEX Request</p>
        </div>
        
        <div className="feature-card">
          <div className="icon">📊</div>
          <h3>Data Management</h3>
          <p>Manage your forms and data efficiently with our integrated solution</p>
        </div>
        
        <div className="feature-card">
          <div className="icon">🔍</div>
          <h3>Status Tracking</h3>
          <p>Track the status of documents at every step, from creation to approval</p>
        </div>
      </div>
    </div>
  );
};

export default Home;