import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAdminUserReservations, cancelAdminUserReservation } from '../../api/admin'

const ALLOWED_STATUSES = ['PENDIENTE', 'ACTIVO', 'CANCELADO', 'COMPLETADO', 'CHECKED_IN']

const STATUS_LABELS = {
  PENDIENTE:  { label: 'Pendiente',   color: '#854F0B', bg: '#FAEEDA' },
  ACTIVO:     { label: 'Activo',      color: '#185FA5', bg: '#E6F1FB' },
  CHECKED_IN: { label: 'Check-in',    color: '#3B6D11', bg: '#EAF3DE' },
  CANCELADO:  { label: 'Cancelado',   color: '#A32D2D', bg: '#FCEBEB' },
  COMPLETADO: { label: 'Completado',  color: '#5F5E5A', bg: '#F1EFE8' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_LABELS[status] || { label: status, color: '#5F5E5A', bg: '#F1EFE8' }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      fontSize: '11px', fontWeight: 600,
      padding: '3px 10px', borderRadius: '999px',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

export default function AdminUserReservations() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [reservaciones, setReservaciones] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [mensaje, setMensaje]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [from, setFrom]         = useState('')
  const [to, setTo]             = useState('')
  const [page, setPage]         = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]       = useState(0)
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getAdminUserReservations(id, {
          status:   statusFilter || undefined,
          from:     from || undefined,
          to:       to   || undefined,
          page,
          pageSize: 15,
        })
        if (cancelled) return
        setReservaciones(data.reservaciones || [])
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
      } catch (e) {
        if (!cancelled) setError(e.message || 'Error al cargar reservaciones')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, statusFilter, from, to, page])

  async function handleCancel(id_reserva) {
    if (!confirm('¿Cancelar esta reserva?')) return
    setCancelling(id_reserva)
    setError('')
    try {
      await cancelAdminUserReservation(id, id_reserva)
      setMensaje('Reserva cancelada correctamente.')
      setReservaciones(prev =>
        prev.map(r => r.id_reserva === id_reserva
          ? { ...r, estado_reserva: 'CANCELADO' } : r)
      )
    } catch (e) {
      setError(e.message || 'No se pudo cancelar la reserva')
    } finally {
      setCancelling(null)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            className="admin-btn admin-btn--secondary"
            onClick={() => navigate('/admin/usuarios')}
            style={{ marginBottom: '0.75rem', fontSize: '13px' }}
          >
            Volver a usuarios
          </button>
          <h1>Reservaciones del usuario</h1>
          <p className="admin-subtitle">
            {total} reserva{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="admin-select admin-select--ghost"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">Todos los estados</option>
            {ALLOWED_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]?.label || s}</option>
            ))}
          </select>
          <label className="admin-date-filter__label">
            Desde
            <input
              type="date"
              className="admin-input admin-date-filter__input"
              value={from}
              onChange={e => { setFrom(e.target.value); setPage(1) }}
            />
          </label>
          <label className="admin-date-filter__label">
            Hasta
            <input
              type="date"
              className="admin-input admin-date-filter__input"
              value={to}
              onChange={e => { setTo(e.target.value); setPage(1) }}
            />
          </label>
          {(from || to || statusFilter) && (
            <button
              className="admin-btn admin-btn--secondary"
              onClick={() => { setFrom(''); setTo(''); setStatusFilter(''); setPage(1) }}
              style={{ fontSize: '12px' }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </header>

      {mensaje && (
        <div className="admin-feedback admin-feedback--success" style={{ marginBottom: '1rem' }}>
          {mensaje}
        </div>
      )}
      {error && (
        <div className="admin-feedback admin-feedback--error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <section className="admin-table-card">
        {loading ? (
          <div className="admin-state">Cargando reservaciones...</div>
        ) : reservaciones.length === 0 ? (
          <div className="admin-state">No se encontraron reservaciones con esos filtros.</div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Espacio</th>
                  <th>Zona</th>
                  <th>Fecha</th>
                  <th>Hora inicio</th>
                  <th>Hora fin</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {reservaciones.map(r => (
                  <tr key={r.id_reserva}>
                    <td>
                      <span style={{ fontWeight: 500 }}>{r.nombre_espacio}</span>
                      <br />
                      <span className="admin-table__muted" style={{ fontSize: '11px' }}>{r.codigo_espacio}</span>
                    </td>
                    <td>
                      {r.nombre_zona}
                      <br />
                      <span className="admin-table__muted" style={{ fontSize: '11px' }}>{r.edificio}</span>
                    </td>
                    <td className="admin-table__muted">{r.fecha_reserva?.slice(0, 10)}</td>
                    <td>{r.hora_inicio}</td>
                    <td>{r.hora_fin}</td>
                    <td className="admin-table__muted" style={{ textTransform: 'capitalize', fontSize: '13px' }}>
                      {r.tipo_reserva?.toLowerCase()}
                    </td>
                    <td><StatusBadge status={r.estado_reserva} /></td>
                    <td>
                      {['PENDIENTE', 'ACTIVO'].includes(r.estado_reserva) && (
                        <button
                          className="admin-btn admin-btn--danger-ghost"
                          style={{ fontSize: '12px', padding: '4px 10px', minHeight: 'unset' }}
                          onClick={() => handleCancel(r.id_reserva)}
                          disabled={cancelling === r.id_reserva}
                        >
                          {cancelling === r.id_reserva ? '...' : 'Cancelar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <footer className="admin-pagination">
            <span className="admin-pagination__info">
              Página <strong>{page}</strong> de {totalPages}
            </span>
            <div className="admin-pagination__controls">
              <button
                className="admin-icon-btn admin-icon-btn--ghost"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                ‹
              </button>
              <button
                className="admin-icon-btn admin-icon-btn--ghost"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                ›
              </button>
            </div>
          </footer>
        )}
      </section>
    </div>
  )
}