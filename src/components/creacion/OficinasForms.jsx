import React from 'react';
import { useState } from 'react';
import './oficinas_forms.css';
import CaruselMapas from './CaruselMapas';
import DateSelector from '../modificacion/DateSelector';
import TimeSelector from './TimeSelector';

const OficinasForms = ({ currentDate, dateData, onConfirm }) => {
  const [reservationData, setReservationData] = useState({
    mail: '',
    idEspacio: 163,
    fechaReserva: dateData.dateObj,
    horaInicio: '08:00',
    horaSalida: '13:00',
    fechaCreacion: new Date(),
    //floor: '3rd floor',
    //location: 'SIERRA MADRE - ICSJ-3040',
    tipoReserva: 'OFICINA',
    //reservationId: 'PK-23941'
  });

  const handleDateChange = (dateObj) => {
    setReservationData({ ...reservationData, fechaReservacion: dateObj });
  };

  const handleTimeChange = (start, end) => {
    setReservationData({
      ...reservationData,
      horaInicio: start,
      horaSalida: end
    });
  };

  const handleChange = (e) => {
    setReservationData({ ...reservationData, [e.target.name]: e.target.value });
  };

  const handleConfirm = () => {
    const finalData = {
      ...reservationData,
      fechaReserva: reservationData.fechaReserva.toISOString(),
      fechaCreacion: reservationData.fechaCreacion.toISOString(),
    };
    onConfirm(finalData);
  }

  return (
    <>
      <div className="main-grid">
        <div className="parking-map-container parking-map-container--carousel">
          <CaruselMapas />
        </div>

        <div className="reservation-panel">
          <h3>New Reservation</h3>

          <DateSelector
            selectedDate={reservationData.fechaReserva}
            onDateChange={handleDateChange}
          />

          <TimeSelector
            horaInicio={reservationData.horaInicio}
            horaSalida={reservationData.horaSalida}
            onTimeChange={handleTimeChange}
          />

          <select className="floor-dropdown" name='floor' value={reservationData.floor} onChange={handleChange}>
            <option>1st floor</option>
            <option>2nd floor</option>
            <option>3rd floor</option>
            <option>4th floor</option>
          </select>
          {/*
          <div className="location-display">
            {reservationData.location}
          </div>
          */}
          <div className="email-container">
            <input
              type="email"
              name='mail'
              className="email-input"
              value={reservationData.mail}
              onChange={handleChange}
              placeholder="Email address"
            />
            <button className="add-guest-btn" title="Add guest">+</button>
          </div>

          <button className="confirm-btn" onClick={handleConfirm}>
            Confirm Reservation
          </button>
        </div>
      </div>
    </>
  );
}

export default OficinasForms