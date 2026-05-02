import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const ROLE_COLORS = {
  admin: '#a855f7',
  employee: '#10b981',
}

const FALLBACK_COLORS = ['#3b82f6', '#f59e0b', '#ec4899', '#22d3ee']

function getColor(role, index) {
  return ROLE_COLORS[role] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

export default function UsersByRolePie({ data = [] }) {
  if (!data.length) {
    return <p className="admin-chart__empty">Sin usuarios para mostrar.</p>
  }

  const chartData = data.map((row) => ({
    name: row.role,
    value: row.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          outerRadius={95}
          label={({ name, value }) => `${name}: ${value}`}
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
