import { useEffect, useState } from 'react'
import { getNoShowHeatmap, getNoShowFloorHeatmap } from '../../api/admin'
import { getFloorMap, getZonas } from '../../api/spaces'
import NoShowHeatmapChart from './components/charts/NoShowHeatmapChart'
import FloorNoShowMap from './components/charts/FloorNoShowMap'

const EMPTY_TEMPORAL = { heatmap: [], total: 0, maxCount: 0 }
const EMPTY_FLOOR    = { noShowsBySpace: [], total: 0, maxCount: 0 }

export default function NoShowsPage() {
  // Filtros compartidos
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')

  // Tab activo
  const [activeTab, setActiveTab] = useState('temporal')

  // --- Vista temporal ---
  const [temporalData, setTemporalData] = useState(EMPTY_TEMPORAL)
  const [temporalLoading, setTemporalLoading] = useState(true)
  const [temporalError,   setTemporalError]   = useState('')

  // --- Vista espacial ---
  const [zonas,       setZonas]       = useState([])
  const [zonaId,      setZonaId]      = useState('')
  const [floorMap,    setFloorMap]    = useState(null)
  const [floorData,   setFloorData]   = useState(EMPTY_FLOOR)
  const [floorLoading, setFloorLoading] = useState(false)
  const [floorError,   setFloorError]   = useState('')

  // Cargar lista de zonas al montar
  useEffect(() => {
    getZonas().then((zs) => {
      setZonas(zs)
      if (zs.length > 0) setZonaId(String(zs[0].id_zona))
    }).catch(() => {})
  }, [])

  // Cargar datos temporales cuando cambien filtros o tab
  useEffect(() => {
    if (activeTab !== 'temporal') return
    let cancelled = false

    async function load() {
      setTemporalLoading(true)
      setTemporalError('')
      try {
        const result = await getNoShowHeatmap({ from: from || undefined, to: to || undefined })
        if (!cancelled) setTemporalData(result)
      } catch (err) {
        if (!cancelled) { setTemporalError(err.message || 'Error al cargar.'); setTemporalData(EMPTY_TEMPORAL) }
      } finally {
        if (!cancelled) setTemporalLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeTab, from, to])

  // Cargar mapa de piso + datos espaciales cuando cambien zona, fechas o tab
  useEffect(() => {
    if (activeTab !== 'espacial' || !zonaId) return
    let cancelled = false

    async function load() {
      setFloorLoading(true)
      setFloorError('')
      try {
        const [map, data] = await Promise.all([
          getFloorMap(Number(zonaId)),
          getNoShowFloorHeatmap({ zonaId, from: from || undefined, to: to || undefined }),
        ])
        if (!cancelled) {
          setFloorMap(map)
          setFloorData(data)
        }
      } catch (err) {
        if (!cancelled) { setFloorError(err.message || 'Error al cargar.'); setFloorData(EMPTY_FLOOR) }
      } finally {
        if (!cancelled) setFloorLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeTab, zonaId, from, to])

  return (
    <div className="admin-page">
      {/* Header con filtros compartidos */}
      <header className="admin-page__header">
        <div>
          <h1>No Shows</h1>
          <p className="admin-subtitle">
            Análisis de reservas no atendidas por horario y por ubicación en planta.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="admin-date-filter__label">
            Desde
            <input type="date" className="admin-input admin-date-filter__input"
              value={from} onChange={e => setFrom(e.target.value)} />
          </label>
          <label className="admin-date-filter__label">
            Hasta
            <input type="date" className="admin-input admin-date-filter__input"
              value={to} onChange={e => setTo(e.target.value)} />
          </label>
          {(from || to) && (
            <button className="admin-btn admin-btn--secondary"
              onClick={() => { setFrom(''); setTo('') }}>
              Limpiar filtros
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="nsh-tabs">
        <button
          className={`nsh-tab${activeTab === 'temporal'  ? ' nsh-tab--active' : ''}`}
          onClick={() => setActiveTab('temporal')}
        >
          Por horario
        </button>
        <button
          className={`nsh-tab${activeTab === 'espacial' ? ' nsh-tab--active' : ''}`}
          onClick={() => setActiveTab('espacial')}
        >
          Por ubicación
        </button>
      </div>

      {/* ── Vista temporal ── */}
      {activeTab === 'temporal' && (
        <>
          {temporalError && <div className="admin-feedback admin-feedback--error">{temporalError}</div>}
          <section className="admin-kpi-grid" style={{ marginBottom: '1.5rem' }}>
            <article className="admin-kpi-card">
              <span className="admin-kpi-card__label">Total no shows</span>
              <span className="admin-kpi-card__value">{temporalLoading ? '…' : temporalData.total}</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-card__label">Pico máximo (celda)</span>
              <span className="admin-kpi-card__value">{temporalLoading ? '…' : temporalData.maxCount}</span>
            </article>
          </section>
          <article className="admin-chart-card">
            <header className="admin-chart-card__header">
              <h3>Mapa de calor — No Shows por día y hora</h3>
              <span className="admin-chart-card__subtitle">Intensidad = cantidad de no shows</span>
            </header>
            {temporalLoading
              ? <div className="admin-chart__loading" style={{ height: 320 }} />
              : <NoShowHeatmapChart data={temporalData.heatmap} maxCount={temporalData.maxCount} />
            }
          </article>
        </>
      )}

      {/* ── Vista espacial ── */}
      {activeTab === 'espacial' && (
        <>
          {floorError && <div className="admin-feedback admin-feedback--error">{floorError}</div>}

          {/* Selector de piso (específico de esta vista) */}
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label className="admin-date-filter__label">
              Piso
              <select
                className="admin-select"
                value={zonaId}
                onChange={e => setZonaId(e.target.value)}
              >
                {zonas.map((z) => (
                  <option key={z.id_zona} value={z.id_zona}>
                    {z.nombre_zona || z.descripcion || `Zona ${z.id_zona}`}
                    {z.edificio ? ` — ${z.edificio}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className="admin-kpi-grid" style={{ marginBottom: '1.5rem' }}>
            <article className="admin-kpi-card">
              <span className="admin-kpi-card__label">No shows en este piso</span>
              <span className="admin-kpi-card__value">{floorLoading ? '…' : floorData.total}</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-card__label">Espacio más afectado</span>
              <span className="admin-kpi-card__value">{floorLoading ? '…' : floorData.maxCount}</span>
            </article>
          </section>

          <article className="admin-chart-card">
            <header className="admin-chart-card__header">
              <h3>Mapa de no shows por espacio</h3>
              <span className="admin-chart-card__subtitle">
                Pasa el cursor sobre un espacio para ver su detalle
              </span>
            </header>
            {floorLoading
              ? <div className="admin-chart__loading" style={{ height: 420 }} />
              : <FloorNoShowMap
                  floorMap={floorMap}
                  noShowsBySpace={floorData.noShowsBySpace}
                  maxCount={floorData.maxCount}
                />
            }
          </article>
        </>
      )}
    </div>
  )
}