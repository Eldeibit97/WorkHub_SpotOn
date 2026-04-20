import React from 'react'
import { useState } from 'react';
import './estacionamiento_forms.css';
import CaruselMapas from './CaruselMapas';
import DateSelector from '../modificacion/DateSelector';

const EstacionamientoForms = ( {currentDate, onConfirm} ) => {
  const [reservationData, setReservationData] = useState({
    date: currentDate,
    email: '',
    parkingLot: 'South Parking Lot',
    level: '2nd Level',
    type: 'parking', 
    reservationId: 'PK-23941'
  });

  const handleDateChange = (newDate) => {
    setReservationData({ ...reservationData, date: newDate });
  };

  const handleChange = (e) => {
    setReservationData({ ...reservationData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <div className="main-grid">
        <div className="parking-map-container parking-map-container--carousel">
          <CaruselMapas></CaruselMapas>
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

          <select className="level-dropdown" name='level' value={reservationData.level} onChange={handleChange}>
            <option>1st Level</option>
            <option>2nd Level</option>
            <option>3rd Level</option>
            <option>4th Level</option>
          </select>
          <div className="email-container">
            <input
              type="email"
              name = 'email'
              className="email-input"
              value={reservationData.email}
              onChange={handleChange}
              placeholder="Email address"
            />
            <button className="add-guest-btn" title="Add guest">+</button>
          </div>
          <button className="confirm-btn" onClick={() => onConfirm(reservationData)}>
            Confirm Reservation
          </button>
        </div>
      </div>
    </>
  );
}

export default EstacionamientoForms