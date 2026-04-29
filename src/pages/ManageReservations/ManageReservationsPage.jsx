import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HeaderNavBar from '../../components/HeaderNavBar.jsx';
import ReservationList from './components/ReservationList.jsx';
import CancellationModal from './components/CancellationModal.jsx';
import './ManageReservationsPage.css';

const initialReservations = [
  {
    id: 1, 
    type: 'Workplace',
    date: 'jueves, 23 de abril de 2026', 
    isoDate: '2026-04-23T08:00:00',
    time: '08:00 → 13:00',
    location: '3rd Floor',
    details: 'SIERRA MADRE - ICSJ-3040',
    estado_reserva: 'COMPLETADO' 
  },
  {
    id: 2,
    type: 'Workplace',
    date: 'sábado, 25 de abril de 2026', 
    isoDate: '2026-04-25T19:30:00', 
    time: '19:30 → 21:00',
    location: 'South Parking Lot',
    details: '2nd Floor',
    estado_reserva: 'ACTIVO' 
  },
  {
    id: 3,
    type: 'Parking',
    date: 'sábado, 25 de abril de 2026', 
    isoDate: '2026-04-25T16:00:00', 
    time: '16:00 → 20:00',
    location: 'South Parking Lot',
    details: 'Spot 15',
    estado_reserva: 'CHECKED_IN' 
  },
  {
    id: 4,
    type: 'Workplace',
    date: 'lunes, 27 de abril de 2026',
    isoDate: '2026-04-27T08:00:00', 
    time: '08:00 → 13:00',
    location: '4th Floor',
    details: 'SIERRA MADRE - ICSJ-4050',
    estado_reserva: 'ACTIVO' 
  }
];

export default function ManageReservationsPage() {
  const [reservations, setReservations] = useState(initialReservations);
  const [selectedReservation, setSelectedReservation] = useState(null);
  
  // Estado para manejar la carga visual por ID de reserva
  const [loadingId, setLoadingId] = useState(null); 

  const handleOpenModal = (reservation) => setSelectedReservation(reservation);
  const handleCloseModal = () => setSelectedReservation(null);

  // --- TRIGGER: CANCELAR ---
  const handleConfirmCancellation = async () => {
    if (!selectedReservation) return;
    try {
      const response = await fetch(`http://localhost:5500/reservas/reserva/${selectedReservation.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setReservations(reservations.filter(res => res.id !== selectedReservation.id));
        handleCloseModal();
      } else {
        alert("Error al cancelar: " + (data.message || data.error));
      }
    } catch {
      alert("Error al conectar con el servidor.");
    }
  };

  // --- TRIGGER: CHECK-IN ---
  const handleCheckIn = async (id) => {
    setLoadingId(id); // Activamos estado de carga
    try {
      const response = await fetch(`http://localhost:5500/reservas/check-in`, { // Ajusta la ruta a la tuya
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_reserva: id })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        // Actualizamos el estado local a CHECKED_IN
        setReservations(reservations.map(res => 
          res.id === id ? { ...res, estado_reserva: 'CHECKED_IN' } : res
        ));
        alert("¡Check-in exitoso!");
      } else {
        alert("Error en Check-in: " + data.message);
      }
    } catch {
      alert("Error de conexión al procesar el Check-in.");
    } finally {
      setLoadingId(null);
    }
  };

  // --- TRIGGER: CHECK-OUT ---
  const handleCheckOut = async (id) => {
    setLoadingId(id); // Activamos estado de carga
    try {
      const response = await fetch(`http://localhost:5500/reservas/check-out`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_reserva: id })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        // Actualizamos el estado local a COMPLETADO (Desaparecerán los botones)
        setReservations(reservations.map(res => 
          res.id === id ? { ...res, estado_reserva: 'COMPLETADO' } : res
        ));
        alert("Check-out realizado. Espacio liberado.");
      } else {
        alert("Error en Check-out: " + data.message);
      }
    } catch {
      alert("Error de conexión al procesar el Check-out.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="manage-page-container">
      <HeaderNavBar></HeaderNavBar>
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
          loadingId={loadingId}
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