import { useState } from 'react'
import { getReservations, saveReservations } from '../lib/constants'
import './MyReservations.css'

export default function MyReservations({ onNavigate }) {
  const [reservations, setReservations] = useState(() => getReservations())
  const vigentes = reservations.filter(r => r.estado === 'vigente')

  const cancelar = (id) => {
    const res = getReservations()
    const r = res.find(x => x.id === id)
    if (!r) return
    r.estado = 'cancelado'
    saveReservations(res)
    setReservations(res)
  }

  const liberar = (id) => {
    const res = getReservations()
    const r = res.find(x => x.id === id)
    if (!r) return
    r.estado = 'liberado'
    saveReservations(res)
    setReservations(res)
    onNavigate(r.tipo === 'estacionamiento' ? 'parking' : 'offices')
  }

  return (
    <div className="my-reservations view-content">
      <h2 className="view-title">Mis reservas</h2>
      <p className="view-subtitle">Gestiona tus reservas activas</p>

      {vigentes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
          <h3>No tienes reservas activas</h3>
          <p>Reserva un estacionamiento o escritorio para comenzar</p>
          <div className="empty-actions">
            <button className="btn btn-primary" onClick={() => onNavigate('parking')}>Estacionamiento</button>
            <button className="btn btn-secondary" onClick={() => onNavigate('offices')}>Oficina</button>
          </div>
        </div>
      ) : (
        <div className="reservations-list">
          {vigentes.map(r => (
            <div key={r.id} className="reservation-card">
              <div className="reservation-main">
                <div className="reservation-type">
                  {r.tipo === 'estacionamiento' ? (
                    <span className="type-badge parking">Estacionamiento</span>
                  ) : (
                    <span className="type-badge office">Oficina</span>
                  )}
                </div>
                <h4 className="reservation-space">{r.espacio}</h4>
                <p className="reservation-date">{r.fecha}</p>
                <p className="reservation-user">{r.nombre}</p>
              </div>
              <div className="reservation-actions">
                <button className="btn btn-ghost-sm" onClick={() => cancelar(r.id)}>Cancelar</button>
                <button className="btn btn-liberar" onClick={() => liberar(r.id)}>Liberar (no asistí)</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
