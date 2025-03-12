import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../components/PurchaseRequest.css';

const ViewForm = () => {
  const { id } = useParams();
  
  const [form, setForm] = useState(null);

  useEffect(() => {
    fetchForm();
    // eslint-disable-next-line
  }, []);

  const fetchForm = async () => {
    try {
      const response = await axios.get(`http://192.168.17.15:5000/api/forms`);
      const foundForm = response.data.find(f => f.id === parseInt(id));
      if (foundForm) {
        setForm(foundForm);
      } else {
        alert("ไม่พบข้อมูลฟอร์ม");
      }
    } catch (error) {
      console.error("❌ Error fetching form:", error);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`http://192.168.17.15:5000/api/forms/${id}/pdf`, '_blank');
  };

  if (!form) return <p>🔄 กำลังโหลดข้อมูล...</p>;

  let detailsObj = {};
  try {
    detailsObj = JSON.parse(form.details);
  } catch (err) {
    console.error("❌ Error parsing details JSON:", err);
  }

  const {
    name,
    department,
    date,
    deliveryDate,
    items = [],
    vendorName,
    vendorAddress1,
    vendorAddress2,
    vendorZip,
    CountryZip,
    currency,
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
    subTotal,
    vat,
    grandTotal
  } = detailsObj;

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

          {/* Remarks Section (Instructional Text) */}
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
