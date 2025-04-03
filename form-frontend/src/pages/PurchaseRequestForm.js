import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/PurchaseRequest.css';
import { useNavigate, useLocation } from 'react-router-dom';

const PurchaseRequestForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const formId = queryParams.get('id');
  const user = JSON.parse(localStorage.getItem('user'));
  const formDataFromState = location.state?.formData;

  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    items: [
      { description: '', unit: '', quantity: '', cost: '', amount: '' }
    ],
    remarks: '',
    vendorName: '',
    vendorAddress1: '',
    vendorAddress2: '',
    vendorZip: '',
    CountryZip: '',
    currency: 'THB',
    terms: '7 Days',
    attn: '',
    supervisorEmail: '',
    deliveryDate: '',
    reasonType: '',
    reasonComments: '',
    depManagerComment: '',
    gmComment: '',
    signRequester: '',
    dateRequester: '',
    signDepartmentManager: '',
    dateDepartmentManager: '',
    signGeneralManager: '',
    dateGeneralManager: ''
  });

  const [insertedId, setInsertedId] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const departments = [
    'Group Management', 'Customer Service', 'Finance and Accounting',
    'Sales and Marketing',
    'Information Communication and Technology', 'Human Resources',
    'Occupational Health and Safety', 'Operation and Production',
    'Production Planning and Control', 'Purchasing', 'Maintenance and Engineering',
    'Quality Control', 'Warehouse and Distribution','Product Innovation'
    ,'New Products Development'
    ,'Regulatory and Technical Information'
  ];

  const currencies = ['AUD', 'JPY', 'EUR', 'THB', 'USD', 'PHP'];
  const termsList = ['7 Days', '15 Days', '30 Days', '45 Days', '60 Days', 'CASH', 'Bank Transfer', 'TT Advance'];

  const fetchFormData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://192.168.17.15:5000';
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

      const newFormData = {
        name: parsedDetails.name || user_name || user?.name || '',
        department: parsedDetails.department || department || '',
        date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        items: parsedDetails.items || [{ description: '', unit: '', quantity: '', cost: '', amount: '' }],
        remarks: parsedDetails.remarks || '',
        vendorName: parsedDetails.vendorName || '',
        vendorAddress1: parsedDetails.vendorAddress1 || '',
        vendorAddress2: parsedDetails.vendorAddress2 || '',
        vendorZip: parsedDetails.vendorZip || '',
        CountryZip: parsedDetails.CountryZip || '',
        currency: parsedDetails.currency || 'THB',
        terms: parsedDetails.terms || '7 Days',
        attn: parsedDetails.attn || '',
        supervisorEmail: parsedDetails.supervisorEmail || '',
        deliveryDate: parsedDetails.deliveryDate || '',
        reasonType: parsedDetails.reasonType || '',
        reasonComments: parsedDetails.reasonComments || '',
        depManagerComment: parsedDetails.depManagerComment || '',
        gmComment: parsedDetails.gmComment || '',
        signRequester: parsedDetails.signRequester || '',
        dateRequester: parsedDetails.dateRequester || '',
        signDepartmentManager: parsedDetails.signDepartmentManager || '',
        dateDepartmentManager: parsedDetails.dateDepartmentManager || '',
        signGeneralManager: parsedDetails.signGeneralManager || '',
        dateGeneralManager: parsedDetails.dateGeneralManager || ''
      };

      setFormData(newFormData);
      
    } catch (error) {
      console.error('Error fetching form:', error);
      alert('Error fetching form data');
    }
  }, [formId, user?.name]);

  useEffect(() => {
    if (formId) {
      if (formDataFromState) {
        try {
          const details = typeof formDataFromState.details === 'string' 
            ? JSON.parse(formDataFromState.details)
            : formDataFromState.details;
          
          setFormData(prev => ({
            ...prev,
            ...details,
            name: formDataFromState.user_name || user?.name || '',
            department: details.department || formDataFromState.department || ''
          }));
        } catch (error) {
          console.error('Error parsing form data:', error);
          fetchFormData();
        }
      } else {
        fetchFormData();
      }
    }
  }, [formId, formDataFromState, fetchFormData, user?.name]);

  // handleCellChange => ดัก onChange จาก <input> ในตาราง
  const handleCellChange = (e, rowIndex, field) => {
    const newItems = [...formData.items];
    const value = e.target.value;
    newItems[rowIndex][field] = value;

    // คำนวณ Amount จาก quantity และ cost
    if (['quantity', 'cost'].includes(field)) {
      const qty = parseFloat(newItems[rowIndex].quantity) || 0;
      const cst = parseFloat(newItems[rowIndex].cost) || 0;
      newItems[rowIndex].amount = (qty * cst).toFixed(2); 
    }

    setFormData({ ...formData, items: newItems });
  };

  // คำนวณ Subtotal, VAT, Grand Total
  const subTotalNum = formData.items.reduce((acc, item) => {
    const amt = parseFloat(item.amount) || 0;
    return acc + amt;
  }, 0);
  
  // เช็คสกุลเงิน ถ้าไม่ใช่ THB ให้ใช้ VAT 0%
  const isTHB = formData.currency === 'THB';
  const vatRate = isTHB ? 0.07 : 0;
  const vatLabel = isTHB ? 'VAT (7%)' : 'VAT (0%)';
  const vatNum = subTotalNum * vatRate;
  const grandTotalNum = subTotalNum + vatNum;

  const subTotalStr = subTotalNum.toLocaleString('en-US', { minimumFractionDigits: 2 });
  const vatStr = vatNum.toLocaleString('en-US', { minimumFractionDigits: 2 });
  const grandTotalStr = grandTotalNum.toLocaleString('en-US', { minimumFractionDigits: 2 });


  // เพิ่ม/ลบ rows
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', unit: '', quantity: '', cost: '', amount: '' }]
    }));
  };

  const handleDeleteItem = (rowIndex) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems.splice(rowIndex, 1);
      return { ...prev, items: newItems };
    });
  };

  // Handle change นอกตาราง
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // แยกฟังก์ชันสำหรับ save draft
  const handleSaveDraft = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://192.168.17.15:5000';
      
      // แก้ไขการสร้าง URL
      const url = formId 
        ? `${baseUrl}/api/forms/${formId}`
        : `${baseUrl}/api/forms`;
      
      const method = formId ? 'put' : 'post';
      
      console.log('Sending request to:', url);
      console.log('Method:', method);
      console.log('Form ID:', formId);
      
      const response = await axios[method](url, {
        form_name: "Purchase Request",
        user_name: formData.name,
        department: formData.department,
        status: 'Draft',
        details: JSON.stringify({
          ...formData,
          subTotal: subTotalNum,
          vat: vatNum,
          grandTotal: grandTotalNum
        })
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      alert('✅ Draft saved successfully!');
      
      const newFormId = response.data.insertedId || formId;
      setInsertedId(newFormId);
      
      navigate('/my-forms');
    } catch (error) {
      console.error('❌ Error:', error);
      console.error('Error response:', error.response);
      alert('❌ Error saving draft: ' + (error.response?.data?.error || error.message));
    }
  };

  // แก้ไข handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://192.168.17.15:5000';
      
      // แก้ไขการสร้าง URL เหมือนกับ handleSaveDraft
      const url = formId 
        ? `${baseUrl}/api/forms/${formId}`
        : `${baseUrl}/api/forms`;
      
      const method = formId ? 'put' : 'post';
      
      console.log('Sending request to:', url);
      console.log('Method:', method);
      console.log('Form ID:', formId);
      
      const response = await axios[method](url, {
        form_name: "Purchase Request",
        user_name: formData.name,
        department: formData.department,
        status: 'Waiting For Approve',
        details: JSON.stringify({
          ...formData,
          subTotal: subTotalNum,
          vat: vatNum,
          grandTotal: grandTotalNum
        })
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      alert('✅ Form submitted successfully!');
      
      const newFormId = response.data.insertedId || formId;
      setInsertedId(newFormId);
      
      navigate('/my-forms');
    } catch (error) {
      console.error('❌ Error:', error);
      console.error('Error response:', error.response);
      alert('❌ Error submitting form: ' + (error.response?.data?.error || error.message));
    }
  };

  // ปุ่ม Send Email (จะแยกออกจาก submit)
  const handleSendEmail = async () => {
    if (!formData.supervisorEmail) {
      alert('Please enter Manager Email before sending email');
      return;
    }
    if (!insertedId) {
      alert('Form has not been saved yet, cannot send email');
      return;
    }
  
    try {
      setIsSendingEmail(true);
      const baseUrl = process.env.REACT_APP_API_URL || 'http://192.168.17.15:5000';
      await axios.post(`${baseUrl}/api/forms/pdf-email`, {
        id: insertedId,
        email: formData.supervisorEmail
      });
      alert('✅ Email sent successfully!');
    } catch (error) {
      console.error('❌ Error sending email:', error);
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
    <div className="print-page">
      <div className="form-container">
        <div className="form-header">
          <img
            src="https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png"
            alt="Company Logo"
            className="company-logo"
          />
          <h1>Newly Weds Foods (Thailand) Limited</h1>
          <p>General Purchase Requisition</p>
          
          <p>FORM # PC-FM-013</p>
        </div>

        <form onSubmit={handleSubmit} id="purchaseRequestForm">
          {/* Row 1: Name, Dept, Date */}
          <div className="input-row">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              readOnly
              style={{ backgroundColor: '#f0f0f0' }}
            />

            <label>Department:</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">Select Department</option>
              {departments.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          {/* Row 2: Manager Email, Delivery Date */}
          <div className="input-row">
            <label>Email:</label>
            <input
              type="email"
              name="supervisorEmail"
              value={formData.supervisorEmail}
              onChange={handleChange}
            />

            <div className="date-group">
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

          {/* ตาราง Items (6 คอลัมน์) */}
          <table className="pr-table">
            <thead>
              <tr>
                <th>ITEM</th>
                <th>Description</th>
                <th>UOM</th>
                <th>Quantity</th>
                <th>Cost</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((row, index) => (
                <tr key={index} className="item-row">
                  <td>{index + 1}</td>
                  <td>
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => handleCellChange(e, index, 'description')}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) => handleCellChange(e, index, 'unit')}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) => handleCellChange(e, index, 'quantity')}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.cost}
                      onChange={(e) => handleCellChange(e, index, 'cost')}
                    />
                  </td>
                  <td className="amount-cell">
                    {parseFloat(row.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    <button
                      type="button"
                      className="delete-btn outside"
                      onClick={() => handleDeleteItem(index)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            className="button add-line-btn"
            onClick={addItem}
          >
            ➕ Add Item
          </button>

          <p></p>
          
          {/* Remarks */}
          <div className="remarks-box">
            <h4>Remarks / หมายเหตุ : </h4>
          <span className="asset-condition">
          โปรดระบุประเภทของสินค้าที่ต้องการว่าเป็นสินทรัพย์หรือเพื่อซ่อมแซม /
   Please specify type of goods as asset or repair-maintenance.<br />
  </span>
  <span className="asset-condition">
    สินทรัพย์ = อายุใช้งาน ≥ 1 ปี และมูลค่า ≥ 1,000.- บาท /
    Asset = Useful life ≥ 1 year, value ≥ 1,000.- Baht
  </span>
</div>
          {/* main-row => Vendor Info / Currency, Terms, Subtotal */}
          <div className="main-row">
          <div className="vendor-section">
  <h3>Vendor Info</h3>
  
  {/* Row 1: Vendor Name */}
  <div className="vendor-row">
    <label>Vendor Name:</label>
    <input
      type="text"
      name="vendorName"
      value={formData.vendorName}
      onChange={handleChange}
    />
  </div>



  {/* Address1 */}
  <div className="vendor-row">
    <label>Address1:</label>
    <input
      type="text"
      name="vendorAddress1"
      value={formData.vendorAddress1}
      onChange={handleChange}
    />
  </div>
  {/* Address2 */}
  <div className="vendor-row">
    <label>Address2:</label>
    <input
      type="text"
      name="vendorAddress2"
      value={formData.vendorAddress2}
      onChange={handleChange}
    />
  </div>
  {/* Zip */}
  <div className="vendor-row">
    <label>Zip Code:</label>
    <input
      type="text"
      name="vendorZip"
      value={formData.vendorZip}
      onChange={handleChange}
    />
  </div>
  {/* Country */}
  <div className="vendor-row">
    <label>Country:</label>
    <input
      type="text"
      name="CountryZip"
      value={formData.CountryZip}
      onChange={handleChange}
    />
  </div>
</div>
            
<div className="right-col summary-section">
  {/* Currency */}
  <div className="input-row no-wrap">
    <label>Currency:</label>
    <select
      name="currency"
      value={formData.currency}
      onChange={handleChange}
    >
      {currencies.map(curr => (
        <option key={curr} value={curr}>{curr}</option>
      ))}
    </select>

    <label>Terms:</label>
    <select
      name="terms"
      value={formData.terms}
      onChange={handleChange}
    >
      {termsList.map(term => (
        <option key={term} value={term}>{term}</option>
      ))}
    </select>
  </div>

      


              <div className="summary compact-summary">
                <p style={{ margin: '3px 0' }}>
                  Sub Total: {subTotalStr} {formData.currency}
                </p>
                <p style={{ margin: '3px 0' }}>
                  {vatLabel}: {vatStr} {formData.currency}
                </p>
                <h3 style={{ margin: '5px 0' }}>
                  Grand Total: {grandTotalStr} {formData.currency}
                </h3>
              </div>
            </div>
          </div>



        {/* Reason of Request Section */}
          <div className="reason-section">
            <h3>Reason of Request / เหตุผลการขอราคา - ขอสั่งซื้อ</h3>

            <div className="input-row-reason">
              <label>Type:</label>
              <select
                name="reasonType"
                value={formData.reasonType}
                onChange={handleChange}
                required
              >
              <option value="">Select</option>
              <option value="เครื่องเขียน (Stationery)">เครื่องเขียน (Stationery)</option>
              <option value="วัสดุสิ้นเปลือง (Consume)">วัสดุสิ้นเปลือง (Consume)</option>
              <option value="สินทรัพย์ (Asset)">สินทรัพย์ (Asset)</option>
              <option value="สารเคมี (Chemical)">สารเคมี (Chemical)</option>
              <option value="ทดสอบ (Testing)">ทดสอบ (Testing)</option>
              <option value="สอบเทียบ/ป้องกัน (Calibrate/Preventive)">สอบเทียบ/ป้องกัน (Calibrate/Preventive)</option>
              <option value="ซ่อมแซม (Repair)">ซ่อมแซม (Repair)</option>
              <option value="อะไหล่ (Spare Parts)">อะไหล่ (Spare Parts)</option>
              <option value="อื่นๆ (Other)">อื่นๆ (Other)</option>
              <option value="ค่าเช่า/(Rental)">ค่าเช่า (Rental)</option>
              <option value="ทำความสะอาด (Cleaning)">ทำความสะอาด (Cleaning)</option>
              <option value="บรรจุภัณฑ์อื่นๆ (Non-FG Packaging)">บรรจุภัณฑ์อื่นๆ (Non-FG Packaging)</option>
              </select>
              <label>Delivery Date:</label>
              <input
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleChange}
              />
            </div>

           

            <div className="input-row-reason">
              <label>Comments:</label>
              <textarea
                name="reasonComments"
                rows="3"
                value={formData.reasonComments}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="comment-row">
            <div className="comment-box">
              <h3>Comment by Department Manager</h3>
              <textarea
                name="depManagerComment"
                rows="4"
                value={formData.depManagerComment}
                onChange={handleChange}
              />
            </div>
            <div className="comment-box">
              <h3>Comment by General Manager</h3>
              <textarea
                name="gmComment"
                rows="4"
                value={formData.gmComment}
                onChange={handleChange}
              />
            </div>
          </div>

          <table className="sign-table">
            <thead>
              <tr>
                {/*<th>Requester</th>*/}
                <th>Department Manager</th>
                <th>General Manager</th>
              </tr>
            </thead>
            <tbody>
              <tr>
               {/* <td>
                  <div className="sign-row">
                    <label>Sign:</label>
                    <input
                      type="text"
                      name="signRequester"
                      value={formData.signRequester}
                      onChange={handleChange}
                      </div>
                    /> 
                  
                  <div className="sign-row">
                    <label>Date:</label>
                    <input
                      type="text"
                      name="dateRequester"
                      value={formData.dateRequester}
                      onChange={handleChange}
                    />
                  </div>
                </td>*/}
                <td>
                  <div className="sign-row">
                    <label>Sign:</label>
                    <input
                      type="text"
                      name="signDepartmentManager"
                      value={formData.signDepartmentManager}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sign-row">
                    <label>Date:</label>
                    <input
                      type="text"
                      name="dateDepartmentManager"
                      value={formData.dateDepartmentManager}
                      onChange={handleChange}
                    />
                  </div>
                </td>
                <td>
                  <div className="sign-row">
                    <label>Sign:</label>
                    <input
                      type="text"
                      name="signGeneralManager"
                      value={formData.signGeneralManager}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sign-row">
                    <label>Date:</label>
                    <input
                      type="text"
                      name="dateGeneralManager"
                      value={formData.dateGeneralManager}
                      onChange={handleChange}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="btn-row">
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
    </div>
  );
};

export default PurchaseRequestForm;