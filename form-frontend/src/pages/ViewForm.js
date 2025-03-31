import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/PurchaseRequest.css';
import '../styles/MajorForm.css';
import '../styles/MinorForm.css';
import '../styles/TravelRequest.css';
import '../styles/common.css';

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
      alert("เกิดข้อผิดพลาดในการดาวน์โหลดข้อมูล: " + (error.response?.data?.error || error.message));
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
  const { user_name, department: dept, form_name, details = {} } = form;
  console.log("Form name:", form_name); // แสดงชื่อฟอร์มเพื่อการดีบัก

  // ดึงข้อมูลจาก details
  const {
    name = user_name,
    department = dept,
    date,
    items = [],
    // ข้อมูลสำหรับ Purchase Request Form
    deliveryDate,
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
    grandTotal = 0,
    // ข้อมูลสำหรับ Travel Request Form
    businessPurpose,
    requestDate,
    email,
    location,
    country,
    trips = [],
    estimatedCost = {},
    requestedBy,
    departmentManager,
    // ข้อมูลสำหรับ Major Form
    operatingCompany,
    carNumber,
    projectDescription,
    additionSection = {},
    disposalSection = {},
    authorizationType = {},
    carType = {},
    localCurrency,
    exchangeRate,
    leasePayments = [],
    financialImpact = {},
    economicImpact = {},
    // ข้อมูลสำหรับ Minor Form
    purpose = {},
    projectSummary,
    totals = {}
  } = details;

  console.log("Rendered with:", { name, department, date, items, details, form_name });

  // ฟังก์ชันสำหรับแสดงฟอร์มตามประเภท
  const renderFormByType = () => {
    switch (form_name) {
      case 'Purchase Request':
        return renderPurchaseRequestForm();
      case 'Travel Request':
        return renderTravelRequestForm();
      case 'Major Capital Authorization Request':
        return renderMajorCapitalForm();
      case 'Minor Capital Authorization Request':
        return renderMinorCapitalForm();
      default:
        return renderPurchaseRequestForm(); // ถ้าไม่พบประเภทที่ตรงกัน ให้แสดงเป็น Purchase Request Form
    }
  };

  // ฟังก์ชันสำหรับแสดง Purchase Request Form
  const renderPurchaseRequestForm = () => {
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

          <div className="input-row">
            <label>Name:</label>
            <span>{name}</span>

            <label>Department:</label>
            <span>{department}</span>
          </div>

          <div className="input-row">
            <label>Email:</label>
            <span>{supervisorEmail}</span>

            <div className="date-group">
              <label>Date:</label>
              <span>{date}</span>
            </div>
          </div>

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
            
            <div className="right-col">
              <div className="input-row no-wrap">
                <label>Currency:</label>
                <span>{currency}</span>

                <label>Terms:</label>
                <span>{terms}</span>
              </div>

              <div className="summary compact-summary">
                <p>
                  Sub Total: {subTotalStr} {currency}
                </p>
                <p>
                  {vatLabel}: {vatStr} {currency}
                </p>
                <h3>
                  Grand Total: {grandTotalStr} {currency}
                </h3>
              </div>
            </div>
          </div>

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
    );
  };

  // ฟังก์ชันสำหรับแสดง Travel Request Form
  const renderTravelRequestForm = () => {
    return (
      <div className="print-page">
        <div className="form-container">
          <div className="form-header">
            <img
              src="https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png"
              alt="Company Logo"
              className="company-logo"
            />
            <h1 className="travel-header">NWFAP TRAVEL REQUEST</h1>
          </div>

          {/* Business Purpose และ Request Date */}
          <div className="input-row">
            <div className="input-group">
              <label>Business Purpose:</label>
              <span>{businessPurpose}</span>
            </div>
            
            <div className="input-group">
              <label>Request Date:</label>
              <span>{requestDate}</span>
            </div>
          </div>

          {/* Traveler Information */}
          <div className="section-header">
            <h2>Traveler Information</h2>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Name:</label>
              <span>{name}</span>
            </div>
            
            <div className="input-group">
              <label>Email:</label>
              <span>{email}</span>
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Location:</label>
              <span>{location}</span>
            </div>
            
            <div className="input-group">
              <label>Country:</label>
              <span>{country}</span>
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Currency:</label>
              <span>{currency}</span>
            </div>
          </div>

          {/* Trip Information */}
          {trips.map((trip, index) => (
            <div key={index} className="trip-container">
              <div className="section-header trip-header">
                <h2>TRIP #{index + 1}</h2>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>From:</label>
                  <span>{trip.from}</span>
                </div>
                
                <div className="input-group">
                  <label>To:</label>
                  <span>{trip.to}</span>
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>Departure Date:</label>
                  <span>{trip.departureDate}</span>
                </div>
                
                <div className="input-group">
                  <label>Trip Class:</label>
                  <span>{trip.tripClass}</span>
                </div>
              </div>

              <div className="input-row">
                <div className="input-group checkbox-group">
                  <label>Round trip:</label>
                  <span>{trip.roundTrip ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {trip.roundTrip && (
                <div className="input-row">
                  <div className="input-group">
                    <label>Return Date:</label>
                    <span>{trip.returnDate}</span>
                  </div>
                </div>
              )}

              <div className="input-row">
                <div className="input-group checkbox-group">
                  <label>Include hotel:</label>
                  <span>{trip.includeHotel ? 'Yes' : 'No'}</span>
                </div>
                
                <div className="input-group checkbox-group">
                  <label>Include car rental:</label>
                  <span>{trip.includeCarRental ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>Airline:</label>
                  <span>{trip.airline}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Estimated Cost */}
          <div className="section-header">
            <h2>Estimated Cost of Trip:</h2>
          </div>

          <div className="cost-table">
            <div className="cost-row">
              <label>Airfare:</label>
              <span>{estimatedCost.airfare || 0}</span>
            </div>
            
            <div className="cost-row">
              <label>Accommodations:</label>
              <span>{estimatedCost.accommodations || 0}</span>
            </div>
            
            <div className="cost-row">
              <label>Meals/Entertainment:</label>
              <span>{estimatedCost.mealsEntertainment || 0}</span>
            </div>
            
            <div className="cost-row">
              <label>Other:</label>
              <span>{estimatedCost.other || 0}</span>
            </div>
            
            <div className="cost-row total-row">
              <label>Total:</label>
              <span>{estimatedCost.total || 0}</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="section-header">
            <h2>Signatures and Date:</h2>
          </div>

          <div className="signature-section">
            <div className="signature-row">
              <label>Requested By:</label>
              <span>{requestedBy || name}</span>
            </div>
            <div className="signature-row">
              <label>Department Manager:</label>
              <span>{departmentManager}</span>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button className="download-pdf no-print" onClick={handleDownloadPDF}>
              📥 Download PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ฟังก์ชันสำหรับแสดง Major Capital Form
  const renderMajorCapitalForm = () => {
    return (
      <div className="print-page">
        <div className="form-container">
          <div className="form-header">
            <img
              src="https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png"
              alt="Company Logo"
              className="company-logo"
            />
            <h1>Major Capital Authorization Request</h1>
            <p>(For Capital Projects {'>'} AUD 10,000)</p>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Operating Company:</label>
              <span>{operatingCompany}</span>
            </div>
            <div className="input-group">
              <label>Department:</label>
              <span>{department}</span>
            </div>
            <div className="input-group">
              <label>Date:</label>
              <span>{date}</span>
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Name:</label>
              <span>{name}</span>
            </div>
            <div className="input-group">
              <label>Email:</label>
              <span>{email}</span>
            </div>
            <div className="input-group">
              <label>CAR: No. NWF:</label>
              <span>{carNumber}</span>
            </div>
          </div>

          <div className="section-header">
            <h2>Project Description:</h2>
          </div>
          <div className="description-box">
            <p>{projectDescription}</p>
          </div>

          <div className="section-header">
            <h2>Project Summary</h2>
          </div>
          <div className="description-box">
            <p>{projectSummary}</p>
          </div>

          <div className="section-header">
            <h2>Authority Requested</h2>
          </div>
          <table className="authority-table">
            <thead>
              <tr>
                <th></th>
                <th>Previously Approved</th>
                <th>This Request</th>
                <th>Total Request</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(additionSection).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value.previouslyApproved || 0}</td>
                  <td>{value.thisRequest || 0}</td>
                  <td>{parseFloat(value.previouslyApproved || 0) + parseFloat(value.thisRequest || 0)}</td>
                </tr>
              ))}
              {Object.entries(disposalSection).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value.previouslyApproved || 0}</td>
                  <td>{value.thisRequest || 0}</td>
                  <td>{parseFloat(value.previouslyApproved || 0) + parseFloat(value.thisRequest || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="section-header">
            <h2>Authorization Type</h2>
          </div>
          <div className="checkbox-container">
            {Object.entries(authorizationType).map(([key, value]) => (
              <div key={key} className="checkbox-group">
                <label>{key}:</label>
                <span>{value === true ? 'Yes' : value === false ? 'No' : value}</span>
              </div>
            ))}
          </div>

          <div className="section-header">
            <h2>CAR Type</h2>
          </div>
          <div className="checkbox-container">
            {Object.entries(carType).map(([key, value]) => (
              <div key={key} className="checkbox-group">
                <label>{key}:</label>
                <span>{value ? 'Yes' : 'No'}</span>
              </div>
            ))}
          </div>

          <div className="section-header">
            <h2>Currency</h2>
          </div>
          <div className="input-row">
            <div className="input-group">
              <label>Local Currency:</label>
              <span>{localCurrency}</span>
            </div>
            <div className="input-group">
              <label>Exchange Rate:</label>
              <span>{exchangeRate}</span>
            </div>
          </div>

          <div className="section-header">
            <h2>Lease Payments</h2>
          </div>
          <table className="lease-table">
            <thead>
              <tr>
                <th>Rent</th>
                <th>For</th>
                <th>Budgeted Amount</th>
                <th>Change from Budget</th>
                <th>Start Date</th>
                <th>Operational Date</th>
                <th>Post Review Date</th>
              </tr>
            </thead>
            <tbody>
              {leasePayments.map((payment, index) => (
                <tr key={index}>
                  <td>{payment.rent}</td>
                  <td>{payment.for}</td>
                  <td>{payment.budgetedAmount}</td>
                  <td>{payment.changeFromBudget}</td>
                  <td>{payment.startDate}</td>
                  <td>{payment.operationalDate}</td>
                  <td>{payment.postReviewDate}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="section-header">
            <h2>Financial Impact</h2>
          </div>
          <div className="input-row">
            <div className="input-group">
              <label>Year:</label>
              <span>{financialImpact.year}</span>
            </div>
          </div>
          <div className="input-row">
            <div className="input-group">
              <label>Profit & Loss Effect:</label>
              <span>{financialImpact.profitLossEffect}</span>
            </div>
          </div>
          <div className="input-row">
            <div className="input-group">
              <label>Cash Flow:</label>
              <span>{financialImpact.cashFlow}</span>
            </div>
          </div>

          <div className="section-header">
            <h2>Economic Impact</h2>
            <p>In AU Dollars</p>
          </div>
          <table className="economic-table">
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
                <td>{economicImpact.internalRate}</td>
                <td>{economicImpact.netPresentValue}</td>
                <td>{economicImpact.discountRate}</td>
                <td>{economicImpact.projectLife}</td>
                <td>{economicImpact.afterTaxPayback}</td>
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
    );
  };

  // ฟังก์ชันสำหรับแสดง Minor Capital Form
  const renderMinorCapitalForm = () => {
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

        <div className="minor-form-header">
          <div className="minor-form-group">
            <label>Operating Company:</label>
            <span>{operatingCompany}</span>
          </div>

          <div className="minor-form-group">
            <label>Department:</label>
            <span>{department}</span>
          </div>

          <div className="minor-form-group">
            <label>Date:</label>
            <span>{date}</span>
          </div>

          <div className="minor-form-group">
            <label>Name:</label>
            <span>{name}</span>
          </div>

          <div className="minor-form-group">
            <label>Email:</label>
            <span>{email}</span>
          </div>
        </div>

        <div className="minor-purpose-section">
          <h3>PURPOSE:</h3>
          <div className="minor-checkbox-group">
            {Object.entries(purpose).map(([key, value]) => (
              <div key={key} className="minor-checkbox-item">
                <label>{key}:</label>
                <span>{value === true ? 'Yes' : value === false ? 'No' : value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="minor-project-summary">
          <h3>Project Summary:</h3>
          <p>{projectSummary}</p>
        </div>

        <div className="minor-items-section">
          <table className="minor-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unitCost}</td>
                  <td>{item.totalCost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="minor-currency-section">
          <label>Currency:</label>
          <span>{currency}</span>
        </div>

        <div className="minor-approval-section">
          <table className="minor-approval-table">
            <thead>
              <tr>
                <th>Requested By</th>
                <th>Department Manager</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{name}</td>
                <td>{departmentManager}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button className="download-pdf no-print" onClick={handleDownloadPDF}>
            📥 Download PDF
          </button>
        </div>
      </div>
    );
  };
  
  return renderFormByType();
};

export default ViewForm;