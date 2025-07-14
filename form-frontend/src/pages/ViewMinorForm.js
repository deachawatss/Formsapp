import React from 'react';
import '../styles/MinorForm.css';

const ViewMinorForm = ({ form }) => {
  console.log("ViewMinorForm received form:", form);
  
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
  
  return (
    <div className="minor-form-container">
      <div className="minor-form-header-title">
        <img 
          src="https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png"
          alt="Company Logo" 
          className="minor-company-logo"
        />
        <div className="minor-title-text">
          <h1>
            Minor Capital Authorization Request
            <span>(In Local Currency &amp; for Projects less than 10,000 AUD)</span>
          </h1>
        </div>
      </div>

      <div className="minor-form-header">
        <div className="minor-form-group">
          <label>Operating Company:</label>
          <span>{details.operatingCompany || ''}</span>
        </div>

        <div className="minor-form-group">
          <label>Department:</label>
          <span>{details.department || form.department || ''}</span>
        </div>

        <div className="minor-form-group">
          <label>Date:</label>
          <span>{details.date || ''}</span>
        </div>

        <div className="minor-form-group">
          <label>Name:</label>
          <span>{details.name || form.user_name || ''}</span>
        </div>

        <div className="minor-form-group">
          <label>Email:</label>
          <span>{details.email || ''}</span>
        </div>
      </div>

      <div className="minor-purpose-section">
        <h3>PURPOSE:</h3>
        <div className="minor-checkbox-group">
          <label>
            <input type="checkbox" checked={details.purpose && details.purpose.replacement} readOnly />
            Replacement
          </label>
          <label>
            <input type="checkbox" checked={details.purpose && details.purpose.expansion} readOnly />
            Expansion
          </label>
          <label>
            <input type="checkbox" checked={details.purpose && details.purpose.costReduction} readOnly />
            Cost Reduction
          </label>
          <label>
            <input type="checkbox" checked={details.purpose && details.purpose.qualityImprovement} readOnly />
            Quality Improvement
          </label>
          <label>
            <input type="checkbox" checked={details.purpose && details.purpose.other} readOnly />
            Other:
            {details.purpose && details.purpose.other && (
              <input type="text" value={details.purpose.otherText || ''} readOnly className="other-input" />
            )}
          </label>
        </div>
      </div>

      <div className="minor-project-summary">
        <h3>PROJECT SUMMARY</h3>
        <textarea value={details.projectSummary || ''} readOnly></textarea>
      </div>

      <div className="minor-currency-section">
        <label>COUNTRY:</label>
        <span>{details.country || ''}</span>

        <label>CURRENCY:</label>
        <span>{details.currency || ''}</span>
      </div>

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
          {(details.items || []).map((item, index) => (
            <tr key={index}>
              <td>{item.carNumber || ''}</td>
              <td>{item.startDate || ''}</td>
              <td>{item.description || ''}</td>
              <td>{item.capital ? parseFloat(item.capital).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
              <td>{item.lease ? parseFloat(item.lease).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
              <td>{item.expense ? parseFloat(item.expense).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
              <td>{item.total ? parseFloat(item.total).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>TOTAL:</td>
            <td style={{ fontWeight: 'bold' }}>
              {parseFloat(details.totals?.capital || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
            <td style={{ fontWeight: 'bold' }}>
              {parseFloat(details.totals?.lease || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
            <td style={{ fontWeight: 'bold' }}>
              {parseFloat(details.totals?.expense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
            <td style={{ fontWeight: 'bold' }}>
              {parseFloat(details.totals?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
          </tr>
        </tfoot>
      </table>

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
  );
};

export default ViewMinorForm; 