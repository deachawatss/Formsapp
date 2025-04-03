import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const MyForms = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchMyForms();
  }, []);

  const fetchMyForms = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        window.location.href = '/login';
        return;
      }

      // Use URL from environment variable and append /my-forms
      const baseUrl = process.env.REACT_APP_API_URL || 'http://192.168.17.15:5000';
      const response = await axios.get(`${baseUrl}/api/forms/my-forms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Raw API Response:', response.data);
      
      const formsData = Array.isArray(response.data) ? response.data : [];
      console.log('Forms data after processing:', formsData);
      
      setForms(formsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching forms:', error);
      console.error('Error details:', error.response?.data);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const form = forms.find(f => f.id === id);
      if (form.status !== 'Draft') {
        alert('Cannot delete forms with "Waiting For Approve" or "Approved" status');
        return;
      }

      if (!window.confirm('Are you sure you want to delete this form?')) {
        return;
      }

      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://192.168.17.15:5000';
      
      const response = await axios.delete(`${baseUrl}/api/forms/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      alert(response.data.message); // Show success message after deletion
      fetchMyForms(); // Reload data
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('❌ ' + (error.response?.data?.error || 'Error deleting form'));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft':
        return '#6c757d'; // Gray
      case 'Waiting For Approve':
        return '#ffc107'; // Yellow
      case 'Approve':
        return '#28a745'; // Green
      case 'Reject':
        return '#dc3545'; // Red
      default:
        return '#6c757d';
    }
  };

  const getEditLink = (form) => {
    switch (form.form_name) {
      case 'Purchase Request':
        return `/form/purchase-request?id=${form.id}`;
      case 'Travel Request':
        return `/form/travel-request?id=${form.id}`;
      case 'Major Capital Authorization Request':
        return `/form/major-form?id=${form.id}`;
      case 'Minor Capital Authorization Request':
        return `/form/minor-form?id=${form.id}`;
      default:
        return `/form/purchase-request?id=${form.id}`;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header-section">
        <h2>My Forms - {user?.name}</h2>
      </div>
      
      <div className="table-container">
        <table className="forms-table">
          <thead>
            <tr>
              <th>Form Name</th>
              <th>Department</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id}>
                <td>{form.form_name}</td>
                <td>{form.department}</td>
                <td>{new Date(form.request_date).toLocaleDateString()}</td>
                <td>
                  <span className="status-badge" style={{ 
                    backgroundColor: getStatusColor(form.status),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.9em'
                  }}>
                    {form.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <Link 
                    to={`/view/${form.id}`} 
                    className="action-btn view-btn"
                    title="View Form"
                  >
                    👁 View
                  </Link>
                  {form.status === 'Draft' && (
                    <>
                      <Link
                        to={getEditLink(form)}
                        state={{ formData: form }}
                        className="action-btn edit-btn"
                        title="Edit Form"
                      >
                        ✏️ Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(form.id)}
                        className="action-btn delete-btn"
                        title="Delete Form"
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyForms; 