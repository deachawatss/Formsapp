import React from 'react';
import '../styles/MajorForm.css';

const ViewMajorForm = ({ form }) => {
  console.log("ViewMajorForm received form:", form);
  
  // ดึงข้อมูลจาก details
  let details = {};
  try {
    // ถ้าเราได้รับ form.details ให้ใช้มัน ถ้าไม่มีให้ใช้ form ทั้งหมด
    if (form.details) {
      details = typeof form.details === 'string' ? JSON.parse(form.details) : form.details;
    } else if (typeof form === 'object') {
      // ถ้าไม่มี form.details แต่ form เป็น object ให้ใช้ form แทน
      details = form;
    }
    
    console.log("Form object:", form);
    console.log("Details parsed:", details);
  } catch (error) {
    console.error("Error parsing details:", error);
    details = {};
  }

  // Calculate totals
  const calculateAdditionTotal = () => {
    const addition = details.additionSection || {};
    const total = {
      previouslyApproved: 0,
      thisRequest: 0,
      total: 0
    };

    ['capitalAddition', 'capitalRelatedExpense', 'pvLeasePayment'].forEach(field => {
      if (addition[field]) {
        const prev = Number(addition[field].previouslyApproved) || 0;
        const curr = Number(addition[field].thisRequest) || 0;
        total.previouslyApproved += prev;
        total.thisRequest += curr;
        total.total += (prev + curr);
      }
    });

    return total;
  };

  const calculateDisposalTotal = () => {
    const disposal = details.disposalSection || {};
    const total = {
      previouslyApproved: 0,
      thisRequest: 0,
      total: 0
    };

    ['capitalDisposal', 'capitalRelatedExpense2', 'otherInitialCost'].forEach(field => {
      if (disposal[field]) {
        const prev = Number(disposal[field].previouslyApproved) || 0;
        const curr = Number(disposal[field].thisRequest) || 0;
        total.previouslyApproved += prev;
        total.thisRequest += curr;
        total.total += (prev + curr);
      }
    });

    return total;
  };

  const additionTotal = calculateAdditionTotal();
  const disposalTotal = calculateDisposalTotal();

  return (
    <div className="major-form-container">
      <div className="major-form">
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

        {/* -------------------- INPUT SECTION 1 -------------------- */}
        <div className="major-input-section">
          <div className="major-form-group">
            <label>Operating Company:</label>
            <input type="text" value={details.operatingCompany || ''} readOnly />
          </div>
          <div className="major-form-group">
            <label>Department:</label>
            <input type="text" value={details.department || form.department || ''} readOnly />
          </div>
          <div className="major-form-group">
            <label>Date:</label>
            <input type="text" value={details.date || ''} readOnly />
          </div>
        </div>

        {/* -------------------- INPUT SECTION 2 -------------------- */}
        <div className="major-input-section">
          <div className="major-form-group">
            <label>Name:</label>
            <input type="text" value={details.name || form.user_name || ''} readOnly />
          </div>
          <div className="major-form-group">
            <label>Email:</label>
            <input type="text" value={details.email || ''} readOnly />
          </div>
          <div className="major-form-group">
            <label>CAR No. NWF:</label>
            <input type="text" value={details.carNumber || ''} readOnly />
          </div>
        </div>

        {/* -------------------- PROJECT DESCRIPTION -------------------- */}
        <div className="major-project-description">
          <label>Project Description:</label>
          <textarea style={{ resize: 'none' }} value={details.projectDescription || ''} readOnly></textarea>
        </div>

        {/* -------------------- PROJECT SUMMARY -------------------- */}
        <div className="major-project-summary">
          <h3>Project Summary</h3>
          <textarea style={{ resize: 'none' }} value={details.projectSummary || ''} readOnly></textarea>
        </div>

        {/* -------------------- AUTHORITY SECTION -------------------- */}
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
                <tr>
                  <td>Capital Addition</td>
                  <td>{Number(details.additionSection?.capitalAddition?.previouslyApproved || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{Number(details.additionSection?.capitalAddition?.thisRequest || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{(Number(details.additionSection?.capitalAddition?.previouslyApproved || 0) + Number(details.additionSection?.capitalAddition?.thisRequest || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Capital-Related Expense</td>
                  <td>{Number(details.additionSection?.capitalRelatedExpense?.previouslyApproved || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{Number(details.additionSection?.capitalRelatedExpense?.thisRequest || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{(Number(details.additionSection?.capitalRelatedExpense?.previouslyApproved || 0) + Number(details.additionSection?.capitalRelatedExpense?.thisRequest || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>PV of Lease Payment</td>
                  <td>{Number(details.additionSection?.pvLeasePayment?.previouslyApproved || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{Number(details.additionSection?.pvLeasePayment?.thisRequest || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{(Number(details.additionSection?.pvLeasePayment?.previouslyApproved || 0) + Number(details.additionSection?.pvLeasePayment?.thisRequest || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="total-row">
                  <td>Total Addition Request</td>
                  <td>{additionTotal.previouslyApproved.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{additionTotal.thisRequest.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{additionTotal.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Capital Disposal</td>
                  <td>{Number(details.disposalSection?.capitalDisposal?.previouslyApproved || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{Number(details.disposalSection?.capitalDisposal?.thisRequest || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{(Number(details.disposalSection?.capitalDisposal?.previouslyApproved || 0) + Number(details.disposalSection?.capitalDisposal?.thisRequest || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Capital-Related Expense</td>
                  <td>{Number(details.disposalSection?.capitalRelatedExpense2?.previouslyApproved || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{Number(details.disposalSection?.capitalRelatedExpense2?.thisRequest || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{(Number(details.disposalSection?.capitalRelatedExpense2?.previouslyApproved || 0) + Number(details.disposalSection?.capitalRelatedExpense2?.thisRequest || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Other Initial Cost</td>
                  <td>{Number(details.disposalSection?.otherInitialCost?.previouslyApproved || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{Number(details.disposalSection?.otherInitialCost?.thisRequest || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{(Number(details.disposalSection?.otherInitialCost?.previouslyApproved || 0) + Number(details.disposalSection?.otherInitialCost?.thisRequest || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="total-row">
                  <td>Total Disposal Request</td>
                  <td>{disposalTotal.previouslyApproved.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{disposalTotal.thisRequest.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{disposalTotal.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="major-right-section">
            <div className="major-authorization-type">
              <h3>Authorization Type</h3>
              <div className="major-checkbox-group">
                <div className="major-checkbox-column">
                  <label>
                    <input type="checkbox" checked={details.authorizationType?.capitalAddition} readOnly />
                    Capital Addition
                  </label>
                  <label>
                    <input type="checkbox" checked={details.authorizationType?.expansion} readOnly />
                    Expansion
                  </label>
                  <label>
                    <input type="checkbox" checked={details.authorizationType?.newDevelopment} readOnly />
                    New Development
                  </label>
                  <label>
                    <input type="checkbox" checked={details.authorizationType?.qualityImprovement} readOnly />
                    Quality Improvement
                  </label>
                  <label>
                    <input type="checkbox" checked={details.authorizationType?.other} readOnly />
                    Other:
                    {details.authorizationType?.other && (
                      <input type="text" value={details.authorizationType?.otherText || ''} readOnly className="other-input" />
                    )}
                  </label>
                </div>
                <div className="major-checkbox-column">
                  <label>
                    <input type="checkbox" checked={details.authorizationType?.replacement} readOnly />
                    Replacement
                  </label>
                  <label>
                    <input type="checkbox" checked={details.authorizationType?.costProfit} readOnly />
                    Cost/Profit
                  </label>
                  <label>
                    <input type="checkbox" checked={details.authorizationType?.capitalDisposal} readOnly />
                    Capital Disposal
                  </label>
                </div>
              </div>
            </div>

            <div className="major-car-type">
              <h3>CAR Type</h3>
              <div className="major-checkbox-group">
                <label>
                  <input type="checkbox" checked={details.carType?.design} readOnly />
                  Design
                </label>
                <label>
                  <input type="checkbox" checked={details.carType?.basic} readOnly />
                  Basic
                </label>
                <label>
                  <input type="checkbox" checked={details.carType?.supplemental} readOnly />
                  Supplemental
                </label>
              </div>
            </div>

            <div className="major-currency-section">
              <div className="major-form-group">
                <label>Local Currency:</label>
                <select value={details.localCurrency} disabled>
                  <option value="">Select...</option>
                  <option value="THB">THB</option>
                  <option value="USD">USD</option>
                  <option value="AUD">AUD</option>
                  <option value="PHP">PHP</option>
                </select>
              </div>
              <div className="major-form-group">
                <label>Exch Rate:</label>
                <input type="text" value={details.exchangeRate || ''} readOnly />
              </div>
              <div className="major-form-group">
                <label>Future Commitment Required:</label>
                <div className="major-radio-group">
                  <label>
                    <input
                      type="radio"
                      name="futureCommitment"
                      value="Yes"
                      checked={details.futureCommitment === 'Yes'}
                      readOnly
                      disabled
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="futureCommitment"
                      value="No"
                      checked={details.futureCommitment === 'No' || !details.futureCommitment}
                      readOnly
                      disabled
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
              {details.leasePayments?.map((payment, index) => (
                <tr key={index}>
                  <td>
                    <div className="lease-payment-inputs">
                      <div className="lease-input-group">
                        <label>Min: $</label>
                        <input type="text" value={payment.rent || ''} readOnly />
                      </div>
                      <div className="lease-input-group">
                        <label>For:</label>
                        <input type="text" value={payment.for || ''} readOnly />
                      </div>
                    </div>
                  </td>
                  <td><input type="text" value={payment.budgetedAmount || ''} readOnly /></td>
                  <td><input type="text" value={payment.changeFromBudget || ''} readOnly /></td>
                  <td><input type="text" value={payment.startDate || ''} readOnly /></td>
                  <td><input type="text" value={payment.operationalDate || ''} readOnly /></td>
                  <td><input type="text" value={payment.postReviewDate || ''} readOnly /></td>
                </tr>
              ))}
              {(!details.leasePayments || details.leasePayments.length === 0) && (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center'}}>No lease payment data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* -------------------- IMPACT SECTION -------------------- */}
        <div className="major-impact-section">
          <div className="major-financial-impact">
            <h3>Financial Impact</h3>
            <div className="financial-tables-container">
              <table className="major-financial-table">
                <thead>
                  <tr>
                    <td className="label-cell">YEAR:</td>
                    <td><input type="text" value={details.financialImpact?.year1 || ''} readOnly /></td>
                    <td><input type="text" value={details.financialImpact?.year2 || ''} readOnly /></td>
                    <td><input type="text" value={details.financialImpact?.year3 || ''} readOnly /></td>
                    <td><input type="text" value={details.financialImpact?.year4 || ''} readOnly /></td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="label-cell">PROFIT/LOSS EFFECT $$:</td>
                    <td><input type="text" value={details.financialImpact?.profitLoss1 || ''} readOnly /></td>
                    <td><input type="text" value={details.financialImpact?.profitLoss2 || ''} readOnly /></td>
                    <td><input type="text" value={details.financialImpact?.profitLoss3 || ''} readOnly /></td>
                    <td><input type="text" value={details.financialImpact?.profitLoss4 || ''} readOnly /></td>
                  </tr>
                  <tr>
                    <td className="label-cell">CASH FLOW (POS/NEG):</td>
                    <td><input type="text" value={details.financialImpact?.cashFlow1 || ''} readOnly /></td>
                    <td><input type="text" value={details.financialImpact?.cashFlow2 || ''} readOnly /></td>
                    <td><input type="text" value={details.financialImpact?.cashFlow3 || ''} readOnly /></td>
                    <td><input type="text" value={details.financialImpact?.cashFlow4 || ''} readOnly /></td>
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
                        value={details.financialImpact?.includesCurrentBudget1 || ''}
                        readOnly
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <input
                        type="text"
                        value={details.financialImpact?.includesCurrentBudget2 || ''}
                        readOnly
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
                  <td><input type="text" value={details.economicImpact?.internalRate || ''} readOnly /></td>
                  <td><input type="text" value={details.economicImpact?.netPresentValue || ''} readOnly /></td>
                  <td><input type="text" value={details.economicImpact?.discountRate || ''} readOnly /></td>
                  <td><input type="text" value={details.economicImpact?.projectLife || ''} readOnly /></td>
                  <td><input type="text" value={details.economicImpact?.afterTaxPayback || ''} readOnly /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* -------------------- APPROVAL SECTION -------------------- */}
        <div className="major-approval-section">
          <h3>Approval</h3>
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
                <td>MD, SE Asia<br/>Anthony C.</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Financial Controller</td>
                <td></td>
                <td></td>
                <td>For GWF<br/>Paul F.</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>General Manager</td>
                <td></td>
                <td></td>
                <td>For NWF<br/>T.Whelan</td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* -------------------- BUTTONS -------------------- */}
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

export default ViewMajorForm; 