import { useState } from 'react'
import {
  getReservations,
  saveReservations,
  getSpaceStatus,
  getTodayStr,
  generateId,
  OFFICE_SPACES
} from '../lib/constants'
} from '../../lib/constants'
import './Parking.css'

export default function Offices({ onNavigate }) {
  const today = getTodayStr()
  const [date, setDate] = useState(today)
  const [floor, setFloor] = useState(1)
  const [reservations, setReservations] = useState(() => getReservations())
  const [selected, setSelected] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [showForm, setShowForm] = useState(false)

  const spaces = OFFICE_SPACES[floor] || []

  const handleSelect = (spaceId, status) => {
    if (status === 'occupied') return
    setSelected({ id: spaceId, status })
    setShowForm(true)
  }

  const handleConfirm = () => {
    if (!selected || !name.trim() || !email.trim()) return

    const res = getReservations()

    if (selected.status === 'claimable') {
      const lib = res.find(
        r => r.tipo === 'oficina' && r.espacio === selected.id &&
        r.fecha === date && r.estado === 'liberado'
      )
      if (lib) lib.estado = 'reclamado'
    }

    res.push({
      id: generateId(),
      tipo: 'oficina',
      espacio: selected.id,
      fecha: date,
      piso: String(floor),
      nombre: name.trim(),
      email: email.trim(),
      estado: 'vigente'
    })
    saveReservations(res)
    setReservations(res)
    setSelected(null)
    setShowForm(false)
    setName('')
    setEmail('')
    onNavigate('my-reservations')
  }

  return (
    <div className="parking view-content offices">
      <h2 className="view-title">Reservar oficina</h2>
      <p className="view-subtitle">Selecciona fecha, piso y el escritorio deseado</p>

      <div className="filters">
        <div className="filter-group">
          <label>Fecha</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input"
          />
        </div>
        <div className="filter-group">
          <label>Piso</label>
          <select
            value={floor}
            onChange={e => setFloor(Number(e.target.value))}
            className="input"
          >
            <option value={1}>Piso 1</option>
            <option value={2}>Piso 2</option>
          </select>
        </div>
      </div>

      <div className="spaces-grid">
        {spaces.map(spaceId => {
          const status = getSpaceStatus(reservations, 'oficina', spaceId, date)
          return (
            <button
              key={spaceId}
              className={`space-card ${status} ${selected?.id === spaceId ? 'selected' : ''}`}
              onClick={() => handleSelect(spaceId, status)}
              disabled={status === 'occupied'}
            >
              <span className="space-label">{spaceId}</span>
              <span className="space-status">
                {status === 'available' ? 'Disponible' : status === 'claimable' ? 'Claim' : 'Ocupado'}
              </span>
            </button>
          )
        })}
      </div>

      {showForm && selected && (
        <div className="reservation-panel">
          <h3>Confirmar reserva</h3>
          <p className="panel-space">Escritorio <strong>{selected.id}</strong></p>
          <div className="form-row">
            <input
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
            />
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={handleConfirm}>Reservar</button>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setSelected(null); }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
