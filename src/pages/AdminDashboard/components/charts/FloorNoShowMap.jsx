import { useEffect, useRef } from 'react'

// Escala de color igual que el heatmap temporal
function spaceColor(count, maxCount) {
  if (!count || !maxCount) return 'rgba(161,0,255,0.08)'
  const intensity = Math.min(count / maxCount, 1)
  return `rgba(161,0,255,${(0.15 + intensity * 0.85).toFixed(2)})`
}

function spaceStroke(count, maxCount) {
  if (!count || !maxCount) return 'rgba(161,0,255,0.2)'
  return `rgba(161,0,255,0.8)`
}

export default function FloorNoShowMap({ floorMap, noShowsBySpace = [], maxCount = 0 }) {
  const svgRef = useRef(null)

  // lookup O(1): id_espacio → count
  const countMap = new Map(noShowsBySpace.map((s) => [s.id_espacio, s.count]))

  if (!floorMap) {
    return <p className="admin-chart__empty">Selecciona un piso para ver el mapa.</p>
  }

  const { viewBox, background, spaces = [] } = floorMap

  return (
    <div className="fnsh-wrapper">
      <svg
        ref={svgRef}
        viewBox={viewBox || '0 0 1440 810'}
        className="fnsh-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Imagen de fondo del piso */}
        {background && (
          <image
            href={background}
            x="0"
            y="0"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
          />
        )}

        {/* Overlay de espacios coloreados */}
        {spaces.map((space) => {
          const count    = countMap.get(space.id_espacio) || 0
          const fill     = spaceColor(count, maxCount)
          const stroke   = spaceStroke(count, maxCount)
          const label    = count > 0 ? String(count) : ''

          if (space.shape === 'rect') {
            return (
              <g key={space.id_espacio ?? space.codigo}>
                <rect
                  x={space.x}
                  y={space.y}
                  width={space.w}
                  height={space.h}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth="1"
                  rx="3"
                  className="fnsh-space"
                >
                  <title>{`${space.nombre || space.codigo}: ${count} no show${count !== 1 ? 's' : ''}`}</title>
                </rect>
                {label && (
                  <text
                    x={space.x + space.w / 2}
                    y={space.y + space.h / 2 + 4}
                    textAnchor="middle"
                    className="fnsh-label"
                  >
                    {label}
                  </text>
                )}
              </g>
            )
          }

          // circle (default)
          const r = (space.r || 6) + 3  // radio ligeramente más grande para visibilidad
          return (
            <g key={space.id_espacio ?? space.codigo}>
              <circle
                cx={space.x}
                cy={space.y}
                r={r}
                fill={fill}
                stroke={stroke}
                strokeWidth="1"
                className="fnsh-space"
              >
                <title>{`${space.nombre || space.codigo}: ${count} no show${count !== 1 ? 's' : ''}`}</title>
              </circle>
              {label && (
                <text
                  x={space.x}
                  y={space.y + 4}
                  textAnchor="middle"
                  className="fnsh-label"
                >
                  {label}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Leyenda */}
      <div className="nsh-legend" style={{ marginTop: '0.75rem' }}>
        <span className="nsh-legend__label">Sin no-shows</span>
        <div className="nsh-legend__scale">
          {[0.1, 0.3, 0.5, 0.7, 0.9, 1].map((v) => (
            <div
              key={v}
              className="nsh-legend__swatch"
              style={{ background: `rgba(161,0,255,${(0.15 + v * 0.85).toFixed(2)})` }}
            />
          ))}
        </div>
        <span className="nsh-legend__label">Más no-shows</span>
      </div>
    </div>
  )
}