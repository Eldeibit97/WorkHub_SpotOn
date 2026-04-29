import { useEffect, useState } from 'react'
import { getDashboardStats } from '../../api/admin'
import ReservationsByStatusPie from './components/charts/ReservationsByStatusPie'
import UsersByRolePie from './components/charts/UsersByRolePie'
import ReservationsLast7DaysBar from './components/charts/ReservationsLast7DaysBar'
import OccupancyByZoneDonut from './components/charts/OccupancyByZoneDonut'

const EMPTY_STATS = {
  totals: {
    users: 0,
    activeReservations: 0,
    availableSpaces: 0,
    cancelledReservations: 0,
  },
  reservationsByStatus: [],
  usersByRole: [],
  reservationsLast7Days: [],
  occupancyByZone: [],
}

const KPI_CONFIG = [
  { key: 'users', label: 'Usuarios totales' },
  { key: 'activeReservations', label: 'Reservas activas' },
  { key: 'availableSpaces', label: 'Espacios disponibles' },
  { key: 'cancelledReservations', label: 'Reservas canceladas' },
]

export default function DashboardOverview() {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getDashboardStats()
        if (cancelled) return
        setStats({
          totals: { ...EMPTY_STATS.totals, ...(data.totals || {}) },
          reservationsByStatus: data.reservationsByStatus || [],
          usersByRole: data.usersByRole || [],
          reservationsLast7Days: data.reservationsLast7Days || [],
          occupancyByZone: data.occupancyByZone || [],
        })
      } catch (loadError) {
        if (cancelled) return
        setError(
          loadError.message ||
            'No se pudieron cargar las métricas. Verifica la conexión con backend.',
        )
        setStats(EMPTY_STATS)
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
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>Dashboard</h1>
          <p className="admin-subtitle">
            Resumen ejecutivo de actividad, ocupación y usuarios del workhub.
          </p>
        </div>
      </header>

      {error && <div className="admin-feedback admin-feedback--error">{error}</div>}

      <section className="admin-kpi-grid">
        {KPI_CONFIG.map(({ key, label }) => (
          <article key={key} className="admin-kpi-card">
            <span className="admin-kpi-card__label">{label}</span>
            <span className="admin-kpi-card__value">
              {loading ? '...' : stats.totals[key] ?? 0}
            </span>
          </article>
        ))}
      </section>

      <section className="admin-charts-grid">
        <article className="admin-chart-card">
          <header className="admin-chart-card__header">
            <h3>Reservas por estado</h3>
            <span className="admin-chart-card__subtitle">Distribución actual</span>
          </header>
          {loading ? (
            <div className="admin-chart__loading" />
          ) : (
            <ReservationsByStatusPie data={stats.reservationsByStatus} />
          )}
        </article>

        <article className="admin-chart-card">
          <header className="admin-chart-card__header">
            <h3>Usuarios por rol</h3>
            <span className="admin-chart-card__subtitle">Permisos asignados</span>
          </header>
          {loading ? (
            <div className="admin-chart__loading" />
          ) : (
            <UsersByRolePie data={stats.usersByRole} />
          )}
        </article>

        <article className="admin-chart-card admin-chart-card--wide">
          <header className="admin-chart-card__header">
            <h3>Reservas últimos 7 días</h3>
            <span className="admin-chart-card__subtitle">Tendencia diaria</span>
          </header>
          {loading ? (
            <div className="admin-chart__loading" />
          ) : (
            <ReservationsLast7DaysBar data={stats.reservationsLast7Days} />
          )}
        </article>

        <article className="admin-chart-card admin-chart-card--wide">
          <header className="admin-chart-card__header">
            <h3>Ocupación por zona</h3>
            <span className="admin-chart-card__subtitle">Espacios ocupados vs total</span>
          </header>
          {loading ? (
            <div className="admin-chart__loading" />
          ) : (
            <OccupancyByZoneDonut data={stats.occupancyByZone} />
          )}
        </article>
      </section>
    </div>
  )
}
