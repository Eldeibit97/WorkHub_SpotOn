import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import './Verificacion.css'

const Verificacion = () => {
  const { reservaId } = useParams()
  const [reserva, setReserva] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReserva = async () => {
      try {
        setLoading(true)
        // TODO: Reemplazar con tu endpoint real
        // const response = await fetch(`/api/reservas/${reservaId}`)
        // const data = await response.json()
        // setReserva(data)
        
        // Datos de ejemplo para desarrollo
        setReserva({
          id: reservaId,
          mail: 'usuario@example.com',
          placa: 'ABC-123-D',
          fechaReserva: '2025-06-15',
          horaInicio: '08:00',
          horaSalida: '17:00',
          edificio: 'Edificio A',
          lugarAsignado: 'A-S2-045',
          estado: 'CONFIRMADA',
          fechaCreacion: new Date().toLocaleDateString()
        })
      } catch (err) {
        setError('Error al cargar la reserva')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (reservaId) {
      fetchReserva()
    }
  }, [reservaId])

  if (loading) {
    return (
      <div className="verificacion-container">
        <div className="loading">Cargando información de la reserva...</div>
      </div>
    )
  }

  if (error || !reserva) {
    return (
      <div className="verificacion-container">
        <div className="error">{error || 'Reserva no encontrada'}</div>
      </div>
    )
  }

  return (
    <div className="verificacion-container">
      <div className="verificacion-card">
        {/* Header */}
        <div className="verificacion-header">
          <div className="header-status">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="status-icon">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className={`status-badge status-${reserva.estado?.toLowerCase()}`}>
              {reserva.estado || 'VERIFICADA'}
            </span>
          </div>
          <h1 className="verificacion-title">Verificación de Reserva</h1>
          <p className="verificacion-subtitle">ID: {reserva.id}</p>
        </div>

        {/* Datos principales */}
        <div className="section">
          <h2 className="section-title">Información de la Reserva</h2>
          <div className="fields-grid">
            <div className="field">
              <label className="field-label">Fecha de Reserva</label>
              <p className="field-value">{reserva.fechaReserva}</p>
            </div>
            <div className="field">
              <label className="field-label">Horario</label>
              <p className="field-value">{reserva.horaInicio} - {reserva.horaSalida}</p>
            </div>
          </div>
        </div>

        {/* Detalles de estacionamiento */}
        <div className="section">
          <h2 className="section-title">Asignación de Estacionamiento</h2>
          <div className="fields-grid">
            <div className="field">
              <label className="field-label">Edificio</label>
              <p className="field-value">{reserva.edificio || 'No asignado'}</p>
            </div>
            <div className="field">
              <label className="field-label">Lugar Asignado</label>
              <p className="field-value parking-space">{reserva.lugarAsignado || 'No asignado'}</p>
            </div>
          </div>
        </div>

        {/* Datos del titular */}
        <div className="section">
          <h2 className="section-title">Titular de la Reserva</h2>
          <div className="fields-grid">
            <div className="field">
              <label className="field-label">Correo Electrónico</label>
              <p className="field-value">{reserva.mail}</p>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="section metadata">
          <p className="metadata-text">Creada: {reserva.fechaCreacion}</p>
        </div>

        {/* Acciones */}
        <div className="actions">
          <button className="btn btn-primary">Confirmar Entrada</button>
          <button className="btn btn-secondary">Volver</button>
        </div>
      </div>
    </div>
  )
}

export default Verificacion