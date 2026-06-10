import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  getEdificioBySlug,
  getFloorLayout,
  getTiposEspacio,
  saveFloorLayout,
} from '../../api/floorEditor'
import { isPlausibleDbEspacioId } from '../../api/reserve'
import FloorEditorGridOverlay from './components/FloorEditorGridOverlay'
import FloorEditorPropsPanel from './components/FloorEditorPropsPanel'
import FloorEditorStatusBar from './components/FloorEditorStatusBar'
import {
  allocateEditorTempId,
  cloneSpaces,
  createSpaceUid,
  clampGridSize,
  ensureSpaceUids,
  isFormFieldFocused,
  normalizeRect,
  round,
  spaceUid,
  spacesEqual,
  SVG_H,
  SVG_W,
  GRID_SIZE_DEFAULT,
  GRID_SIZE_MAX,
  GRID_SIZE_MIN,
  parseViewBox,
  ZOOM_MAX,
  ZOOM_MIN,
} from './floorEditorUtils'
import { useFloorEditorHistory } from './hooks/useFloorEditorHistory'
import { useFloorEditorSelection } from './hooks/useFloorEditorSelection'
import { useFloorEditorViewport } from './hooks/useFloorEditorViewport'
import {
  ALL_TIPO_IDS,
  TIPO_COLORS,
  TIPO_OPTIONS as DEFAULT_TIPO_OPTIONS,
  normalizeTipoEspacio,
} from '../../lib/spaceTipo'
import './FloorEditor.css'

const ALL_TIPOS = ALL_TIPO_IDS

function normalizeSpacesForEditor(spaces) {
  return ensureSpaceUids(
    spaces.map((s) => ({
      ...s,
      tipo: normalizeTipoEspacio(s.tipo),
      codigo: s.codigo ?? '',
      nombre: s.nombre ?? '',
    })),
    isPlausibleDbEspacioId,
  )
}

const TOOLS = [
  { id: 'MOVE', label: 'Mover', hint: 'Arrastra marcadores para reubicarlos' },
  { id: 'ADD_SEAT', label: 'Asiento', hint: 'Click en el mapa para colocar un asiento (círculo r=6)' },
  { id: 'ADD_ROOM', label: 'Sala', hint: 'Arrastra en el mapa para dibujar una sala (rectángulo)' },
  { id: 'DELETE', label: 'Borrar', hint: 'Click sobre un espacio para eliminarlo' },
]

