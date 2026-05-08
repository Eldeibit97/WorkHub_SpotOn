import React from 'react'
import { useState } from 'react';
import './EstacionamientoForms.css';
import DateSelector from '../../ManageReservations/components/DateSelector';
import TimeSelector from './TimeSelector';

const EstacionamientoForms = ({ dateData, onConfirm }) => {
  const [reservationData, setReservationData] = useState({
    mail: '',
    idEspacio: 163,
    fechaReserva: dateData.dateObj,
    horaInicio: '08:00',
    horaSalida: '13:00',
    fechaCreacion: new Date(),
    //parkingLot: 'South Parking Lot',
    //level: '2nd Level',
    tipoReserva: 'ESTACIONAMIENTO',
    //reservationID: 'PK9021'
  });

  const handleDateChange = (newDate) => {
    setReservationData({ ...reservationData, fechaReserva: newDate });
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

  const handleConfirm = () =>{
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
          <div className="parking-map-placeholder">
            <h3>Mapa de estacionamiento</h3>
            <p>El selector visual estará disponible próximamente.</p>
          </div>
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
          {/*
          <div className="location-display">
            {reservationData.parkingLot}
          </div>
          */}
          <select className="level-dropdown" name='level' value={reservationData.level} onChange={handleChange}>
            <option>1st Level</option>
            <option>2nd Level</option>
            <option>3rd Level</option>
            <option>4th Level</option>
          </select>
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

export default EstacionamientoForms