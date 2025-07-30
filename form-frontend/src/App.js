import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PurchaseRequestForm from './pages/PurchaseRequestForm';
import CapexRequestForm from './pages/CapexRequestForm';
import TravelRequestForm from './pages/TravelRequestForm';
import MinorForm from './pages/MinorForm';
import MajorForm from './pages/MajorForm';
import Home from './pages/Home';  
import Dashboard from './pages/Dashboard';
import ViewForm from './pages/ViewForm';
import Login from './pages/login';
import MyForms from './pages/MyForms';
import './App.css';

// ProtectedRoute component with proper token validation
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        console.log('Token validation: No token found');
        setIsAuthenticated(false);
        return;
      }

      try {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        console.log('ProtectedRoute - Token validation: Using API URL:', baseUrl);
        console.log('ProtectedRoute - Token validation: Environment:', process.env.NODE_ENV);
        console.log('ProtectedRoute - Token validation: REACT_APP_API_URL env:', process.env.REACT_APP_API_URL);
        
        const response = await fetch(`${baseUrl}/api/forms/my-forms`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Token validation: Response status:', response.status);
        
        if (response.ok) {
          console.log('Token validation: Success');
          setIsAuthenticated(true);
        } else {
          console.log('Token validation: Failed, clearing localStorage');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    };

    validateToken();
  }, [token]);

  if (isAuthenticated === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px' 
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const token = localStorage.getItem('token');
  const isLoginPage = window.location.pathname === '/login';
  const isPublicRoute = ['/login'].includes(window.location.pathname);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        console.log('Token validation: No token found');
        setIsAuthenticated(false);
        return;
      }

      try {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        console.log('App - Token validation: Using API URL:', baseUrl);
        console.log('App - Token validation: Environment:', process.env.NODE_ENV);
        console.log('App - Token validation: REACT_APP_API_URL env:', process.env.REACT_APP_API_URL);
        
        const response = await fetch(`${baseUrl}/api/forms/my-forms`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Token validation: Response status:', response.status);
        
        if (response.ok) {
          console.log('Token validation: Success');
          setIsAuthenticated(true);
        } else {
          console.log('Token validation: Failed, clearing localStorage');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    };

    validateToken();
  }, [token]);

  return (
    <Router>
      {!isLoginPage && isAuthenticated && <Header />}
      <div className="app-container" style={{ marginTop: isAuthenticated && !isPublicRoute ? '70px' : '0' }}>
        {!isLoginPage && isAuthenticated && <Sidebar />}
        <div className="content-container">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />


            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Home/>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/view/:id" element={
              <ProtectedRoute>
                <ViewForm />
              </ProtectedRoute>
            } />
            <Route path="/form/purchase-request" element={
              <ProtectedRoute>
                <PurchaseRequestForm />
              </ProtectedRoute>
            } />
            <Route path="/form/capex-request" element={
              <ProtectedRoute>
                <CapexRequestForm />
              </ProtectedRoute>
            } />
            <Route path="/form/minor-form" element={
              <ProtectedRoute>
                <MinorForm />
              </ProtectedRoute>
            } />
            <Route path="/form/major-form" element={
              <ProtectedRoute>
                <MajorForm />
              </ProtectedRoute>
            } />
            <Route path="/form/travel-request" element={
              <ProtectedRoute>
                <TravelRequestForm />
              </ProtectedRoute>
            } />
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/my-forms" element={
              <ProtectedRoute>
                <MyForms />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
