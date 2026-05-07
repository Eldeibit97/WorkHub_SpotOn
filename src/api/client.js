const rawBase = import.meta.env.VITE_API_URL ?? ''
const aiApiBase = import.meta.env.AI_API_URL ?? ''

export const aiApiBaseUrl = aiApiBase.replace(/\/$/, '')
export const apiBaseUrl = rawBase.replace(/\/$/, '')

const withCredentials = import.meta.env.VITE_API_WITH_CREDENTIALS === 'true'

if (import.meta.env.DEV && !apiBaseUrl && !aiApiBase) {
  console.warn(
    '[api] VITE_API_URL o AI_API_URL no está definida. Copia .env.example a .env y pon la URL de tu backend o del agente AI.',
  )
}

/**
 * @param {string} path - Ruta absoluta desde la base (ej. "/auth/login")
 * @param {RequestInit & { body?: object }} [options]
 */
export async function apiFetch(path, options = {}, ai=false) {
  if (!apiBaseUrl && !aiApiBase) {
    throw new Error('Configura VITE_API_URL o AI_API_URL en .env (copia desde .env.example).')
  }

  const url = `${ai ? aiApiBaseUrl : apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const { headers, body, credentials: credentialsOverride, ...rest } = options

  // Por defecto 'omit': evita preflight con credenciales; compatible con Allow-Origin: * si el backend lo usa.
  // Solo usa 'include' con VITE_API_WITH_CREDENTIALS=true si el backend envía un origen concreto (no *) y cookies.
  const credentials = withCredentials
    ? 'include'
    : (credentialsOverride ?? 'omit')

  const init = {
    ...rest,
    headers: {
      ...(body !== undefined &&
      body !== null &&
      typeof body === 'object' &&
      !(body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...headers,
    },
    credentials,
    body:
      body !== undefined &&
      body !== null &&
      typeof body === 'object' &&
      !(body instanceof FormData)
        ? JSON.stringify(body)
        : body,
  }

  return fetch(url, init)
}
