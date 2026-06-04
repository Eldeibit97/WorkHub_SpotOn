import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDateWeekdayDayMonthEs, isSameLocalDay, MONTHS_ES } from '../../../lib/dateFormat'
import './DateStrip.css'

const DAYS_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
/** Cabeceras lun → dom (misma convención que la tira semanal). */
const WEEKDAY_LABELS_MON = [...DAYS_ES.slice(1), DAYS_ES[0]];

export default function DateStrip({ value, onChange }) {
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

  const [weekOffset, setWeekOffset] = useState(() => {
    const selMonday = new Date(selectedDate)
    const sdow = selMonday.getDay() === 0 ? 6 : selMonday.getDay() - 1
    selMonday.setDate(selMonday.getDate() - sdow)
    return diffWeeks(todayMonday, selMonday)
  })

  useEffect(() => {
    const selMonday = new Date(selectedDate)
    const sdow = selMonday.getDay() === 0 ? 6 : selMonday.getDay() - 1
    selMonday.setDate(selMonday.getDate() - sdow)
    // Alinear semana visible con la fecha elegida (mismo comportamiento que Step2SeatMap antes del extract).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronización derivada al cambiar `value`
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- al abrir el popover, anclar el mes al día seleccionado
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
          <span className="date-strip__date-text">{formatDateWeekdayDayMonthEs(selectedDate)}</span>
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
            const isSel = isSameLocalDay(d, selectedDate)
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
              const isSel = isSameLocalDay(d, selectedDate)
              const isTodayCell = isSameLocalDay(d, today)
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
