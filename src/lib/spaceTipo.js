/** Etiquetas de tipo de espacio (UI). Una sola fuente para mapa, resumen, editor y tooltips. */
export const TIPO_LABEL = {
  1: 'Estación de trabajo',
  2: 'Sala de juntas',
  5: 'Área especial',
}

export const TIPO_ICON = {
  1: '💺',
  2: '🪑',
  5: '☕',
}

/** Opciones activas en UI (sin Phone Booth ni Media Scape). */
export const TIPO_OPTIONS = [
  { value: 1, label: TIPO_LABEL[1] },
  { value: 2, label: TIPO_LABEL[2] },
  { value: 5, label: TIPO_LABEL[5] },
]

export const TIPO_COLORS = {
  1: '#10b981',
  2: '#6366f1',
  5: '#f43f5e',
}

export const ALL_TIPO_IDS = TIPO_OPTIONS.map((o) => o.value)

/** Tipos deprecados eliminados de BD; se mapean a área especial para datos legacy. */
export function normalizeTipoEspacio(tipo) {
  const n = Number(tipo)
  if (n === 3 || n === 4) return 5
  return n
}

export function labelForTipo(tipo) {
  const normalized = normalizeTipoEspacio(tipo)
  return TIPO_LABEL[normalized] || `Tipo ${tipo}`
}
