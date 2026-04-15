import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReservationList from '../components/cancelacion/ReservationList.jsx';
import CancellationModal from '../components/cancelacion/CancellationModal.jsx';
import '../components/cancelacion/styles/styles.css';

const initialReservations = [
  {
    id: 1,
    type: 'Workplace',
    date: 'lunes, 09 de marzo de 2026',
    time: '08:00 → 13:00',
    location: '3rd Floor',
    details: 'SIERRA MADRE - ICSJ-3040'
  },
  {
    id: 2,
    type: 'Parking',
    date: 'lunes, 09 de marzo de 2026',
    time: '08:00 → 13:00',
    location: 'South Parking Lot',
    details: '2nd Floor'
  }
];

export default function ManageReservationsPage() {
  const [reservations, setReservations] = useState(initialReservations);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const handleOpenModal = (reservation) => {
    setSelectedReservation(reservation);
  };

  const handleCloseModal = () => {
    setSelectedReservation(null);
  };

  const handleConfirmCancellation = () => {
    if (selectedReservation) {
      const updatedReservations = reservations.filter(
        (res) => res.id !== selectedReservation.id
      );
      setReservations(updatedReservations);
      handleCloseModal();
    }
  };

  return (
    <div className="manage-page-container">
      <nav className="manage-top-nav" aria-label="Navegación">
        <Link to="/home" className="manage-nav-link">
          ← Volver al inicio
        </Link>
        <Link to="/my-reservations" className="manage-nav-link manage-nav-link-secondary">
          Mis reservas
        </Link>
      </nav>
      <header className="brand-header">
        <h1 className="brand-logo">accenture</h1>
        <h2 className="page-title">Cancelar Reservaciones Activas</h2>
        <p className="page-subtitle">Gestiona tus espacios de trabajo y estacionamiento en el ATC.</p>
      </header>

      <main className="main-content">
        <ReservationList 
          reservations={reservations} 
          onCancelRequest={handleOpenModal} 
        />
      </main>

      {selectedReservation && (
        <CancellationModal 
          reservation={selectedReservation}
          onClose={handleCloseModal}
          onConfirm={handleConfirmCancellation}
        />
      )}
    </div>
  );
}