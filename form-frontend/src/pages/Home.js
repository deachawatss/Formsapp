import React from 'react';
import '../styles/NewHome.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="logo-container">
          <img 
            src="https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png" 
            alt="NWFTH Logo" 
            className="company-logo" 
          />
        </div>
      </div>
      
      <div className="features-section">
        <div className="features-container">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="feature-title">Various Types of Forms</h3>
            <p className="feature-description">Supporting multiple document formats including Purchase Request, Travel Request, and CAPEX Request</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V12H7V10ZM11 10H17V12H11V10ZM7 14H9V16H7V14ZM11 14H17V16H11V14Z" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="feature-title">Data Management</h3>
            <p className="feature-description">Manage your forms and data efficiently</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.5 10.84L11.92 12.25L12 12.17V21H14V12.17L16.83 9.34L18.33 10.84L21 8.17V9H21Z" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="feature-title">Status Tracking</h3>
            <p className="feature-description">Track the status of documents at every step, from creation to approval</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;