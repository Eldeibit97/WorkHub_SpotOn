import React from 'react';

export default function ReservationCard({ reservation, onCancelRequest }) {
  return (
    <div className="reservation-card">
      <div className="card-header">
        <span className="badge">Activa</span>
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
        <button className="btn-cancel-outline" onClick={onCancelRequest}>
          Cancelar Reservación
        </button>
      </div>
    </div>
  );
}