/**
 * Generates initial floor-map JSONs for the reservation wizard.
 *
 * Reads Espacio.csv + Zona.csv + Tipo_Espacio.csv from a given path (default
 * c:\\Users\\ramir\\Downloads\\) and writes one JSON per zona to
 * src/data/floor-maps/<codigoZona>.json.
 *
 * Layouts are AUTO-GENERATED approximations — the user is expected to refine
 * positions by hand (or via the in-app `?edit=1` editor) for each floor.
 *
 * Usage: node scripts/generate-floor-maps.mjs [csvDir]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const CSV_DIR = process.argv[2] || 'c:\\Users\\ramir\\Downloads'
const OUT_DIR = path.join(ROOT, 'src', 'data', 'floor-maps')

const VIEWBOX = { w: 1440, h: 810 }
// Defaults per tipo_espacio
const SHAPE_DEFAULTS = {
  1: { shape: 'circle', r: 11 }, // Estación de trabajo
  2: { shape: 'rect', w: 110, h: 80 }, // Sala de juntas
  3: { shape: 'rect', w: 26, h: 26 }, // Phone Booth
  4: { shape: 'rect', w: 90, h: 60 }, // Media Scape
  5: { shape: 'rect', w: 150, h: 100 }, // Área especial
}

// Per zona, define an approximate layout: where the desk grid starts and how
// many columns it has (rough fit on each plano). The user will refine.
const ZONA_LAYOUTS = {
  1: { // PB
    background: '/mapas/piso_PB.svg',
    deskGrid: { x: 110, y: 130, cols: 12, gapX: 70, gapY: 60 },
    rooms: { x: 1000, y: 140, perRow: 1, gapX: 0, gapY: 110 },
  },
  2: { // MZ
    background: '/mapas/piso_MZ.svg',
    deskGrid: { x: 100, y: 110, cols: 14, gapX: 65, gapY: 55 },
    rooms: { x: 1080, y: 130, perRow: 1, gapX: 0, gapY: 110 },
  },
  3: { // P3
    background: '/mapas/piso_3.svg',
    deskGrid: { x: 130, y: 150, cols: 9, gapX: 80, gapY: 70 },
    rooms: { x: 1050, y: 140, perRow: 1, gapX: 0, gapY: 130 },
  },
  4: { // P9
    background: '/mapas/piso_9.svg',
    deskGrid: { x: 100, y: 110, cols: 13, gapX: 70, gapY: 55 },
    rooms: { x: 1090, y: 140, perRow: 1, gapX: 0, gapY: 110 },
  },
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const header = parseLine(lines[0])
  return lines.slice(1).map((line) => {
    const cells = parseLine(line)
    const row = {}
    header.forEach((key, i) => { row[key] = cells[i] })
    return row
  })
}

function parseLine(line) {
  const cells = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else { inQuotes = !inQuotes }
    } else if (ch === ',' && !inQuotes) {
      cells.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  cells.push(cur)
  return cells
}

function makeSpaceMarker(esp, position) {
  const tipo = Number(esp.id_tipo_espacio)
  const defaults = SHAPE_DEFAULTS[tipo] || SHAPE_DEFAULTS[1]
  const base = {
    id_espacio: Number(esp.id_espacio),
    codigo: esp.codigo_espacio,
    nombre: esp.nombre_espacio,
    tipo,
  }
  if (defaults.shape === 'circle') {
    return { ...base, shape: 'circle', x: position.x, y: position.y, r: defaults.r }
  }
  return {
    ...base,
    shape: 'rect',
    x: position.x - defaults.w / 2,
    y: position.y - defaults.h / 2,
    w: defaults.w,
    h: defaults.h,
  }
}

function layoutZona(zona, espacios, tipos) {
  const layout = ZONA_LAYOUTS[zona.id_zona]
  if (!layout) throw new Error(`No layout for zona ${zona.id_zona}`)

  const desks = espacios.filter((e) => Number(e.id_tipo_espacio) === 1)
  const rooms = espacios.filter((e) => Number(e.id_tipo_espacio) !== 1)

  const spaces = []

  // Desks: grid
  const g = layout.deskGrid
  desks.forEach((esp, i) => {
    const col = i % g.cols
    const row = Math.floor(i / g.cols)
    const pos = { x: g.x + col * g.gapX, y: g.y + row * g.gapY }
    spaces.push(makeSpaceMarker(esp, pos))
  })

  // Rooms: stacked in a side column. Group consecutively by tipo so similar
  // shapes appear together.
  const roomsByTipo = [...rooms].sort((a, b) => Number(a.id_tipo_espacio) - Number(b.id_tipo_espacio))
  const r = layout.rooms
  roomsByTipo.forEach((esp, i) => {
    const col = i % r.perRow
    const row = Math.floor(i / r.perRow)
    const pos = { x: r.x + col * r.gapX, y: r.y + row * r.gapY }
    spaces.push(makeSpaceMarker(esp, pos))
  })

  return {
    zonaId: Number(zona.id_zona),
    codigoZona: zona.nombre_zona,
    nombre: zona.descripcion,
    edificio: zona.edificio,
    viewBox: `0 0 ${VIEWBOX.w} ${VIEWBOX.h}`,
    background: layout.background,
    tipoLabels: Object.fromEntries(tipos.map((t) => [t.id_tipo_espacio, t.nombre_tipo])),
    spaces,
  }
}

function main() {
  const espacios = parseCsv(path.join(CSV_DIR, 'Espacio.csv'))
  const zonas = parseCsv(path.join(CSV_DIR, 'Zona.csv'))
  const tipos = parseCsv(path.join(CSV_DIR, 'Tipo_Espacio.csv'))

  const fileMap = { 1: 'pb.json', 2: 'mz.json', 3: 'p3.json', 4: 'p9.json' }

  for (const zona of zonas) {
    const id = Number(zona.id_zona)
    const espaciosZona = espacios.filter((e) => Number(e.id_zona) === id && e.activo === 'true')
    const data = layoutZona(zona, espaciosZona, tipos)
    const outPath = path.join(OUT_DIR, fileMap[id])
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
    console.log(`Wrote ${outPath} — ${data.spaces.length} espacios`)
  }
}

main()
