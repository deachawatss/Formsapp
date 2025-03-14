import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaWindows, FaUser, FaLock, FaExclamationCircle } from 'react-icons/fa';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    useDomain: true  // Always use domain authentication
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://192.168.17.15:5000/api/login', credentials);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/');
        window.location.reload();
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        setError(`Login failed. Please check your domain credentials.`);
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img
          src="https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png"
          alt="Newlyweds Foods Logo"
          className="company-logo"
        />
        <h1>Organization Forms System</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Username</label>
            <div className="input-with-icon">
              <FaUser className="input-icon" />
              <input
                type="text"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                placeholder="Enter your domain username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter your domain password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <FaExclamationCircle className="error-icon" />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="windows-login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner">⌛</span>
                Signing in...
              </>
            ) : (
              <>
                <FaWindows className="windows-icon" />
                Sign in with Domain Account
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
