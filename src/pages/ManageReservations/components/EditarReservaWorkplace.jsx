import React, { useState } from 'react';
// IMPORTANTE: Agregamos useParams y useNavigate
import { useParams, useNavigate } from 'react-router-dom'; 
import '../../CrearReservacion/CrearReservacion.css';
import DateSelector from './DateSelector';
import TimeSelector from '../../CrearReservacion/components/TimeSelector';
 
const EditarReservaWorkplace = () => {
  // Leemos el ID de la URL que nos mandó la tarjeta
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  // Inicializamos los datos. (En el futuro, aquí harías un fetch al backend usando el 'id')
  const [reservationData, setReservationData] = useState({
    date: new Date(),
    startTime: '08:00',
    endTime: '13:00',
    floor: '3rd floor',
    location: 'SIERRA MADRE - ICSJ-3040',
    email: 'pedrosanchez@gmail.com',
    parkingLot: 'South Parking Lot',
    level: '2nd Floor',
    // Usamos el ID de la URL si existe, si no, uno por defecto
    reservationId: id ? `WP-${id}` : 'WP-48231' 
  });
 
  const handleDateChange = (newDate) => {
    setReservationData({ ...reservationData, date: newDate });
  };

  const handleTimeChange = (start, end) => {
    setReservationData({ ...reservationData, startTime: start, endTime: end });
  };

  const handleFloorChange = (e) => {
    setReservationData({ ...reservationData, floor: e.target.value });
  };

  const handleEmailChange = (e) => {
    setReservationData({ ...reservationData, email: e.target.value });
  };

  const handleSave = () => {
    // TODO: llamar al endpoint PATCH aquí
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      // Opcional: Regresar a "Mis reservaciones" después de guardar
      navigate('/my-reservations'); 
    }, 2000);
  };
 
  return (
    <div className="reservation-container">
      <header className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Modify Reservation</h1>
          <p className="page-subtitle">Update the details of your existing booking</p>
        </div>
      </header>

      <div className="edit-page-content">
        <div className="reservation-panel">

          <div className="reservation-panel-header">
            {/* Mostramos el ID dinámico que leímos de la URL */}
            <span className="reservation-id-badge">{reservationData.reservationId}</span>
            <h3>Edit Reservation</h3>
          </div>

          {saved && (
            <div className="save-success-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Changes saved successfully
            </div>
          )}

          <DateSelector
            selectedDate={reservationData.date}
            onDateChange={handleDateChange}
          />

          <TimeSelector
            startTime={reservationData.startTime}
            endTime={reservationData.endTime}
            onTimeChange={handleTimeChange}
          />

          <select
            className="floor-dropdown"
            value={reservationData.floor}
            onChange={handleFloorChange}
          >
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

          <button
            className="confirm-btn"
            onClick={handleSave}
          >
            Save Changes
          </button>

        </div>
      </div>
    </div>
  );
}

export default EditarReservaWorkplace;