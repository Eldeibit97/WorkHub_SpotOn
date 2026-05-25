import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getEdificioBySlug, getZonasByEdificio } from '../../api/floorEditor'
import FloorEditorHubBreadcrumb from './components/FloorEditorHubBreadcrumb'
import './FloorEditorHub.css'

function EditZonaModal({ zona, onCancel, onSave }) {
  const [nombre, setNombre] = useState(zona.descripcion ?? '')
  const [codigo, setCodigo] = useState(zona.nombre_zona ?? '')
  const [descripcion, setDescripcion] = useState(zona.descripcion ?? '')

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <div className="admin-modal" role="dialog" aria-modal="true">
        <h3>Editar piso</h3>
        <div className="admin-form">
          <label>
            Código
            <input
              id="fe-edit-codigo"
              className="admin-input"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </label>
          <label>
            Nombre
            <input
              id="fe-edit-nombre"
              className="admin-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>
          <label>
            Descripción
            <input
              id="fe-edit-desc"
              className="admin-input"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </label>
        </div>
        <p className="fe-hub-card__meta" style={{ marginTop: '0.5rem' }}>
          Los cambios se guardan solo en esta sesión hasta que el backend exponga PATCH /api/admin/zonas.
        </p>
        <div className="admin-modal-actions">
          <button type="button" className="admin-btn admin-btn--secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() =>
              onSave({
                nombre_zona: codigo.trim() || zona.nombre_zona,
                descripcion: nombre.trim() || descripcion.trim() || zona.descripcion,
              })
            }
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteZonaModal({ zona, isOnlyZone, onCancel, onConfirm }) {
  if (!zona) return null

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <div className="admin-modal admin-modal--danger" role="dialog" aria-modal="true">
        <h3>Eliminar piso</h3>
        <p>
          Estás por eliminar el piso{' '}
          <strong>
            {zona.nombre_zona} · {zona.descripcion}
          </strong>
          .
        </p>
        {isOnlyZone ? (
          <p className="admin-warning-text">
            Es el único piso de esta oficina. No se puede eliminar en la vista mock.
          </p>
        ) : (
          <p className="admin-warning-text">
            En esta versión el piso se ocultará de la lista localmente. El backend aplicará soft delete
            cuando esté disponible.
          </p>
        )}
        <div className="admin-modal-actions">
          <button type="button" className="admin-btn admin-btn--secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={onConfirm}
            disabled={isOnlyZone}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FloorEditorFloors() {
  const { edificioSlug } = useParams()
  const navigate = useNavigate()
  const [edificio, setEdificio] = useState(null)
  const [zonas, setZonas] = useState([])
  const [hiddenIds, setHiddenIds] = useState(() => new Set())
  const [overrides, setOverrides] = useState({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editZona, setEditZona] = useState(null)
  const [deleteZona, setDeleteZona] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setNotFound(false)
      try {
        const meta = await getEdificioBySlug(edificioSlug)
        if (!meta) {
          if (!cancelled) setNotFound(true)
          return
        }
        const list = await getZonasByEdificio(edificioSlug)
        if (!cancelled) {
          setEdificio(meta)
          setZonas(list)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [edificioSlug])

  const visibleZonas = useMemo(() => {
    return zonas
      .filter((z) => !hiddenIds.has(z.id_zona))
      .map((z) => ({ ...z, ...overrides[z.id_zona] }))
  }, [zonas, hiddenIds, overrides])

  if (notFound) {
    return <Navigate to="/admin/floor-editor" replace />
  }

  function handleSaveEdit(patch) {
    if (!editZona) return
    setOverrides((prev) => ({
      ...prev,
      [editZona.id_zona]: { ...prev[editZona.id_zona], ...patch },
    }))
    setEditZona(null)
  }

  function handleConfirmDelete() {
    if (!deleteZona || visibleZonas.length <= 1) return
    setHiddenIds((prev) => new Set(prev).add(deleteZona.id_zona))
    setDeleteZona(null)
  }

  return (
    <div className="fe-hub">
      <FloorEditorHubBreadcrumb
        items={[
          { label: 'Oficinas', to: '/admin/floor-editor' },
          { label: edificio?.displayName ?? '…' },
        ]}
      />

      <header className="fe-hub__header">
        <h1 className="fe-hub__title">{edificio?.displayName ?? 'Pisos'}</h1>
        <p className="fe-hub__subtitle">
          {edificio?.direccion || 'Selecciona un piso para editar su plano.'}
        </p>
      </header>

      {loading ? (
        <p className="fe-hub-loading">Cargando pisos…</p>
      ) : (
        <div className="fe-hub-grid">
          {visibleZonas.map((z) => (
            <article key={z.id_zona} className="fe-hub-card fe-hub-card--floor">
              <button
                type="button"
                className="fe-hub-card__enter"
                onClick={() =>
                  navigate(
                    `/admin/floor-editor/edificios/${edificioSlug}/pisos/${z.id_zona}`,
                  )
                }
              >
                <div className="fe-hub-card__thumb">
                  {z.thumbUrl ? (
                    <img src={z.thumbUrl} alt="" />
                  ) : (
                    <div className="fe-hub-card__thumb--placeholder">Sin vista previa</div>
                  )}
                </div>
                <div className="fe-hub-card__body">
                  <span className="fe-hub-card__title">{z.nombre_zona}</span>
                  <span className="fe-hub-card__meta">{z.descripcion}</span>
                  <span className="fe-hub-card__meta">{z.spaceCount} espacio(s)</span>
                </div>
              </button>
              <div className="fe-hub-card__actions" style={{ padding: '0 1.1rem 1rem' }}>
                <button
                  type="button"
                  className="fe-hub-card__action-btn"
                  onClick={() => setEditZona(z)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="fe-hub-card__action-btn fe-hub-card__action-btn--danger"
                  onClick={() => setDeleteZona(z)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}

          <button
            type="button"
            className="fe-hub-card fe-hub-card--dashed"
            disabled
            title="Próximamente"
          >
            <span className="fe-hub-card__plus" aria-hidden="true">
              +
            </span>
            <span>Agregar piso</span>
          </button>
        </div>
      )}

      {editZona && (
        <EditZonaModal
          zona={editZona}
          onCancel={() => setEditZona(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deleteZona && (
        <DeleteZonaModal
          zona={deleteZona}
          isOnlyZone={visibleZonas.length <= 1}
          onCancel={() => setDeleteZona(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
