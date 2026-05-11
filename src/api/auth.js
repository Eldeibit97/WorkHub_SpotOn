import { apiFetch } from './client'

function loginPath() {
  const raw = import.meta.env.VITE_LOGIN_PATH ?? '/api/auth/login'
  return raw.startsWith('/') ? raw : `/${raw}`
}

export const AUTH_TOKEN_KEY = 'workhub_auth_token'

/**
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<object>} JSON de respuesta del servidor
 */
export async function loginRequest(credentials) {
  const res = await apiFetch(loginPath(), {
    method: 'POST',
    body: credentials,
  })

  const text = await res.text()
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `Ruta no encontrada (404): ${loginPath()}. Define VITE_LOGIN_PATH en .env igual que en Swagger (ej. /api/auth/login).`,
      )
    }
    const msg =
      data.message ||
      data.error ||
      (typeof data.errors === 'string' ? data.errors : null) ||
      `Error ${res.status}`
    throw new Error(msg)
  }

  const token = data.token ?? data.accessToken ?? data.access_token
  if (token) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token)
  }

  return data
}

export function getStoredToken() {
  return sessionStorage.getItem(AUTH_TOKEN_KEY)
}

export function clearStoredToken() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
}

/** Borrador del wizard de reserva (modo edición / pasos en sessionStorage). */
export function clearReservationWizardStorage() {
  try {
    sessionStorage.removeItem('workhub_reservation_edit_draft')
    sessionStorage.removeItem('workhub_reservation_edit_mode')
    sessionStorage.removeItem('workhub_reservation_edit_step')
  } catch {
    // ignore
  }
}

/**
 * Cierra sesión en servidor (invalida cookie `workhub.sid` y store en BD).
 * Respuesta esperada: 204. Llamar con credenciales include (apiFetch por defecto).
 */
export async function logoutRequest() {
  const res = await apiFetch('/api/auth/logout', { method: 'POST' })
  return res
}
