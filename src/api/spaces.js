import { apiFetch } from './client'
import { getStoredToken } from './auth'
import { isPlausibleDbEspacioId } from './reserve'

import pbBgUrl from '../assets/mapas/piso_PB.svg'
import mzBgUrl from '../assets/mapas/piso_MZ.svg'
import p3BgUrl from '../assets/mapas/piso_3.svg'
import p9BgUrl from '../assets/mapas/piso_9.svg'

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

/** Rutas `/src/assets/...` del JSON no existen en `dist`; Vite resuelve estos imports en build. */
const FLOOR_BACKGROUND_URL_BY_ZONA_ID = {
  1: pbBgUrl,
  2: mzBgUrl,
  3: p3BgUrl,
  4: p9BgUrl,
}

function withBundledFloorBackground(zonaId, floorMap) {
  const url = FLOOR_BACKGROUND_URL_BY_ZONA_ID[zonaId]
  return url ? { ...floorMap, background: url } : floorMap
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

function normalizeCodigoKey(s) {
  if (s == null) return ''
  return String(s).trim().toUpperCase()
}

/** Quita separadores habituales para alinear "PB001" con "PB-001" / "pb 001". */
function compactCodigoKey(s) {
  return normalizeCodigoKey(s).replace(/[\s\-_.#]/g, '')
}

function nombreNormKey(s) {
  if (s == null) return ''
  return String(s).trim().replace(/\s+/g, ' ').toLowerCase()
}

function apiSpaceId(sp) {
  const raw = sp.idEspacio ?? sp.id_espacio ?? sp.id
  const n = Number(raw)
  return Number.isFinite(n) ? Math.trunc(n) : NaN
}

/**
 * Soporta distintas formas de envelope del backend.
 * @param {unknown} data
 * @returns {Array<object>|null}
 */
function extractSpacesArray(data) {
  if (data == null) return null
  if (Array.isArray(data)) return data
  if (Array.isArray(data.spaces)) return data.spaces
  if (Array.isArray(data.data?.spaces)) return data.data.spaces
  if (Array.isArray(data.data) && data.data.length && typeof data.data[0] === 'object') return data.data
  if (Array.isArray(data.result?.spaces)) return data.result.spaces
  if (Array.isArray(data.items)) return data.items
  return null
}

function addCodeTokensFromText(text, addKey) {
  if (!text || typeof text !== 'string') return
  const matches = text.match(/\b([A-Za-z]{1,8}\d{2,8})\b/g)
  if (!matches) return
  for (const t of matches) addKey(compactCodigoKey(t))
}

/**
 * Claves para enlazar un espacio del API al marcador local (código, nombre, tokens tipo PB001).
 * @param {object} sp
 * @param {(k: string) => void} addKey
 */
function addMatchKeysFromApiSpace(sp, addKey) {
  const codigoFields = [
    sp.codigo,
    sp.codigo_espacio,
    sp.codigoEspacio,
    sp.code,
    sp.clave,
    sp.clave_espacio,
    sp.claveEspacio,
  ]
  for (const v of codigoFields) {
    if (v != null && String(v).trim() !== '') addKey(compactCodigoKey(String(v)))
  }
  const nombreFields = [
    sp.nombre,
    sp.nombre_espacio,
    sp.nombreEspacio,
    sp.descripcion,
    sp.label,
  ]
  for (const v of nombreFields) {
    if (v == null || String(v).trim() === '') continue
    const str = String(v)
    addKey(nombreNormKey(str))
    addCodeTokensFromText(str, addKey)
  }
}

/** Orden: código del mapa primero, luego tokens en nombre, luego nombre completo. */
function orderedLookupKeysForLocal(s) {
  const out = []
  const seen = new Set()
  const add = (k) => {
    if (!k || seen.has(k)) return
    seen.add(k)
    out.push(k)
  }
  if (s.codigo != null && String(s.codigo).trim() !== '') add(compactCodigoKey(String(s.codigo)))
  if (s.nombre) {
    addCodeTokensFromText(String(s.nombre), add)
    add(nombreNormKey(s.nombre))
  }
  return out
}

/**
 * Construye mapa clave → id_espacio solo con ids que parecen de BD.
 * @param {Array<object>} apiSpaces
 */
function buildApiIdLookup(apiSpaces) {
  /** @type {Map<string, number>} */
  const byKey = new Map()
  for (const sp of apiSpaces) {
    const id = apiSpaceId(sp)
    if (!isPlausibleDbEspacioId(id)) continue
    addMatchKeysFromApiSpace(sp, (k) => {
      if (k) byKey.set(k, id)
    })
  }
  return byKey
}

/**
 * Mantiene geometría del JSON local y sustituye `id_espacio` con datos de `GET /api/spaces`.
 *
 * @param {object} local
 * @param {Array<object>} apiSpaces
 * @returns {object}
 */
function mergeLocalFloorMapWithApiSpaces(local, apiSpaces) {
  if (!Array.isArray(apiSpaces) || apiSpaces.length === 0) return local

  const byKey = buildApiIdLookup(apiSpaces)

  /** Último recurso: mismo cardinal y API sin claves útiles (p. ej. solo `{ id_espacio }`). */
  const indexFallback =
    byKey.size === 0 &&
    apiSpaces.length === local.spaces.length &&
    apiSpaces.every((sp) => isPlausibleDbEspacioId(apiSpaceId(sp)))

  let mergedSpaces
  if (indexFallback) {
    mergedSpaces = local.spaces.map((s, i) => ({ ...s, id_espacio: apiSpaceId(apiSpaces[i]) }))
  } else {
    mergedSpaces = local.spaces.map((s) => {
      for (const k of orderedLookupKeysForLocal(s)) {
        const realId = byKey.get(k)
        if (realId != null && isPlausibleDbEspacioId(realId)) return { ...s, id_espacio: realId }
      }
      return s
    })
  }

  if (import.meta.env.DEV) {
    const bad = mergedSpaces.filter((s) => !isPlausibleDbEspacioId(s.id_espacio))
    if (bad.length > 0) {
      console.warn(
        '[getFloorMap] Tras fusionar con GET /api/spaces quedan %s marcador(es) sin id_espacio de BD. Revisa la red: forma del JSON, códigos/nombres alineados con el mapa local, o misma cantidad de espacios para el fallback por índice.',
        bad.length,
      )
    }
  }

  return { ...local, spaces: mergedSpaces }
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
 * El JSON local define geometría y metadatos del plano. Si `GET /api/spaces?zonaId=`
 * devuelve `spaces` con `id_espacio` (y código) de BD, se sustituye el id de cada
 * marcador local que coincida por código, para que el batch use `Espacio.id_espacio` real.
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
      const apiSpaces = extractSpacesArray(data)
      if (apiSpaces && apiSpaces.length > 0) {
        return withBundledFloorBackground(
          zonaId,
          mergeLocalFloorMapWithApiSpaces(local, apiSpaces),
        )
      }
    }
  } catch {
    // fall through
  }
  return withBundledFloorBackground(zonaId, local)
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
