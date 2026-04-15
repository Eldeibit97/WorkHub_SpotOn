import React from 'react';
import '../../styles/oficinas_forms.css';
import DateSelector from './DateSelector';
import TimeSelector from './TimeSelector';
 
const OficinasForms = ({ onConfirm, reservationData, setReservationData }) => {
  const handleDateChange = (newDate) => {
    setReservationData({ ...reservationData, date: newDate });
  };
 
  const handleTimeChange = (start, end) => {
    setReservationData({ 
      ...reservationData,
      startTime: start, 
      endTime: end 
    });
  };
 
  const handleFloorChange = (e) => {
    setReservationData({ ...reservationData, floor: e.target.value });
  };
 
  const handleEmailChange = (e) => {
    setReservationData({ ...reservationData, email: e.target.value });
  };
 
  return (
    <div className="main-grid">
      <div className="parking-map-container">
        {/* Aquí puedes agregar tu visualización de workspace */}
        <div className="placeholder-text">
          Workspace layout will appear here
        </div>
      </div>
 
      <div className="reservation-panel">
        <h3>New Reservation</h3>
        
        <DateSelector 
          selectedDate={reservationData.date}
          onDateChange={handleDateChange}
        />
 
        <TimeSelector 
          startTime={reservationData.startTime}
          endTime={reservationData.endTime}
          onTimeChange={handleTimeChange}
        />
 
        <select className="floor-dropdown" value={reservationData.floor} onChange={handleFloorChange}>
          <option>1st floor</option>
          <option>2nd floor</option>
          <option>3rd floor</option>
          <option>4th floor</option>
        </select>
 
        <div className="location-display">
          {reservationData.location}
        </div>
 
        <div className="email-container">
          <input 
            type="email" 
            className="email-input" 
            value={reservationData.email}
            onChange={handleEmailChange}
            placeholder="Email address"
          />
          <button className="add-guest-btn" title="Add guest">+</button>
        </div>
 
        <button className="confirm-btn" onClick={onConfirm}>
          Confirm Reservation
        </button>
      </div>
    </div>
  );
}

export default OficinasForms