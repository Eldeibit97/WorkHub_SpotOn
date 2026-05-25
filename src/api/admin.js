import { apiFetch } from './client'
import { getStoredToken } from './auth'

function authHeaders() {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseResponse(res) {
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
    const message = data.message || data.error || `Error ${res.status}`
    const error = new Error(message)
    error.status = res.status
    throw error
  }

  return data
}

export async function getDashboardStats({ from, to } = {}) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)

  const query = params.toString()
  const path = query ? `/api/admin/stats?${query}` : '/api/admin/stats'

  const res = await apiFetch(path, {
    headers: authHeaders(),
  })
  return parseResponse(res)
}

export async function getAdminUserReservations(userId, { status, from, to, page, pageSize } = {}) {
  const params = new URLSearchParams()
  if (status)   params.set('status',   status)
  if (from)     params.set('from',     from)
  if (to)       params.set('to',       to)
  if (page)     params.set('page',     String(page))
  if (pageSize) params.set('pageSize', String(pageSize))

  const res = await apiFetch(`/api/admin/users/${userId}/reservations?${params.toString()}`, {
    headers: authHeaders(),
  })
  return parseResponse(res)
}

export async function cancelAdminUserReservation(userId, reservationId) {
  const res = await apiFetch(`/api/admin/users/${userId}/reservations/${reservationId}/cancel`, {
    method: 'PATCH',
    headers: authHeaders(),
  })
  return parseResponse(res)
}

export async function getNoShowHeatmap({ from, to } = {}) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to)   params.set('to', to)

  const query = params.toString()
  const path  = query
    ? `/api/admin/no-shows/heatmap?${query}`
    : '/api/admin/no-shows/heatmap'

  const res = await apiFetch(path, { headers: authHeaders() })
  return parseResponse(res)
}

export async function getNoShowFloorHeatmap({ zonaId, from, to } = {}) {
  const params = new URLSearchParams()
  if (zonaId) params.set('zonaId', String(zonaId))
  if (from)   params.set('from',   from)
  if (to)     params.set('to',     to)

  const res = await apiFetch(
    `/api/admin/no-shows/floor-heatmap?${params.toString()}`,
    { headers: authHeaders() }
  )
  return parseResponse(res)
}
