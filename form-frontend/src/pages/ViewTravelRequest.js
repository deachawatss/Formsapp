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
    <div className="travel-form-container print-page">
      <div className="travel-form-header">
        <img 
          src="https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png"
          alt="Company Logo" 
          className="travel-company-logo"
        />
        <div className="travel-title-text">
          <h1>NWFAP TRAVEL REQUEST</h1>
        </div>
      </div>

      <div className="travel-section">
        <div className="form-grid">
          <div className="form-field full-width">
            <label>Business Purpose:</label>
            <span>{details.businessPurpose || ''}</span>
          </div>
          <div className="form-field short-input">
            <label>Request Date:</label>
            <span>{details.requestDate || ''}</span>
          </div>
        </div>
      </div>

      <div className="travel-section">
        <div className="travel-section-header">
          <h2>Traveler Information</h2>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label>Name:</label>
            <span>{details.name || form.user_name || ''}</span>
          </div>
          <div className="form-field">
            <label>Email:</label>
            <span>{details.email || ''}</span>
          </div>
          <div className="form-field">
            <label>Location:</label>
            <span>{details.location || ''}</span>
          </div>
          <div className="form-field">
            <label>Country:</label>
            <span>{details.country || ''}</span>
          </div>
          <div className="form-field short-input">
            <label>Currency:</label>
            <span>{details.currency || ''}</span>
          </div>
        </div>
      </div>

        {(details.trips || []).map((trip, idx) => (
          <div key={idx} className="travel-section">
            <div className="travel-section-header">
              <h2>TRIP {idx + 1}</h2>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>From:</label>
                <span>{trip.from}</span>
              </div>
              <div className="form-field">
                <label>To:</label>
                <span>{trip.to}</span>
              </div>
              <div className="form-field short-input">
                <label>Departure Date:</label>
                <span>{trip.departureDate}</span>
              </div>
              <div className="form-field">
                <label></label>
                <span>{trip.includeHotel ? '✓ Include hotel' : ''}</span>
              </div>
              <div className="form-field short-input">
                <label>Trip Class:</label>
                <span>{trip.tripClass}</span>
              </div>
              <div className="form-field">
                <label></label>
                <span>{trip.includeCarRental ? '✓ Include car rental' : ''}</span>
              </div>
              <div className="form-field">
                <label></label>
                <span>{trip.roundTrip ? '✓ Round trip' : ''}</span>
              </div>
              <div className="form-field">
                <label>Airline:</label>
                <span>{trip.airline}</span>
              </div>
              {trip.roundTrip && (
                <div className="form-field short-input">
                  <label>Return Date:</label>
                  <span>{trip.returnDate}</span>
                </div>
              )}
              {trip.roundTrip && (
                <div className="form-field">
                  <label></label>
                  <span></span>
                </div>
              )}
              {trip.roundTrip && (
                <div className="form-field short-input">
                  <label>Return Trip Class:</label>
                  <span>{trip.returnTripClass}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="travel-section">
          <div className="travel-section-header">
            <h2>Estimated Cost of Trip:</h2>
          </div>
          <div className="cost-section">
            <label>Airfare:</label>
            <span>{fmt(details.estimatedCost?.airfare)}</span>
          </div>
          <div className="cost-section">
            <label>Accommodations:</label>
            <span>{fmt(details.estimatedCost?.accommodations)}</span>
          </div>
          <div className="cost-section">
            <label>Meals/Entertainment:</label>
            <span>{fmt(details.estimatedCost?.mealsEntertainment)}</span>
          </div>
          <div className="cost-section">
            <label>Other:</label>
            <span>{fmt(details.estimatedCost?.other)}</span>
          </div>
          <div className="cost-section total">
            <label>Total:</label>
            <span>{fmt(details.estimatedCost?.total)}</span>
          </div>
        </div>

        <div className="travel-section">
          <div className="travel-section-header">
            <h2>Signatures and Date:</h2>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label>Department Manager:</label>
              <span>{details.departmentManager || ''}</span>
            </div>
          </div>
        </div>

        <div className="btn-row">
          <button type="button" className="button print-btn" onClick={()=>window.print()}>
            🖨 Print
          </button>
        </div>
    </div>
  );
};

export default ViewTravelRequest;
