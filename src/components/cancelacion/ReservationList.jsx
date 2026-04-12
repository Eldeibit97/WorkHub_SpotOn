import React from 'react';
import ReservationCard from './ReservationCard';

export default function ReservationList({ reservations, onCancelRequest }) {
  // Manejo de estado vacío (cuando ya cancelaste todo)
  if (reservations.length === 0) {
    return (
      <div className="empty-state">
        <p>No tienes reservaciones activas en este momento.</p>
      </div>
    );
  }

  return (
    <div className="reservation-list">
      {reservations.map((reservation) => (
        <ReservationCard 
          key={reservation.id} 
          reservation={reservation} 
          onCancelRequest={() => onCancelRequest(reservation)} 
        />
      ))}
    </div>
  );
}