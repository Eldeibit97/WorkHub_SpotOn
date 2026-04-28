import React from 'react';
import { useState } from 'react';
import './oficinas_forms.css';
import CaruselMapas from './CaruselMapas';
import DateSelector from '../modificacion/DateSelector';
import TimeSelector from './TimeSelector';

const OficinasForms = ( {currentDate, onConfirm} ) => {
  const [reservationData, setReservationData] = useState({
    date: currentDate,
    startTime: '08:00',
    endTime: '13:00',
    floor: '3rd floor',
    location: 'SIERRA MADRE - ICSJ-3040',
    email: '',
    type: 'workplace',
    reservationId: 'PK-23941'
  });

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

  const handleChange = (e) => {
    setReservationData({ ...reservationData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <div className="main-grid">
        <div className="parking-map-container parking-map-container--carousel">
          <CaruselMapas />
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

          <select className="floor-dropdown" name='floor' value={reservationData.floor} onChange={handleChange}>
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
              name='email'
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

export default OficinasForms