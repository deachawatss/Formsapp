import React, { useState, useEffect, useRef } from 'react';
import { FaUserCircle, FaSignOutAlt, FaFileAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    // Click outside to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="header">
      <img src="https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png" alt="Logo" className="logo" />
      <h1>NWFTH - Organization Forms</h1>
      
      {user && (
        <div className="header-right" ref={dropdownRef}>
          <Link to="/my-forms" className="my-forms-button">
            <FaFileAlt />
            <span>My Forms</span>
          </Link>
          <div 
            className="user-profile"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <FaUserCircle className="user-icon" />
            <span className="user-name">{user.name}</span>
            
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="user-info">
                  <FaUserCircle className="large-user-icon" />
                  <div className="user-details">
                    <span className="full-name">{user.name}</span>
                    <span className="email">{user.email}</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="logout-button">
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
