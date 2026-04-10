import React from 'react'
import '../../styles/estacionamiento_forms.css';
import TimerDisplay from './TimerDisplay';
import DateSelector from './DateSelector';

const EstacionamientoForms = ({ onConfirm, reservationData, setReservationData }) => {
  const handleDateChange = (newDate) => {
    setReservationData({ ...reservationData, date: newDate });
  };

  const handleFloorChange = (e) => {
    setReservationData({ ...reservationData, level: e.target.value });
  };

  const handleEmailChange = (e) => {
    setReservationData({ ...reservationData, email: e.target.value });
  };

  return (
    <>
      <div className="main-grid">
        <div className="parking-map-container">
          <div className="placeholder-text">
            Parking visualization area
          </div>
        </div>

        <div className="reservation-panel">
          <h3>New Reservation</h3>

          <DateSelector
            selectedDate={reservationData.date}
            onDateChange={handleDateChange}
          />

          <div className="location-display">
            {reservationData.parkingLot}
          </div>

          <select className="floor-dropdown" value={reservationData.level} onChange={handleFloorChange}>
            <option>1st Floor</option>
            <option>2nd Floor</option>
            <option>3rd Floor</option>
            <option>4th Floor</option>
          </select>
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
    </>
  );
}

export default EstacionamientoForms