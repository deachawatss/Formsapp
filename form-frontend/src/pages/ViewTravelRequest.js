import React from 'react';
import '../styles/TravelRequest.css';

const ViewTravelRequest = ({ form }) => {
  console.log("ViewTravelRequest received form:", form);

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
            <span>{details.businessPurpose || ''}</span>
          </div>
          
          <div className="input-group">
            <label>Request Date:</label>
            <span>{details.requestDate || ''}</span>
          </div>
        </div>

        {/* Traveler Information */}
        <div className="section-header">
          <h2>Traveler Information</h2>
        </div>

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

        {/* Trip Information */}
        {(details.trips || []).map((trip, index) => (
          <div key={index} className="trip-container">
            <div className="section-header trip-header">
              <h2>TRIP #{index + 1}</h2>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>From:</label>
                <span>{trip.from || ''}</span>
              </div>
              
              <div className="input-group">
                <label>To:</label>
                <span>{trip.to || ''}</span>
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Departure Date:</label>
                <span>{trip.departureDate || ''}</span>
              </div>
              
              <div className="input-group">
                <label>Trip Class:</label>
                <span>{trip.tripClass || ''}</span>
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
                  <span>{trip.returnDate || ''}</span>
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
                <span>{trip.airline || ''}</span>
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
            <span>{(details.estimatedCost && details.estimatedCost.airfare) || 0}</span>
          </div>
          
          <div className="cost-row">
            <label>Accommodations:</label>
            <span>{(details.estimatedCost && details.estimatedCost.accommodations) || 0}</span>
          </div>
          
          <div className="cost-row">
            <label>Meals/Entertainment:</label>
            <span>{(details.estimatedCost && details.estimatedCost.mealsEntertainment) || 0}</span>
          </div>
          
          <div className="cost-row">
            <label>Other:</label>
            <span>{(details.estimatedCost && details.estimatedCost.other) || 0}</span>
          </div>
          
          <div className="cost-row total-row">
            <label>Total:</label>
            <span>{(details.estimatedCost && details.estimatedCost.total) || 0}</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="section-header">
          <h2>Signatures and Date:</h2>
        </div>

        <div className="signature-section">
          <div className="signature-row">
            <label>Requested By:</label>
            <span>{details.requestedBy || details.name || form.user_name || ''}</span>
          </div>
          <div className="signature-row">
            <label>Department Manager:</label>
            <span>{details.departmentManager || ''}</span>
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
    </div>
  );
};

export default ViewTravelRequest; 