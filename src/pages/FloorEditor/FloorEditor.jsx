import { useCallback, useEffect, useRef, useState } from 'react'
import pbMap from '../../data/floor-maps/pb.json'
import mzMap from '../../data/floor-maps/mz.json'
import p3Map from '../../data/floor-maps/p3.json'
import p9Map from '../../data/floor-maps/p9.json'
import './FloorEditor.css'

const FLOOR_MAPS = { 1: pbMap, 2: mzMap, 3: p3Map, 4: p9Map }

function floorBgPath(zonaId) {
  const rel = {
    1: '/mapas/piso_PB.svg',
    2: '/mapas/piso_MZ.svg',
    3: '/mapas/piso_3.png',
    4: '/mapas/piso_9.svg',
  }[zonaId]
  const base = import.meta.env.BASE_URL ?? '/'
  const normalizedBase = base === '/' ? '' : base.replace(/\/$/, '')
  return `${normalizedBase}${rel}`
}

const FLOOR_BG = {
  1: floorBgPath(1),
  2: floorBgPath(2),
  3: floorBgPath(3),
  4: floorBgPath(4),
}

const ZONES = Object.values(FLOOR_MAPS).map((m) => ({
  id: m.zonaId,
  codigoZona: m.codigoZona,
  label: `${m.codigoZona} · ${m.nombre}`,
}))

const TIPO_OPTIONS = [
  { value: 1, label: 'Estación de trabajo' },
  { value: 2, label: 'Sala de juntas' },
  { value: 3, label: 'Phone Booth' },
  { value: 4, label: 'Media Scape' },
  { value: 5, label: 'Área especial' },
]

const TIPO_COLORS = {
  1: '#10b981',
  2: '#6366f1',
  3: '#f59e0b',
  4: '#06b6d4',
  5: '#f43f5e',
}

const TOOLS = [
  { id: 'MOVE', label: 'Mover', hint: 'Arrastra marcadores para reubicarlos' },
  { id: 'ADD_SEAT', label: 'Asiento', hint: 'Click en el mapa para colocar un asiento (círculo r=6)' },
  { id: 'ADD_ROOM', label: 'Sala', hint: 'Arrastra en el mapa para dibujar una sala (rectángulo)' },
  { id: 'DELETE', label: 'Borrar', hint: 'Click sobre un espacio para eliminarlo' },
]

const SVG_W = 1440
const SVG_H = 810

function round(n) {
  return Math.round(n * 10) / 10
}

function normalizeRect(x0, y0, x1, y1) {
  return {
    x: round(Math.min(x0, x1)),
    y: round(Math.min(y0, y1)),
    w: round(Math.abs(x1 - x0)),
    h: round(Math.abs(y1 - y0)),
  }
}

