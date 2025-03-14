import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PurchaseRequestForm from './pages/PurchaseRequestForm';
import CapexRequestForm from './pages/CapexRequestForm';
import TravelRequestForm from './pages/TravelRequestForm';
import Home from './pages/Home';  
import ViewForm from './pages/ViewForm';
import Login from './pages/login';
import MyForms from './pages/MyForms';
import './App.css';

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  const token = localStorage.getItem('token');
  const isLoginPage = window.location.pathname === '/login';
  const isPublicRoute = ['/login'].includes(window.location.pathname);

  return (
    <Router>
      {!isLoginPage && token && <Header />}
      <div className="app-container" style={{ marginTop: token && !isPublicRoute ? '50px' : '0' }}>
        {!isLoginPage && token && <Sidebar />}
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
            <Route path="/my-forms" element={<MyForms />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
