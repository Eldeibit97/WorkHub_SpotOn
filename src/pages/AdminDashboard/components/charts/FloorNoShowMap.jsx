import { useMemo } from 'react'

function spaceColor(count, maxCount) {
  if (!count || !maxCount) return 'rgba(161,0,255,0.08)'
  const intensity = Math.min(count / maxCount, 1)
  return `rgba(161,0,255,${(0.15 + intensity * 0.85).toFixed(2)})`
}

function spaceStroke(count, maxCount) {
  if (!count || !maxCount) return 'rgba(161,0,255,0.2)'
  return 'rgba(161,0,255,0.8)'
}

const PADDING = 20  // margen alrededor del contenido real

function computeBoundingBox(spaces) {
  if (!spaces || spaces.length === 0) return null

  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity

  for (const s of spaces) {
    if (s.x == null || s.y == null) continue
    if (s.shape === 'rect' && s.w != null && s.h != null) {
      minX = Math.min(minX, s.x)
      minY = Math.min(minY, s.y)
      maxX = Math.max(maxX, s.x + s.w)
      maxY = Math.max(maxY, s.y + s.h)
    } else {
      const r = s.r || 6
      minX = Math.min(minX, s.x - r)
      minY = Math.min(minY, s.y - r)
      maxX = Math.max(maxX, s.x + r)
      maxY = Math.max(maxY, s.y + r)
    }
  }

  if (!Number.isFinite(minX)) return null

  const contentW = maxX - minX
  const contentH = maxY - minY

  // Si el contenido ocupa más del 50% del viewBox original,
  // aplicar un zoom extra del 15% recortando desde el centro
  const originalW = 1440
  const originalH = 810
  const coverageX = contentW / originalW
  const coverageY = contentH / originalH

  let extraZoom = 0
  if (coverageX > 0.5 || coverageY > 0.5) {
    extraZoom = Math.min(contentW, contentH) * 0.08
  }

  return {
    x:      minX - PADDING + extraZoom,
    y:      minY - PADDING + extraZoom,
    width:  contentW + PADDING * 2 - extraZoom * 2,
    height: contentH + PADDING * 2 - extraZoom * 2,
  }
}

export default function FloorNoShowMap({ floorMap, noShowsBySpace = [], maxCount = 0 }) {
  const countMap = useMemo(
    () => new Map(noShowsBySpace.map((s) => [s.id_espacio, s.count])),
    [noShowsBySpace]
  )

  const bbox = useMemo(
    () => floorMap ? computeBoundingBox(floorMap.spaces) : null,
    [floorMap]
  )

  if (!floorMap) {
    return <p className="admin-chart__empty">Selecciona un piso para ver el mapa.</p>
  }

  const { viewBox: originalViewBox, background, spaces = [] } = floorMap

  // Si logramos calcular el bounding box real, lo usamos; si no, el original
  const viewBox = bbox
    ? `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`
    : originalViewBox



  return (
    <div className="fnsh-wrapper">
      <svg
        viewBox={viewBox}
        className="fnsh-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Imagen de fondo — siempre con el viewBox original del piso */}
        {background && (
          <image
            href={background}
            x="0"
            y="0"
            width="1440"
            height="810"
            preserveAspectRatio="xMidYMid meet"
          />
        )}

        {spaces.map((space) => {
          const count  = countMap.get(space.id_espacio) || 0
          const fill   = spaceColor(count, maxCount)
          const stroke = spaceStroke(count, maxCount)
          const label  = count > 0 ? String(count) : ''

          if (space.shape === 'rect') {
            return (
              <g key={space.id_espacio ?? space.codigo}>
                <rect
                  x={space.x} y={space.y}
                  width={space.w} height={space.h}
                  fill={fill} stroke={stroke}
                  strokeWidth="1" rx="3"
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

          const r = (space.r || 6) + 3
          return (
            <g key={space.id_espacio ?? space.codigo}>
              <circle
                cx={space.x} cy={space.y} r={r}
                fill={fill} stroke={stroke}
                strokeWidth="1"
                className="fnsh-space"
              >
                <title>{`${space.nombre || space.codigo}: ${count} no show${count !== 1 ? 's' : ''}`}</title>
              </circle>
              {label && (
                <text
                  x={space.x} y={space.y + 4}
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