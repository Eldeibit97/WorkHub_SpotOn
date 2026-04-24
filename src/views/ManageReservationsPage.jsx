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
    isoDate: '2026-03-09T08:00:00',
    time: '08:00 → 13:00',
    location: '3rd Floor',
    details: 'SIERRA MADRE - ICSJ-3040'
  },
  {
    id: 2,
    type: 'Parking',
    date: 'jueves, 23 de abril de 2026', 
    isoDate: '2026-04-23T08:00:00',
    time: '08:00 → 13:00',
    location: 'South Parking Lot',
    details: '2nd Floor'
  },
  {
    id: 3,
    type: 'Workplace',
    date: 'viernes, 24 de abril de 2026',
    isoDate: '2026-04-24T08:00:00',
    time: '08:00 → 13:00',
    location: '4th Floor',
    details: 'SIERRA MADRE - ICSJ-4050'
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

  const handleConfirmCancellation = async () => {
    if (!selectedReservation) return;

    try {
      
      const response = await fetch(`http://localhost:3000/reservas/reserva/${selectedReservation.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const updatedReservations = reservations.filter(
          (res) => res.id !== selectedReservation.id
        );
        setReservations(updatedReservations);
        handleCloseModal();
        console.log("Reservación eliminada con éxito de la base de datos.");
      } else {
        alert("Error al cancelar: " + (data.message || data.error));
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      alert("No se pudo conectar con el servidor. Revisa que tu backend esté encendido.");
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
        <h2 className="page-title">Mis Reservaciones</h2>
        <p className="page-subtitle">Gestiona tus espacios de trabajo y estacionamiento.</p>
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