export default function FloorEditor() {
  const { edificioSlug, zonaId: zonaIdParam } = useParams()
  const navigate = useNavigate()
  const zonaId = Number(zonaIdParam)

  const [floorMap, setFloorMap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [tipoOptions, setTipoOptions] = useState(DEFAULT_TIPO_OPTIONS)
  const [tool, setTool] = useState('MOVE')
  const [preview, setPreview] = useState(null)
  const [showLabels, setShowLabels] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [gridVisible, setGridVisible] = useState(false)
  const [gridSize, setGridSize] = useState(GRID_SIZE_DEFAULT)
  const [visibleTipos, setVisibleTipos] = useState(() => new Set(ALL_TIPOS))
  const [cursorCoords, setCursorCoords] = useState(null)
  const [baseline, setBaseline] = useState([])

  const svgRef = useRef(null)
  const dragSnapshotRef = useRef(null)
  const draggingRef = useRef(null)
  const drawStartRef = useRef(null)
  const isDrawingRef = useRef(false)
  const deletedDbIdsRef = useRef(new Set())

  const viewBox = floorMap?.viewBox ?? `0 0 ${SVG_W} ${SVG_H}`
  const bg = floorMap?.background ?? null
  const gridBounds = parseViewBox(viewBox, SVG_W, SVG_H)

  const {
    spaces,
    setSpaces,
    resetHistory,
    commitSpaces,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useFloorEditorHistory([])

  const spacesRef = useRef(spaces)

  const {
    selectedIds,
    selectedCount,
    singleSelectedId,
    clearSelection,
    handleMarkerSelect,
    selectMany,
    removeFromSelection,
  } = useFloorEditorSelection()

  const {
    canvasWrapRef,
    zoom,
    setZoom,
    fitToScreen,
    spaceHeld,
    isPanning,
    canvasCursor,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
  } = useFloorEditorViewport({ viewBox })

  const selectedSpace = singleSelectedId != null
    ? spaces.find((s) => spaceUid(s) === singleSelectedId) ?? null
    : null

  const isDirty = !spacesEqual(spaces, baseline)

  useEffect(() => {
    spacesRef.current = spaces
  }, [spaces])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const meta = await getEdificioBySlug(edificioSlug)
        if (!meta) {
          if (!cancelled) setLoadError('not_found')
          return
        }
        const map = await getFloorLayout(zonaId)
        if (cancelled) return
        const { autoEliminarIds = [], ...floorMapData } = map
        deletedDbIdsRef.current = new Set(autoEliminarIds)
        setSaveError(null)
        const initial = cloneSpaces(normalizeSpacesForEditor(floorMapData.spaces))
        setFloorMap(floorMapData)
        resetHistory(initial)
        setBaseline(initial)
        clearSelection()
        setPreview(null)
        draggingRef.current = null
        isDrawingRef.current = false
        drawStartRef.current = null
        dragSnapshotRef.current = null
      } catch {
        if (!cancelled) setLoadError('error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edificioSlug, zonaId])

  useEffect(() => {
    let cancelled = false
    getTiposEspacio().then((opts) => {
      if (!cancelled && opts.length > 0) setTipoOptions(opts)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function trackDeletedSpace(space, remainingSpaces) {
    if (!isPlausibleDbEspacioId(space.id_espacio)) return
    const stillExists = remainingSpaces.some(
      (s) => s.id_espacio === space.id_espacio,
    )
    if (!stillExists) {
      deletedDbIdsRef.current.add(space.id_espacio)
    }
  }

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

  useLayoutEffect(() => {
    if (!floorMap) return
    fitToScreen()
  }, [zonaId, floorMap, fitToScreen])

  function removeSelected() {
    if (selectedCount === 0) return
    const snapshot = cloneSpaces(spaces)
    const uids = new Set(selectedIds)
    const removed = spaces.filter((s) => uids.has(spaceUid(s)))
    const next = spaces.filter((s) => !uids.has(spaceUid(s)))
    for (const space of removed) trackDeletedSpace(space, next)
    commitSpaces(snapshot, next)
    clearSelection()
  }

  function removeSpaceByUid(uid) {
    const space = spaces.find((s) => spaceUid(s) === uid)
    if (!space) return
    const snapshot = cloneSpaces(spaces)
    const next = spaces.filter((s) => spaceUid(s) !== uid)
    trackDeletedSpace(space, next)
    commitSpaces(snapshot, next)
    removeFromSelection([uid])
  }

  function duplicateSelected() {
    if (selectedCount === 0) return
    const snapshot = cloneSpaces(spaces)
    const clones = spaces
      .filter((s) => selectedIds.has(spaceUid(s)))
      .map((s) => ({
        ...s,
        _uid: createSpaceUid(),
        id_espacio: allocateEditorTempId(),
        x: round((s.x ?? 0) + 10),
        y: round((s.y ?? 0) + 10),
        codigo: `${s.codigo}_copy`,
      }))
    const next = [...spaces, ...clones]
    commitSpaces(snapshot, next)
    selectMany(clones.map((c) => spaceUid(c)))
  }

  function updateSelected(patch) {
    if (singleSelectedId == null) return
    const snapshot = cloneSpaces(spaces)
    const next = spaces.map((s) =>
      spaceUid(s) === singleSelectedId ? { ...s, ...patch } : s,
    )
    commitSpaces(snapshot, next)
  }

  function toggleTipoFilter(tipo) {
    setVisibleTipos((prev) => {
      const next = new Set(prev)
      if (next.has(tipo)) next.delete(tipo)
      else next.add(tipo)
      return next
    })
  }

  async function savePlan() {
    if (!floorMap || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const eliminarIds = [...deletedDbIdsRef.current]
      const result = await saveFloorLayout(zonaId, floorMap, spaces, eliminarIds)
      if (!result.ok) {
        setSaveError(result.message)
        return
      }

      const refreshed = await getFloorLayout(zonaId)
      const { autoEliminarIds = [], ...floorMapData } = refreshed
      const initial = cloneSpaces(normalizeSpacesForEditor(floorMapData.spaces))
      deletedDbIdsRef.current = new Set(autoEliminarIds)
      setFloorMap(floorMapData)
      resetHistory(initial)
      setBaseline(initial)
      clearSelection()
    } catch {
      setSaveError('No se pudo guardar el plano. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  function handleSvgPointerDown(e) {
    if (spaceHeld || e.button === 1) {
      handleCanvasPointerDown(e)
      return
    }
    if (isPanning || spaceHeld) return
    const { x, y } = screenToSvg(e.clientX, e.clientY)

    if (tool === 'ADD_SEAT') {
      const snapshot = cloneSpaces(spaces)
      const newSpace = {
        _uid: createSpaceUid(),
        id_espacio: allocateEditorTempId(),
        codigo: 'NUEVO',
        nombre: 'Nuevo asiento',
        tipo: 1,
        shape: 'circle',
        x: round(x),
        y: round(y),
        r: 6,
      }
      commitSpaces(snapshot, [...spaces, newSpace])
      handleMarkerSelect(spaceUid(newSpace), false)
      return
    }

    if (tool === 'ADD_ROOM') {
      svgRef.current?.setPointerCapture(e.pointerId)
      isDrawingRef.current = true
      drawStartRef.current = { x0: x, y0: y }
      setPreview({ x: round(x), y: round(y), w: 0, h: 0 })
      return
    }

    clearSelection()
  }

  function handleSvgPointerMove(e) {
    const { x, y } = screenToSvg(e.clientX, e.clientY)
    setCursorCoords({ x, y })

    if (!isDrawingRef.current || !drawStartRef.current) return
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
      const snapshot = cloneSpaces(spaces)
      const newSpace = {
        _uid: createSpaceUid(),
        id_espacio: allocateEditorTempId(),
        codigo: 'NUEVA_SALA',
        nombre: 'Nueva sala',
        tipo: 2,
        shape: 'rect',
        ...rect,
      }
      commitSpaces(snapshot, [...spaces, newSpace])
      handleMarkerSelect(spaceUid(newSpace), false)
    }
  }

  function handleSvgPointerLeave() {
    setCursorCoords(null)
  }

  function handleMarkerPointerDown(e, space) {
    if (isPanning || spaceHeld) return
    e.stopPropagation()

    if (tool === 'DELETE') {
      removeSpaceByUid(spaceUid(space))
      return
    }

    if (tool === 'MOVE') {
      const uid = spaceUid(space)
      if (e.shiftKey) {
        handleMarkerSelect(uid, true)
        return
      }

      const idsToMove = selectedIds.has(uid)
        ? selectedIds
        : new Set([uid])

      if (!selectedIds.has(uid)) {
        handleMarkerSelect(uid, false)
      }

      const { x, y } = screenToSvg(e.clientX, e.clientY)
      const anchorX = space.shape === 'circle' ? space.x : space.x + (space.w ?? 30) / 2
      const anchorY = space.shape === 'circle' ? space.y : space.y + (space.h ?? 30) / 2

      const startPositions = new Map()
      for (const s of spaces) {
        const sUid = spaceUid(s)
        if (idsToMove.has(sUid)) {
          startPositions.set(sUid, { x: s.x, y: s.y })
        }
      }

      dragSnapshotRef.current = cloneSpaces(spaces)
      draggingRef.current = {
        ids: idsToMove,
        startPositions,
        dx: x - anchorX,
        dy: y - anchorY,
        primaryId: uid,
      }
      return
    }

    handleMarkerSelect(spaceUid(space), e.shiftKey)
  }

  useEffect(() => {
    function onMove(e) {
      const drag = draggingRef.current
      if (!drag) return
      const { x, y } = screenToSvg(e.clientX, e.clientY)
      const anchorX = round(x - drag.dx)
      const anchorY = round(y - drag.dy)

      const primaryStart = drag.startPositions.get(drag.primaryId)
      if (!primaryStart) return

      const primarySpace = spacesRef.current.find((s) => spaceUid(s) === drag.primaryId)
      if (!primarySpace) return

      const primaryStartAnchorX = primarySpace.shape === 'circle'
        ? primaryStart.x
        : primaryStart.x + (primarySpace.w ?? 30) / 2
      const primaryStartAnchorY = primarySpace.shape === 'circle'
        ? primaryStart.y
        : primaryStart.y + (primarySpace.h ?? 30) / 2

      const deltaX = anchorX - primaryStartAnchorX
      const deltaY = anchorY - primaryStartAnchorY

      setSpaces((prev) =>
        prev.map((s) => {
          const start = drag.startPositions.get(spaceUid(s))
          if (!start) return s
          return {
            ...s,
            x: round(start.x + deltaX),
            y: round(start.y + deltaY),
          }
        }),
      )
    }

    function onUp() {
      if (!draggingRef.current) return
      const snapshot = dragSnapshotRef.current
      draggingRef.current = null
      dragSnapshotRef.current = null
      if (snapshot && !spacesEqual(snapshot, spacesRef.current)) {
        commitSpaces(snapshot, spacesRef.current)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [commitSpaces, screenToSvg, setSpaces])

  useEffect(() => {
    function onKey(e) {
      if (isFormFieldFocused()) return

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
          return
        }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault()
          redo()
          return
        }
        if (e.key === 'd') {
          e.preventDefault()
          duplicateSelected()
          return
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCount > 0) {
          e.preventDefault()
          removeSelected()
        }
      }
      if (e.key === 'Escape') clearSelection()
      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === 'v' || e.key === 'V') setTool('MOVE')
        if (e.key === 'a' || e.key === 'A') setTool('ADD_SEAT')
        if (e.key === 'r' || e.key === 'R') setTool('ADD_ROOM')
        if (e.key === 'd' || e.key === 'D') setTool('DELETE')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCount, selectedIds, spaces])

  const svgCursor = isPanning
    ? 'grabbing'
    : spaceHeld
      ? 'grab'
      : tool === 'ADD_SEAT' || tool === 'ADD_ROOM'
        ? 'crosshair'
        : 'default'

  const markerCursor = tool === 'MOVE' ? 'grab' : tool === 'DELETE' ? 'pointer' : 'pointer'
  const floorLabel = floorMap
    ? `${floorMap.codigoZona} · ${floorMap.nombre}`
    : 'Editor'

  if (loadError === 'not_found') {
    return <Navigate to="/admin/floor-editor" replace />
  }

  if (loading || !floorMap) {
    return (
      <div className="fe fe--loading">
        <p className="fe-hub-loading">{loadError ? 'No se pudo cargar el plano.' : 'Cargando plano…'}</p>
      </div>
    )
  }

  return (
    <div className={`fe${spaceHeld || isPanning ? ' fe--space-pan' : ''}`}>
      <header className="fe__topbar">
        <div className="fe__topbar-left">
          <button
            type="button"
            className="fe__back-btn"
            onClick={() => navigate(`/admin/floor-editor/edificios/${edificioSlug}`)}
            aria-label="Volver a la lista de pisos"
          >
            <span className="fe__back-btn-icon" aria-hidden="true">←</span>
            Pisos
          </button>
        </div>
        <div className="fe__topbar-center">
          <h1 className="fe__floor-title">{floorLabel}</h1>
        </div>
        <div className="fe__topbar-right">
          <div className="fe__history-btns">
            <button
              type="button"
              className="fe__history-btn"
              onClick={undo}
              disabled={!canUndo}
              title="Deshacer (Ctrl+Z)"
              aria-label="Deshacer"
            >
              ↶
            </button>
            <button
              type="button"
              className="fe__history-btn"
              onClick={redo}
              disabled={!canRedo}
              title="Rehacer (Ctrl+Y)"
              aria-label="Rehacer"
            >
              ↷
            </button>
          </div>
          <span
            className={`fe__save-status${
              saveError
                ? ' fe__save-status--error'
                : isDirty
                  ? ' fe__save-status--dirty'
                  : ' fe__save-status--saved'
            }`}
            title={saveError ?? undefined}
          >
            {saveError ? saveError : isDirty ? 'Cambios pendientes' : 'Guardado'}
          </span>
          <label className="fe__toggle-label">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
            />
            Etiquetas
          </label>
          <span className="fe__count">{spaces.length} espacios</span>
          <button
            type="button"
            className="fe__save-btn"
            onClick={savePlan}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar plano'}
          </button>
        </div>
      </header>

      <div className="fe__body">
        <aside className={`fe__sidebar${sidebarCollapsed ? ' fe__sidebar--collapsed' : ''}`}>
          <button
            type="button"
            className="fe__sidebar-toggle"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expandir panel' : 'Colapsar panel'}
            title={sidebarCollapsed ? 'Expandir panel' : 'Colapsar panel'}
          >
            {sidebarCollapsed ? '▶' : '◀'}
          </button>

          {!sidebarCollapsed && (
            <div className="fe__sidebar-scroll">
              <section className="fe__section">
                <div className="fe__section-title">Herramienta</div>
                <div className="fe__tools">
                  {TOOLS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
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
                  <span>V·A·R·D · Ctrl+Z/Y · Ctrl+D · Shift+click · Espacio+arrastrar · Rueda=zoom</span>
                </div>
              </section>

              <section className="fe__section">
                <div className="fe__section-title">Zoom</div>
                <div className="fe__zoom-row">
                  <button
                    type="button"
                    className="fe__zoom-btn"
                    onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - 0.2).toFixed(1)))}
                  >
                    −
                  </button>
                  <span className="fe__zoom-val">{Math.round(zoom * 100)}%</span>
                  <button
                    type="button"
                    className="fe__zoom-btn"
                    onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + 0.2).toFixed(1)))}
                  >
                    +
                  </button>
                  <button type="button" className="fe__zoom-reset" onClick={() => setZoom(1)}>
                    Reset
                  </button>
                  <button type="button" className="fe__zoom-reset" onClick={fitToScreen}>
                    Ajustar
                  </button>
                </div>
              </section>

              <section className="fe__section">
                <div className="fe__section-title">Opciones</div>
                <label className="fe__toggle-label fe__toggle-label--block">
                  <input
                    type="checkbox"
                    checked={gridVisible}
                    onChange={(e) => setGridVisible(e.target.checked)}
                  />
                  Mostrar cuadrícula
                </label>
                {gridVisible && (
                  <div className="fe__grid-controls">
                    <div className="fe__grid-controls-header">
                      <label htmlFor="fe-grid-size">Tamaño de celda</label>
                      <span className="fe__grid-size-value">{gridSize}px</span>
                    </div>
                    <input
                      id="fe-grid-size"
                      className="fe__grid-slider"
                      type="range"
                      min={GRID_SIZE_MIN}
                      max={GRID_SIZE_MAX}
                      step={1}
                      value={gridSize}
                      onChange={(e) => setGridSize(clampGridSize(Number(e.target.value)))}
                    />
                    <div className="fe__grid-slider-labels">
                      <span>{GRID_SIZE_MIN}px</span>
                      <span>{GRID_SIZE_MAX}px</span>
                    </div>
                  </div>
                )}
              </section>

              <section className="fe__section">
                <div className="fe__section-title">Filtro por tipo</div>
                <div className="fe__filter-list">
                  {tipoOptions.map((o) => (
                    <label key={o.value} className="fe__filter-item">
                      <input
                        type="checkbox"
                        checked={visibleTipos.has(o.value)}
                        onChange={() => toggleTipoFilter(o.value)}
                      />
                      <span
                        className="fe__legend-dot"
                        style={{ background: TIPO_COLORS[o.value] }}
                      />
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>
          )}
        </aside>

        <div className="fe__canvas-area">
          <div
            ref={canvasWrapRef}
            className={`fe__canvas-wrap${
              canvasCursor ? ` fe__canvas-wrap--${canvasCursor}` : ''
            }${spaceHeld || isPanning ? ' fe__canvas-wrap--space-pan' : ''}`}
            style={canvasCursor ? { cursor: canvasCursor } : undefined}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onContextMenu={(e) => { if (spaceHeld || isPanning) e.preventDefault() }}
          >
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
                onPointerLeave={handleSvgPointerLeave}
              >
                <image
                  href={bg}
                  width={SVG_W}
                  height={SVG_H}
                  preserveAspectRatio="xMidYMid meet"
                />

                <FloorEditorGridOverlay
                  width={gridBounds.w}
                  height={gridBounds.h}
                  gridSize={gridSize}
                  visible={gridVisible}
                />

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

                {
                spaces.map((space) => {
                  const uid = spaceUid(space)
                  const isSelected = selectedIds.has(uid)
                  const tipo = normalizeTipoEspacio(space.tipo)
                  const dimmed = !visibleTipos.has(tipo)
                  const color = TIPO_COLORS[tipo] ?? '#6366f1'
                  const markerProps = {
                    style: {
                      cursor: markerCursor,
                      opacity: dimmed ? 0.2 : 1,
                    },
                    onPointerDown: (e) => handleMarkerPointerDown(e, space),
                  }
                  const cx = space.shape === 'circle'
                    ? space.x
                    : space.x + (space.w ?? 30) / 2
                  const cy = space.shape === 'circle'
                    ? space.y
                    : space.y + (space.h ?? 30) / 2

                  return (
                    <g key={uid}>
                      {space.shape === 'circle' ? (
                        <circle
                          cx={space.x}
                          cy={space.y}
                          r={space.r ?? 6}
                          fill={color}
                          fillOpacity={isSelected ? 1 : 0.8}
                          stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.35)'}
                          strokeWidth={1}
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
                          strokeWidth={1}
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
                          style={{ userSelect: 'none', opacity: dimmed ? 0.2 : 1 }}
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

          <FloorEditorStatusBar cursorCoords={cursorCoords} />

          {selectedCount > 0 && (
            <aside className="fe__props-rail" aria-label="Propiedades del espacio">
              <FloorEditorPropsPanel
                selectedSpace={selectedSpace}
                selectedCount={selectedCount}
                tipoOptions={tipoOptions}
                onUpdate={updateSelected}
                onDeleteSelected={removeSelected}
                variant="rail"
              />
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
