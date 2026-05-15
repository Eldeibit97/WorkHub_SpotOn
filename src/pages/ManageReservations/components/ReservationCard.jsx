import React from 'react';
import { Link } from 'react-router-dom';

export default function ReservationCard({ reservation, onCancelRequest, onCheckIn, onCheckOut, onViewDetails, isLoading }) {
  
  // --- LÓGICA DE TIEMPO Y FECHAS ---
  const getTimeLogic = (isoDateString) => {
    if (!isoDateString || isoDateString.includes('undefined')) return { status: null, hoursUntil: null };

    const resDate = new Date(isoDateString);
    const today = new Date();

    const resDateOnly = new Date(resDate);
    const todayOnly = new Date(today);
    resDateOnly.setHours(0, 0, 0, 0);
    todayOnly.setHours(0, 0, 0, 0);

    const diffTimeDays = resDateOnly - todayOnly;
    const diffDays = Math.ceil(diffTimeDays / (1000 * 60 * 60 * 24));

    // AHORA TODO EN ESPAÑOL
    let statusData = { text: 'Pasado', className: 'status-past' };
    if (diffDays === 0) statusData = { text: 'Hoy', className: 'status-today' };
    else if (diffDays > 0) statusData = { text: 'Próximo', className: 'status-upcoming' };

    const diffTimeMs = resDate - today;
    const hoursUntil = diffTimeMs / (1000 * 60 * 60);

    return { status: statusData, hoursUntil };
  };

  const { status, hoursUntil } = getTimeLogic(reservation.isoDate);
  const isPast = status?.text === 'Pasado' || reservation.estado_reserva === 'COMPLETADO';
  const isCheckedIn = reservation.estado_reserva === 'CHECKED_IN';
  const isLessOrEqualOneHour = hoursUntil !== null && hoursUntil <= 1;

  // --- RENDERIZADO DE BOTONES ---
  const renderActions = () => {
    if (isPast) return null; 

    if (isCheckedIn) {
      return (
        <button className="btn-primary-danger" onClick={onCheckOut} disabled={isLoading}>
          {isLoading ? 'Procesando...' : 'Realizar Check-out'}
        </button>
      );
    }

    if (isLessOrEqualOneHour) {
      return (
        <>
          <button className="btn-checkin" onClick={onCheckIn} disabled={isLoading}>
            {isLoading ? 'Procesando...' : 'Check-in'}
          </button>
          <button className="btn-cancel-outline" onClick={onCancelRequest} disabled={isLoading}>
            Cancelar
          </button>
        </>
      );
    }

    const editRoute = `/edit-workplace/${reservation.id}`;

    return (
      <>
        <Link to={editRoute} className="btn-modify-outline">
          Modificar
        </Link>
        <button className="btn-cancel-outline" onClick={onCancelRequest} disabled={isLoading}>
          Cancelar
        </button>
      </>
    );
  };

  return (
    <div className="reservation-card">
      <div className="card-header">
        {/* Aquí mostramos Próximo, Hoy, Check-in o Completado */}
        <span className={`badge ${reservation.estado_reserva === 'COMPLETADO' ? 'status-past' : (status ? status.className : '')}`}>
          {reservation.estado_reserva === 'COMPLETADO' 
            ? 'Completado' 
            : (isCheckedIn ? 'Check-in' : (status ? status.text : 'Activo'))}
        </span>
        <span className="type-label">{reservation.type}</span>
      </div>
      
      <div className="card-body clickable-body" onClick={onViewDetails} title="Haz clic para ver más detalles">
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
        {renderActions()}
      </div>
    </div>
  );
}