export default function FloorEditor() {
  const [zonaId, setZonaId] = useState(ZONES[0].id)
  const [spaces, setSpaces] = useState(() =>
    FLOOR_MAPS[ZONES[0].id].spaces.map((s) => ({ ...s })),
  )
  const [tool, setTool] = useState('MOVE')
  const [selectedId, setSelectedId] = useState(null)
  const [preview, setPreview] = useState(null) // rect preview during ADD_ROOM drag
  const [zoom, setZoom] = useState(1)
  const [showLabels, setShowLabels] = useState(false)

  const svgRef = useRef(null)
  const draggingRef = useRef(null)   // { id, dx, dy }
  const drawStartRef = useRef(null)  // { x0, y0 }
  const isDrawingRef = useRef(false)

  const floorMap = FLOOR_MAPS[zonaId]
  const viewBox = floorMap?.viewBox ?? `0 0 ${SVG_W} ${SVG_H}`
  const bg = FLOOR_BG[zonaId]
  const selectedSpace = spaces.find((s) => s.id_espacio === selectedId) ?? null

  function changeZone(newId) {
    setZonaId(newId)
    setSpaces(FLOOR_MAPS[newId].spaces.map((s) => ({ ...s })))
    setSelectedId(null)
    setPreview(null)
    draggingRef.current = null
    isDrawingRef.current = false
    drawStartRef.current = null
  }

  // Screen → SVG coordinate conversion (accounts for CSS zoom transform)
  const screenToSvg = useCallback((clientX, clientY) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const t = pt.matrixTransform(ctm.inverse())
    return { x: t.x, y: t.y }
  }, [])

  // ── SVG-level pointer events (fire only when no marker stops propagation) ──

  function handleSvgPointerDown(e) {
    const { x, y } = screenToSvg(e.clientX, e.clientY)

    if (tool === 'ADD_SEAT') {
      const newSpace = {
        id_espacio: Date.now(),
        codigo: 'NUEVO',
        nombre: 'Nuevo asiento',
        tipo: 1,
        shape: 'circle',
        x: round(x),
        y: round(y),
        r: 6,
      }
      setSpaces((prev) => [...prev, newSpace])
      setSelectedId(newSpace.id_espacio)
      return
    }

    if (tool === 'ADD_ROOM') {
      svgRef.current?.setPointerCapture(e.pointerId)
      isDrawingRef.current = true
      drawStartRef.current = { x0: x, y0: y }
      setPreview({ x: round(x), y: round(y), w: 0, h: 0 })
      return
    }

    // MOVE / DELETE clicking empty space → deselect
    setSelectedId(null)
  }

  function handleSvgPointerMove(e) {
    if (!isDrawingRef.current || !drawStartRef.current) return
    const { x, y } = screenToSvg(e.clientX, e.clientY)
    const { x0, y0 } = drawStartRef.current
    setPreview(normalizeRect(x0, y0, x, y))
  }

  function handleSvgPointerUp(e) {
    if (!isDrawingRef.current || !drawStartRef.current) return
    isDrawingRef.current = false
    const { x, y } = screenToSvg(e.clientX, e.clientY)
    const { x0, y0 } = drawStartRef.current
    drawStartRef.current = null
    const rect = normalizeRect(x0, y0, x, y)
    setPreview(null)
    if (rect.w > 6 && rect.h > 6) {
      const newSpace = {
        id_espacio: Date.now(),
        codigo: 'NUEVA_SALA',
        nombre: 'Nueva sala',
        tipo: 2,
        shape: 'rect',
        ...rect,
      }
      setSpaces((prev) => [...prev, newSpace])
      setSelectedId(newSpace.id_espacio)
    }
  }

  // ── Marker pointer events ──

  function handleMarkerPointerDown(e, space) {
    e.stopPropagation() // prevent SVG-level handler

    if (tool === 'MOVE') {
      const { x, y } = screenToSvg(e.clientX, e.clientY)
      const anchorX = space.shape === 'circle' ? space.x : space.x + (space.w ?? 30) / 2
      const anchorY = space.shape === 'circle' ? space.y : space.y + (space.h ?? 30) / 2
      draggingRef.current = { id: space.id_espacio, dx: x - anchorX, dy: y - anchorY }
      return
    }

    if (tool === 'DELETE') {
      removeSpace(space.id_espacio)
      return
    }

    // ADD_SEAT / ADD_ROOM clicking on existing space → select it
    setSelectedId((prev) => (prev === space.id_espacio ? null : space.id_espacio))
  }

  function removeSpace(id) {
    setSpaces((prev) => prev.filter((s) => s.id_espacio !== id))
    if (selectedId === id) setSelectedId(null)
  }

  // Global pointermove / pointerup for MOVE dragging
  useEffect(() => {
    function onMove(e) {
      const drag = draggingRef.current
      if (!drag) return
      const { x, y } = screenToSvg(e.clientX, e.clientY)
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.id_espacio !== drag.id) return s
          const nx = x - drag.dx
          const ny = y - drag.dy
          if (s.shape === 'circle') return { ...s, x: round(nx), y: round(ny) }
          const w = s.w ?? 30
          const h = s.h ?? 30
          return { ...s, x: round(nx - w / 2), y: round(ny - h / 2) }
        }),
      )
    }
    function onUp() {
      draggingRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [screenToSvg])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId != null) removeSpace(selectedId)
      }
      if (e.key === 'Escape') setSelectedId(null)
      if (e.key === 'v' || e.key === 'V') setTool('MOVE')
      if (e.key === 'a' || e.key === 'A') setTool('ADD_SEAT')
      if (e.key === 'r' || e.key === 'R') setTool('ADD_ROOM')
      if (e.key === 'd' || e.key === 'D') setTool('DELETE')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  function updateSelected(patch) {
    setSpaces((prev) =>
      prev.map((s) => (s.id_espacio === selectedId ? { ...s, ...patch } : s)),
    )
  }

  // ── Download JSON ──
  function downloadJSON() {
    const data = { ...floorMap, spaces }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${floorMap.codigoZona.toLowerCase()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const svgCursor =
    tool === 'ADD_SEAT' || tool === 'ADD_ROOM' ? 'crosshair' : 'default'
  const markerCursor =
    tool === 'MOVE' ? 'grab' : tool === 'DELETE' ? 'pointer' : 'pointer'

  const currentHint = TOOLS.find((t) => t.id === tool)?.hint ?? ''

  return (
    <div className="fe">
      {/* ── Top bar ── */}
      <header className="fe__topbar">
        <div className="fe__topbar-left">
          <span className="fe__logo">Editor de Planos</span>
          <select
            className="fe__zone-select"
            value={zonaId}
            onChange={(e) => changeZone(Number(e.target.value))}
          >
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>{z.label}</option>
            ))}
          </select>
          <span className="fe__hint">{currentHint}</span>
        </div>
        <div className="fe__topbar-right">
          <label className="fe__toggle-label">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
            />
            Etiquetas
          </label>
          <span className="fe__count">{spaces.length} espacios</span>
          <button className="fe__save-btn" onClick={downloadJSON}>
            Descargar JSON
          </button>
        </div>
      </header>

      <div className="fe__body">
        {/* ── Sidebar ── */}
        <aside className="fe__sidebar">
          {/* Tools */}
          <section className="fe__section">
            <div className="fe__section-title">Herramienta</div>
            <div className="fe__tools">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  className={`fe__tool${tool === t.id ? ' fe__tool--active' : ''}`}
                  onClick={() => setTool(t.id)}
                  title={t.hint}
                >
                  <span className="fe__tool-icon">
                    {t.id === 'MOVE' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="12" y1="3" x2="12" y2="21" />
                      </svg>
                    )}
                    {t.id === 'ADD_SEAT' && (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="7" />
                      </svg>
                    )}
                    {t.id === 'ADD_ROOM' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="6" width="18" height="12" rx="2" />
                      </svg>
                    )}
                    {t.id === 'DELETE' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    )}
                  </span>
                  <span className="fe__tool-label">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="fe__shortcuts">
              <span>V · A · R · D — teclas rápidas</span>
            </div>
          </section>

          {/* Zoom */}
          <section className="fe__section">
            <div className="fe__section-title">Zoom</div>
            <div className="fe__zoom-row">
              <button
                className="fe__zoom-btn"
                onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.2).toFixed(1)))}
              >−</button>
              <span className="fe__zoom-val">{Math.round(zoom * 100)}%</span>
              <button
                className="fe__zoom-btn"
                onClick={() => setZoom((z) => Math.min(4, +(z + 0.2).toFixed(1)))}
              >+</button>
              <button className="fe__zoom-reset" onClick={() => setZoom(1)}>Reset</button>
            </div>
          </section>

          {/* Legend */}
          <section className="fe__section">
            <div className="fe__section-title">Leyenda</div>
            <div className="fe__legend">
              {TIPO_OPTIONS.map((o) => (
                <div key={o.value} className="fe__legend-item">
                  <span
                    className="fe__legend-dot"
                    style={{ background: TIPO_COLORS[o.value] }}
                  />
                  <span>{o.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Properties panel */}
          {selectedSpace && (
            <section className="fe__section fe__props">
              <div className="fe__section-title">Propiedades</div>

              <div className="fe__prop-row">
                <label>ID Espacio</label>
                <input
                  type="number"
                  value={selectedSpace.id_espacio}
                  onChange={(e) => updateSelected({ id_espacio: Number(e.target.value) })}
                />
              </div>
              <div className="fe__prop-row">
                <label>Código</label>
                <input
                  type="text"
                  value={selectedSpace.codigo}
                  onChange={(e) => updateSelected({ codigo: e.target.value })}
                />
              </div>
              <div className="fe__prop-row">
                <label>Nombre</label>
                <input
                  type="text"
                  value={selectedSpace.nombre}
                  onChange={(e) => updateSelected({ nombre: e.target.value })}
                />
              </div>
              <div className="fe__prop-row">
                <label>Tipo</label>
                <select
                  value={selectedSpace.tipo}
                  onChange={(e) => updateSelected({ tipo: Number(e.target.value) })}
                >
                  {TIPO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="fe__prop-coords">
                <div className="fe__prop-row">
                  <label>X</label>
                  <input
                    type="number"
                    value={selectedSpace.x}
                    onChange={(e) => updateSelected({ x: round(Number(e.target.value)) })}
                  />
                </div>
                <div className="fe__prop-row">
                  <label>Y</label>
                  <input
                    type="number"
                    value={selectedSpace.y}
                    onChange={(e) => updateSelected({ y: round(Number(e.target.value)) })}
                  />
                </div>

                {selectedSpace.shape === 'circle' ? (
                  <div className="fe__prop-row">
                    <label>Radio</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedSpace.r ?? 6}
                      onChange={(e) => updateSelected({ r: round(Number(e.target.value)) })}
                    />
                  </div>
                ) : (
                  <>
                    <div className="fe__prop-row">
                      <label>Ancho</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedSpace.w ?? 30}
                        onChange={(e) => updateSelected({ w: round(Number(e.target.value)) })}
                      />
                    </div>
                    <div className="fe__prop-row">
                      <label>Alto</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedSpace.h ?? 30}
                        onChange={(e) => updateSelected({ h: round(Number(e.target.value)) })}
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                className="fe__delete-selected"
                onClick={() => removeSpace(selectedId)}
              >
                Eliminar espacio
              </button>
            </section>
          )}
        </aside>

        {/* ── Canvas ── */}
        <div className="fe__canvas-wrap">
          <div
            className="fe__canvas-scroll"
            style={{
              width: `${Math.round(SVG_W * zoom)}px`,
              height: `${Math.round(SVG_H * zoom)}px`,
            }}
          >
            <svg
              ref={svgRef}
              className="fe__svg"
              viewBox={viewBox}
              style={{
                width: `${SVG_W}px`,
                height: `${SVG_H}px`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                cursor: svgCursor,
              }}
              preserveAspectRatio="xMidYMid meet"
              onPointerDown={handleSvgPointerDown}
              onPointerMove={handleSvgPointerMove}
              onPointerUp={handleSvgPointerUp}
            >
              <image
                href={bg}
                width={SVG_W}
                height={SVG_H}
                preserveAspectRatio="xMidYMid meet"
              />

              {/* ADD_ROOM preview */}
              {preview && preview.w > 0 && preview.h > 0 && (
                <rect
                  x={preview.x}
                  y={preview.y}
                  width={preview.w}
                  height={preview.h}
                  fill="rgba(99,102,241,0.15)"
                  stroke="#a855f7"
                  strokeWidth="1.5"
                  strokeDasharray="6 3"
                  rx="4"
                  pointerEvents="none"
                />
              )}

              {/* Spaces */}
              {spaces.map((space) => {
                const isSelected = space.id_espacio === selectedId
                const color = TIPO_COLORS[space.tipo] ?? '#6366f1'
                const markerProps = {
                  style: { cursor: markerCursor },
                  onPointerDown: (e) => handleMarkerPointerDown(e, space),
                }
                const cx = space.shape === 'circle'
                  ? space.x
                  : space.x + (space.w ?? 30) / 2
                const cy = space.shape === 'circle'
                  ? space.y
                  : space.y + (space.h ?? 30) / 2

                return (
                  <g key={space.id_espacio}>
                    {space.shape === 'circle' ? (
                      <circle
                        cx={space.x}
                        cy={space.y}
                        r={space.r ?? 6}
                        fill={color}
                        fillOpacity={isSelected ? 1 : 0.8}
                        stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.35)'}
                        strokeWidth={isSelected ? 2.5 : 1}
                        {...markerProps}
                      />
                    ) : (
                      <rect
                        x={space.x}
                        y={space.y}
                        width={space.w ?? 30}
                        height={space.h ?? 30}
                        rx="4"
                        fill={color}
                        fillOpacity={isSelected ? 0.85 : 0.6}
                        stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.35)'}
                        strokeWidth={isSelected ? 2.5 : 1}
                        {...markerProps}
                      />
                    )}

                    {showLabels && (
                      <text
                        x={cx}
                        y={cy + 3}
                        textAnchor="middle"
                        fontSize="5"
                        fill="#fff"
                        pointerEvents="none"
                        style={{ userSelect: 'none' }}
                      >
                        {space.codigo}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
