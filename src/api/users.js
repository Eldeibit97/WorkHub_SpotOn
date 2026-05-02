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
    throw new Error(message)
  }

  return data
}

export async function listUsers({ page = 1, pageSize = 12, search = '', role = '' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })

  if (search.trim()) params.set('search', search.trim())
  if (role.trim()) params.set('role', role.trim())

  const res = await apiFetch(`/api/admin/users?${params.toString()}`, {
    headers: authHeaders(),
  })
  return parseResponse(res)
}

export async function getRoles() {
  const res = await apiFetch('/api/admin/roles', {
    headers: authHeaders(),
  })
  return parseResponse(res)
}

export async function createUser(payload) {
  const res = await apiFetch('/api/admin/users', {
    method: 'POST',
    headers: authHeaders(),
    body: payload,
  })
  return parseResponse(res)
}

export async function updateUser(id, payload) {
  const res = await apiFetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: payload,
  })
  return parseResponse(res)
}

export async function updateUserPassword(id, password) {
  const res = await apiFetch(`/api/admin/users/${id}/password`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: { password },
  })
  return parseResponse(res)
}

export async function updateUserRoles(id, roles) {
  const res = await apiFetch(`/api/admin/users/${id}/roles`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: { roles },
  })
  return parseResponse(res)
}

export async function deleteUser(id) {
  const res = await apiFetch(`/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return parseResponse(res)
}

export async function importUsersCsv(rows) {
  const res = await apiFetch('/api/admin/users/import-csv', {
    method: 'POST',
    headers: authHeaders(),
    body: { users: rows },
  })
  return parseResponse(res)
}
