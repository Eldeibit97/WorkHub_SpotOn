/** Etiquetas de tipo de espacio (UI). Una sola fuente para mapa, resumen y tooltips. */
export const TIPO_LABEL = {
  1: 'Estación de trabajo',
  2: 'Sala de juntas',
  3: 'Phone Booth',
  4: 'Media Scape',
  5: 'Área especial',
}

export const TIPO_ICON = {
  1: '💺',
  2: '🪑',
  3: '📞',
  4: '🖥️',
  5: '☕',
}

export function labelForTipo(tipo) {
  return TIPO_LABEL[tipo] || `Tipo ${tipo}`
}
