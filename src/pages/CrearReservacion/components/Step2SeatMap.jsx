import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { getAvailability } from '../../../api/spaces'
import { getReservationFloorMap } from '../../../api/reservationFloorMap'
import { apiFetch } from '../../../api/client'
import { getStoredToken } from '../../../api/auth'
import { connectWebSocket, subscribeToZona, unsubscribeFromZona, disconnectWebSocket } from '../../../api/websocket'
import FLOOR_INTERIOR_IMAGES from '../../../assets/floors/index.js'
import TimeSelector from './TimeSelector'
import DateStrip from './DateStrip'
import SeatMapExportModal from './SeatMapExportModal'
import SeatMapSpaceDetailModal from './SeatMapSpaceDetailModal'
import SeatMapExpiredModal from './SeatMapExpiredModal'
import SpaceTypeFilter from './SpaceTypeFilter' // Ruta corregida
import { labelForTipo, normalizeTipoEspacio } from '../../../lib/spaceTipo'
import { toYyyyMmDd } from '../../../lib/dateFormat'
import { formatCountdown, isSharedRoomType } from './seatMapHelpers'
import { getInitialsFromEmail } from '../../../lib/userDisplay'
import './Step2SeatMap.css'
import { bloquearEspaciosTemporal, liberarEspaciosTemporal } from '../../../api/reserve'
export default function Step2SeatMap({
  data,
  update,
  onBack,
  onNext,
  canContinue,
  editMode,
  bookerMail,
  bookerName,
  onBlockSpaces,
}) {
  const [floorMap, setFloorMap] = useState(null)
  const [availability, setAvailability] = useState({})
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [coworkerInput, setCoworkerInput] = useState('')
  const [coworkerError, setCoworkerError] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [exportPayload, setExportPayload] = useState('')
  const [draftPositions, setDraftPositions] = useState(null)
  const [detailSpace, setDetailSpace] = useState(null)
  const [spaceSchedule, setSpaceSchedule] = useState(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [expiredDialogOpen, setExpiredDialogOpen] = useState(false)
  const [showAvailabilityTooltip, setShowAvailabilityTooltip] = useState(false)
  const [syncStatus, setSyncStatus] = useState('synced')
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // --- INTEGRACIÓN FILTRO: Estado ---
  const [activeTypeFilters, setActiveTypeFilters] = useState([])

  const COUNTDOWN_START = 300
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [expired, setExpired] = useState(false)

  const svgRef = useRef(null)
  const mapWrapperRef = useRef(null)
  const draggingRef = useRef(null)

  useEffect(() => {
    setCountdown(COUNTDOWN_START)
    setExpired(false)
    setExpiredDialogOpen(false)
    setActiveTypeFilters([]) // Resetear filtros al cambiar zona
  }, [data.zonaId])

  useEffect(() => {
    if (editMode) return
    if (expired) return
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          setExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [editMode, expired])

  useEffect(() => {
    if (!editMode && expired) setExpiredDialogOpen(true)
  }, [editMode, expired])

  // WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    if (!data.zonaId) return

    function handleAvailabilityChange(wsData) {
      console.log('[Step2SeatMap] availability:changed recibido:', wsData)
      
      if (wsData.zonaId === data.zonaId) {
        setSyncStatus('syncing')
        
        // Actualizar solo los espacios que cambiaron
        setAvailability((prev) => {
          const updated = { ...prev }
          if (wsData.espacios && Array.isArray(wsData.espacios)) {
            for (const esp of wsData.espacios) {
              if (esp.estado === 'OCUPADO' || esp.estado === 'CHECKED_IN') {
                updated[esp.idEspacio] = 'OCUPADO'
              } else if (esp.estado === 'BLOQUEADO_TEMPORAL') {
                updated[esp.idEspacio] = 'BLOQUEADO_TEMPORAL'
              } else {
                updated[esp.idEspacio] = 'DISPONIBLE'
              }
            }
          }
          return updated
        })
        
        setLastUpdate(new Date())
        
        // Animación: mostrar "syncing" 500ms luego volver a "synced"
        setTimeout(() => setSyncStatus('synced'), 500)
      }
    }

    // Conectar WebSocket y suscribirse a la zona
    connectWebSocket(handleAvailabilityChange)
    subscribeToZona(data.zonaId)

    // Cleanup: desuscribirse al desmontar o cambiar zona
    return () => {
      unsubscribeFromZona(data.zonaId)
    }
  }, [data.zonaId])

  const stats = useMemo(() => {
    if (!floorMap) return { disponibles: 0, ocupados: 0, total: 0 }
    let disponibles = 0
    let ocupados = 0
    for (const s of floorMap.spaces) {
      const av = availability[s.id_espacio]
      if (av === 'OCUPADO' || av === 'BLOQUEADO' || av === 'BLOQUEADO_TEMPORAL' || av === 'CHECKED_IN') ocupados++
      else disponibles++
    }
    return { disponibles, ocupados, total: floorMap.spaces.length }
  }, [floorMap, availability])
  const availablePct = stats.total > 0 ? (stats.disponibles / stats.total) * 100 : 0
  const occupiedPct = Math.max(0, 100 - availablePct)

  const attendees = useMemo(() => {
    const list = [{ key: '__me__', label: bookerName || bookerMail || 'Tú', isMe: true }]
    data.coworkers.forEach((c) => list.push({ key: c.email, label: c.email, isMe: false }))
    return list
  }, [data.coworkers, bookerMail, bookerName])

  async function openDetail(sel) {
    setDetailSpace(sel)
    setSpaceSchedule(null)
    setScheduleLoading(true)
    try {
      const fechaStr = toYyyyMmDd(data.fecha)
      const token = getStoredToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await apiFetch(`/api/spaces/${sel.id_espacio}/schedule?fecha=${fechaStr}`, { headers })
      if (res.ok) {
        const json = await res.json()
        setSpaceSchedule(json)
      } else {
        setSpaceSchedule(null)
      }
    } catch {
      setSpaceSchedule(null)
    } finally {
      setScheduleLoading(false)
    }
  }

  const selectedById = useMemo(() => {
    const map = new Map()
    for (const sel of data.selectedSpaces) map.set(sel.id_espacio, sel)
    return map
  }, [data.selectedSpaces])

  useEffect(() => {
    if (!data.zonaId) return
    let cancelled = false
    setLoading(true)
    async function load() {
      try {
        const map = await getReservationFloorMap(data.zonaId)
        if (cancelled) return
        const fechaStr = toYyyyMmDd(data.fecha)
        const av = await getAvailability({ zonaId: data.zonaId, fecha: fechaStr, horaInicio: data.horaInicio, horaFin: data.horaFin })
        if (cancelled) return
        setFloorMap(map)
        setAvailability(av)
        setDraftPositions(null)
      } catch (err) {
        if (cancelled) return
        console.error('[Step2SeatMap] No se pudo cargar el plano de la zona', data.zonaId, err)
        setFloorMap(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { 
      cancelled = true
      disconnectWebSocket()
    }
  }, [data.zonaId, data.fecha, data.horaInicio, data.horaFin])

  const screenToSvg = useCallback((clientX, clientY) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    return pt.matrixTransform(ctm.inverse())
  }, [])

  const handleMarkerPointerDown = useCallback((e, space) => {
    if (!editMode) return
    e.stopPropagation()
    e.preventDefault()
    const { x, y } = screenToSvg(e.clientX, e.clientY)
    const cur = (draftPositions && draftPositions[space.id_espacio]) || space
    const anchorX = cur.shape === 'circle' ? cur.x : cur.x + (cur.w || 0) / 2
    const anchorY = cur.shape === 'circle' ? cur.y : cur.y + (cur.h || 0) / 2
    draggingRef.current = { id: space.id_espacio, dx: x - anchorX, dy: y - anchorY }
  }, [editMode, draftPositions, screenToSvg])

  useEffect(() => {
    if (!editMode) return
    function move(e) {
      const drag = draggingRef.current
      if (!drag) return
      const { x, y } = screenToSvg(e.clientX, e.clientY)
      setDraftPositions((prev) => {
        const next = { ...(prev || {}) }
        const space = floorMap?.spaces.find((s) => s.id_espacio === drag.id)
        if (!space) return prev
        const nx = x - drag.dx
        const ny = y - drag.dy
        if (space.shape === 'circle') {
          next[drag.id] = { ...(next[drag.id] || space), x: round(nx), y: round(ny) }
        } else {
          const w = space.w || 30
          const h = space.h || 30
          next[drag.id] = { ...(next[drag.id] || space), x: round(nx - w / 2), y: round(ny - h / 2), w, h }
        }
        return next
      })
    }
    function up() { draggingRef.current = null }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [editMode, floorMap, screenToSvg])

  function round(n) { return Math.round(n * 10) / 10 }

  const effectiveSpaces = useMemo(() => {
    if (!floorMap) return []
    if (!draftPositions) return floorMap.spaces
    return floorMap.spaces.map((s) => {
      const override = draftPositions[s.id_espacio]
      return override ? { ...s, ...override } : s
    })
  }, [floorMap, draftPositions])

  // --- FILTRADO (Lógica) ---
  const filteredSpaces = useMemo(() => {
    if (activeTypeFilters.length === 0) return effectiveSpaces
    return effectiveSpaces.filter((s) => 
      activeTypeFilters.includes(normalizeTipoEspacio(s.tipo))
    )
  }, [effectiveSpaces, activeTypeFilters])

  const tightViewBox = useMemo(() => {
    const spaces = floorMap?.spaces
    if (!spaces?.length) return floorMap?.viewBox ?? '0 0 1440 810'
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const s of spaces) {
      if (s.shape === 'circle') {
        const r = s.r ?? 6
        minX = Math.min(minX, s.x - r); minY = Math.min(minY, s.y - r)
        maxX = Math.max(maxX, s.x + r); maxY = Math.max(maxY, s.y + r)
      } else {
        const w = s.w ?? 30; const h = s.h ?? 30
        minX = Math.min(minX, s.x); minY = Math.min(minY, s.y)
        maxX = Math.max(maxX, s.x + w); maxY = Math.max(maxY, s.y + h)
      }
    }
    const pad = 80
    const x = Math.max(0, minX - pad); const y = Math.max(0, minY - pad)
    const w = maxX + pad - x; const h = maxY + pad - y
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) return floorMap?.viewBox ?? '0 0 1440 810'
    return `${Math.round(x)} ${Math.round(y)} ${Math.round(w)} ${Math.round(h)}`
  }, [floorMap])

  function toggleSelect(space) {
    if (editMode) return
    const state = availability[space.id_espacio]
    if (state === 'OCUPADO' || state === 'BLOQUEADO' || state === 'BLOQUEADO_TEMPORAL' || state === 'CHECKED_IN') return

    const sharedRoom = isSharedRoomType(space.tipo)
    const newEntry = {
      id_espacio: space.id_espacio,
      codigo: space.codigo,
      nombre: space.nombre,
      tipo: space.tipo,
      sharedForAll: sharedRoom,
    }

    if (sharedRoom) {
      update({ selectedSpaces: [newEntry] })
      return
    }

    const currentHasSharedRoom = data.selectedSpaces.some((s) => s.sharedForAll)
    const currentSeats = currentHasSharedRoom ? [] : data.selectedSpaces

    const maxSeats = 1 + data.coworkers.length
    if (currentSeats.length >= maxSeats) {
      update({ selectedSpaces: [...currentSeats.slice(0, -1), newEntry] })
      return
    }
    update({ selectedSpaces: [...currentSeats, newEntry] })
  }

  function addCoworker(e) {
    e.preventDefault()
    const email = coworkerInput.trim().toLowerCase()
    if (!email) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setCoworkerError('Correo no válido.'); return }
    if (email === (bookerMail || '').toLowerCase()) { setCoworkerError('Ese eres tú.'); return }
    if (data.coworkers.some((c) => c.email === email)) { setCoworkerError('Ya añadiste a esa persona.'); return }
    update({ coworkers: [...data.coworkers, { email }] })
    setCoworkerInput('')
    setCoworkerError('')
  }

  function removeCoworker(email) {
    const newCoworkers = data.coworkers.filter((c) => c.email !== email)
    const maxSeats = 1 + newCoworkers.length
    update({
      coworkers: newCoworkers,
      selectedSpaces: data.selectedSpaces.slice(0, maxSeats),
    })
  }

  function exportEditedJson() {
    if (!floorMap) return
    const merged = {
      ...floorMap,
      spaces: effectiveSpaces.map((s) => {
        if (s.shape === 'circle') return { id_espacio: s.id_espacio, codigo: s.codigo, nombre: s.nombre, tipo: s.tipo, shape: 'circle', x: s.x, y: s.y, r: s.r }
        return { id_espacio: s.id_espacio, codigo: s.codigo, nombre: s.nombre, tipo: s.tipo, shape: 'rect', x: s.x, y: s.y, w: s.w, h: s.h }
      }),
    }
    setExportPayload(JSON.stringify(merged, null, 2))
    setEditorOpen(true)
  }

  async function copyExport() {
    try { await navigator.clipboard.writeText(exportPayload) } catch { /* ignore */ }
  }

  function showTooltipFor(e, space) {
    const rect = mapWrapperRef.current?.getBoundingClientRect()
    if (!rect) return
    let state = availability[space.id_espacio] || 'DISPONIBLE'
    
    // Convertir nombres técnicos a legibles
    const stateLabels = {
      'DISPONIBLE': 'Disponible',
      'OCUPADO': 'Ocupado',
      'BLOQUEADO_TEMPORAL': 'Bloqueado temporal',
      'BLOQUEADO': 'Bloqueado',
      'CHECKED_IN': 'En uso',
    }
    const displayState = stateLabels[state] || state
    
    setTooltip({
      x: e.clientX - rect.left, y: e.clientY - rect.top,
      title: space.codigo, subtitle: space.nombre,
      tipo: labelForTipo(space.tipo),
      state: displayState,
    })
    setHovered(space.id_espacio)
  }

  function clearTooltip() { setTooltip(null); setHovered(null) }

  const floorImage = FLOOR_INTERIOR_IMAGES[data.zonaId]
  const mapBackground = floorMap?.background ?? null

  /**
   * JSON puede incluir "mapViewBox" para ajustar el zoom manualmente por piso.
   * Si no existe, se usa el viewBox calculado automáticamente desde los espacios.
   */
  const activeViewBox = useMemo(() => {
    return floorMap?.mapViewBox ?? tightViewBox
  }, [floorMap, tightViewBox])

  /**
   * Posición y tamaño exactos de la imagen de fondo, calculados con ResizeObserver
   * para replicar la geometría xMidYMid meet del SVG principal.
   * Evita depender de object-view-box (CSS no reconocido por React inline styles).
   */
  const [bgTransform, setBgTransform] = useState(null)

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg || !mapBackground || !activeViewBox) { setBgTransform(null); return }
    const compute = () => {
      const { width: CW, height: CH } = svg.getBoundingClientRect()
      if (CW <= 0 || CH <= 0) return
      const [vbX, vbY, vbW, vbH] = activeViewBox.split(' ').map(Number)
      const scale = Math.min(CW / vbW, CH / vbH)
      setBgTransform({
        left: Math.round((CW - vbW * scale) / 2 - vbX * scale),
        top:  Math.round((CH - vbH * scale) / 2 - vbY * scale),
        width:  Math.round(1440 * scale),
        height: Math.round(810 * scale),
      })
    }
    compute()
    const obs = new ResizeObserver(compute)
    obs.observe(svg)
    return () => obs.disconnect()
  }, [mapBackground, activeViewBox])
  const isExpiredBlocking = expired && !editMode
  const hasSharedRoomSelection = data.selectedSpaces.some((s) => s.sharedForAll)
  const effectiveSelectedCount = hasSharedRoomSelection ? (1 + data.coworkers.length) : data.selectedSpaces.length

  const detailTipoLabel = detailSpace
    ? (detailSpace.nombre || labelForTipo(detailSpace.tipo))
    : ''

  function getTimeDiff(date) {
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'hace pocos segundos'
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
    return `hace ${Math.floor(diff / 3600)}h`
  }

  async function handleContinuar() {
    // Bloquear espacios antes de ir a Step 3
    const idEspacios = data.selectedSpaces.map(s => s.id_espacio)
    if (idEspacios.length > 0 && data.zonaId) {
      // Obtener socketId del WebSocket
      const socketId = localStorage.getItem('websocket_socket_id')
      
      const bloqueado = await bloquearEspaciosTemporal(idEspacios, data.zonaId, socketId)
      if (bloqueado) {
        if (import.meta.env.DEV && sessionStorage.getItem('DEBUG_RESERVATION')) {
          console.log('[Step2SeatMap] Espacios bloqueados temporalmente:', idEspacios)
        }
        // Notificar al padre que estos espacios están bloqueados
        if (onBlockSpaces) {
          onBlockSpaces(idEspacios)
        }
      } else {
        console.warn('[Step2SeatMap] Advertencia: Fallo al bloquear espacios, continuando igual')
      }
    }

    // Ir a Step 3
    onNext()
  }

  async function handleAtras() {
    // NO liberar espacios aquí - dejar que el padre maneje eso
    // Ir atrás
    onBack()
  }

  return (
    <div className="step2">
      <div className="cinema-card">
        <aside className="cinema-card__sidebar">
          <div className="step2__floor-img-wrap">
            {floorImage
              ? <img src={floorImage} alt={floorMap?.nombre || 'Piso'} className="step2__floor-img" />
              : <div className="step2__floor-img-placeholder" />
            }
          </div>

          <div className="step2__stats-bar">
            <div className="step2__availability-wrap">
              <span className="step2__availability-title">Barra de disponibilidad</span>
              <div
                className="step2__availability-bar"
                aria-label="Disponibilidad de espacios"
                onMouseEnter={() => setShowAvailabilityTooltip(true)}
                onMouseLeave={() => setShowAvailabilityTooltip(false)}
              >
              <span className="step2__availability-segment step2__availability-segment--disp" style={{ width: `${availablePct}%` }} />
              <span className="step2__availability-segment step2__availability-segment--ocup" style={{ width: `${occupiedPct}%` }} />
              </div>
              {showAvailabilityTooltip && (
                <div className="seat-tooltip step2__availability-tooltip">
                  <div className="seat-tooltip__title">Disponibilidad</div>
                  <div className="seat-tooltip__sub">Estado actual del piso</div>
                  <div className="seat-tooltip__row">
                    <span className="seat-tooltip__state seat-tooltip__state--disponible">
                      {stats.disponibles} disponibles
                    </span>
                    <span className="seat-tooltip__tipo">de {stats.total}</span>
                  </div>
                  <div className="seat-tooltip__row">
                    <span className="seat-tooltip__state seat-tooltip__state--ocupado">
                      {stats.ocupados} ocupados
                    </span>
                    <span className="seat-tooltip__tipo">de {stats.total}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="step2__sidebar-legend">
            <div className="step2__sidebar-legend-item">
              <i className="seat-dot seat-dot--disponible" />Disponible
            </div>
            <div className="step2__sidebar-legend-item">
              <i className="seat-dot seat-dot--ocupado" />Ocupado
            </div>
            <div className="step2__sidebar-legend-item">
              <i className="seat-dot seat-dot--bloqueado_temporal" />En selección
            </div>
            <div className="step2__sidebar-legend-item">
              <i className="seat-dot seat-dot--selected" />Tu selección
            </div>
          </div>
        </aside>

        <div className="cinema-card__main">
          <div className="cinema-card__header">
            <div className="step2__title-block">
              <h2 className="step2__floor-title">
                {floorMap ? `${floorMap.codigoZona} · ${floorMap.nombre}` : 'Cargando…'}
              </h2>
              <div className="step2__sync-indicator">
                {syncStatus === 'syncing' && <span className="step2__sync-spinner" />}
                <span className="step2__last-update">
                  {syncStatus === 'syncing' ? 'Sincronizando...' : `Actualizado hace ${getTimeDiff(lastUpdate)}`}
                </span>
              </div>
              {!editMode && (
                <div className={`step2__countdown${isExpiredBlocking ? ' step2__countdown--expired' : ''}`}>
                  <h3 className="step2__countdown-label">Tiempo para reservar</h3>
                  <span className="step2__countdown-time">{formatCountdown(countdown)}</span>
                </div>
              )}
            </div>

            <div className="step2__datetime-block">
              <DateStrip
                value={data.fecha}
                onChange={(d) => update({ fecha: d })}
              />
              <div className="step2__time-row">
                <TimeSelector
                  horaInicio={data.horaInicio}
                  horaSalida={data.horaFin}
                  onTimeChange={(start, end) => update({ horaInicio: start, horaFin: end })}
                />
              </div>
            </div>
          </div>

          <div className="step2__middle-row">
            <div className="step2__coworkers">
              <div className="step2__coworkers-title">Agregar compañeros</div>
              <div className="assignees__row">
                {attendees.map((a) => (
                  <span key={a.key} className="assignee-chip" title={a.label}>
                    <span className="assignee-chip__avatar" style={{ background: a.isMe ? '#a855f7' : '#ec4899' }}>
                      {a.isMe ? 'TÚ' : getInitialsFromEmail(a.label)}
                    </span>
                    <span className="assignee-chip__label">{a.label}</span>
                    {!a.isMe && (
                      <span
                        className="assignee-chip__remove"
                        role="button"
                        tabIndex={0}
                        onClick={() => removeCoworker(a.key)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') removeCoworker(a.key) }}
                        aria-label={`Quitar ${a.label}`}
                      >×</span>
                    )}
                  </span>
                ))}
              </div>
              <form className="assignees__add" onSubmit={addCoworker}>
                <input
                  type="email"
                  placeholder="correo@accenture.com"
                  value={coworkerInput}
                  onChange={(e) => { setCoworkerInput(e.target.value); setCoworkerError('') }}
                />
                <button type="submit" className="assignees__add-btn" aria-label="Añadir compañero">+</button>
              </form>
              {coworkerError && <div className="assignees__error">{coworkerError}</div>}
            </div>

            <div className="space-picker">
              <div className="space-picker__header">
                <span className="space-picker__title">Espacios seleccionados</span>
                <span className="space-picker__counter">
                  {effectiveSelectedCount} / {1 + data.coworkers.length}
                </span>
              </div>
              <div className="space-picker__list">
                {data.selectedSpaces.length === 0 && (
                  <p className="space-picker__empty">Selecciona un espacio en el plano</p>
                )}
                {data.selectedSpaces.map((sel) => (
                  <div key={sel.id_espacio} className="space-picker__item space-picker__item--selected">
                    <span className="space-picker__item-dot" />
                    <span className="space-picker__item-code">{sel.codigo}</span>
                    <span className="space-picker__item-name">{sel.nombre || labelForTipo(sel.tipo)}</span>
                    <button
                      type="button"
                      className="space-picker__item-detail-btn"
                      onClick={() => openDetail(sel)}
                      title="Ver horario del espacio"
                    >Detalles</button>
                    <button
                      type="button"
                      className="space-picker__item-remove"
                      onClick={() => update({ selectedSpaces: data.selectedSpaces.filter((s) => s.id_espacio !== sel.id_espacio) })}
                      aria-label={`Quitar ${sel.codigo}`}
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="cinema-card__map" ref={mapWrapperRef}>
            {loading && <div className="step2__loader">Cargando plano…</div>}

            {/* --- COMPONENTE FILTRO INSERTADO --- */}
            {!loading && floorMap && floorMap.spaces.length > 0 && (
              <SpaceTypeFilter
                spaces={floorMap.spaces}
                availability={availability}
                activeTypes={activeTypeFilters}
                onChange={setActiveTypeFilters}
              />
            )}

            {!loading && floorMap && (
              <>
                <div className="step2__map-viewport">
                    {mapBackground && bgTransform && (
                      <img
                        src={mapBackground}
                        alt=""
                        aria-hidden="true"
                        className="step2__map-bg"
                        style={{
                          position: 'absolute',
                          left: bgTransform.left,
                          top: bgTransform.top,
                          width: bgTransform.width,
                          height: bgTransform.height,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        }}
                      />
                    )}
                    <svg
                      ref={svgRef}
                      className="seat-map"
                      viewBox={activeViewBox}
                      preserveAspectRatio="xMidYMid meet"
                      onMouseLeave={clearTooltip}
                    >
                      <image
                        href={floorMap.background}
                        width="1440"
                        height="810"
                        preserveAspectRatio="xMidYMid meet"
                      />
                      {/* --- MAPEO CON FILTROS (filteredSpaces) --- */}
                      {filteredSpaces.map((space) => {
                        const state = availability[space.id_espacio] || 'DISPONIBLE'
                        const sel = selectedById.get(space.id_espacio)
                        const isHovered = hovered === space.id_espacio
                        const cls = [
                          'seat-marker',
                          `seat-marker--${state.toLowerCase()}`,
                          sel ? 'seat-marker--selected' : '',
                          isHovered ? 'seat-marker--hover' : '',
                          editMode ? 'seat-marker--edit' : '',
                          `seat-marker--tipo-${normalizeTipoEspacio(space.tipo)}`,
                        ].filter(Boolean).join(' ')

                        const commonProps = {
                          className: cls,
                          onPointerDown: (e) => handleMarkerPointerDown(e, space),
                          onClick: () => toggleSelect(space),
                          onMouseEnter: (e) => showTooltipFor(e, space),
                          onMouseMove: (e) => showTooltipFor(e, space),
                          onMouseLeave: clearTooltip,
                        }

                        return space.shape === 'circle' ? (
                          <circle key={space.id_espacio} {...commonProps} cx={space.x} cy={space.y} r={space.r || 14} />
                        ) : (
                          <rect key={space.id_espacio} {...commonProps} x={space.x} y={space.y} width={space.w || 36} height={space.h || 36} rx="6" />
                        )
                      })}
                    </svg>
                </div>

                {tooltip && (
                  <div className="seat-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
                    <div className="seat-tooltip__title">{tooltip.title}</div>
                    <div className="seat-tooltip__sub">{tooltip.subtitle}</div>
                    <div className="seat-tooltip__row">
                      <span className={`seat-tooltip__state seat-tooltip__state--${tooltip.state.toLowerCase()}`}>{tooltip.state}</span>
                      <span className="seat-tooltip__tipo">{tooltip.tipo}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {editMode && !loading && floorMap && (
              <div className="seat-map-edit-bar">
                <div className="seat-map-edit-bar__title">Modo edición · arrastra los marcadores y exporta el JSON</div>
                <div className="seat-map-edit-bar__actions">
                  <button type="button" className="wiz-btn wiz-btn--ghost" onClick={() => setDraftPositions(null)}>Restablecer</button>
                  <button type="button" className="wiz-btn wiz-btn--primary" onClick={exportEditedJson}>Exportar JSON</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="wiz-actions">
        <button type="button" className="wiz-btn wiz-btn--ghost" onClick={handleAtras}>← Atrás</button>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <span className="step2__count">{effectiveSelectedCount} espacio(s) seleccionado(s)</span>
          <button
            type="button"
            className="wiz-btn wiz-btn--primary"
            onClick={handleContinuar}
            disabled={!canContinue || isExpiredBlocking}
          >
            Continuar
          </button>
        </div>
      </div>

      <SeatMapExportModal
        open={editorOpen}
        codigoZona={floorMap?.codigoZona}
        exportPayload={exportPayload}
        onClose={() => setEditorOpen(false)}
        onCopy={copyExport}
      />

      <SeatMapSpaceDetailModal
        space={detailSpace}
        scheduleLoading={scheduleLoading}
        spaceSchedule={spaceSchedule}
        horaInicio={data.horaInicio}
        horaFin={data.horaFin}
        availabilityState={detailSpace ? (availability[detailSpace.id_espacio] || 'DISPONIBLE') : ''}
        tipoLabel={detailTipoLabel}
        onClose={() => setDetailSpace(null)}
      />

      <SeatMapExpiredModal
        open={expiredDialogOpen}
        onReload={() => window.location.reload()}
      />
    </div>
  )
}