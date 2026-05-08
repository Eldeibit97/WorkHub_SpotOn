import { apiFetch } from './client'
import { getStoredToken } from './auth'

import pbMap from '../data/floor-maps/pb.json'
import mzMap from '../data/floor-maps/mz.json'
import p3Map from '../data/floor-maps/p3.json'
import p9Map from '../data/floor-maps/p9.json'

const LOCAL_MAPS = {
  1: pbMap,
  2: mzMap,
  3: p3Map,
  4: p9Map,
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

/**
 * @returns {Promise<Array<{id_zona:number,nombre_zona:string,descripcion:string,edificio:string}>>}
 */
export async function getZonas() {
  try {
    const res = await apiFetch('/api/zonas', { headers: authHeaders() })
    if (res.ok) {
      const data = await safeJson(res)
      if (Array.isArray(data) && data.length > 0) return data
    }
  } catch {
    // fall through to local fallback
  }
  return Object.values(LOCAL_MAPS).map((m) => ({
    id_zona: m.zonaId,
    nombre_zona: m.codigoZona,
    descripcion: m.nombre,
    edificio: m.edificio,
  }))
}

/**
 * Returns the floor-map definition (background + spaces) for a zona.
 * Backend payload, when implemented, should mirror the JSON in
 * src/data/floor-maps/<zona>.json. Local JSON is always used as the source
 * of truth for shape/position; backend is consulted to merge any updated
 * coordinates if available.
 *
 * @param {number} zonaId
 */
export async function getFloorMap(zonaId) {
  const local = LOCAL_MAPS[zonaId]
  if (!local) throw new Error(`No floor map for zona ${zonaId}`)
  try {
    const res = await apiFetch(`/api/spaces?zonaId=${zonaId}`, { headers: authHeaders() })
    if (res.ok) {
      const data = await safeJson(res)
      if (data && Array.isArray(data.spaces) && data.spaces.length > 0) return data
    }
  } catch {
    // fall through
  }
  return local
}

/**
 * Returns availability for every space in a zona at a given date/time range.
 * Endpoint contract:
 *   GET /api/spaces/availability?zonaId=X&fecha=YYYY-MM-DD&horaInicio=HH:mm&horaFin=HH:mm
 *   200 OK -> { "<id_espacio>": "DISPONIBLE" | "OCUPADO" | "BLOQUEADO" }
 *
 * @param {{ zonaId:number, fecha:string, horaInicio:string, horaFin:string }} params
 * @returns {Promise<Record<string,'DISPONIBLE'|'OCUPADO'|'BLOQUEADO'>>}
 */
export async function getAvailability({ zonaId, fecha, horaInicio, horaFin }) {
  try {
    const params = new URLSearchParams({
      zonaId: String(zonaId),
      fecha,
      horaInicio,
      horaFin,
    })
    const res = await apiFetch(`/api/spaces/availability?${params.toString()}`, {
      headers: authHeaders(),
    })
    if (res.ok) {
      const data = await safeJson(res)
      if (data && typeof data === 'object') return data
    }
  } catch {
    // fall through
  }
  // Fallback: assume everything is available so the UI works without backend.
  const local = LOCAL_MAPS[zonaId]
  if (!local) return {}
  const map = {}
  for (const s of local.spaces) map[s.id_espacio] = 'DISPONIBLE'
  return map
}
