import torresHero from '../../assets/torresmoradas-login.png'

/** Alias de presentación por valor de `Zona.edificio` (sin tabla Oficina). */
export const EDIFICIO_UI = {
  'ATC Monterrey': {
    displayName: 'Torres Moradas',
    direccion: 'Av. del Roble 660, Valle del Campestre, San Pedro Garza García, N.L.',
    imagenUrl: torresHero,
  },
}

export function edificioToSlug(edificio) {
  return String(edificio ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function resolveEdificioFromSlug(slug, edificioNames) {
  return edificioNames.find((name) => edificioToSlug(name) === slug) ?? null
}

export function getEdificioDisplay(edificio) {
  const ui = EDIFICIO_UI[edificio]
  return {
    displayName: ui?.displayName ?? edificio,
    direccion: ui?.direccion ?? '',
    imagenUrl: ui?.imagenUrl ?? null,
  }
}
