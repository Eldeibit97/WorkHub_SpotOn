export const SVG_W = 1440
export const SVG_H = 810
export const ZOOM_MIN = 0.25
export const ZOOM_MAX = 4
export const GRID_SIZE = 10
export const GRID_SIZE_MIN = 5
export const GRID_SIZE_MAX = 80
export const GRID_SIZE_DEFAULT = GRID_SIZE
export const HISTORY_MAX = 20

export function round(n) {
  return Math.round(n * 10) / 10
}

export function clampGridSize(size) {
  const n = Math.round(Number(size))
  if (!Number.isFinite(n)) return GRID_SIZE_DEFAULT
  return Math.min(GRID_SIZE_MAX, Math.max(GRID_SIZE_MIN, n))
}

export function snapCoord(n, enabled, gridSize = GRID_SIZE) {
  if (!enabled) return round(n)
  const size = clampGridSize(gridSize)
  return round(Math.round(n / size) * size)
}

export function normalizeRect(x0, y0, x1, y1, snapEnabled = false, gridSize = GRID_SIZE) {
  const snap = (v) => snapCoord(v, snapEnabled, gridSize)
  return {
    x: snap(Math.min(x0, x1)),
    y: snap(Math.min(y0, y1)),
    w: snap(Math.abs(x1 - x0)),
    h: snap(Math.abs(y1 - y0)),
  }
}

export function cloneSpaces(spaces) {
  return spaces.map((s) => ({ ...s }))
}

export function spacesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function parseViewBox(viewBox, fallbackW = SVG_W, fallbackH = SVG_H) {
  if (!viewBox) return { w: fallbackW, h: fallbackH }
  const parts = viewBox.split(/\s+/).map(Number)
  if (parts.length >= 4) return { w: parts[2], h: parts[3] }
  return { w: fallbackW, h: fallbackH }
}

export function isFormFieldFocused() {
  const tag = document.activeElement?.tagName
  return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA'
}

/** IDs negativos locales del editor; no se envían como idEspacio al API. */
let editorTempIdSeq = -1

export function allocateEditorTempId() {
  editorTempIdSeq -= 1
  return editorTempIdSeq
}

export function isEditorTempId(id) {
  const n = Number(id)
  return Number.isInteger(n) && n < 0
}

/** Clave estable interna del editor (independiente de id_espacio de BD). */
export function createSpaceUid() {
  return `sp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function spaceUid(space) {
  return space?._uid ?? null
}

/**
 * Asigna `_uid` único a cada marcador y separa ids de BD duplicados en ids temporales.
 * @param {Array<object>} spaces
 * @param {(id: unknown) => boolean} isDbId
 */
export function ensureSpaceUids(spaces, isDbId) {
  const seenDbIds = new Set()
  const seenCodigos = new Set()
  return spaces.map((s) => {
    let id_espacio = s.id_espacio
    const codigoKey = String(s.codigo ?? '').trim().toUpperCase()
    const codigoDuplicado = codigoKey !== '' && seenCodigos.has(codigoKey)

    if (codigoKey) seenCodigos.add(codigoKey)

    if (isDbId(id_espacio)) {
      if (seenDbIds.has(id_espacio) || codigoDuplicado) {
        id_espacio = allocateEditorTempId()
      } else {
        seenDbIds.add(id_espacio)
      }
    } else if (id_espacio == null || id_espacio === '') {
      id_espacio = allocateEditorTempId()
    }

    return {
      ...s,
      _uid: s._uid || createSpaceUid(),
      id_espacio,
    }
  })
}
