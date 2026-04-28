import { useState } from 'react'
import {
  getReservations,
  saveReservations,
  getSpaceStatus,
  getTodayStr,
  generateId,
  PARKING_SPACES
} from '../lib/constants'
} from '../../lib/constants'
import './Parking.css'

export default function Parking({ onNavigate }) {
  const today = getTodayStr()
  const [date, setDate] = useState(today)
  const [zone, setZone] = useState('A')
  const [reservations, setReservations] = useState(() => getReservations())
  const [selected, setSelected] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [showForm, setShowForm] = useState(false)

  const spaces = PARKING_SPACES[zone] || []

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
        r => r.tipo === 'estacionamiento' && r.espacio === selected.id &&
        r.fecha === date && r.estado === 'liberado'
      )
      if (lib) lib.estado = 'reclamado'
    }

    res.push({
      id: generateId(),
      tipo: 'estacionamiento',
      espacio: selected.id,
      fecha: date,
      zona: zone,
      nombre: name.trim(),
      email: email.trim(),
      estado: 'vigente'
    })
    saveReservations(res)
    setReservations(getReservations())
    setSelected(null)
    setShowForm(false)
    setName('')
    setEmail('')
    onNavigate('my-reservations')
  }

  return (
    <div className="parking view-content">
      <h2 className="view-title">Reservar estacionamiento</h2>
      <p className="view-subtitle">Selecciona fecha, zona y el cajón deseado</p>

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
          <label>Zona</label>
          <select
            value={zone}
            onChange={e => setZone(e.target.value)}
            className="input"
          >
            <option value="A">Zona A</option>
            <option value="B">Zona B</option>
          </select>
        </div>
      </div>

      <div className="spaces-grid">
        {spaces.map(spaceId => {
          const status = getSpaceStatus(reservations, 'estacionamiento', spaceId, date)
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
          <p className="panel-space">Espacio <strong>{selected.id}</strong></p>
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
