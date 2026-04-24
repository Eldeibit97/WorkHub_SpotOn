import React from 'react';
import { Link } from 'react-router-dom';

export default function ReservationCard({ reservation, onCancelRequest, onCheckIn, onCheckOut, isLoading }) {
  
  // Función para calcular el estatus temporal y la diferencia de horas
  const getTimeLogic = (isoDateString) => {
    if (!isoDateString) return { status: null, hoursUntil: null };

    const resDate = new Date(isoDateString);
    const today = new Date();

    // Lógica para badge (Días exactos)
    const resDateOnly = new Date(resDate);
    const todayOnly = new Date(today);
    resDateOnly.setHours(0, 0, 0, 0);
    todayOnly.setHours(0, 0, 0, 0);

    const diffTimeDays = resDateOnly - todayOnly;
    const diffDays = Math.ceil(diffTimeDays / (1000 * 60 * 60 * 24));

    let statusData = { text: 'Past', className: 'status-past' };
    if (diffDays === 0) statusData = { text: 'Today', className: 'status-today' };
    else if (diffDays > 0) statusData = { text: 'Upcoming', className: 'status-upcoming' };

    // Lógica para botones (Diferencia real en horas)
    const diffTimeMs = resDate - today;
    const hoursUntil = diffTimeMs / (1000 * 60 * 60);

    return { status: statusData, hoursUntil };
  };

  const { status, hoursUntil } = getTimeLogic(reservation.isoDate);
  
  // Reglas de negocio para visibilidad de botones
  const isPast = status?.text === 'Past' || reservation.estado_reserva === 'COMPLETADO';
  const isCheckedIn = reservation.estado_reserva === 'CHECKED_IN';
  const isLessOrEqualOneHour = hoursUntil !== null && hoursUntil <= 1;

  // Renderizado condicional de la botonera
  const renderActions = () => {
    if (isPast) return null; // Regla 1: Si ya pasó o está completado, no hay botones.

    if (isCheckedIn) {
      // Regla 4: Si ya hizo check-in, SOLO muestra check-out
      return (
        <button className="btn-primary-danger" onClick={onCheckOut} disabled={isLoading}>
          {isLoading ? 'Procesando...' : 'Realizar Check-out'}
        </button>
      );
    }

    if (isLessOrEqualOneHour) {
      // Regla 3: Falta 1 hora o menos -> Cambia Modificar por Check-in
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

    // Regla 2: Falta más de 1 hora -> Muestra Modificar y Cancelar
    return (
      <>
        <Link to="/my-reservations" className="btn-modify-outline">
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
        <span className={`badge ${status ? status.className : ''}`}>
          {/* Si está checked in, forzamos la vista del estatus */}
          {isCheckedIn ? 'Checked-In' : (status ? status.text : 'Activa')}
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
        {renderActions()}
      </div>
    </div>
  );
}