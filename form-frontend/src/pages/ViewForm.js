import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ViewMajorForm from './ViewMajorForm';
import ViewPRForm from './ViewPRForm';
import ViewMinorForm from './ViewMinorForm';
import ViewTravelRequest from './ViewTravelRequest';
import '../styles/common.css';

const ViewForm = () => {
  const { id } = useParams();
  
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchForm = async () => {
    try {
      const token = localStorage.getItem('token');
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        
      const response = await axios.get(`${baseUrl}/api/forms/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data) {
          console.log("API Response data:", response.data);
          console.log("API Response form_name:", response.data.form_name);
          try {
            const parsedDetails = typeof response.data.details === 'string' 
              ? JSON.parse(response.data.details) 
              : response.data.details;
            console.log("Parsed details:", parsedDetails);
        } catch (err) {
          console.error("Error parsing details:", err);
          }
          setForm(response.data);
        }
      } catch (error) {
        console.error('Error fetching form:', error);
        setError('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!form) {
    return <div>No data found</div>;
  }

  // Access form_type (new schema) with fallback to form_name (old schema) for compatibility
  const form_type = form.form_type || form.form_name;
  console.log("Form type:", form_type);
  console.log("Rendered with form data:", form);

  // Render appropriate view component based on form type
  const renderFormByType = () => {
    // Add log before entering switch case
    console.log(`Rendering form type: "${form_type}" from data:`, form);
    
    switch (form_type) {
      case 'Major Capital Authorization Request':
        return <ViewMajorForm form={form} />;
      case 'Purchase Request':
        console.log("Rendering Purchase Request form with data:", form);
        return <ViewPRForm form={form} />;
      case 'Minor Capital Authorization Request':
        return <ViewMinorForm form={form} />;
      case 'Travel Request':
        return <ViewTravelRequest form={form} />;
      default:
        console.error("❌ Form type not found:", form_type);
        console.error("Available form data:", form);
        return <div>Form type not found "{form_type}"</div>;
    }
  };

    return (
    <div>
      {renderFormByType()}
      </div>
    );
};

export default ViewForm;