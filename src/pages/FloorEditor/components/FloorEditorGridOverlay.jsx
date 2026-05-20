import { useId } from 'react'
import { clampGridSize } from '../floorEditorUtils'

export default function FloorEditorGridOverlay({ width, height, gridSize, visible }) {
  const rawId = useId()
  const patternId = `fe-grid-${rawId.replace(/:/g, '')}`
  const size = clampGridSize(gridSize)

  if (!visible) return null

  return (
    <g className="fe__grid-overlay" pointerEvents="none" aria-hidden="true">
      <defs>
        <pattern
          id={patternId}
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${size} 0 L 0 0 0 ${size}`}
            fill="none"
            stroke="rgba(168, 85, 247, 0.38)"
            strokeWidth="0.6"
          />
        </pattern>
      </defs>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={`url(#${patternId})`}
      />
    </g>
  )
}
