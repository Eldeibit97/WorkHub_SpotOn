import { apiFetch } from './client'
import { getStoredToken } from './auth'
import { isPlausibleDbEspacioId } from './reserve'
import {
  getZonaById,
  extractSpacesArray,
  mapApiSpaceToEditor,
  spaceHasGeometry,
  isExcludedEditorSpace,
  isUsableBackgroundHref,
  resolveFloorBackgroundHref,
} from './spaces'

/**
 * Fuente de datos del plano para el flujo de reserva del USUARIO.
 *
 * Las POSICIONES de los asientos vienen 100% del backend (GET /api/spaces) y los
 * metadatos de la zona de /api/zonas. No se usa ningún JSON ni geometría local.
 *
 * FLOOR_PRESENTATION es la única config local: el encuadre/zoom por piso (la tabla
 * Zona no expone `map_view_box`) y un fondo de respaldo por si el backend entrega un
 * valor inválido (p. ej. un color). Son 4 entradas mínimas, no datos de asientos.
 * @type {Record<number, { mapViewBox: string|null, background: string }>}
 */
const FLOOR_PRESENTATION = {
  1: { mapViewBox: null, background: '/mapas/piso_PB.svg' },
  2: { mapViewBox: '395 228 650 352', background: '/mapas/piso_MZ.svg' },
  3: { mapViewBox: '424 215 545 385', background: '/mapas/piso_3.svg' },
  4: { mapViewBox: '395 228 650 352', background: '/mapas/piso_9.svg' },
}

function authHeaders() {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try { return JSON.parse(text) } catch { return null }
}

async function fetchApiSpaces(zonaId) {
  try {
    const res = await apiFetch(`/api/spaces?zonaId=${zonaId}`, { headers: authHeaders() })
    if (res.ok) return extractSpacesArray(await safeJson(res))
  } catch {
    // fall through
  }
  return null
}

/** Reservable = id real de BD + geometría válida + no legacy. */
function isReservableSpace(s) {
  return (
    isPlausibleDbEspacioId(s.id_espacio) &&
    spaceHasGeometry(s) &&
    !isExcludedEditorSpace(s)
  )
}

/**
 * @param {object|null} zonaRow
 * @returns {{ codigoZona: string, nombre: string, edificio: string, viewBox: string }}
 */
function readZonaMeta(zonaRow) {
  return {
    codigoZona:
      zonaRow?.codigo_zona ??
      zonaRow?.codigoZona ??
      zonaRow?.nombre_zona ??
      zonaRow?.nombreZona ??
      '',
    nombre: zonaRow?.descripcion ?? zonaRow?.nombre ?? '',
    edificio: zonaRow?.edificio ?? '',
    viewBox: zonaRow?.view_box ?? zonaRow?.viewBox ?? '0 0 1440 810',
  }
}

/**
 * Devuelve el plano del piso para el flujo de reserva. Mismo shape que consume
 * Step2SeatMap: { zonaId, codigoZona, nombre, edificio, viewBox, mapViewBox, background, spaces }.
 * @param {number} zonaId
 */
export async function getReservationFloorMap(zonaId) {
  const pres = FLOOR_PRESENTATION[zonaId] ?? {}

  let zonaRow = null
  try {
    zonaRow = await getZonaById(zonaId)
  } catch {
    // fall through — usamos presentación local
  }

  const apiSpaces = await fetchApiSpaces(zonaId)
  const spaces = (Array.isArray(apiSpaces) ? apiSpaces : [])
    .map(mapApiSpaceToEditor)
    .filter(isReservableSpace)
  const meta = readZonaMeta(zonaRow)

  const background = isUsableBackgroundHref(zonaRow?.background)
    ? zonaRow.background
    : (pres.background ?? null)

  return resolveFloorBackgroundHref({
    zonaId,
    codigoZona: meta.codigoZona,
    nombre: meta.nombre,
    edificio: meta.edificio,
    viewBox: meta.viewBox,
    mapViewBox: pres.mapViewBox ?? null,
    background,
    spaces,
  })
}
