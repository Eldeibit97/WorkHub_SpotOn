import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getFloorMap, getAvailability } from '../../../api/spaces'
import { apiFetch } from '../../../api/client'
import { getStoredToken } from '../../../api/auth'
import FLOOR_INTERIOR_IMAGES from '../../../assets/floors/index.js'
import TimeSelector from './TimeSelector'
import './Step2SeatMap.css'

const TIPO_LABEL = {
  1: 'Estación',
  2: 'Sala de juntas',
  3: 'Phone Booth',
  4: 'Media Scape',
  5: 'Área especial',
}

function isSharedRoomType(tipo) {
  return tipo !== 1
}

const DAYS_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function formatFechaLarga(d) {
  const date = d instanceof Date ? d : new Date(d)
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  return `${dayNames[date.getDay()]}, ${date.getDate()} ${MONTHS_ES[date.getMonth()]}`
}

function isSameDay(a, b) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

/** Cabeceras lun → dom (misma convención que la tira semanal). */
const WEEKDAY_LABELS_MON = [...DAYS_ES.slice(1), DAYS_ES[0]]


function getInitialsFromEmail(mail) {
  if (!mail) return '?'
  const before = mail.split('@')[0]
  const parts = before.split(/[.\-_]+/).filter(Boolean)
  if (parts.length === 0) return mail.charAt(0).toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function formatCountdown(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Week strip for date selection ───────────────────────────────────────────
function DateStrip({ value, onChange }) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const selectedDate = useMemo(() => {
    const d = value instanceof Date ? new Date(value) : new Date(value)
    d.setHours(0, 0, 0, 0)
    return d
  }, [value])

  // Anchor week on today's Monday (stable across day picks)
  const todayMonday = useMemo(() => {
    const m = new Date(today)
    const dow = m.getDay() === 0 ? 6 : m.getDay() - 1
    m.setDate(m.getDate() - dow)
    return m
  }, [today])

  function diffWeeks(from, to) {
    const ms = to.getTime() - from.getTime()
    return Math.floor(ms / (7 * 24 * 60 * 60 * 1000))
  }

  // Initial offset: bring selected date's week into view
  const [weekOffset, setWeekOffset] = useState(() => {
    const selMonday = new Date(selectedDate)
    const sdow = selMonday.getDay() === 0 ? 6 : selMonday.getDay() - 1
    selMonday.setDate(selMonday.getDate() - sdow)
    return diffWeeks(todayMonday, selMonday)
  })

  // Cuando cambia el día elegido (tira de días, calendario, paso 1), alinear la
  // semana visible. No depender de weekOffset: si no, las flechas se revierten al instante.
  useEffect(() => {
    const selMonday = new Date(selectedDate)
    const sdow = selMonday.getDay() === 0 ? 6 : selMonday.getDay() - 1
    selMonday.setDate(selMonday.getDate() - sdow)
    setWeekOffset(diffWeeks(todayMonday, selMonday))
  }, [selectedDate, todayMonday])

  const shiftedDays = useMemo(() => {
    const start = new Date(todayMonday)
    start.setDate(start.getDate() + weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [todayMonday, weekOffset])

  const [calOpen, setCalOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => ({
    y: selectedDate.getFullYear(),
    m: selectedDate.getMonth(),
  }))
  const calRef = useRef(null)
  const calToggleRef = useRef(null)

  useEffect(() => {
    if (!calOpen) return
    setViewMonth({ y: selectedDate.getFullYear(), m: selectedDate.getMonth() })
  }, [calOpen, selectedDate])

  const monthGridDays = useMemo(() => {
    const { y, m } = viewMonth
    const first = new Date(y, m, 1)
    const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1
    const start = new Date(y, m, 1 - startPad)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [viewMonth])

  const canPrevMonth =
    viewMonth.y > today.getFullYear() ||
    (viewMonth.y === today.getFullYear() && viewMonth.m > today.getMonth())

  // Close calendar on outside click (sin pelear con el botón que abre/cierra)
  useEffect(() => {
    if (!calOpen) return
    function close(e) {
      if (calToggleRef.current?.contains(e.target)) return
      if (calRef.current?.contains(e.target)) return
      setCalOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [calOpen])

  function handleDayClick(d) {
    if (d < today) return
    onChange(new Date(d))
    setCalOpen(false)
  }

  function pickCalendarDay(d) {
    handleDayClick(d)
  }

  return (
    <div className="date-strip">
      <div className="date-strip__bar">
        <button
          type="button"
          className="date-strip__toggle"
          ref={calToggleRef}
          onClick={() => setCalOpen((v) => !v)}
          aria-label={calOpen ? 'Cerrar calendario' : 'Abrir calendario del mes'}
          aria-expanded={calOpen}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="date-strip__date-text">{formatFechaLarga(selectedDate)}</span>
          <svg
            className={`date-strip__chevron${calOpen ? ' date-strip__chevron--open' : ''}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div className="date-strip__week">
          <button
            type="button"
            className="date-strip__nav"
            onClick={() => setWeekOffset((o) => o - 1)}
            aria-label="Semana anterior"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          {shiftedDays.map((d) => {
            const isPast = d < today
            const isSel = isSameDay(d, selectedDate)
            return (
              <button
                key={d.toISOString()}
                type="button"
                className={`date-strip__day${isSel ? ' date-strip__day--active' : ''}${isPast ? ' date-strip__day--past' : ''}`}
                onClick={() => handleDayClick(d)}
                disabled={isPast}
              >
                <span className="date-strip__day-name">{DAYS_ES[d.getDay()]}</span>
                <span className="date-strip__day-num">{d.getDate()}</span>
              </button>
            )
          })}
          <button
            type="button"
            className="date-strip__nav"
            onClick={() => setWeekOffset((o) => o + 1)}
            aria-label="Semana siguiente"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

      {calOpen && (
        <div className="date-strip__popover date-strip__popover--month" ref={calRef} role="dialog" aria-label="Calendario">
          <div className="date-strip__month-head">
            <button
              type="button"
              className="date-strip__month-nav"
              onClick={() => setViewMonth(({ y, m }) => {
                const d = new Date(y, m - 1, 1)
                return { y: d.getFullYear(), m: d.getMonth() }
              })}
              disabled={!canPrevMonth}
              aria-label="Mes anterior"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span className="date-strip__month-title">
              {MONTHS_ES[viewMonth.m]} {viewMonth.y}
            </span>
            <button
              type="button"
              className="date-strip__month-nav"
              onClick={() => setViewMonth(({ y, m }) => {
                const d = new Date(y, m + 1, 1)
                return { y: d.getFullYear(), m: d.getMonth() }
              })}
              aria-label="Mes siguiente"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
          <div className="date-strip__month-weekdays">
            {WEEKDAY_LABELS_MON.map((label) => (
              <span key={label} className="date-strip__month-wd">{label}</span>
            ))}
          </div>
          <div className="date-strip__month-grid">
            {monthGridDays.map((d) => {
              const inMonth = d.getMonth() === viewMonth.m
              const isPast = d < today
              const isSel = isSameDay(d, selectedDate)
              const isTodayCell = isSameDay(d, today)
              return (
                <button
                  key={`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`}
                  type="button"
                  className={`date-strip__month-day${inMonth ? '' : ' date-strip__month-day--outside'}${isSel ? ' date-strip__month-day--selected' : ''}${isPast ? ' date-strip__month-day--past' : ''}${isTodayCell ? ' date-strip__month-day--today' : ''}`}
                  disabled={isPast}
                  onClick={() => pickCalendarDay(d)}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Step2SeatMap({
  data,
  update,
  onBack,
  onNext,
  canContinue,
  editMode,
  bookerMail,
  bookerName,
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


  // Countdown state: 5 min = 300 s
  const COUNTDOWN_START = 300
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [expired, setExpired] = useState(false)

  const svgRef = useRef(null)
  const mapWrapperRef = useRef(null)
  const draggingRef = useRef(null)

  // Reset countdown only when the map zone changes (new floor), not when date/time is adjusted
  useEffect(() => {
    setCountdown(COUNTDOWN_START)
    setExpired(false)
    setExpiredDialogOpen(false)
  }, [data.zonaId])

  // Countdown tick
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

  // Show custom expired dialog
  useEffect(() => {
    if (!editMode && expired) setExpiredDialogOpen(true)
  }, [editMode, expired])

  // Floor stats
  const stats = useMemo(() => {
    if (!floorMap) return { disponibles: 0, ocupados: 0, total: 0 }
    let disponibles = 0
    let ocupados = 0
    for (const s of floorMap.spaces) {
      const av = availability[s.id_espacio]
      if (av === 'OCUPADO' || av === 'BLOQUEADO') ocupados++
      else disponibles++
    }
    return { disponibles, ocupados, total: floorMap.spaces.length }
  }, [floorMap, availability])
  const availablePct = stats.total > 0 ? (stats.disponibles / stats.total) * 100 : 0
  const occupiedPct = Math.max(0, 100 - availablePct)

  // Attendees list (tú + compañeros) — informational only, no per-seat assignment
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
      const d = data.fecha instanceof Date ? data.fecha : new Date(data.fecha)
      const fechaStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

  // Load floor map + availability
  useEffect(() => {
    if (!data.zonaId) return
    let cancelled = false
    setLoading(true)
    async function load() {
      const map = await getFloorMap(data.zonaId)
      if (cancelled) return
      const d = data.fecha instanceof Date ? data.fecha : new Date(data.fecha)
      const fechaStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const av = await getAvailability({ zonaId: data.zonaId, fecha: fechaStr, horaInicio: data.horaInicio, horaFin: data.horaFin })
      if (cancelled) return
      setFloorMap(map)
      setAvailability(av)
      setDraftPositions(null)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [data.zonaId, data.fecha, data.horaInicio, data.horaFin])

  // Edit mode: drag handlers
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
    if (state === 'OCUPADO' || state === 'BLOQUEADO') return
    if (selectedById.has(space.id_espacio)) {
      update({ selectedSpaces: data.selectedSpaces.filter((s) => s.id_espacio !== space.id_espacio) })
      return
    }

    const sharedRoom = isSharedRoomType(space.tipo)
    const newEntry = {
      id_espacio: space.id_espacio,
      codigo: space.codigo,
      nombre: space.nombre,
      tipo: space.tipo,
      sharedForAll: sharedRoom,
    }

    // Salas: una selección cubre a todos (tú + compañeros).
    if (sharedRoom) {
      update({ selectedSpaces: [newEntry] })
      return
    }

    // Si había una sala compartida y ahora eligen estación, reiniciar selección por asientos.
    const currentHasSharedRoom = data.selectedSpaces.some((s) => s.sharedForAll)
    const currentSeats = currentHasSharedRoom ? [] : data.selectedSpaces

    const maxSeats = 1 + data.coworkers.length
    if (currentSeats.length >= maxSeats) {
      // Conserva el comportamiento de reemplazo automático al cambiar de lugar.
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
    const state = availability[space.id_espacio] || 'DISPONIBLE'
    setTooltip({
      x: e.clientX - rect.left, y: e.clientY - rect.top,
      title: space.codigo, subtitle: space.nombre,
      tipo: TIPO_LABEL[space.tipo] || `Tipo ${space.tipo}`,
      state,
    })
    setHovered(space.id_espacio)
  }

  function clearTooltip() { setTooltip(null); setHovered(null) }

  const floorImage = FLOOR_INTERIOR_IMAGES[data.zonaId]
  const isExpiredBlocking = expired && !editMode
  const hasSharedRoomSelection = data.selectedSpaces.some((s) => s.sharedForAll)
  const effectiveSelectedCount = hasSharedRoomSelection ? (1 + data.coworkers.length) : data.selectedSpaces.length

  return (
    <div className="step2">
      {/* ── Cinema-style unified card ── */}
      <div className="cinema-card">
        {/* Sidebar */}
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
              <i className="seat-dot seat-dot--selected" />Tu selección
            </div>
          </div>

        </aside>

        {/* Main column: header → coworkers → map → legend */}
        <div className="cinema-card__main">
          {/* Header: title + datetime side by side */}
          <div className="cinema-card__header">
            <div className="step2__title-block">
              <h2 className="step2__floor-title">
                {floorMap ? `${floorMap.codigoZona} · ${floorMap.nombre}` : 'Cargando…'}
              </h2>
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

          {/* Coworkers + Space picker row */}
          <div className="step2__middle-row">
            {/* Attendees — informational chips */}
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

            {/* Selected spaces summary panel */}
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
                    <span className="space-picker__item-name">{sel.nombre || TIPO_LABEL[sel.tipo]}</span>
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

          {/* Map area */}
          <div className="cinema-card__map" ref={mapWrapperRef}>
            {loading && <div className="step2__loader">Cargando plano…</div>}

            {!loading && floorMap && (
              <>
                <div className="step2__map-viewport">
                    <svg
                      ref={svgRef}
                      className="seat-map"
                      viewBox={tightViewBox}
                      preserveAspectRatio="xMidYMid meet"
                      onMouseLeave={clearTooltip}
                    >
                      <image
                        href={floorMap.background}
                        width="1440"
                        height="810"
                        preserveAspectRatio="xMidYMid meet"
                      />
                      {effectiveSpaces.map((space) => {
                        const state = availability[space.id_espacio] || 'DISPONIBLE'
                        const sel = selectedById.get(space.id_espacio)
                        const isHovered = hovered === space.id_espacio
                        const cls = [
                          'seat-marker',
                          `seat-marker--${state.toLowerCase()}`,
                          sel ? 'seat-marker--selected' : '',
                          isHovered ? 'seat-marker--hover' : '',
                          editMode ? 'seat-marker--edit' : '',
                          `seat-marker--tipo-${space.tipo}`,
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

      {/* ── Actions ── */}
      <div className="wiz-actions">
        <button type="button" className="wiz-btn wiz-btn--ghost" onClick={onBack}>← Atrás</button>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <span className="step2__count">{effectiveSelectedCount} espacio(s) seleccionado(s)</span>
          <button
            type="button"
            className="wiz-btn wiz-btn--primary"
            onClick={onNext}
            disabled={!canContinue || isExpiredBlocking}
          >
            Continuar
          </button>
        </div>
      </div>

      {/* ── Export modal (edit mode) ── */}
      {editorOpen && (
        <div className="export-modal" role="dialog" aria-modal="true">
          <div className="export-modal__panel">
            <div className="export-modal__header">
              <h3>Exportar JSON · {floorMap?.codigoZona}</h3>
              <button type="button" className="export-modal__close" onClick={() => setEditorOpen(false)}>×</button>
            </div>
            <p className="export-modal__hint">
              Copia este contenido y pégalo en{' '}
              <code>src/data/floor-maps/{(floorMap?.codigoZona || '').toLowerCase()}.json</code>.
            </p>
            <textarea className="export-modal__textarea" readOnly value={exportPayload} onFocus={(e) => e.currentTarget.select()} />
            <div className="export-modal__actions">
              <button type="button" className="wiz-btn wiz-btn--ghost" onClick={() => setEditorOpen(false)}>Cerrar</button>
              <button type="button" className="wiz-btn wiz-btn--primary" onClick={copyExport}>Copiar al portapapeles</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Space detail modal ── */}
      {detailSpace && (
        <div className="export-modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setDetailSpace(null) }}>
          <div className="export-modal__panel space-detail-modal">
            <div className="export-modal__header">
              <div>
                <h3 className="space-detail-modal__title">{detailSpace.codigo}</h3>
                <p className="space-detail-modal__subtitle">{detailSpace.nombre || TIPO_LABEL[detailSpace.tipo]}</p>
              </div>
              <button type="button" className="export-modal__close" onClick={() => setDetailSpace(null)}>×</button>
            </div>

            <div className="space-detail-modal__current">
              <span className="space-detail-modal__label">Horario seleccionado</span>
              <span className="space-detail-modal__range">{data.horaInicio} – {data.horaFin}</span>
              <span className={`seat-tooltip__state seat-tooltip__state--${(availability[detailSpace.id_espacio] || 'disponible').toLowerCase()}`}>
                {availability[detailSpace.id_espacio] || 'DISPONIBLE'}
              </span>
            </div>

            <div className="space-detail-modal__schedule">
              <span className="space-detail-modal__label">Horario del día</span>
              {scheduleLoading && <p className="space-detail-modal__loading">Cargando horario…</p>}
              {!scheduleLoading && spaceSchedule && Array.isArray(spaceSchedule.bloques) && spaceSchedule.bloques.length > 0 && (
                <div className="space-detail-modal__blocks">
                  {spaceSchedule.bloques.map((b, i) => (
                    <div key={i} className={`space-detail-modal__block space-detail-modal__block--${b.estado?.toLowerCase() === 'ocupado' ? 'ocupado' : 'libre'}`}>
                      <span className="space-detail-modal__block-time">{b.inicio} – {b.fin}</span>
                      <span className="space-detail-modal__block-state">{b.estado}</span>
                    </div>
                  ))}
                </div>
              )}
              {!scheduleLoading && !spaceSchedule && (
                <p className="space-detail-modal__no-data">Sin datos de horario detallado disponibles</p>
              )}
            </div>

            <div className="export-modal__actions">
              <button type="button" className="wiz-btn wiz-btn--primary" onClick={() => setDetailSpace(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Expired session modal ── */}
      {expiredDialogOpen && (
        <div className="export-modal export-modal--expired" role="alertdialog" aria-modal="true">
          <div className="export-modal__panel expired-modal">
            <div className="expired-modal__icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="expired-modal__title">Tu tiempo de reserva ha acabado</h3>
            <p className="expired-modal__body">Para continuar con tu reserva necesitas recargar la página e iniciar de nuevo.</p>
            <button type="button" className="wiz-btn wiz-btn--primary expired-modal__reload" onClick={() => window.location.reload()}>
              Recargar página
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
