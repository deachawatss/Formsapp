import React from 'react';
import '../styles/PurchaseRequest.css';

const ViewPRForm = ({ form }) => {
  console.log("ViewPRForm received form:", form);
  
  // Get data from details
  let details = {};
  try {
    // If we receive form.details, use it; otherwise use the entire form
    if (form.details) {
      details = typeof form.details === 'string' ? JSON.parse(form.details) : form.details;
    } else if (typeof form === 'object') {
      // If there's no form.details but form is an object, use form instead
      details = form;
    }
    
    console.log("Form object:", form);
    console.log("Details parsed:", details);
  } catch (error) {
    console.error("Error parsing details:", error);
    details = {};
  }
  
  const isTHB = details.currency === 'THB';
  const vatLabel = isTHB ? 'VAT (7%)' : 'VAT (0%)';
  const subTotalStr = (details.subTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const vatStr = (details.vat || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const grandTotalStr = (details.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <div className="print-page">
      <div className="form-container">
        <div className="minor-form-header-title">
          <img
            src="https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png"
            alt="Company Logo"
            className="minor-company-logo"
          />
          <div className="minor-title-text">
            <h1>
              Newly Weds Foods (Thailand) Limited
              <span>General Purchase Requisition</span>
              <span>FORM # PC-FM-013</span>
            </h1>
          </div>
        </div>


        <div className="input-row">
          <div className="input-group">
            <label>Name:</label>
            <span>{details.name || form.user_name || ''}</span>
          </div>
          <div className="input-group">
            <label>Email:</label>
            <span>{details.supervisorEmail || ''}</span>
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Department:</label>
            <span>{details.department || form.department || ''}</span>
          </div>
          <div className="input-group">
            <label>Date:</label>
            <span>{details.date || ''}</span>
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
            {(details.items || []).map((row, index) => (
              <tr key={index} className="item-row">
                <td>{index + 1}</td>
                <td>{row.description || ''}</td>
                <td>{row.unit || ''}</td>
                <td>{row.quantity || ''}</td>
                <td>{row.cost || ''}</td>
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
            <span>{details.reasonType || ''}</span>
            <label>Delivery Date:</label>
            <span>{details.deliveryDate || ''}</span>
          </div>
          <div className="input-row-reason">
            <label>Comments:</label>
            <span>{details.reasonComments || ''}</span>
          </div>
        </div>

        <div className="main-row">
          <div className="vendor-section">
            <h3>Vendor Info</h3>
            <div className="vendor-row">
              <label>Vendor Name:</label>
              <span>{details.vendorName || ''}</span>
            </div>
            <div className="vendor-row">
              <label>Address1:</label>
              <span>{details.vendorAddress1 || ''}</span>
            </div>
            <div className="vendor-row">
              <label>Address2:</label>
              <span>{details.vendorAddress2 || ''}</span>
            </div>
            <div className="vendor-row">
              <label>Zip Code:</label>
              <span>{details.vendorZip || ''}</span>
            </div>
            <div className="vendor-row">
              <label>Country:</label>
              <span>{details.CountryZip || ''}</span>
            </div>
          </div>
          
          <div className="right-col">
            <div className="input-row no-wrap">
              <label>Currency:</label>
              <span>{details.currency || ''}</span>

              <label>Terms:</label>
              <span>{details.terms || ''}</span>
            </div>

            <div className="summary compact-summary">
              <p>
                Sub Total: {subTotalStr} {details.currency || ''}
              </p>
              <p>
                {vatLabel}: {vatStr} {details.currency || ''}
              </p>
              <h3>
                Grand Total: {grandTotalStr} {details.currency || ''}
              </h3>
            </div>
          </div>
        </div>

        <div className="comment-row">
          <div className="comment-box">
            <h3>Comment by Department Manager</h3>
            <div>{details.depManagerComment || ''}</div>
          </div>
          <div className="comment-box">
            <h3>Comment by General Manager</h3>
            <div>{details.gmComment || ''}</div>
          </div>
        </div>

        <table className="sign-table">
          <thead>
            <tr>
              <th>Department Manager</th>
              <th>General Manager</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="sign-row">
                  <label>Sign:</label>
                  <span>{details.signDepartmentManager || ''}</span>
                </div>
                <div className="sign-row">
                  <label>Date:</label>
                  <span>{details.dateDepartmentManager || ''}</span>
                </div>
              </td>
              <td>
                <div className="sign-row">
                  <label>Sign:</label>
                  <span>{details.signGeneralManager || ''}</span>
                </div>
                <div className="sign-row">
                  <label>Date:</label>
                  <span>{details.dateGeneralManager || ''}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="major-button-group">
          <button
            type="button"
            className="button print-btn"
            onClick={() => window.print()}
          >
            🖨 Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPRForm; 