import React from 'react';
import ReservationCard from './ReservationCard';

export default function ReservationList({ reservations, onCancelRequest, onCheckIn, onCheckOut, loadingId }) {
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
          onCheckIn={() => onCheckIn(reservation.id)}
          onCheckOut={() => onCheckOut(reservation.id)}
          isLoading={loadingId === reservation.id}
        />
      ))}
    </div>
  );
}