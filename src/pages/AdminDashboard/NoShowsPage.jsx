import { useEffect, useState } from 'react'
import { getNoShowHeatmap } from '../../api/admin'
import NoShowHeatmapChart from './components/charts/NoShowHeatmapChart'

const EMPTY = { heatmap: [], total: 0, maxCount: 0 }

export default function NoShowsPage() {
  const [data, setData]       = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [from, setFrom]       = useState('')
  const [to, setTo]           = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const result = await getNoShowHeatmap({
          from: from || undefined,
          to:   to   || undefined,
        })
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No se pudo cargar el mapa de calor.')
          setData(EMPTY)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [from, to])

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>No Shows</h1>
          <p className="admin-subtitle">
            Distribución de reservas no atendidas por día y hora. Identifica
            los patrones de ausentismo para optimizar la capacidad.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="admin-date-filter__label">
            Desde
            <input
              type="date"
              className="admin-input admin-date-filter__input"
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
          </label>
          <label className="admin-date-filter__label">
            Hasta
            <input
              type="date"
              className="admin-input admin-date-filter__input"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </label>
          {(from || to) && (
            <button
              className="admin-btn admin-btn--secondary"
              onClick={() => { setFrom(''); setTo('') }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </header>

      {error && <div className="admin-feedback admin-feedback--error">{error}</div>}

      {/* KPI de total no-shows */}
      <section className="admin-kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <article className="admin-kpi-card">
          <span className="admin-kpi-card__label">Total no shows</span>
          <span className="admin-kpi-card__value">
            {loading ? '…' : data.total}
          </span>
        </article>
        <article className="admin-kpi-card">
          <span className="admin-kpi-card__label">Pico máximo (celda)</span>
          <span className="admin-kpi-card__value">
            {loading ? '…' : data.maxCount}
          </span>
        </article>
      </section>

      {/* Heatmap */}
      <section>
        <article className="admin-chart-card" style={{ gridColumn: 'span 2' }}>
          <header className="admin-chart-card__header">
            <h3>Mapa de calor — No Shows por día y hora</h3>
            <span className="admin-chart-card__subtitle">
              Intensidad de color = cantidad de no shows
            </span>
          </header>
          {loading ? (
            <div className="admin-chart__loading" style={{ height: 320 }} />
          ) : (
            <NoShowHeatmapChart
              data={data.heatmap}
              maxCount={data.maxCount}
            />
          )}
        </article>
      </section>
    </div>
  )
}