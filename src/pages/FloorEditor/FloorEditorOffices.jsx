import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEdificios } from '../../api/floorEditor'
import './FloorEditorHub.css'

function ComingSoonModal({ onClose }) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Próximamente</h3>
        <p>La creación de oficinas estará disponible en una próxima versión.</p>
        <div className="admin-modal-actions">
          <button type="button" className="admin-btn admin-btn--primary" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FloorEditorOffices() {
  const navigate = useNavigate()
  const [edificios, setEdificios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showComingSoon, setShowComingSoon] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const list = await getEdificios()
        if (!cancelled) setEdificios(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="fe-hub">
      <header className="fe-hub__header">
        <h1 className="fe-hub__title">Oficinas</h1>
        <p className="fe-hub__subtitle">
          Selecciona un edificio para administrar los planos de sus pisos.
        </p>
      </header>

      {loading ? (
        <p className="fe-hub-loading">Cargando oficinas…</p>
      ) : (
        <div className="fe-hub-grid">
          {edificios.map((ed) => (
            <button
              key={ed.slug}
              type="button"
              className="fe-hub-card"
              onClick={() => navigate(`/admin/floor-editor/edificios/${ed.slug}`)}
            >
              <div className="fe-hub-card__thumb">
                {ed.imagenUrl ? (
                  <img src={ed.imagenUrl} alt="" />
                ) : (
                  <div className="fe-hub-card__thumb--placeholder">Sin imagen</div>
                )}
              </div>
              <div className="fe-hub-card__body">
                <span className="fe-hub-card__title">{ed.displayName}</span>
                {ed.direccion && (
                  <span className="fe-hub-card__meta">{ed.direccion}</span>
                )}
                <span className="fe-hub-card__meta">{ed.zonaCount} piso(s)</span>
              </div>
            </button>
          ))}

          <button
            type="button"
            className="fe-hub-card fe-hub-card--dashed"
            onClick={() => setShowComingSoon(true)}
          >
            <span className="fe-hub-card__plus" aria-hidden="true">
              +
            </span>
            <span>Crear oficina</span>
          </button>
        </div>
      )}

      {showComingSoon && <ComingSoonModal onClose={() => setShowComingSoon(false)} />}
    </div>
  )
}
