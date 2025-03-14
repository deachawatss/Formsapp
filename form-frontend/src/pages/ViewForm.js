import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/PurchaseRequest.css';

const ViewForm = () => {
  const { id } = useParams();
  
  const [form, setForm] = useState(null);

  useEffect(() => {
    fetchForm();
    // eslint-disable-next-line
  }, []);

  const fetchForm = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("Fetching form with ID:", id);
      console.log("Using token:", token);

      if (!token) {
        alert("กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const response = await axios.get(`http://192.168.17.15:5000/api/forms/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log("Raw API Response:", response.data);
      console.log("Response details type:", typeof response.data.details);
      
      // แปลง details เป็น object ถ้าเป็น string
      let parsedDetails = {};
      if (typeof response.data.details === 'string') {
        try {
          parsedDetails = JSON.parse(response.data.details);
          console.log("Successfully parsed details:", parsedDetails);
        } catch (err) {
          console.error("Error parsing details:", err);
          console.log("Raw details string:", response.data.details);
        }
      } else {
        parsedDetails = response.data.details || {};
        console.log("Details already an object:", parsedDetails);
      }

      // ตรวจสอบค่าที่จำเป็น
      const formData = {
        ...response.data,
        details: {
          ...parsedDetails,
          items: parsedDetails.items || [],
          name: parsedDetails.name || response.data.user_name || '',
          department: parsedDetails.department || response.data.department || '',
          date: parsedDetails.date || new Date().toLocaleDateString(),
          subTotal: parsedDetails.subTotal || 0,
          vat: parsedDetails.vat || 0,
          grandTotal: parsedDetails.grandTotal || 0
        }
      };

      console.log("Final processed form data:", formData);
      setForm(formData);

    } catch (error) {
      console.error("Error fetching form:", error);
      console.error("Error response:", error.response?.data);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล: " + (error.response?.data?.error || error.message));
    }
  };

  const handleDownloadPDF = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    try {
      // แสดง loading message
      const loadingDiv = document.createElement('div');
      loadingDiv.style.position = 'fixed';
      loadingDiv.style.top = '50%';
      loadingDiv.style.left = '50%';
      loadingDiv.style.transform = 'translate(-50%, -50%)';
      loadingDiv.style.padding = '20px';
      loadingDiv.style.background = 'rgba(0,0,0,0.8)';
      loadingDiv.style.color = 'white';
      loadingDiv.style.borderRadius = '10px';
      loadingDiv.style.zIndex = '9999';
      loadingDiv.textContent = '⌛ Generating PDF...';
      document.body.appendChild(loadingDiv);

      // เรียก API เพื่อดาวน์โหลด PDF
      const response = await fetch(`http://192.168.17.15:5000/api/forms/${id}/pdf?token=${token}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error downloading PDF');
      }

      // แปลงการตอบกลับเป็น blob
      const blob = await response.blob();
      
      // สร้าง URL สำหรับ blob
      const url = window.URL.createObjectURL(blob);
      
      // สร้าง link สำหรับดาวน์โหลด
      const a = document.createElement('a');
      a.href = url;
      a.download = `form_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      document.body.removeChild(loadingDiv);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด PDF: ' + error.message);
    }
  };

  if (!form) return <p>🔄 loading...</p>;

  // ดึงข้อมูลพื้นฐานจาก form
  const { user_name, department: dept, details = {} } = form;

  // ดึงข้อมูลจาก details
  const {
    name = user_name,
    department = dept,
    date,
    deliveryDate,
    items = [],
    vendorName,
    vendorAddress1,
    vendorAddress2,
    vendorZip,
    CountryZip,
    currency = 'THB',
    terms,
    supervisorEmail,
    reasonType,
    reasonComments,
    depManagerComment,
    gmComment,
    signRequester,
    dateRequester,
    signDepartmentManager,
    dateDepartmentManager,
    signGeneralManager,
    dateGeneralManager,
    subTotal = 0,
    vat = 0,
    grandTotal = 0
  } = details;

  console.log("Rendered with:", { name, department, date, items, details });

  const isTHB = currency === 'THB';
  const vatLabel = isTHB ? 'VAT (7%)' : 'VAT (0%)';
  const subTotalStr = (subTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const vatStr = (vat || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const grandTotalStr = (grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

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

        <div id="purchaseRequestForm">
          {/* Row 1: Name, Dept, Date */}
          <div className="input-row">
            <label>Name:</label>
            <span>{name}</span>

            <label>Department:</label>
            <span>{department}</span>
          </div>

          {/* Row 2: Email, Date */}
          <div className="input-row">
            <label>Email:</label>
            <span>{supervisorEmail}</span>

            <div className="date-group">
              <label>Date:</label>
              <span>{date}</span>
            </div>
          </div>

          {/* ตาราง Items */}
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
              {items.map((row, index) => (
                <tr key={index} className="item-row">
                  <td>{index + 1}</td>
                  <td>{row.description}</td>
                  <td>{row.unit}</td>
                  <td>{row.quantity}</td>
                  <td>{row.cost}</td>
                  <td>
                    {parseFloat(row.amount || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Remarks Section */}
          <div className="remarks-box">
            <h4>Remarks / หมายเหตุ : </h4>
            <span className="asset-condition">
              โปรดระบุประเภทของสินค้าที่ต้องการว่าเป็นสินทรัพย์หรือเพื่อซ่อมแซม /
              Please specify type of goods as asset or repair-maintenance.
            </span>
            <br />
            <span className="asset-condition">
              สินทรัพย์ = อายุใช้งาน ≥ 1 ปี และมูลค่า ≥ 1,000.- บาท /
              Asset = Useful life ≥ 1 year, value ≥ 1,000.- Baht
            </span>
          </div>

          {/* Reason Section */}
          <div className="reason-section">
            <h3>Reason of Request / เหตุผลการขอราคา - ขอสั่งซื้อ</h3>
            <div className="input-row-reason">
              <label>Type:</label>
              <span>{reasonType}</span>
              <label>Delivery Date:</label>
              <span>{deliveryDate}</span>
            </div>
            <div className="input-row-reason">
              <label>Comments:</label>
              <span>{reasonComments}</span>
            </div>
          </div>

          {/* Vendor Info + Summary */}
          <div className="main-row">
            <div className="vendor-section">
              <h3>Vendor Info</h3>
              <div className="vendor-row">
                <label>Vendor Name:</label>
                <span>{vendorName}</span>
              </div>
              <div className="vendor-row">
                <label>Address1:</label>
                <span>{vendorAddress1}</span>
              </div>
              <div className="vendor-row">
                <label>Address2:</label>
                <span>{vendorAddress2}</span>
              </div>
              <div className="vendor-row">
                <label>Zip Code:</label>
                <span>{vendorZip}</span>
              </div>
              <div className="vendor-row">
                <label>Country:</label>
                <span>{CountryZip}</span>
              </div>
            </div>
            
            <div className="right-col summary-section">
              <div className="input-row">
                <label>Currency:</label>
                <span>{currency}</span>

                <label>Terms:</label>
                <span>{terms}</span>
              </div>

              <div className="summary compact-summary">
                <p style={{ margin: '3px 0' }}>
                  Sub Total: {subTotalStr} {currency}
                </p>
                <p style={{ margin: '3px 0' }}>
                  {vatLabel}: {vatStr} {currency}
                </p>
                <h3 style={{ margin: '5px 0' }}>
                  Grand Total: {grandTotalStr} {currency}
                </h3>
              </div>
            </div>
          </div>

          {/* Comment Section */}
          <div className="comment-row">
            <div className="comment-box">
              <h3>Comment by Department Manager</h3>
              <div>{depManagerComment}</div>
            </div>
            <div className="comment-box">
              <h3>Comment by General Manager</h3>
              <div>{gmComment}</div>
            </div>
          </div>

          {/* Sign Table */}
          <table className="sign-table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Department Manager</th>
                <th>General Manager</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="sign-row">
                    <label>Sign:</label>
                    <span>{signRequester}</span>
                  </div>
                  <div className="sign-row">
                    <label>Date:</label>
                    <span>{dateRequester}</span>
                  </div>
                </td>
                <td>
                  <div className="sign-row">
                    <label>Sign:</label>
                    <span>{signDepartmentManager}</span>
                  </div>
                  <div className="sign-row">
                    <label>Date:</label>
                    <span>{dateDepartmentManager}</span>
                  </div>
                </td>
                <td>
                  <div className="sign-row">
                    <label>Sign:</label>
                    <span>{signGeneralManager}</span>
                  </div>
                  <div className="sign-row">
                    <label>Date:</label>
                    <span>{dateGeneralManager}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '20px' }}>
            <button className="download-pdf no-print" onClick={handleDownloadPDF}>
              📥 Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewForm;