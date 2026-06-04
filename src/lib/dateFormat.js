/** Normaliza a medianoche local para comparaciones de calendario. */
export function startOfLocalDay(d) {
  const x = d instanceof Date ? new Date(d) : new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function isSameLocalDay(a, b) {
  const da = startOfLocalDay(a)
  const db = startOfLocalDay(b)
  return (
    da.getDate() === db.getDate()
    && da.getMonth() === db.getMonth()
    && da.getFullYear() === db.getFullYear()
  )
}

/** `YYYY-MM-DD` en calendario local (API / query). */
export function toYyyyMmDd(date) {
  const d = date instanceof Date ? date : new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Fecha larga para resumen (es-MX). */
export function formatDateLongEsMx(date) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** Cabecera tipo tira de fecha: "lunes, 12 mayo" (sin año; mismo texto que DateStrip antes del extract). */
export function formatDateWeekdayDayMonthEs(date) {
  const d = date instanceof Date ? date : new Date(date)
  const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  return `${weekdays[d.getDay()]}, ${d.getDate()} ${MONTHS_ES[d.getMonth()]}`
}

/** Eje X de gráficas: "12 may" */
export function formatDateShortEsMx(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

/** Selector de fechas (lista): día de semana y mes en español. */
export function formatDatePickerLabelEs(date) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/** Chip corto "12 may" */
export function formatDateChipEs(date) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}
