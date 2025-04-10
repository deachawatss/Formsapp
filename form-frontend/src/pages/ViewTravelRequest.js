import React from 'react';
import '../styles/TravelRequest.css';

const ViewTravelRequest = ({ form }) => {
  /* ---------- ดึงรายละเอียด ---------- */
  let details = {};
  try {
    details = form.details
      ? (typeof form.details === 'string' ? JSON.parse(form.details) : form.details)
      : (typeof form === 'object' ? form : {});
  } catch (err) { console.error('Error parsing details:', err); }

  /* ---------- helper ---------- */
  const fmt = v => parseFloat(v || 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <div className="print-page">
      <div className="form-container">
        {/* banner */}
        <div className="form-header">
          <img src="https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png"
               alt="Company Logo" className="company-logo" />
          <h1 className="travel-header">NWFAP TRAVEL REQUEST</h1>
        </div>

        {/* business purpose / date */}
        <div className="input-row">
          <div className="input-group">
            <label>Business Purpose:</label>
            <span>{details.businessPurpose || ''}</span>
          </div>
          <div className="input-group">
            <label>Request Date:</label>
            <span>{details.requestDate || ''}</span>
          </div>
        </div>

        {/* traveller info */}
        <div className="section-card">
          <div className="section-header"><h2>Traveler Information</h2></div>

          <div className="input-row">
            <div className="input-group">
              <label>Name:</label>
              <span>{details.name || form.user_name || ''}</span>
            </div>
            <div className="input-group">
              <label>Email:</label>
              <span>{details.email || ''}</span>
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Location:</label>
              <span>{details.location || ''}</span>
            </div>
            <div className="input-group">
              <label>Country:</label>
              <span>{details.country || ''}</span>
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Currency:</label>
              <span>{details.currency || ''}</span>
            </div>
          </div>
        </div>

        {/* trips */}
        {(details.trips || []).map((trip, idx) => (
          <div key={idx} className="trip-container">
            <div className="section-header trip-header">
              <h2>TRIP #{idx + 1}</h2>
            </div>

            <div className="input-row">
              <div className="input-group"><label>From:</label><span>{trip.from}</span></div>
              <div className="input-group"><label>To:</label><span>{trip.to}</span></div>
            </div>

            <div className="input-row">
              <div className="input-group"><label>Departure Date:</label><span>{trip.departureDate}</span></div>
              <div className="input-group"><label>Trip Class:</label><span>{trip.tripClass}</span></div>
            </div>

            <div className="input-row">
              <div className="input-group checkbox-group">
                <label>Round trip:</label><span>{trip.roundTrip ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {trip.roundTrip && (
              <div className="input-row">
                <div className="input-group"><label>Return Date:</label><span>{trip.returnDate}</span></div>
              </div>
            )}

            <div className="input-row">
              <div className="input-group checkbox-group">
                <label>Include hotel:</label><span>{trip.includeHotel ? 'Yes' : 'No'}</span>
              </div>
              <div className="input-group checkbox-group">
                <label>Include car rental:</label><span>{trip.includeCarRental ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="input-row">
              <div className="input-group"><label>Airline:</label><span>{trip.airline}</span></div>
            </div>
          </div>
        ))}

        {/* estimated cost */}
        <div className="section-card cost-table">
          <div className="section-header"><h2>Estimated Cost of Trip:</h2></div>

          <div className="cost-row"><label>Airfare:</label>
            <div className="cost-value">{fmt(details.estimatedCost?.airfare)}</div></div>

          <div className="cost-row"><label>Accommodations:</label>
            <div className="cost-value">{fmt(details.estimatedCost?.accommodations)}</div></div>

          <div className="cost-row"><label>Meals/Entertainment:</label>
            <div className="cost-value">{fmt(details.estimatedCost?.mealsEntertainment)}</div></div>

          <div className="cost-row"><label>Other:</label>
            <div className="cost-value">{fmt(details.estimatedCost?.other)}</div></div>

          <div className="cost-row total-row"><label>Total:</label>
            <div className="cost-value" style={{fontWeight:'bold'}}>
              {fmt(details.estimatedCost?.total)}
            </div></div>
        </div>

        {/* signatures */}
        <div className="section-card">
          <div className="section-header"><h2>Signatures and Date:</h2></div>

          <div className="signature-section">
            
            <div className="signature-row">
              <label>Department Manager:</label>
              <span>{details.departmentManager || ''}</span>
            </div>
          </div>
        </div>

        {/* print */}
        <div style={{textAlign:'center',marginTop:30}}>
          <button type="button" className="button print-btn" onClick={()=>window.print()}>
            🖨 Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTravelRequest;
