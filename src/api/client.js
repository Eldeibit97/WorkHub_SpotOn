const rawBase = import.meta.env.VITE_API_URL ?? ''
const aiApiBase = import.meta.env.VITE_AI_API_URL ?? ''

export const aiApiBaseUrl = aiApiBase.replace(/\/$/, '')
export const apiBaseUrl = rawBase.replace(/\/$/, '')

/** Cookie de sesión `workhub.sid`: enviar credenciales en todas las peticiones salvo `VITE_API_WITH_CREDENTIALS=false`. */
const withCredentialsDefault = import.meta.env.VITE_API_WITH_CREDENTIALS !== 'false'

if (import.meta.env.DEV && !apiBaseUrl && !aiApiBase) {
  console.warn(
    '[api] VITE_API_URL o AI_API_URL no está definida. Copia .env.example a .env y pon la URL de tu backend o del agente AI.',
  )
}

function normalizeApiPath(path) {
  return path.startsWith('/') ? path : `/${path}`
}

function isPublicAuthPath(apiPath) {
  const p = normalizeApiPath(apiPath)
  const loginPath = normalizeApiPath(import.meta.env.VITE_LOGIN_PATH ?? '/api/auth/login')
  return (
    p === loginPath ||
    p === '/api/auth/logout' ||
    p === '/api/auth/me'
  )
}

let unauthorizedHandler = null

/** Registra callback ante 401 (p. ej. limpiar estado y enviar a login). Desde AuthProvider. */
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = typeof fn === 'function' ? fn : null
}

/**
 * @param {string} path - Ruta absoluta desde la base (ej. "/api/auth/login")
 * @param {RequestInit & { body?: object }} [options]
 */
export async function apiFetch(path, options = {}, ai=false) {
  if (!apiBaseUrl && !aiApiBase) {
    throw new Error('Configura VITE_API_URL o AI_API_URL en .env (copia desde .env.example).')
  }

  const url = `${ai ? aiApiBaseUrl : apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const { headers, body, credentials: credentialsOverride, ...rest } = options

  const credentials = withCredentialsDefault ? 'include' : (credentialsOverride ?? 'omit')

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

  const res = await fetch(url, init)

  if (res.status === 401 && !isPublicAuthPath(path) && unauthorizedHandler) {
    unauthorizedHandler()
  }

  return res
}
