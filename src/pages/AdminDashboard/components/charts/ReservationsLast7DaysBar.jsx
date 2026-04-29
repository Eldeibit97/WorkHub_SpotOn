import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

export default function ReservationsLast7DaysBar({ data = [] }) {
  if (!data.length) {
    return <p className="admin-chart__empty">Sin datos de reservas en los últimos 7 días.</p>
  }

  const chartData = data.map((row) => ({
    label: formatDate(row.date),
    count: row.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="label" stroke="var(--text-secondary)" tickLine={false} />
        <YAxis stroke="var(--text-secondary)" allowDecimals={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: 'rgba(168, 85, 247, 0.08)' }}
          contentStyle={{
            background: 'var(--white)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            color: 'var(--text-primary)',
          }}
        />
        <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
