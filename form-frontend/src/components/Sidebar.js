import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css'; // ใช้สำหรับสไตล์

const Sidebar = () => {
  // Get user information from localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  // Check if user is admin (hardcoded admin users)
  const isAdmin = (userName) => {
    const adminUsers = ['Jon', 'Phuvis', 'deachawat'];
    return adminUsers.includes(userName);
  };

  return (
    <div className="sidebar">
      {/* ปุ่ม Home และ Dashboard */}
      <ul>
        <li>
          <Link to="/">🏠 Home</Link>
        </li>
        {/* Show Dashboard only for admin users */}
        {isAdmin(user.name) && (
          <li>
            <Link to="/dashboard">📊 Dashboard</Link>
          </li>
        )}
      </ul>

      <h2>📂 Document Forms</h2>
      <ul>
        <li>
          <span>💰 CAPEX Request</span>
          <ul className="submenu">
            <li>
              <Link to="/form/major-form">
                &nbsp;&nbsp;🔷 Major Capital Request
              </Link>
            </li>
            <li>
              <Link to="/form/minor-form">
                &nbsp;&nbsp;🔶 Minor Capital Request
              </Link>
            </li>
          </ul>
        </li>

        <li>
          <Link to="/form/purchase-request">📄 Purchase Request</Link>
        </li>
        <li>
          <Link to="/form/travel-request">✈️ Travel Request</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
