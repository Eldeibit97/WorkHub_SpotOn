/**
 * Catálogo estático del Mercado. En v2 esto vendrá del backend.
 * `id` debe coincidir con el `item_id` guardado en BD y con el `data-theme` aplicado en el HTML.
 */

export const CATALOG_THEMES = [
  {
    id: 'dracula',
    category: 'theme',
    nombre: 'Drácula',
    descripcion: 'Fondo oscuro con acentos rosa, púrpura suave y cyan. Inspirado en el tema clásico de programación.',
    precio: 200,
    swatches: ['#282a36', '#ff79c6', '#bd93f9', '#8be9fd', '#f8f8f2'],
    gradiente: 'linear-gradient(135deg, #282a36 0%, #44475a 50%, #6272a4 100%)',
  },
  {
    id: 'neon',
    category: 'theme',
    nombre: 'Neon',
    descripcion: 'Negro profundo con destellos magenta y cyan eléctrico. Máximo contraste y vibración visual.',
    precio: 300,
    swatches: ['#0d0d0f', '#ff00ff', '#00ffff', '#ff6ec7', '#b400ff'],
    gradiente: 'linear-gradient(135deg, #0d0d0f 0%, #1a0020 50%, #001a1a 100%)',
  },
  {
    id: 'abyssal',
    category: 'theme',
    nombre: 'Abyssal',
    descripcion: 'Azul marino profundo con cyan suave y acentos dorados. Diseñado para sesiones largas de lectura.',
    precio: 250,
    swatches: ['#0b0e14', '#56b6c2', '#e5c07b', '#98c379', '#1e2a3a'],
    gradiente: 'linear-gradient(135deg, #0b0e14 0%, #0d1f2d 50%, #112233 100%)',
  },
  {
    id: 'amethyst',
    category: 'theme',
    nombre: 'Amethyst',
    descripcion: 'Profundo violeta con superficies lavanda y cabeceras amatista brillante.',
    precio: 350,
    swatches: ['#1a1028', '#7c3aed', '#ede9fe', '#c4b5fd', '#4c1d95'],
    gradiente: 'linear-gradient(135deg, #1a1028 0%, #2e1065 50%, #3b0764 100%)',
  },
]

export const CATALOG_AVATARS = [
  { id: 'avatar-01', category: 'avatar', nombre: 'Cosmos', precio: 100, src: '/shop/avatars/avatar-01.svg' },
  { id: 'avatar-02', category: 'avatar', nombre: 'Pulsar', precio: 100, src: '/shop/avatars/avatar-02.svg' },
  { id: 'avatar-03', category: 'avatar', nombre: 'Nebula', precio: 150, src: '/shop/avatars/avatar-03.svg' },
  { id: 'avatar-04', category: 'avatar', nombre: 'Quasar', precio: 150, src: '/shop/avatars/avatar-04.svg' },
  { id: 'avatar-05', category: 'avatar', nombre: 'Vortex', precio: 200, src: '/shop/avatars/avatar-05.svg' },
  { id: 'avatar-06', category: 'avatar', nombre: 'Eclipse', precio: 200, src: '/shop/avatars/avatar-06.svg' },
]

export const CATALOG_BANNERS = [
  { id: 'banner-01', category: 'banner', nombre: 'Aurora', precio: 150, src: '/shop/banners/banner-01.svg' },
  { id: 'banner-02', category: 'banner', nombre: 'Galaxia', precio: 150, src: '/shop/banners/banner-02.svg' },
  { id: 'banner-03', category: 'banner', nombre: 'Cristal', precio: 200, src: '/shop/banners/banner-03.svg' },
  { id: 'banner-04', category: 'banner', nombre: 'Tormenta', precio: 250, src: '/shop/banners/banner-04.svg' },
]

/** Todos los ítems del catálogo indexados por id para búsqueda O(1). */
export const CATALOG_BY_ID = Object.fromEntries(
  [...CATALOG_THEMES, ...CATALOG_AVATARS, ...CATALOG_BANNERS].map((item) => [item.id, item]),
)
