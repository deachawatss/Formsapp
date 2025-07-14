import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/TravelRequest.css';

const TravelRequestForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const formId = queryParams.get('id');
  const user = JSON.parse(localStorage.getItem('user'));
  const formDataFromState = location.state?.formData;

  // สร้าง empty trip object เพื่อใช้เป็นต้นแบบเวลาเพิ่มทริปใหม่ ใช้ useMemo เพื่อไม่ให้สร้างใหม่ทุก render
  const emptyTrip = useMemo(() => ({
    from: '',
    to: '',
    departureDate: new Date().toISOString().split('T')[0],
    tripClass: '',
    includeHotel: false,
    includeCarRental: false,
    airline: '',
    roundTrip: false,
    returnDate: '',
    returnTripClass: ''
  }), []);

  const [formData, setFormData] = useState({
    businessPurpose: '',
    requestDate: new Date().toISOString().split('T')[0],
    name: user?.name || '',
    email: user?.email || '',
    location: '',
    country: '',
    currency: '',
    trips: [{ ...emptyTrip }], // เก็บข้อมูลเป็น array ของ trips
    estimatedCost: {
      airfare: '',
      accommodations: '',
      mealsEntertainment: '',
      other: '',
      total: '0'
    },
    requestedBy: '',
    departmentManager: '',
    status: 'Draft',
  });

  const [insertedId, setInsertedId] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showTripMenu, setShowTripMenu] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);

  // ฟังก์ชันดึงข้อมูลฟอร์มที่มีอยู่แล้ว
  const fetchFormData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseUrl}/api/forms/${formId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const { details, user_name } = response.data;
      let parsedDetails = {};
      
      if (typeof details === 'string') {
        parsedDetails = JSON.parse(details);
      } else {
        parsedDetails = details;
      }

      // มั่นใจว่ามี trips array ถ้าข้อมูลเก่าไม่มี trips array
      if (!parsedDetails.trips) {
        // แปลงข้อมูลเก่าเป็นรูปแบบใหม่ (ถ้าเคยมีข้อมูลทริปเดียว)
        if (parsedDetails.from || parsedDetails.to) {
          parsedDetails.trips = [{
            from: parsedDetails.from || '',
            to: parsedDetails.to || '',
            departureDate: parsedDetails.departureDate || new Date().toISOString().split('T')[0],
            tripClass: parsedDetails.tripClass || '',
            includeHotel: parsedDetails.includeHotel || false,
            includeCarRental: parsedDetails.includeCarRental || false,
            airline: parsedDetails.airline || '',
            roundTrip: parsedDetails.roundTrip || false,
            returnDate: parsedDetails.returnDate || '',
            returnTripClass: parsedDetails.returnTripClass || ''
          }];
        } else {
          parsedDetails.trips = [{ ...emptyTrip }];
        }
      }

      // Ensure all existing trips have returnTripClass field for backward compatibility
      if (parsedDetails.trips) {
        parsedDetails.trips = parsedDetails.trips.map(trip => ({
          ...trip,
          returnTripClass: trip.returnTripClass || ''
        }));
      }

      setFormData({
        ...parsedDetails,
        name: parsedDetails.name || user_name || user?.name || '',
        email: parsedDetails.email || user?.email || '',
      });
      
    } catch (error) {
      console.error('Error fetching form:', error);
      alert('Error fetching form data');
    }
  }, [formId, user?.name, user?.email, emptyTrip]);

  // โหลดข้อมูลฟอร์มเมื่อมี formId
  useEffect(() => {
    if (formId) {
      if (formDataFromState) {
        try {
          const details = typeof formDataFromState.details === 'string' 
            ? JSON.parse(formDataFromState.details)
            : formDataFromState.details;
          
          // มั่นใจว่ามี trips array ถ้าข้อมูลเก่าไม่มี trips array
          if (!details.trips) {
            // แปลงข้อมูลเก่าเป็นรูปแบบใหม่ (ถ้าเคยมีข้อมูลทริปเดียว)
            if (details.from || details.to) {
              details.trips = [{
                from: details.from || '',
                to: details.to || '',
                departureDate: details.departureDate || new Date().toISOString().split('T')[0],
                tripClass: details.tripClass || '',
                includeHotel: details.includeHotel || false,
                includeCarRental: details.includeCarRental || false,
                airline: details.airline || '',
                roundTrip: details.roundTrip || false,
                returnDate: details.returnDate || '',
                returnTripClass: details.returnTripClass || ''
              }];
            } else {
              details.trips = [{ ...emptyTrip }];
            }
          }
          
          // Ensure all existing trips have returnTripClass field for backward compatibility
          if (details.trips) {
            details.trips = details.trips.map(trip => ({
              ...trip,
              returnTripClass: trip.returnTripClass || ''
            }));
          }
          
          setFormData(prev => ({
            ...prev,
            ...details,
            name: formDataFromState.user_name || user?.name || '',
            email: details.email || user?.email || '',
          }));
        } catch (error) {
          console.error('Error parsing form data:', error);
          fetchFormData();
        }
      } else {
        fetchFormData();
      }
    }
  }, [formId, formDataFromState, fetchFormData, user?.name, user?.email, emptyTrip]);

  // จัดการการเปลี่ยนแปลงข้อมูลในฟอร์มทั่วไป
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // จัดการการเปลี่ยนแปลงข้อมูลในแต่ละทริป
  const handleTripChange = (tripIndex, field, value) => {
    const updatedTrips = [...formData.trips];
    
    if (field === 'roundTrip') {
      updatedTrips[tripIndex][field] = value;
      
      // ถ้ายกเลิก roundTrip ให้ล้างค่า returnDate
      if (!value) {
        updatedTrips[tripIndex].returnDate = '';
      }
    } else {
      updatedTrips[tripIndex][field] = value;
    }
    
    setFormData({
      ...formData,
      trips: updatedTrips
    });
  };

  // จัดการเปลี่ยนแปลงค่า checkbox ในทริป
  const handleTripCheckboxChange = (e, tripIndex) => {
    const { name, checked } = e.target;
    handleTripChange(tripIndex, name, checked);
  };

  // จัดการเปลี่ยนแปลงค่า input/select ในทริป
  const handleTripInputChange = (e, tripIndex) => {
    const { name, value } = e.target;
    handleTripChange(tripIndex, name, value);
  };

  // จัดการการเปลี่ยนแปลงค่าใช้จ่าย
  const handleCostChange = (e) => {
    const { name, value } = e.target;
    const updatedCost = { ...formData.estimatedCost, [name]: value };
    
    // คำนวณยอดรวม
    const airfare = parseFloat(updatedCost.airfare) || 0;
    const accommodations = parseFloat(updatedCost.accommodations) || 0;
    const mealsEntertainment = parseFloat(updatedCost.mealsEntertainment) || 0;
    const other = parseFloat(updatedCost.other) || 0;
    
    updatedCost.total = (airfare + accommodations + mealsEntertainment + other).toString();
    
    setFormData({ ...formData, estimatedCost: updatedCost });
  };

  // แสดงเมนูเพิ่ม/ลบทริป
  const toggleTripMenu = (tripIndex) => {
    setActiveTrip(tripIndex);
    setShowTripMenu(!showTripMenu);
  };

  // เพิ่มทริปใหม่ก่อนทริปปัจจุบัน
  const insertTripBefore = (tripIndex) => {
    const updatedTrips = [...formData.trips];
    updatedTrips.splice(tripIndex, 0, { ...emptyTrip });
    
    setFormData({
      ...formData,
      trips: updatedTrips
    });
    
    setShowTripMenu(false);
  };

  // เพิ่มทริปใหม่หลังทริปปัจจุบัน
  const insertTripAfter = (tripIndex) => {
    const updatedTrips = [...formData.trips];
    updatedTrips.splice(tripIndex + 1, 0, { ...emptyTrip });
    
    setFormData({
      ...formData,
      trips: updatedTrips
    });
    
    setShowTripMenu(false);
  };

  // ลบทริปปัจจุบัน
  const removeTrip = (tripIndex) => {
    // ต้องเหลืออย่างน้อย 1 ทริป
    if (formData.trips.length <= 1) {
      alert('At least 1 trip is required');
      return;
    }
    
    const updatedTrips = [...formData.trips];
    updatedTrips.splice(tripIndex, 1);
    
    setFormData({
      ...formData,
      trips: updatedTrips
    });
    
    setShowTripMenu(false);
  };

  // เพิ่มทริปใหม่
  const addTrip = () => {
    setFormData({
      ...formData,
      trips: [...formData.trips, { ...emptyTrip }]
    });
  };

  // บันทึกฟอร์มเป็นแบบร่าง
  const handleSaveDraft = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const url = formId 
        ? `${baseUrl}/api/forms/${formId}`
        : `${baseUrl}/api/forms`;
      
      const method = formId ? 'put' : 'post';
      
      const response = await axios[method](url, {
        form_name: "Travel Request",
        user_name: formData.name,
        status: 'Draft',
        details: JSON.stringify(formData)
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
      alert('❌ Error saving draft: ' + (error.response?.data?.error || error.message));
    }
  };

  // ส่งฟอร์ม
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const url = formId 
        ? `${baseUrl}/api/forms/${formId}`
        : `${baseUrl}/api/forms`;
      
      const method = formId ? 'put' : 'post';
      
      const response = await axios[method](url, {
        form_name: "Travel Request",
        user_name: formData.name,
        status: 'Waiting For Approve',
        details: JSON.stringify(formData)
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
      alert('❌ Error submitting form: ' + (error.response?.data?.error || error.message));
    }
  };

  // ส่งอีเมล
  const handleSendEmail = async () => {
    try {
      setIsSendingEmail(true);
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.post(`${baseUrl}/api/forms/pdf-email`, {
        id: insertedId,
        email: formData.email
      });
      alert('✅ Email sent successfully!');
    } catch (error) {
      console.error('❌ Error sending email:', error);
      alert('❌ Error sending email');
    } finally {
      setIsSendingEmail(false);
    }
  };
  
  // พิมพ์ฟอร์ม
  const handlePrint = () => {
    window.print();
  };

  // ปิดเมนูเพิ่ม/ลบทริปเมื่อคลิกนอกเมนู
  useEffect(() => {
    const handleClickOutside = () => {
      if (showTripMenu) {
        setShowTripMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showTripMenu]);

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

      <form onSubmit={handleSubmit} id="travelRequestForm">
        <div className="travel-section">
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Business Purpose:</label>
              <input
                type="text"
                name="businessPurpose"
                value={formData.businessPurpose}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field short-input">
              <label>Request Date:</label>
              <input
                type="date"
                name="requestDate"
                value={formData.requestDate}
                onChange={handleChange}
              />
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
              <input
                type="text"
                name="name"
                value={formData.name}
                readOnly
                style={{ backgroundColor: '#f0f0f0' }}
              />
            </div>
            <div className="form-field">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field">
              <label>Location:</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field">
              <label>Country:</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field short-input">
              <label>Currency:</label>
              <input
                type="text"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {formData.trips.map((trip, tripIndex) => (
          <div key={tripIndex} className="travel-section">
            <div className="travel-section-header">
              <h2>TRIP {tripIndex + 1}</h2>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>From:</label>
                <input
                  type="text"
                  name="from"
                  value={trip.from}
                  onChange={(e) => handleTripInputChange(e, tripIndex)}
                  required
                />
              </div>
              <div className="form-field">
                <label>To:</label>
                <input
                  type="text"
                  name="to"
                  value={trip.to}
                  onChange={(e) => handleTripInputChange(e, tripIndex)}
                  required
                />
              </div>
              <div className="form-field short-input">
                <label>Departure Date:</label>
                <input
                  type="date"
                  name="departureDate"
                  value={trip.departureDate}
                  onChange={(e) => handleTripInputChange(e, tripIndex)}
                  required
                />
              </div>
              <div className="form-field">
                 <label></label> {/* Spacer for alignment */}
                 <div className="checkbox-group">
                    <input
                      type="checkbox"
                      name="includeHotel"
                      checked={trip.includeHotel}
                      onChange={(e) => handleTripCheckboxChange(e, tripIndex)}
                    />
                    <label>Include hotel</label>
                 </div>
              </div>
              <div className="form-field short-input">
                <label>Trip Class:</label>
                <select
                  name="tripClass"
                  value={trip.tripClass}
                  onChange={(e) => handleTripInputChange(e, tripIndex)}
                  required
                >
                  <option value="">select...</option>
                  <option value="Economy">Economy</option>
                  <option value="Business">Business</option>
                  <option value="First Class">First Class</option>
                </select>
              </div>
              <div className="form-field">
                 <label></label> {/* Spacer for alignment */}
                 <div className="checkbox-group">
                    <input
                      type="checkbox"
                      name="includeCarRental"
                      checked={trip.includeCarRental}
                      onChange={(e) => handleTripCheckboxChange(e, tripIndex)}
                    />
                    <label>Include car rental</label>
                 </div>
              </div>
              <div className="form-field">
                 <label></label> {/* Spacer for alignment */}
                 <div className="checkbox-group">
                    <input
                      type="checkbox"
                      name="roundTrip"
                      checked={trip.roundTrip}
                      onChange={(e) => handleTripCheckboxChange(e, tripIndex)}
                    />
                    <label>Round trip</label>
                 </div>
              </div>
              <div className="form-field">
                <label>Airline:</label>
                <input
                  type="text"
                  name="airline"
                  value={trip.airline}
                  onChange={(e) => handleTripInputChange(e, tripIndex)}
                  required
                />
              </div>
              {trip.roundTrip && (
                <div className="form-field short-input">
                  <label>Return Date:</label>
                  <input
                    type="date"
                    name="returnDate"
                    value={trip.returnDate}
                    onChange={(e) => handleTripInputChange(e, tripIndex)}
                    required={trip.roundTrip}
                  />
                </div>
              )}
              {trip.roundTrip && (
                <div className="form-field">
                  <label></label> {/* Spacer for alignment */}
                </div>
              )}
              {trip.roundTrip && (
                <div className="form-field short-input">
                  <label>Return Trip Class:</label>
                  <select
                    name="returnTripClass"
                    value={trip.returnTripClass}
                    onChange={(e) => handleTripInputChange(e, tripIndex)}
                    required={trip.roundTrip}
                  >
                    <option value="">select...</option>
                    <option value="Economy">Economy</option>
                    <option value="Business">Business</option>
                    <option value="First Class">First Class</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="btn-row" style={{ marginBottom: '20px' }}>
          <button 
            type="button" 
            className="button" 
            onClick={addTrip}
            style={{ backgroundColor: '#4CAF50', color: 'white' }}
          >
            ➕ Add Trip
          </button>
        </div>

        <div className="travel-section">
            <div className="travel-section-header">
              <h2>Estimated Cost of Trip:</h2>
            </div>
            <div className="cost-section">
              <label>Airfare:</label>
              <input
                type="text"
                name="airfare"
                value={formData.estimatedCost.airfare}
                onChange={handleCostChange}
                required
              />
            </div>
            <div className="cost-section">
              <label>Accommodations:</label>
              <input
                type="text"
                name="accommodations"
                value={formData.estimatedCost.accommodations}
                onChange={handleCostChange}
                required
              />
            </div>
            <div className="cost-section">
              <label>Meals/Entertainment:</label>
              <input
                type="text"
                name="mealsEntertainment"
                value={formData.estimatedCost.mealsEntertainment}
                onChange={handleCostChange}
                required
              />
            </div>
            <div className="cost-section">
              <label>Other:</label>
              <input
                type="text"
                name="other"
                value={formData.estimatedCost.other}
                onChange={handleCostChange}
              />
            </div>
            <div className="cost-section total">
              <label>Total:</label>
              <input
                type="text"
                value={parseFloat(formData.estimatedCost.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                readOnly
              />
            </div>
        </div>

        <div className="travel-section">
            <div className="travel-section-header">
              <h2>Signatures and Date:</h2>
            </div>
            <div className="form-grid">
                <div className="form-field">
                    <label>Department Manager:</label>
                    <input
                      type="text"
                      name="departmentManager"
                      value={formData.departmentManager}
                      onChange={handleChange}
                    />
                </div>
            </div>
        </div>

        <div className="btn-row">
          <button type="button" className="button draft-btn" onClick={handleSaveDraft}>
            💾 Save as Draft
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
  );
};

export default TravelRequestForm;
