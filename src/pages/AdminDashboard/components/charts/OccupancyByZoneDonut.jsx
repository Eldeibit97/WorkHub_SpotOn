import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const ZONE_COLORS = ['#a855f7', '#d946ef', '#3b82f6', '#10b981', '#f59e0b', '#ec4899']

export default function OccupancyByZoneDonut({ data = [] }) {
  if (!data.length) {
    return <p className="admin-chart__empty">Sin datos de ocupación.</p>
  }

  const chartData = data.map((row) => ({
    name: row.zone,
    value: row.occupied,
    total: row.total,
  }))

  const totalOccupied = chartData.reduce((acc, item) => acc + item.value, 0)
  const totalSpaces = data.reduce((acc, row) => acc + (row.total ?? 0), 0)
  const percentage = totalSpaces ? Math.round((totalOccupied / totalSpaces) * 100) : 0

  return (
    <div className="admin-chart__donut">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={ZONE_COLORS[index % ZONE_COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, _name, item) => {
              const total = item?.payload?.total
              if (total === undefined) return value
              return [`${value} / ${total}`, item.payload.name]
            }}
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
      <div className="admin-chart__donut-center">
        <span className="admin-chart__donut-pct">{percentage}%</span>
        <span className="admin-chart__donut-label">ocupado</span>
      </div>
    </div>
  )
}
