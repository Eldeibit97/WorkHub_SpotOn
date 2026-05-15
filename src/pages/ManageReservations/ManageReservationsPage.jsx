import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReservationList from './components/ReservationList.jsx';
import CancellationModal from './components/CancellationModal.jsx';
import ReservationDetailModal from './components/ReservationDetailModal.jsx';
import './ManageReservationsPage.css';

// Datos de prueba ajustados al 14 de Mayo de 2026 para ver todos los estados
const initialReservations = [
  {
    id: 1, 
    type: 'Workplace',
    date: 'martes, 12 de mayo de 2026', 
    isoDate: '2026-05-12T08:00:00', // Ya pasó
    time: '08:00 → 13:00',
    location: '3rd Floor',
    details: 'SIERRA MADRE - ICSJ-3040',
    estado_reserva: 'COMPLETADO',
    nombre_usuario: 'Ignacio'
  },
  {
    id: 2,
    type: 'Parking',
    date: 'jueves, 14 de mayo de 2026', 
    isoDate: '2026-05-14T14:00:00', // Empezó hace un rato (Check-in)
    time: '14:00 → 18:00',
    location: 'South Parking Lot',
    details: 'Spot 15',
    estado_reserva: 'CHECKED_IN',
    nombre_usuario: 'Ignacio'
  },
  {
    id: 3,
    type: 'Workplace',
    date: 'jueves, 14 de mayo de 2026', 
    isoDate: '2026-05-14T17:30:00', // Empieza en menos de 1 hora
    time: '17:30 → 19:30',
    location: '2nd Floor',
    details: 'SIERRA MADRE - ICSJ-2010',
    estado_reserva: 'ACTIVO',
    nombre_usuario: 'Ignacio'
  },
  {
    id: 4,
    type: 'Workplace',
    date: 'sábado, 16 de mayo de 2026',
    isoDate: '2026-05-16T08:00:00', // Futuro
    time: '08:00 → 13:00',
    location: '4th Floor',
    details: 'SIERRA MADRE - ICSJ-4050',
    estado_reserva: 'ACTIVO',
    nombre_usuario: 'Ignacio'
  }
];

export default function ManageReservationsPage() {
  const [reservations, setReservations] = useState(initialReservations);
  const [selectedReservation, setSelectedReservation] = useState(null);
  
  // En lugar de guardar el ID, guardamos todo el objeto para el modal
  const [detailReservation, setDetailReservation] = useState(null); 

  // --- HANDLERS DE MODALES ---
  const handleOpenModal = (reservation) => setSelectedReservation(reservation);
  const handleCloseModal = () => setSelectedReservation(null);
  const handleOpenDetail = (reservation) => setDetailReservation(reservation);
  const handleCloseDetail = () => setDetailReservation(null);

  // --- LÓGICA LOCAL (Sin Backend) ---
  const handleConfirmCancellation = () => {
    if (!selectedReservation) return;
    // Eliminamos del estado local
    setReservations(reservations.filter(res => res.id !== selectedReservation.id));
    handleCloseModal();
  };

  const handleCheckIn = (id) => {
    // Cambiamos el estado local a CHECKED_IN
    setReservations(reservations.map(res => 
      res.id === id ? { ...res, estado_reserva: 'CHECKED_IN' } : res
    ));
  };

  const handleCheckOut = (id) => {
    // Cambiamos el estado local a COMPLETADO
    setReservations(reservations.map(res => 
      res.id === id ? { ...res, estado_reserva: 'COMPLETADO' } : res
    ));
    alert("Check-out simulado con éxito. Espacio liberado.");
  };

  return (
    <div className="manage-page-container">
      <header className="brand-header">
        <h2 className="page-title">Mis Reservaciones</h2>
        <p className="page-subtitle">Gestiona tus espacios de trabajo y estacionamiento.</p>
      </header>

      <main className="main-content">
        <ReservationList 
          reservations={reservations} 
          onCancelRequest={handleOpenModal} 
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onViewDetails={handleOpenDetail} // Pasamos la función
        />
      </main>

      {/* Modal de Cancelación */}
      {selectedReservation && (
        <CancellationModal 
          reservation={selectedReservation}
          onClose={handleCloseModal}
          onConfirm={handleConfirmCancellation}
        />
      )}

      {/* Modal de Detalles (Le pasamos el objeto completo) */}
      {detailReservation && (
        <ReservationDetailModal 
          reservation={detailReservation} 
          onClose={handleCloseDetail} 
        />
      )}
    </div>
  );
}