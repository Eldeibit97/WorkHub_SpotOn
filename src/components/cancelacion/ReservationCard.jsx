import React from 'react';
import { Link } from 'react-router-dom';

export default function ReservationCard({ reservation, onCancelRequest }) {
  
  // Función para calcular el estatus
  const getStatus = (isoDateString) => {
    if (!isoDateString) return null;

    const resDate = new Date(isoDateString);
    const today = new Date();

    resDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = resDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { text: 'Today', className: 'status-today' };
    } else if (diffDays > 0) {
      return { text: 'Upcoming', className: 'status-upcoming' };
    } else {
      return { text: 'Past', className: 'status-past' };
    }
  };

  const status = getStatus(reservation.isoDate);

  return (
    <div className="reservation-card">
      <div className="card-header">
        {/* Aquí reemplazamos "Activa" por el estatus dinámico */}
        <span className={`badge ${status ? status.className : ''}`}>
          {status ? status.text : 'Activa'}
        </span>
        <span className="type-label">{reservation.type}</span>
      </div>
      
      <div className="card-body">
        <div className="detail-row">
          <strong>Fecha:</strong> <span>{reservation.date}</span>
        </div>
        <div className="detail-row">
          <strong>Horario:</strong> <span>{reservation.time}</span>
        </div>
        <div className="detail-row">
          <strong>Ubicación:</strong> <span>{reservation.location}</span>
        </div>
        <div className="detail-row">
          <strong>Detalles:</strong> <span className="highlight-text">{reservation.details}</span>
        </div>
      </div>

      <div className="card-actions">
        <Link to="/my-reservations" className="btn-modify-outline">
          Modificar Reservación
        </Link>
        <button className="btn-cancel-outline" onClick={onCancelRequest}>
          Cancelar Reservación
        </button>
      </div>
    </div>
  );
}