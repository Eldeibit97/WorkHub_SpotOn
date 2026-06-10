import { useState } from 'react'

// DOW en PostgreSQL: 0=Dom, 1=Lun, … 6=Sab
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAYS       = [0, 1, 2, 3, 4, 5, 6]

// Rango horario relevante para oficina
const HOUR_START = 7
const HOUR_END   = 20
const HOURS      = Array.from(
  { length: HOUR_END - HOUR_START + 1 },
  (_, i) => HOUR_START + i
)

function formatHour(h) {
  const suffix = h < 12 ? 'am' : 'pm'
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display}${suffix}`
}

// Escala de color: de transparente hasta el púrpura de la marca
function cellColor(count, maxCount) {
  if (!count || !maxCount) return 'transparent'
  const intensity = Math.min(count / maxCount, 1)
  // Interpola entre un lila suave (baja densidad) y el púrpura Accenture
  const alpha = 0.12 + intensity * 0.88
  return `rgba(161, 0, 255, ${alpha.toFixed(2)})`
}

function cellTextColor(count, maxCount) {
  if (!count || !maxCount) return 'var(--text-muted)'
  const intensity = count / maxCount
  return intensity > 0.55 ? '#fff' : 'var(--text-primary)'
}

export default function NoShowHeatmapChart({ data = [], maxCount = 0 }) {
  const [tooltip, setTooltip] = useState(null)

  // Construir lookup O(1)
  const lookup = new Map()
  for (const cell of data) {
    lookup.set(`${cell.day}-${cell.hour}`, cell.count)
  }

  if (!data.length) {
    return (
      <p className="admin-chart__empty">
        Sin no-shows en el período seleccionado.
      </p>
    )
  }

  return (
    <div className="nsh-wrapper">
      {/* Eje Y — horas */}
      <div className="nsh-y-axis">
        <div className="nsh-corner" />
        {HOURS.map((h) => (
          <div key={h} className="nsh-y-label">{formatHour(h)}</div>
        ))}
      </div>

      {/* Columnas por día */}
      <div className="nsh-grid">
        {DAYS.map((day) => (
          <div key={day} className="nsh-col">
            <div className="nsh-day-label">{DAY_LABELS[day]}</div>
            {HOURS.map((hour) => {
              const count = lookup.get(`${day}-${hour}`) || 0
              return (
                <div
                  key={hour}
                  className="nsh-cell"
                  style={{
                    background: cellColor(count, maxCount),
                    color: cellTextColor(count, maxCount),
                  }}
                  onMouseEnter={(e) =>
                    setTooltip({ day, hour, count, x: e.clientX, y: e.clientY })
                  }
                  onMouseLeave={() => setTooltip(null)}
                >
                  {count > 0 && <span className="nsh-cell__count">{count}</span>}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Tooltip flotante */}
      {tooltip && (
        <div
          className="nsh-tooltip"
          style={{ top: tooltip.y + 12, left: tooltip.x + 12 }}
        >
          <strong>{DAY_LABELS[tooltip.day]}</strong> · {formatHour(tooltip.hour)}
          <br />
          {tooltip.count} no {tooltip.count === 1 ? 'show' : 'shows'}
        </div>
      )}

      {/* Leyenda de escala */}
      <div className="nsh-legend">
        <span className="nsh-legend__label">Menos</span>
        <div className="nsh-legend__scale">
          {[0.1, 0.3, 0.5, 0.7, 0.9, 1].map((v) => (
            <div
              key={v}
              className="nsh-legend__swatch"
              style={{ background: `rgba(161,0,255,${(0.12 + v * 0.88).toFixed(2)})` }}
            />
          ))}
        </div>
        <span className="nsh-legend__label">Más</span>
      </div>
    </div>
  )
}