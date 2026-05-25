import { apiFetch } from './client'
import { getStoredToken } from './auth'
import { getFloorMap, getZonas, mapApiSpaceToEditor } from './spaces'
import { isPlausibleDbEspacioId } from './reserve'
import FLOOR_INTERIOR_IMAGES from '../assets/floors/index.js'
import { TIPO_OPTIONS, normalizeTipoEspacio } from '../lib/spaceTipo'
import {
  edificioToSlug,
  getEdificioDisplay,
  resolveEdificioFromSlug,
} from '../data/floor-editor/edificios.seed.js'

function authHeaders() {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function backgroundForApi(background) {
  if (!background || typeof background !== 'string') return background ?? null
  const base = import.meta.env.BASE_URL ?? '/'
  const normalizedBase = base === '/' ? '' : base.replace(/\/$/, '')
  if (normalizedBase && background.startsWith(normalizedBase)) {
    const stripped = background.slice(normalizedBase.length)
    return stripped.startsWith('/') ? stripped : `/${stripped}`
  }
  return background
}

/**
 * @param {object} s — espacio en estado del editor
 */
function editorSpaceToSavePayload(s) {
  const tipo = normalizeTipoEspacio(s.tipo)
  const payload = {
    codigoEspacio: s.codigo,
    nombreEspacio: s.nombre,
    idTipoEspacio: tipo,
    shape: s.shape,
    x: s.x ?? null,
    y: s.y ?? null,
  }
  if (isPlausibleDbEspacioId(s.id_espacio)) {
    payload.idEspacio = s.id_espacio
  }
  if (s.shape === 'circle') {
    payload.r = s.r ?? null
  } else {
    payload.w = s.w ?? null
    payload.h = s.h ?? null
  }
  return payload
}

/**
 * @param {object} floorMap
 * @param {Array<object>} spaces
 * @param {number[]} eliminarIds
 */
export function buildSaveFloorLayoutBody(floorMap, spaces, eliminarIds = []) {
  return {
    codigoZona: floorMap.codigoZona,
    viewBox: floorMap.viewBox,
    background: backgroundForApi(floorMap.background),
    espacios: spaces.map(editorSpaceToSavePayload),
    eliminarIds: eliminarIds.filter((id) => isPlausibleDbEspacioId(id)),
  }
}

function normalizeSaveResponse(data) {
  if (!data || typeof data !== 'object') {
    return { espacios: [], zona: null, creados: [] }
  }
  const espacios = data.espacios ?? data.spaces ?? []
  const zona = data.zona ?? null
  const creados = data.creados ?? data.created ?? []
  return { espacios, zona, creados }
}

/**
 * @returns {Promise<Array<{ value:number, label:string }>>}
 */
export async function getTiposEspacio() {
  try {
    const res = await apiFetch('/api/tipos-espacio', { headers: authHeaders() })
    if (res.ok) {
      const data = await safeJson(res)
      const raw = Array.isArray(data)
        ? data
        : data?.items ?? data?.data ?? data?.tipos ?? null
      if (Array.isArray(raw) && raw.length > 0) {
        return raw
          .map((t) => {
            const value = Number(t.id_tipo_espacio ?? t.idTipoEspacio ?? t.id)
            const label =
              t.nombre_tipo ?? t.nombreTipo ?? t.nombre ?? t.label ?? `Tipo ${value}`
            return { value, label }
          })
          .filter((t) => [1, 2, 5].includes(t.value))
      }
    }
  } catch {
    // fallback
  }
  return TIPO_OPTIONS
}

/**
 * @returns {Promise<Array<{ edificio:string, slug:string, displayName:string, direccion:string, imagenUrl:string|null, zonaCount:number }>>}
 */
export async function getEdificios() {
  const zonas = await getZonas()
  const byEdificio = new Map()

  for (const z of zonas) {
    const key = z.edificio || 'Sin edificio'
    if (!byEdificio.has(key)) byEdificio.set(key, [])
    byEdificio.get(key).push(z)
  }

  return [...byEdificio.entries()].map(([edificio, zs]) => {
    const ui = getEdificioDisplay(edificio)
    return {
      edificio,
      slug: edificioToSlug(edificio),
      displayName: ui.displayName,
      direccion: ui.direccion,
      imagenUrl: ui.imagenUrl,
      zonaCount: zs.length,
    }
  })
}

/**
 * @param {string} edificioSlug
 * @returns {Promise<{ edificio:string, slug:string, displayName:string, direccion:string, imagenUrl:string|null }|null>}
 */
export async function getEdificioBySlug(edificioSlug) {
  const list = await getEdificios()
  return list.find((e) => e.slug === edificioSlug) ?? null
}

/**
 * @param {string} edificioSlug
 * @returns {Promise<Array<object>>}
 */
export async function getZonasByEdificio(edificioSlug) {
  const edificios = await getEdificios()
  const edificioNames = edificios.map((e) => e.edificio)
  const edificio = resolveEdificioFromSlug(edificioSlug, edificioNames)
  if (!edificio) return []

  const zonas = await getZonas()
  const filtered = zonas
    .filter((z) => (z.edificio || 'Sin edificio') === edificio)
    .sort((a, b) => a.id_zona - b.id_zona)

  const enriched = await Promise.all(
    filtered.map(async (z) => {
      let spaceCount = 0
      try {
        const map = await getFloorMap(z.id_zona)
        spaceCount = map?.spaces?.length ?? 0
      } catch {
        spaceCount = 0
      }
      return {
        ...z,
        slug: edificioSlug,
        thumbUrl: FLOOR_INTERIOR_IMAGES[z.id_zona] ?? null,
        spaceCount,
        codigo_zona: z.nombre_zona,
      }
    }),
  )

  return enriched
}

/** @param {number} zonaId */
export async function getFloorLayout(zonaId) {
  return getFloorMap(zonaId)
}

/**
 * @param {number} zonaId
 * @param {object} floorMap
 * @param {Array<object>} spaces
 * @param {number[]} [eliminarIds]
 * @returns {Promise<{ ok: true, data: object } | { ok: false, status: number, message: string }>}
 */
export async function saveFloorLayout(zonaId, floorMap, spaces, eliminarIds = []) {
  const body = buildSaveFloorLayoutBody(floorMap, spaces, eliminarIds)

  try {
    const res = await apiFetch(`/api/admin/zonas/${zonaId}/floor-layout`, {
      method: 'PUT',
      headers: authHeaders(),
      body,
    })
    const data = await safeJson(res)

    if (res.ok) {
      return { ok: true, data: normalizeSaveResponse(data) }
    }

    const message =
      (typeof data?.message === 'string' && data.message) ||
      (typeof data?.error === 'string' && data.error) ||
      (res.status === 409
        ? 'Conflicto: código duplicado o espacio con reservas al eliminar.'
        : res.status === 403
          ? 'Solo administradores pueden guardar planos.'
          : res.status === 401
            ? 'Sesión expirada. Inicia sesión de nuevo.'
            : res.status === 400
              ? 'Datos inválidos. Revisa shape, tipo e ids de espacio.'
              : `Error al guardar (${res.status}).`)

    return { ok: false, status: res.status, message }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      message: err instanceof Error ? err.message : 'No se pudo conectar con el servidor.',
    }
  }
}

/** Convierte espacios de la respuesta PUT o GET /api/spaces al formato del editor. */
export function mapSavedSpacesToEditor(apiSpaces) {
  return (apiSpaces ?? []).map((sp) => {
    const editor = mapApiSpaceToEditor(sp)
    return {
      ...editor,
      tipo: normalizeTipoEspacio(editor.tipo),
      id_espacio: isPlausibleDbEspacioId(editor.id_espacio) ? editor.id_espacio : null,
    }
  })
}

export { edificioToSlug, resolveEdificioFromSlug, getEdificioDisplay, editorSpaceToSavePayload }
