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
