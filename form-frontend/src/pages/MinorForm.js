import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/MinorForm.css';

const MinorForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const formId = queryParams.get('id');
  const user = JSON.parse(localStorage.getItem('user'));
  const formDataFromState = location.state?.formData;
  
  const [insertedId, setInsertedId] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const [formData, setFormData] = useState({
    operatingCompany: '',
    department: '',
    date: new Date().toISOString().split('T')[0],
    name: user?.name || '',
    email: '',
    items: [
      {
        carNumber: '',
        startDate: '',
        description: '',
        capital: '',
        lease: '',
        expense: '',
        total: ''
      }
    ],
    purpose: {
      replacement: false,
      expansion: false,
      costReduction: false,
      qualityImprovement: false,
      other: false,
      otherText: ''
    },
    projectSummary: '',
    country: '',
    currency: '',
    totals: {
      capital: 0,
      lease: 0,
      expense: 0,
      total: 0
    }
  });

  // เพิ่มฟังก์ชันสำหรับโหลดข้อมูลฟอร์มเดิม
  const fetchFormData = useCallback(async () => {
    try {
      console.log("Fetching form data for ID:", formId);
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseUrl}/api/forms/${formId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const { details, user_name, department } = response.data;
      let parsedDetails = {};
      
      if (typeof details === 'string') {
        parsedDetails = JSON.parse(details);
      } else {
        parsedDetails = details;
      }
      
      console.log("Loaded form details:", parsedDetails);

      // ใช้ฟอร์ม functional update เพื่อหลีกเลี่ยงการอ้างถึง formData ปัจจุบัน
      setFormData(prevFormData => ({
        ...prevFormData,  // เก็บค่าพื้นฐานไว้
        ...parsedDetails, // เขียนทับด้วยข้อมูลที่โหลดมา
        name: parsedDetails.name || user_name || user?.name || '',
        department: parsedDetails.department || department || '',
        items: parsedDetails.items || [{
          carNumber: '',
          startDate: '',
          description: '',
          capital: '',
          lease: '',
          expense: '',
          total: ''
        }],
        purpose: parsedDetails.purpose || {
          replacement: false,
          expansion: false,
          costReduction: false,
          qualityImprovement: false,
          other: false,
          otherText: ''
        },
        totals: parsedDetails.totals || {
          capital: 0,
          lease: 0,
          expense: 0,
          total: 0
        }
      }));
      
    } catch (error) {
      console.error('Error fetching form:', error);
      alert('Error fetching form data');
    }
  }, [formId, user?.name]); // ลบ formData ออกจาก dependencies

  // เพิ่ม useEffect เพื่อโหลดข้อมูลเมื่อมีการเปิดฟอร์มพร้อม ID
  useEffect(() => {
    if (formId) {
      if (formDataFromState) {
        try {
          console.log("Using form data from state:", formDataFromState);
          const details = typeof formDataFromState.details === 'string' 
            ? JSON.parse(formDataFromState.details)
            : formDataFromState.details;
          
          console.log("Parsed details from formDataFromState:", details);
          
          setFormData(prev => {
            const newFormData = {
              ...prev,
              ...details,
              name: formDataFromState.user_name || user?.name || '',
              department: details.department || formDataFromState.department || ''
            };
            console.log("New form data set:", newFormData);
            return newFormData;
          });
        } catch (error) {
          console.error('Error parsing form data:', error);
          fetchFormData();
        }
      } else {
        fetchFormData();
      }
    }
  }, [formId, formDataFromState, fetchFormData, user?.name]);
  
  const departments = [
    'Group Management',
    'Customer Service',
    'Finance and Accounting',
    'Sales and Marketing',
    'Information Communication and Technology',
    'Human Resources',
    'Occupational Health and Safety',
    'Operation and Production',
    'Production Planning and Control',
    'Purchasing',
    'Maintenance and Engineering',
    'Quality Control',
    'Warehouse and Distribution',
    'Product Innovation',
    'New Products Development',
    'Regulatory and Technical Information'
  ];

  const companies = [
    'NWF Thailand',
    'NWF Philippines',
    'NWF Australia'
  ];

  const currencies = ['THB', 'PHP', 'AUD'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    console.log(`Input change: ${name} = ${type === 'checkbox' ? checked : value}`);
    
    if (name.startsWith('purpose.')) {
      const purposeKey = name.split('.')[1];
      setFormData(prev => {
        const newForm = {
          ...prev,
          purpose: {
            ...prev.purpose,
            [purposeKey]: type === 'checkbox' ? checked : value
          }
        };
        console.log("Updated form data (purpose):", newForm);
        return newForm;
      });
    } else {
      setFormData(prev => {
        const newForm = {
          ...prev,
          [name]: value
        };
        console.log("Updated form data:", newForm);
        return newForm;
      });
    }
  };

  const handleItemChange = (index, field, value) => {
    console.log(`Item change: row ${index}, field ${field} = ${value}`);
    
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };

    // Calculate total for the row
    if (['capital', 'lease', 'expense'].includes(field)) {
      const capital = parseFloat(newItems[index].capital) || 0;
      const lease = parseFloat(newItems[index].lease) || 0;
      const expense = parseFloat(newItems[index].expense) || 0;
      newItems[index].total = (capital + lease + expense).toFixed(2);
    }

    // Calculate totals for all columns
    const totals = newItems.reduce((acc, item) => ({
      capital: acc.capital + (parseFloat(item.capital) || 0),
      lease: acc.lease + (parseFloat(item.lease) || 0),
      expense: acc.expense + (parseFloat(item.expense) || 0),
      total: acc.total + (parseFloat(item.total) || 0)
    }), { capital: 0, lease: 0, expense: 0, total: 0 });

    setFormData(prev => {
      const newForm = {
        ...prev,
        items: newItems,
        totals
      };
      console.log("Updated items and totals:", newItems, totals);
      return newForm;
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        carNumber: '',
        startDate: '',
        description: '',
        capital: '',
        lease: '',
        expense: '',
        total: ''
      }]
    }));
  };

  const handleDeleteItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting form with data:", formData);
      
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // แก้ไขการสร้าง URL เหมือนกับ handleSaveDraft
      const url = formId 
        ? `${baseUrl}/api/forms/${formId}`
        : `${baseUrl}/api/forms`;
      
      const method = formId ? 'put' : 'post';
      
      console.log('Sending request to:', url);
      console.log('Method:', method);
      console.log('Form ID:', formId);
      
      const requestData = {
        form_name: "Minor Capital Authorization Request",
        user_name: formData.name,
        department: formData.department,
        status: 'Waiting For Approve',
        details: formData
      };
      
      console.log("Request data:", requestData);
      
      const response = await axios[method](
        url,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log("Submit response:", response.data);
      
      if (response.data) {
        alert('Data saved successfully');
        const newFormId = response.data.insertedId || formId;
        setInsertedId(newFormId);
        navigate('/my-forms');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      console.error('Error details:', error.response?.data);
      alert('Error saving data');
    }
  };

  // แยกฟังก์ชันสำหรับ save draft
  const handleSaveDraft = async () => {
    try {
      console.log("Saving draft with form data:", formData);
      
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // แก้ไขการสร้าง URL
      const url = formId 
        ? `${baseUrl}/api/forms/${formId}`
        : `${baseUrl}/api/forms`;
      
      const method = formId ? 'put' : 'post';
      
      console.log('Sending request to:', url);
      console.log('Method:', method);
      console.log('Form ID:', formId);
      
      const requestData = {
        form_name: "Minor Capital Authorization Request",
        user_name: formData.name,
        department: formData.department,
        status: 'Draft',
        details: formData
      };
      
      console.log("Request data:", requestData);
      
      const response = await axios[method](url, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Save draft response:", response.data);
      
      if (response.data) {
        alert('✅ Draft saved successfully!');
        const newFormId = response.data.insertedId || formId;
        setInsertedId(newFormId);
        navigate('/my-forms');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      console.error('Error details:', error.response?.data);
      alert('❌ Error saving draft');
    }
  };

  // ปุ่ม Send Email
  const handleSendEmail = async () => {
    if (!formData.email) {
      alert('Please enter Email before sending email');
      return;
    }
    if (!insertedId) {
      alert('Form has not been saved yet, cannot send email');
      return;
    }
  
    try {
      setIsSendingEmail(true);
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.post(`${baseUrl}/api/forms/pdf-email`, {
        id: insertedId,
        email: formData.email
      });
      alert('✅ Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('❌ Error sending email');
    } finally {
      setIsSendingEmail(false);
    }
  };
  
  // Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="minor-form-container">
      <div className="minor-form-header-title">
        <img 
          src="https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png"
          alt="Company Logo" 
          className="minor-company-logo"
        />
        <h1>Minor Capital Authorization Request</h1>
        <p className="minor-subtitle">(In Local Currency &amp; for Projects less than 10,000 AUD)</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="minor-form-header">
          <div className="minor-form-group">
            <label>Operating Company:</label>
            <select
              name="operatingCompany"
              value={formData.operatingCompany}
              onChange={handleChange}
              required
            >
              <option value="">Select...</option>
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>

          <div className="minor-form-group">
            <label>Department:</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">Select...</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="minor-form-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="minor-form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              readOnly
              style={{ backgroundColor: '#f0f0f0' }}
            />
          </div>

          <div className="minor-form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="minor-purpose-section">
          <h3>PURPOSE:</h3>
          <div className="minor-checkbox-group">
            <label>
              <input
                type="checkbox"
                name="purpose.replacement"
                checked={formData.purpose.replacement}
                onChange={handleChange}
              />
              Replacement
            </label>
            <label>
              <input
                type="checkbox"
                name="purpose.expansion"
                checked={formData.purpose.expansion}
                onChange={handleChange}
              />
              Expansion
            </label>
            <label>
              <input
                type="checkbox"
                name="purpose.costReduction"
                checked={formData.purpose.costReduction}
                onChange={handleChange}
              />
              Cost Reduction
            </label>
            <label>
              <input
                type="checkbox"
                name="purpose.qualityImprovement"
                checked={formData.purpose.qualityImprovement}
                onChange={handleChange}
              />
              Quality Improvement
            </label>
            <label>
              <input
                type="checkbox"
                name="purpose.other"
                checked={formData.purpose.other}
                onChange={handleChange}
              />
              Other:
              <input
                type="text"
                name="purpose.otherText"
                value={formData.purpose.otherText}
                onChange={handleChange}
                disabled={!formData.purpose.other}
              />
            </label>
          </div>
        </div>

        <div className="minor-project-summary">
          <h3>PROJECT SUMMARY</h3>
          <textarea
            name="projectSummary"
            value={formData.projectSummary}
            onChange={handleChange}
            rows="4"
          />
        </div>

        {/* ---------------- ย้าย COUNTRY & CURRENCY มาไว้โซนเดียวกับตาราง CAR# ---------------- */}
        <div className="minor-currency-section">
          <label>COUNTRY:</label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
          >
            <option value="">Select...</option>
            <option value="Thailand">Thailand</option>
            <option value="Philippines">Philippines</option>
            <option value="Australia">Australia</option>
          </select>

          <label>CURRENCY:</label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            required
          >
            <option value="">Select...</option>
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
        {/* ----------------------------------------------------------------------------- */}

        <table className="minor-items-table">
          <thead>
            <tr>
              <th>CAR#</th>
              <th>START DATE</th>
              <th>DESCRIPTION</th>
              <th>CAPITAL</th>
              <th>LEASE</th>
              <th>EXPENSE</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    value={item.carNumber}
                    onChange={(e) => handleItemChange(index, 'carNumber', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={item.startDate}
                    onChange={(e) => handleItemChange(index, 'startDate', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.capital}
                    onChange={(e) => handleItemChange(index, 'capital', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.lease}
                    onChange={(e) => handleItemChange(index, 'lease', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.expense}
                    onChange={(e) => handleItemChange(index, 'expense', e.target.value)}
                  />
                </td>
                <td className="amount-cell">
                  {parseFloat(item.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  <button
                    type="button"
                    className="minor-delete-btn outside"
                    onClick={() => handleDeleteItem(index)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {/* ----------------- เพิ่มส่วนแสดงผลรวม TOTAL ----------------- */}
          <tfoot>
            <tr>
              <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>TOTAL:</td>
              <td style={{ fontWeight: 'bold' }}>
                {parseFloat(formData.totals.capital).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td style={{ fontWeight: 'bold' }}>
                {parseFloat(formData.totals.lease).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td style={{ fontWeight: 'bold' }}>
                {parseFloat(formData.totals.expense).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td style={{ fontWeight: 'bold' }}>
                {parseFloat(formData.totals.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
          {/* --------------------------------------------------------- */}
        </table>

        <button type="button" onClick={addItem} className="minor-add-item-btn">
          ➕ Add Line
        </button>

        {/* 
          ----------------------------------------------------------------
          ส่วน footer เดิม เก็บไว้เหมือนเดิม แต่เอา country/currency ออกไปแล้ว
          ----------------------------------------------------------------
        */}
        <div className="minor-form-footer">
          <div className="minor-approval-section">
            <table className="minor-approval-table">
              <thead>
                <tr>
                  <th colSpan="3">OPERATING COMPANY</th>
                  <th colSpan="3">REGIONAL MANAGEMENT</th>
                </tr>
                <tr>
                  <th>TITLE</th>
                  <th>SIGNATURE</th>
                  <th>DATE</th>
                  <th>TITLE</th>
                  <th>SIGNATURE</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Department Manager</td>
                  <td></td>
                  <td></td>
                  <td>MD, SE Asia<p>
                  Anthony C.</p></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Financial Controller</td>
                  <td></td>
                  <td></td>
                  <td>For GWF<p>
                  Paul F.</p></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>General Manager</td>
                  <td></td>
                  <td></td>
                  <td>For NWF<p>
                  T.Whelan</p></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="minor-button-group">
          <button type="button" className="button draft-btn" onClick={handleSaveDraft}>
            💾 Save as Draft
          </button>

          <button type="submit" className="button submit-btn">
            📩 Submit Form
          </button>

          <button
            type="button"
            className="button"
            onClick={handleSendEmail}
            disabled={!formData.email || !insertedId || isSendingEmail}
          >
            ✉️ {isSendingEmail ? 'Sending...' : 'Send Email'}
          </button>

          <button
            type="button"
            className="button print-btn"
            onClick={handlePrint}
          >
            🖨 Print
          </button>
        </div>
      </form>
    </div>
  );
};

export default MinorForm;
