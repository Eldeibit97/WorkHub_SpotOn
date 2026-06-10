import { apiFetch } from './client'
import { getStoredToken } from './auth'
import { isPlausibleDbEspacioId } from './reserve'
import { normalizeTipoEspacio } from '../lib/spaceTipo'

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

/** Planos en `public/mapas/` + `import.meta.env.BASE_URL` (subcarpeta en deploy). */
export function resolveFloorBackgroundHref(floorMap) {
  if (!floorMap?.background || typeof floorMap.background !== 'string') return floorMap
  let bg = floorMap.background
  if (/^https?:\/\//i.test(bg)) return floorMap
  if (bg.startsWith('/src/assets/mapas/')) {
    const file = bg.split('/').pop()
    bg = `/mapas/${file}`
  }
  const base = import.meta.env.BASE_URL ?? '/'
  const normalizedBase = base === '/' ? '' : base.replace(/\/$/, '')
  if (bg.startsWith('/')) return { ...floorMap, background: `${normalizedBase}${bg}` }
  return { ...floorMap, background: bg }
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

export function apiSpaceId(sp) {
  const raw = sp.idEspacio ?? sp.id_espacio ?? sp.id
  const n = Number(raw)
  return Number.isFinite(n) ? Math.trunc(n) : NaN
}

/**
 * Soporta distintas formas de envelope del backend.
 * @param {unknown} data
 * @returns {Array<object>|null}
 */
export function extractSpacesArray(data) {
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
export function buildApiIdLookup(apiSpaces) {
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
export function mergeLocalFloorMapWithApiSpaces(local, apiSpaces) {
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
    const usedApiIds = new Set()
    mergedSpaces = local.spaces.map((s) => {
      for (const k of orderedLookupKeysForLocal(s)) {
        const realId = byKey.get(k)
        if (
          realId != null &&
          isPlausibleDbEspacioId(realId) &&
          !usedApiIds.has(realId)
        ) {
          usedApiIds.add(realId)
          return { ...s, id_espacio: realId }
        }
      }
      return s
    })
  }

  if (import.meta.env.DEV) {
    const bad = mergedSpaces.filter((s) => !isPlausibleDbEspacioId(s.id_espacio))
    if (bad.length > 0) {
      console.warn(
        '[getFloorMap] %s marcador(es) sin id_espacio de BD (códigos: %s). Revisa duplicados en el JSON local o alineación con GET /api/spaces.',
        bad.length,
        bad.map((s) => s.codigo || s.nombre).join(', '),
      )
    }
  }

  return { ...local, spaces: mergedSpaces }
}

/**
 * El backend a veces entrega `background` como color (p. ej. "#eee") o vacío en vez de
 * una ruta de imagen. Solo aceptamos URLs/rutas/archivos de imagen; si no, usamos el local.
 * @param {unknown} bg
 */
export function isUsableBackgroundHref(bg) {
  if (typeof bg !== 'string') return false
  const s = bg.trim()
  if (!s || s.startsWith('#')) return false
  return /^https?:\/\//i.test(s) || s.startsWith('/') || /\.(svg|png|jpe?g|webp|gif)$/i.test(s)
}

function normalizeZonaRow(zonaRow, local) {
  if (!zonaRow) {
    return {
      codigoZona: local.codigoZona,
      nombre: local.nombre,
      edificio: local.edificio,
      viewBox: local.viewBox,
      mapViewBox: local.mapViewBox,
      background: local.background,
    }
  }
  return {
    codigoZona:
      zonaRow.codigo_zona ??
      zonaRow.codigoZona ??
      zonaRow.nombre_zona ??
      zonaRow.nombreZona ??
      local.codigoZona,
    nombre: zonaRow.descripcion ?? zonaRow.nombre ?? local.nombre,
    edificio: zonaRow.edificio ?? local.edificio,
    viewBox: zonaRow.view_box ?? zonaRow.viewBox ?? local.viewBox,
    mapViewBox: zonaRow.map_view_box ?? zonaRow.mapViewBox ?? local.mapViewBox,
    background: isUsableBackgroundHref(zonaRow.background) ? zonaRow.background : local.background,
  }
}

export function spaceHasGeometry(s) {
  if (s.x == null || s.y == null) return false
  if (s.shape === 'circle') return s.r != null
  return s.w != null && s.h != null
}

/** Espacios legacy retirados del layout (p. ej. Media Scape 1 en PB). */
export function isExcludedEditorSpace(s) {
  const codigo = String(s.codigo ?? s.codigo_espacio ?? s.codigoEspacio ?? '')
    .trim()
    .toUpperCase()
  const nombre = String(s.nombre ?? s.nombre_espacio ?? s.nombreEspacio ?? '').trim()
  if (codigo === 'PBMS-082') return true
  if (/^media\s*scape\s*1$/i.test(nombre)) return true
  return false
}

function partitionExcludedSpaces(spaces) {
  const autoEliminarIds = []
  const kept = spaces.filter((s) => {
    if (!isExcludedEditorSpace(s)) return true
    const id = s.id_espacio ?? apiSpaceId(s)
    if (isPlausibleDbEspacioId(id)) autoEliminarIds.push(id)
    return false
  })
  return { spaces: kept, autoEliminarIds }
}

/**
 * Mapea un espacio del API al formato del editor de planos.
 * @param {object} sp
 * @returns {object}
 */
export function mapApiSpaceToEditor(sp) {
  const id = apiSpaceId(sp)
  const tipo = normalizeTipoEspacio(
    sp.id_tipo_espacio ?? sp.idTipoEspacio ?? sp.tipo ?? 1,
  )
  const shape = sp.shape ?? (tipo === 1 ? 'circle' : 'rect')
  const editor = {
    id_espacio: isPlausibleDbEspacioId(id) ? id : null,
    codigo: sp.codigo_espacio ?? sp.codigoEspacio ?? sp.codigo ?? '',
    nombre: sp.nombre_espacio ?? sp.nombreEspacio ?? sp.nombre ?? '',
    tipo,
    shape,
    x: sp.x != null ? Number(sp.x) : null,
    y: sp.y != null ? Number(sp.y) : null,
    r: sp.r != null ? Number(sp.r) : null,
    w: sp.w != null ? Number(sp.w) : null,
    h: sp.h != null ? Number(sp.h) : null,
  }
  if (shape === 'circle' && editor.r == null) editor.r = 6
  if (shape === 'rect') {
    if (editor.w == null) editor.w = 80
    if (editor.h == null) editor.h = 60
  }
  return editor
}

/**
 * @param {number} zonaId
 * @param {object|null} zonaRow
 * @param {Array<object>|null} apiSpaces
 * @param {object} local
 */
function buildFloorMapFromSources(zonaId, zonaRow, apiSpaces, local) {
  const meta = normalizeZonaRow(zonaRow, local)
  let spaces

  if (Array.isArray(apiSpaces) && apiSpaces.length > 0) {
    const fromApi = apiSpaces.map(mapApiSpaceToEditor)
    // Solo usamos la geometría del API si la trae la mayoría de los espacios. Si apenas
    // unos pocos la tienen (p. ej. MZ: 1 de 120), conservamos la geometría del JSON local
    // y solo sustituimos los `id_espacio` reales por coincidencia de código.
    const geoCount = fromApi.filter(spaceHasGeometry).length
    const apiHasGeometry = geoCount > 0 && geoCount >= fromApi.length / 2
    if (apiHasGeometry) {
      spaces = fromApi.filter((s) => s.codigo || s.nombre)
    } else {
      spaces = mergeLocalFloorMapWithApiSpaces(local, apiSpaces).spaces
    }
  } else {
    spaces = local.spaces.map((s) => ({ ...s }))
  }

  const partitioned = partitionExcludedSpaces(spaces)

  return resolveFloorBackgroundHref({
    zonaId,
    codigoZona: meta.codigoZona,
    nombre: meta.nombre,
    edificio: meta.edificio,
    viewBox: meta.viewBox,
    mapViewBox: meta.mapViewBox,
    background: meta.background,
    spaces: partitioned.spaces,
    autoEliminarIds: partitioned.autoEliminarIds,
  })
}

/**
 * @param {number} zonaId
 * @returns {Promise<object|null>}
 */
export async function getZonaById(zonaId) {
  const zonas = await getZonas()
  return (
    zonas.find((z) => Number(z.id_zona ?? z.idZona) === Number(zonaId)) ?? null
  )
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

  let zonaRow = null
  let apiSpaces = null

  try {
    zonaRow = await getZonaById(zonaId)
  } catch {
    // fall through
  }

  try {
    const res = await apiFetch(`/api/spaces?zonaId=${zonaId}`, { headers: authHeaders() })
    if (res.ok) {
      const data = await safeJson(res)
      apiSpaces = extractSpacesArray(data)
    }
  } catch {
    // fall through
  }

  return buildFloorMapFromSources(zonaId, zonaRow, apiSpaces, local)
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
  // Fallback: sin disponibilidad del backend devolvemos {}. La UI trata la ausencia
  // de un id como 'DISPONIBLE', así que no necesitamos los mapas locales (JSON) aquí.
  return {}
}
