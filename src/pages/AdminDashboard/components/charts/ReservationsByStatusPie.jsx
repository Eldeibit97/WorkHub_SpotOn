import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const STATUS_COLORS = {
  PENDIENTE: '#f59e0b',
  ACTIVO: '#10b981',
  CHECKED_IN: '#3b82f6',
  CHECKED_OUT: '#8b5cf6',
  CANCELADO: '#ef4444',
  EXPIRADO: '#6b7280',
}

const FALLBACK_COLORS = ['#a855f7', '#d946ef', '#ec4899', '#22d3ee', '#f97316', '#84cc16']

function getColor(status, index) {
  return STATUS_COLORS[status] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

export default function ReservationsByStatusPie({ data = [] }) {
  if (!data.length) {
    return <p className="admin-chart__empty">Sin reservas para mostrar.</p>
  }

  const chartData = data.map((row) => ({
    name: row.status,
    value: row.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={3}
        >
          {chartData.map((entry, index) => (
            <Cell key={entry.name} fill={getColor(entry.name, index)} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'var(--white)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            color: 'var(--text-primary)',
          }}
        />
        <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
