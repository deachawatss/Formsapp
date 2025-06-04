import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/MajorForm.css';

const MajorForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const [insertedId, setInsertedId] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // ดึง ID จาก URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const formId = queryParams.get('id');

  const [formData, setFormData] = useState({
    operatingCompany: '',
    department: '',
    date: new Date().toISOString().split('T')[0],
    name: user?.name || '',
    email: user?.email || '',
    projectDescription: '',
    // แยกส่วน Addition
    additionSection: {
      capitalAddition: { previouslyApproved: '', thisRequest: '' },
      capitalRelatedExpense: { previouslyApproved: '', thisRequest: '' },
      pvLeasePayment: { previouslyApproved: '', thisRequest: '' },
    },
    // แยกส่วน Disposal
    disposalSection: {
      capitalDisposal: { previouslyApproved: '', thisRequest: '' },
      capitalRelatedExpense2: { previouslyApproved: '', thisRequest: '' },
      expense: { previouslyApproved: '', thisRequest: '' },
      otherInitialCost: { previouslyApproved: '', thisRequest: '' }
    },
    // Authorization
    authorizationType: {
      capitalAddition: false,
      expansion: false,
      newDevelopment: false,
      qualityImprovement: false,
      other: false,
      otherText: '',
      replacement: false,
      costProfit: false,
      capitalDisposal: false
    },
    // Car Type
    carType: {
      design: false,
      basic: false,
      supplemental: false
    },
    // Currency
    localCurrency: '',
    exchangeRate: '',
    futureCommitment: 'No',

    // Lease Payments
    leasePayments: [
      {
        rent: '',
        for: '',
        budgetedAmount: '',
        changeFromBudget: '',
        startDate: '',
        operationalDate: '',
        postReviewDate: ''
      }
    ],

    // Financial/Economic
    financialImpact: {
      year: '',
      profitLossEffect: '',
      cashFlow: '',
      includesCurrentBudget1: '',
      includesCurrentBudget2: ''
    },
    economicImpact: {
      internalRate: '',
      netPresentValue: '',
      discountRate: '',
      projectLife: '',
      afterTaxPayback: ''
    }
  });

  // โหลดข้อมูลฟอร์มเมื่อเปิดในโหมดแก้ไข
  useEffect(() => {
    const loadFormData = async () => {
      if (formId) {
        try {
          const token = localStorage.getItem('token');
          const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          const response = await axios.get(`${baseUrl}/api/forms/${formId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.data) {
            setIsEditMode(true);
            setInsertedId(formId);
            
            // แปลง details เป็น object ถ้าเป็น string
            let details = response.data.details;
            if (typeof details === 'string') {
              details = JSON.parse(details);
            }
            
            // อัพเดท formData ด้วยข้อมูลที่โหลดมา
            setFormData(prevData => ({
              ...prevData,
              ...details
            }));
          }
        } catch (error) {
          console.error('Error loading form data:', error);
          alert('Error loading form data');
        }
      }
    };

    loadFormData();
  }, [formId]);

  const departments = [
    'Group Management', 'Customer Service', 'Finance and Accounting',
    'Sales and Marketing', 'Information Communication and Technology', 
    'Human Resources', 'Occupational Health and Safety', 
    'Operation and Production', 'Production Planning and Control', 
    'Purchasing', 'Maintenance and Engineering', 'Quality Control', 
    'Warehouse and Distribution', 'Product Innovation',
    'New Products Development', 'Regulatory and Technical Information'
  ];

  const companies = [
    'NWF Thailand',
    'NWF Philippines',
    'NWF Australia'
  ];

  const currencies = ['AUD', 'THB', 'PHP', 'USD'];

  // ------------------ HANDLERS ------------------ //
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // สำหรับ checkbox authorizationType / carType
    if (name.startsWith('authorizationType.') || name.startsWith('carType.')) {
      const [section, key] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: type === 'checkbox' ? checked : value
        }
      }));
    } 
    // สำหรับ nested fields เช่น financialImpact.includesCurrentBudget1
    else if (name.includes('.')) {
      const [section, key] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      }));
    } 
    else {
      // ฟิลด์ทั่วไป
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // เปลี่ยนค่าใน additionSection
  const handleAdditionChange = (field, subField, val) => {
    setFormData(prev => ({
      ...prev,
      additionSection: {
        ...prev.additionSection,
        [field]: {
          ...prev.additionSection[field],
          [subField]: val
        }
      }
    }));
  };

  // เปลี่ยนค่าใน disposalSection
  const handleDisposalChange = (field, subField, val) => {
    setFormData(prev => ({
      ...prev,
      disposalSection: {
        ...prev.disposalSection,
        [field]: {
          ...prev.disposalSection[field],
          [subField]: val
        }
      }
    }));
  };

  // Lease Payment
  const handleLeaseChange = (index, field, value) => {
    const newLeasePayments = [...formData.leasePayments];
    newLeasePayments[index] = {
      ...newLeasePayments[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      leasePayments: newLeasePayments
    }));
  };

  const handleDeleteLeaseLine = (index) => {
    const newLeasePayments = [...formData.leasePayments];
    newLeasePayments.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      leasePayments: newLeasePayments
    }));
  };

  const addLeaseLine = () => {
    setFormData(prev => ({
      ...prev,
      leasePayments: [
        ...prev.leasePayments,
        {
          rent: '',
          for: '',
          budgetedAmount: '',
          changeFromBudget: '',
          startDate: '',
          operationalDate: '',
          postReviewDate: ''
        }
      ]
    }));
  };

  // ------------------ CALCULATIONS ------------------ //
  // ผลรวมในแต่ละแถว = previouslyApproved + thisRequest
  const rowTotal = (obj) => {
    if (!obj) return '0.00';
    const prev = parseFloat(obj.previouslyApproved) || 0;
    const curr = parseFloat(obj.thisRequest) || 0;
    return (prev + curr).toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  // รวมเฉพาะส่วน Addition
  const totalAdditionRequest = () => {
    const { capitalAddition, capitalRelatedExpense, pvLeasePayment } = formData.additionSection;
    const sumPrev = (parseFloat(capitalAddition.previouslyApproved) || 0)
                  + (parseFloat(capitalRelatedExpense.previouslyApproved) || 0)
                  + (parseFloat(pvLeasePayment.previouslyApproved) || 0);

    const sumThis = (parseFloat(capitalAddition.thisRequest) || 0)
                  + (parseFloat(capitalRelatedExpense.thisRequest) || 0)
                  + (parseFloat(pvLeasePayment.thisRequest) || 0);

    return {
      prev: sumPrev.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      thisReq: sumThis.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      total: (sumPrev + sumThis).toLocaleString('en-US', { minimumFractionDigits: 2 })
    };
  };

  // รวมเฉพาะส่วน Disposal
  const totalDisposalRequest = () => {
    const { capitalDisposal, capitalRelatedExpense2, expense } = formData.disposalSection;
    const sumPrev = (parseFloat(capitalDisposal.previouslyApproved) || 0)
                  + (parseFloat(capitalRelatedExpense2.previouslyApproved) || 0)
                  + (parseFloat(expense.previouslyApproved) || 0);

    const sumThis = (parseFloat(capitalDisposal.thisRequest) || 0)
                  + (parseFloat(capitalRelatedExpense2.thisRequest) || 0)
                  + (parseFloat(expense.thisRequest) || 0);

    return {
      prev: sumPrev.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      thisReq: sumThis.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      total: (sumPrev + sumThis).toLocaleString('en-US', { minimumFractionDigits: 2 })
    };
  };

  // สำหรับ Other Initial Cost
  const rowTotalOtherInitial = () => {
    const { otherInitialCost } = formData.disposalSection;
    return rowTotal(otherInitialCost);
  };

  // ------------------ SUBMIT ------------------ //
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const formPayload = {
        form_name: "Major Capital Authorization Request",
        user_name: formData.name,
        department: formData.department,
        status: 'Waiting For Approve',
        details: formData
      };

      let response;
      if (isEditMode) {
        // ถ้าเป็นการแก้ไข ใช้ PUT
        response = await axios.put(
          `${baseUrl}/api/forms/${formId}`,
          formPayload,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
      } else {
        // ถ้าเป็นการสร้างใหม่ ใช้ POST
        response = await axios.post(
          `${baseUrl}/api/forms`,
          formPayload,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
      }
      
      if (response.data) {
        alert('✅ Submitted successfully');
        if (!isEditMode) {
          const newFormId = response.data.insertedId;
          setInsertedId(newFormId);
        }
        navigate('/my-forms');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    }
  };

  // แยกฟังก์ชันสำหรับ save draft
  const handleSaveDraft = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const formPayload = {
        form_name: "Major Capital Authorization Request",
        user_name: formData.name,
        department: formData.department,
        status: 'Draft',
        details: formData
      };

      let response;
      if (isEditMode) {
        // ถ้าเป็นการแก้ไข ใช้ PUT
        response = await axios.put(
          `${baseUrl}/api/forms/${formId}`,
          formPayload,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
      } else {
        // ถ้าเป็นการสร้างใหม่ ใช้ POST
        response = await axios.post(
          `${baseUrl}/api/forms`,
          formPayload,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
      }
      
      if (response.data) {
        alert('✅ Draft saved successfully!');
        if (!isEditMode) {
          const newFormId = response.data.insertedId;
          setInsertedId(newFormId);
        }
        navigate('/my-forms');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('❌ Error saving draft');
    }
  };

  // ปุ่ม Send Email
  const handleSendEmail = async () => {
    if (!formData.supervisorEmail) {
      alert('Please fill in the email before sending email');
      return;
    }
    if (!insertedId) {
      alert('Form not saved yet, cannot send email');
      return;
    }
  
    try {
      setIsSendingEmail(true);
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.post(`${baseUrl}/api/forms/pdf-email`, {
        id: insertedId,
        email: formData.supervisorEmail
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

  // ------------------ RENDER ------------------ //
  return (
    <div className="major-form-container">
      <div className="major-form-header">
        <img 
          src="https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png"
          alt="Company Logo" 
          className="major-company-logo"
        />
        <h1>
          Major Capital Authorization Request 
          <span>(For Capital Projects {'>'} AUD 10,000)</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* -------------------- INPUT SECTION 1 -------------------- */}
        <div className="major-input-section">
          <div className="major-form-group">
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

          <div className="major-form-group">
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

          <div className="major-form-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* -------------------- INPUT SECTION 2 -------------------- */}
        <div className="major-input-section">
          <div className="major-form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              readOnly
              style={{ backgroundColor: '#f0f0f0' }}
            />
          </div>

          <div className="major-form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="major-form-group">
            <label>CAR: No. NWF:</label>
            <input
              type="text"
              name="carNumber"
              value={formData.carNumber}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* -------------------- PROJECT DESCRIPTION -------------------- */}
        <div className="major-project-description">
          <label>Project Description:</label>
          <textarea
            name="projectDescription"
            value={formData.projectDescription}
            onChange={handleChange}
            placeholder="Enter project description"
          />
        </div>

        <div className="major-project-summary">
          <h3>Project Summary</h3>
          <textarea
            name="projectSummary"
            value={formData.projectSummary}
            onChange={handleChange}
          />
        </div>

        {/* ===================== SINGLE TABLE (Addition + Disposal) ===================== */}
        <div className="major-authority-section">
          <div className="major-authority-table">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Previously Approved</th>
                  <th>This Request</th>
                  <th>Total Request</th>
                </tr>
              </thead>
              <tbody>
                {/* ---------- ADDITION SECTION ---------- */}
                <tr>
                  <td>Capital Addition</td>
                  <td>
                    <input
                      type="number"
                      value={formData.additionSection.capitalAddition.previouslyApproved}
                      onChange={(e) => handleAdditionChange('capitalAddition', 'previouslyApproved', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={formData.additionSection.capitalAddition.thisRequest}
                      onChange={(e) => handleAdditionChange('capitalAddition', 'thisRequest', e.target.value)}
                    />
                  </td>
                  <td>{rowTotal(formData.additionSection.capitalAddition)}</td>
                </tr>
                <tr>
                  <td>Capital-Related Expense</td>
                  <td>
                    <input
                      type="number"
                      value={formData.additionSection.capitalRelatedExpense.previouslyApproved}
                      onChange={(e) => handleAdditionChange('capitalRelatedExpense', 'previouslyApproved', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={formData.additionSection.capitalRelatedExpense.thisRequest}
                      onChange={(e) => handleAdditionChange('capitalRelatedExpense', 'thisRequest', e.target.value)}
                    />
                  </td>
                  <td>{rowTotal(formData.additionSection.capitalRelatedExpense)}</td>
                </tr>
                <tr>
                  <td>PV of Lease Payment</td>
                  <td>
                    <input
                      type="number"
                      value={formData.additionSection.pvLeasePayment.previouslyApproved}
                      onChange={(e) => handleAdditionChange('pvLeasePayment', 'previouslyApproved', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={formData.additionSection.pvLeasePayment.thisRequest}
                      onChange={(e) => handleAdditionChange('pvLeasePayment', 'thisRequest', e.target.value)}
                    />
                  </td>
                  <td>{rowTotal(formData.additionSection.pvLeasePayment)}</td>
                </tr>
                <tr>
                  <td>Total Addition Request</td>
                  <td>{totalAdditionRequest().prev}</td>
                  <td>{totalAdditionRequest().thisReq}</td>
                  <td>{totalAdditionRequest().total}</td>
                </tr>

                {/* ---------- DISPOSAL SECTION ---------- */}
                <tr style={{ height: '10px' }}></tr>
                <tr>
                  <td>Capital Disposal</td>
                  <td>
                    <input
                      type="number"
                      value={formData.disposalSection.capitalDisposal.previouslyApproved}
                      onChange={(e) => handleDisposalChange('capitalDisposal', 'previouslyApproved', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={formData.disposalSection.capitalDisposal.thisRequest}
                      onChange={(e) => handleDisposalChange('capitalDisposal', 'thisRequest', e.target.value)}
                    />
                  </td>
                  <td>{rowTotal(formData.disposalSection.capitalDisposal)}</td>
                </tr>
                <tr>
                  <td>Capital-Related Expense</td>
                  <td>
                    <input
                      type="number"
                      value={formData.disposalSection.capitalRelatedExpense2.previouslyApproved}
                      onChange={(e) => handleDisposalChange('capitalRelatedExpense2', 'previouslyApproved', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={formData.disposalSection.capitalRelatedExpense2.thisRequest}
                      onChange={(e) => handleDisposalChange('capitalRelatedExpense2', 'thisRequest', e.target.value)}
                    />
                  </td>
                  <td>{rowTotal(formData.disposalSection.capitalRelatedExpense2)}</td>
                </tr>
        
                <tr>
                  <td>Total Disposal Request</td>
                  <td>{totalDisposalRequest().prev}</td>
                  <td>{totalDisposalRequest().thisReq}</td>
                  <td>{totalDisposalRequest().total}</td>
                </tr>
                <tr>
                  <td>Other Initial Cost</td>
                  <td>
                    <input
                      type="number"
                      value={formData.disposalSection.otherInitialCost.previouslyApproved}
                      onChange={(e) => handleDisposalChange('otherInitialCost', 'previouslyApproved', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={formData.disposalSection.otherInitialCost.thisRequest}
                      onChange={(e) => handleDisposalChange('otherInitialCost', 'thisRequest', e.target.value)}
                    />
                  </td>
                  <td>{rowTotalOtherInitial()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* -------------------- RIGHT SECTION (Authorization, Car Type, Currency) -------------------- */}
          <div className="major-right-section">
            <div className="major-authorization-type">
              <h3>Authorization Type</h3>
              <div className="major-checkbox-group">
                <div className="major-checkbox-column">
                  <label>
                    <input
                      type="checkbox"
                      name="authorizationType.capitalAddition"
                      checked={formData.authorizationType.capitalAddition}
                      onChange={handleChange}
                    />
                    Capital Addition
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="authorizationType.expansion"
                      checked={formData.authorizationType.expansion}
                      onChange={handleChange}
                    />
                    Expansion
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="authorizationType.newDevelopment"
                      checked={formData.authorizationType.newDevelopment}
                      onChange={handleChange}
                    />
                    New Development
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="authorizationType.qualityImprovement"
                      checked={formData.authorizationType.qualityImprovement}
                      onChange={handleChange}
                    />
                    Quality Improvement
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="authorizationType.other"
                      checked={formData.authorizationType.other}
                      onChange={handleChange}
                    />
                    Other:
                    <input
                      type="text"
                      name="authorizationType.otherText"
                      value={formData.authorizationType.otherText}
                      onChange={handleChange}
                      className="other-input"
                    />
                  </label>
                </div>
                <div className="major-checkbox-column">
                  <label>
                    <input
                      type="checkbox"
                      name="authorizationType.replacement"
                      checked={formData.authorizationType.replacement}
                      onChange={handleChange}
                    />
                    Replacement
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="authorizationType.costProfit"
                      checked={formData.authorizationType.costProfit}
                      onChange={handleChange}
                    />
                    Cost/Profit
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="authorizationType.capitalDisposal"
                      checked={formData.authorizationType.capitalDisposal}
                      onChange={handleChange}
                    />
                    Capital Disposal
                  </label>
                </div>
              </div>
            </div>

            <div className="major-car-type">
              <h3>Car Type</h3>
              <div className="major-checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="carType.design"
                    checked={formData.carType.design}
                    onChange={handleChange}
                  />
                  Design
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="carType.basic"
                    checked={formData.carType.basic}
                    onChange={handleChange}
                  />
                  Basic
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="carType.supplemental"
                    checked={formData.carType.supplemental}
                    onChange={handleChange}
                  />
                  Supplemental
                </label>
              </div>
            </div>

            <div className="major-currency-section">
              <div className="major-form-group">
                <label>Local Currency:</label>
                <select
                  name="localCurrency"
                  value={formData.localCurrency}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select...</option>
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
              <div className="major-form-group">
                <label>Exch Rate:</label>
                <input
                  type="number"
                  name="exchangeRate"
                  value={formData.exchangeRate}
                  onChange={handleChange}
                />
              </div>
              <div className="major-form-group">
                <label>Future Commitment Required:</label>
                <div className="major-radio-group">
                  <label>
                    <input
                      type="radio"
                      name="futureCommitment"
                      value="Yes"
                      checked={formData.futureCommitment === 'Yes'}
                      onChange={handleChange}
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="futureCommitment"
                      value="No"
                      checked={formData.futureCommitment === 'No'}
                      onChange={handleChange}
                    />
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------- LEASE PAYMENT TABLE -------------------- */}
        <div className="major-lease-payment-table">
          <table>
            <thead>
              <tr>
                <th>Lease or Continued Payment</th>
                <th>Budgeted Amount</th>
                <th>Change From Budget</th>
                <th>Start Date</th>
                <th>Operational Date</th>
                <th>Post Review Date</th>
              </tr>
            </thead>
            <tbody>
              {formData.leasePayments.map((payment, index) => (
                <tr key={index}>
                  <td>
                    <div className="lease-payment-inputs">
                      <div className="lease-input-group">
                        <label>Min: $</label>
                        <input
                          type="number"
                          value={payment.rent}
                          onChange={(e) => handleLeaseChange(index, 'rent', e.target.value)}
                        />
                      </div>
                      <div className="lease-input-group">
                        <label>For:</label>
                        <input
                          type="text"
                          value={payment.for}
                          onChange={(e) => handleLeaseChange(index, 'for', e.target.value)}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={payment.budgetedAmount}
                      onChange={(e) => handleLeaseChange(index, 'budgetedAmount', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={payment.changeFromBudget}
                      onChange={(e) => handleLeaseChange(index, 'changeFromBudget', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={payment.startDate}
                      onChange={(e) => handleLeaseChange(index, 'startDate', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={payment.operationalDate}
                      onChange={(e) => handleLeaseChange(index, 'operationalDate', e.target.value)}
                    />
                  </td>
                  <td className="lease-delete-cell">
                    <div className="lease-delete-wrapper">
                      <input
                        type="date"
                        value={payment.postReviewDate}
                        onChange={(e) => handleLeaseChange(index, 'postReviewDate', e.target.value)}
                      />
                      <button
                        type="button"
                        className="major-delete-btn outside"
                        onClick={() => handleDeleteLeaseLine(index)}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addLeaseLine} className="major-add-line-btn">
          ➕ Add Line
          </button>
        </div>

        {/* -------------------- IMPACT SECTION -------------------- */}
        <div className="major-impact-section">
          <div className="major-financial-impact">
            <h3>Financial Impact</h3>
            <div className="financial-tables-container">
              <table className="major-financial-table">
                <tbody>
                  <tr>
                    <td className="label-cell">YEAR:</td>
                    <td>
                      <input
                        type="text"
                        name="financialImpact.year1"
                        value={formData.financialImpact.year1}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="financialImpact.year2"
                        value={formData.financialImpact.year2}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="financialImpact.year3"
                        value={formData.financialImpact.year3}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="financialImpact.year4"
                        value={formData.financialImpact.year4}
                        onChange={handleChange}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">PROFIT/LOSS EFFECT $$:</td>
                    <td>
                      <input
                        type="number"
                        name="financialImpact.profitLoss1"
                        value={formData.financialImpact.profitLoss1}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="financialImpact.profitLoss2"
                        value={formData.financialImpact.profitLoss2}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="financialImpact.profitLoss3"
                        value={formData.financialImpact.profitLoss3}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="financialImpact.profitLoss4"
                        value={formData.financialImpact.profitLoss4}
                        onChange={handleChange}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">CASH FLOW (POS/NEG):</td>
                    <td>
                      <input
                        type="number"
                        name="financialImpact.cashFlow1"
                        value={formData.financialImpact.cashFlow1}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="financialImpact.cashFlow2"
                        value={formData.financialImpact.cashFlow2}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="financialImpact.cashFlow3"
                        value={formData.financialImpact.cashFlow3}
                        onChange={handleChange}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="financialImpact.cashFlow4"
                        value={formData.financialImpact.cashFlow4}
                        onChange={handleChange}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="major-budget-table">
                <thead>
                  <tr>
                    <th>Includes Current Budget</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <input
                        type="text"
                        name="financialImpact.includesCurrentBudget1"
                        value={formData.financialImpact.includesCurrentBudget1}
                        onChange={handleChange}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <input
                        type="text"
                        name="financialImpact.includesCurrentBudget2"
                        value={formData.financialImpact.includesCurrentBudget2}
                        onChange={handleChange}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="major-economic-impact">
            <h3>Economic Impact</h3>
            <div className="major-economic-header">
              <span>In AU Dollars</span>
            </div>
            <table className="major-economic-table">
              <thead>
                <tr>
                  <th>Internal Rate of Return (IRR) %</th>
                  <th>Net Present Value (NPV)</th>
                  <th>Discount Rate for NPV (%)</th>
                  <th>Project Life (Years)</th>
                  <th>After Tax Payback (Years)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input
                      type="number"
                      name="economicImpact.internalRate"
                      value={formData.economicImpact.internalRate}
                      onChange={handleChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="economicImpact.netPresentValue"
                      value={formData.economicImpact.netPresentValue}
                      onChange={handleChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="economicImpact.discountRate"
                      value={formData.economicImpact.discountRate}
                      onChange={handleChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="economicImpact.projectLife"
                      value={formData.economicImpact.projectLife}
                      onChange={handleChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="economicImpact.afterTaxPayback"
                      value={formData.economicImpact.afterTaxPayback}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* -------------------- APPROVAL SECTION -------------------- */}
        <div className="major-approval-section">
          <table className="major-approval-table">
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
                <td>MD, SE Asia<p>Anthony C.</p></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Financial Controller</td>
                <td></td>
                <td></td>
                <td>For GWF<p>Paul F.</p></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>General Manager</td>
                <td></td>
                <td></td>
                <td>For NWF<p>T.Whelan</p></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

   
        {/* -------------------- BUTTONS -------------------- */}
        <div className="major-button-group">
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
            disabled={!formData.supervisorEmail || !insertedId || isSendingEmail}
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

export default MajorForm;