import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePurplePoints } from '../../context/PurplePointsContext'
import { apiFetch } from '../../api/client'
import { getStoredToken } from '../../api/auth'
import ReservationList from './components/ReservationList.jsx'
import CancellationModal from './components/CancellationModal.jsx'
import ReservationDetailModal from './components/ReservationDetailModal.jsx'
import './ManageReservationsPage.css'

function authHeaders() {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Convierte una reserva del backend al formato que ReservationCard espera
function toCardFormat(r) {
  const fecha = r.fecha_reserva ? new Date(r.fecha_reserva) : null

  const dateLabel = fecha
    ? fecha.toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—'

  const isoDate = fecha
    ? `${r.fecha_reserva?.slice(0, 10)}T${r.hora_inicio || '00:00:00'}`
    : undefined

  const time = r.hora_inicio && r.hora_fin
    ? `${r.hora_inicio.slice(0, 5)} → ${r.hora_fin.slice(0, 5)}`
    : '—'

  const type = r.nombre_tipo || r.tipo_reserva || 'Espacio'
  const location = [r.nombre_zona, r.edificio].filter(Boolean).join(' · ') || '—'
  const details = [r.nombre_espacio, r.codigo_espacio].filter(Boolean).join(' - ') || '—'

  return {
    id: r.id_reserva,
    type,
    date: dateLabel,
    isoDate,
    time,
    location,
    details,
    estado_reserva: r.estado_reserva,
    nombre_usuario: r.nombre_usuario || '',
    // guardamos los originales por si los necesita el modal
    _raw: r,
  }
}

export default function ManageReservationsPage() {
  const { user } = useAuth()
  const { refreshBalance } = usePurplePoints()
  const userId = user?.sub

  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingId, setLoadingId] = useState(null)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [detailReservation, setDetailReservation] = useState(null)

  // Carga reservas del backend
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await apiFetch(
          `/api/reservas/consulta?userId=${userId}`,
          { headers: authHeaders() }
        )
        const data = await res.json()
        if (cancelled) return
        setReservations((Array.isArray(data) ? data : []).map(toCardFormat))
      } catch (e) {
        if (!cancelled) setError('No se pudieron cargar las reservaciones.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [userId])

  // --- HANDLERS DE MODALES ---
  const handleOpenModal = (reservation) => setSelectedReservation(reservation)
  const handleCloseModal = () => setSelectedReservation(null)
  const handleOpenDetail = (reservation) => setDetailReservation(reservation)
  const handleCloseDetail = () => setDetailReservation(null)

  // --- CHECK-IN ---
  const handleCheckIn = async (id) => {
    setLoadingId(id)
    try {
      const res = await apiFetch('/api/reservas/check-in', {
        method: 'PUT',
        headers: authHeaders(),
        body: { id_reserva: id },
      })
      if (res.ok) {
        setReservations(prev =>
          prev.map(r => r.id === id ? { ...r, estado_reserva: 'CHECKED_IN' } : r)
        )
      } else {
        const data = await res.json()
        setError(data.message || 'No se pudo hacer check-in')
      }
    } catch {
      setError('Error al hacer check-in')
    } finally {
      setLoadingId(null)
    }
  }

  // --- CHECK-OUT ---
  const handleCheckOut = async (id) => {
    setLoadingId(id)
    try {
      const res = await apiFetch('/api/reservas/check-out', {
        method: 'PUT',
        headers: authHeaders(),
        body: { id_reserva: id },
      })
      if (res.ok) {
        setReservations(prev =>
          prev.map(r => r.id === id ? { ...r, estado_reserva: 'COMPLETADO' } : r)
        )
        // Refrescar saldo de PP (el backend otorga bonus al completar la visita)
        refreshBalance().catch(() => {})
      } else {
        const data = await res.json()
        setError(data.message || 'No se pudo hacer check-out')
      }
    } catch {
      setError('Error al hacer check-out')
    } finally {
      setLoadingId(null)
    }
  }

  // --- CANCELAR ---
  const handleConfirmCancellation = async () => {
    if (!selectedReservation) return
    const id = selectedReservation.id
    try {
      const res = await apiFetch('/api/reservas/update', {
        method: 'PUT',
        headers: authHeaders(),
        body: {
          id_reserva: id,
          id_usuario: userId,
          id_espacio: selectedReservation._raw?.id_espacio,
          fecha_reserva: selectedReservation._raw?.fecha_reserva,
          hora_inicio: selectedReservation._raw?.hora_inicio,
          hora_fin: selectedReservation._raw?.hora_fin,
          estado_reserva: 'CANCELADO',
          fecha_creacion: selectedReservation._raw?.fecha_creacion,
          tipo_reserva: selectedReservation._raw?.tipo_reserva,
        },
      })
      if (res.ok) {
        setReservations(prev => prev.filter(r => r.id !== id))
      } else {
        const data = await res.json()
        setError(data.message || 'No se pudo cancelar la reserva')
      }
    } catch {
      setError('Error al cancelar la reserva')
    } finally {
      handleCloseModal()
    }
  }

  return (
    <div className="manage-page-container">
      <header className="brand-header">
        <h2 className="page-title">Mis Reservaciones</h2>
        <p className="page-subtitle">Gestiona tus espacios de trabajo y estacionamiento.</p>
      </header>

      <main className="main-content">
        {error && (
          <p style={{ color: '#E24B4A', fontSize: '14px', marginBottom: '1rem' }}>
            {error}
          </p>
        )}
        {loading ? (
          <div className="reservation-list">
            {[0, 1, 2].map((i) => (
              <div className="skeleton-res-card" key={i}>
                <div className="skeleton-res-header">
                  <div className="skeleton-res-line skeleton-res-badge" />
                  <div className="skeleton-res-line skeleton-res-type" />
                </div>
                <div className="skeleton-res-line skeleton-res-row skeleton-res-row-medium" />
                <div className="skeleton-res-line skeleton-res-row skeleton-res-row-short" />
                <div className="skeleton-res-line skeleton-res-row skeleton-res-row-long" />
                <div className="skeleton-res-line skeleton-res-row skeleton-res-row-medium" />
                <div className="skeleton-res-actions">
                  <div className="skeleton-res-line skeleton-res-btn" />
                  <div className="skeleton-res-line skeleton-res-btn" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ReservationList
            reservations={reservations}
            onCancelRequest={handleOpenModal}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onViewDetails={handleOpenDetail}
            loadingId={loadingId}
          />
        )}
      </main>

      {selectedReservation && (
        <CancellationModal
          reservation={selectedReservation}
          onClose={handleCloseModal}
          onConfirm={handleConfirmCancellation}
        />
      )}

      {detailReservation && (
        <ReservationDetailModal
          reservation={detailReservation}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  )
}