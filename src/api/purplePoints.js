import { apiFetch } from './client'
import { apiBaseUrl } from './client'
import { getStoredToken } from './auth'

/**
 * Capa de cliente para Purple Points. Contrato completo en docs/BACKEND_PURPLE_POINTS.md.
 * Cuando el backend no esté disponible, se usa un store en localStorage para UI.
 */

const LS_BALANCE = 'workhub_pp_balance'
const LS_INVENTORY = 'workhub_pp_inventory'
const LS_EQUIPPED = 'workhub_pp_equipped'

/** Saldo inicial simulado para desarrollo. */
const DEV_INITIAL_BALANCE = 500

function authHeaders() {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try { return JSON.parse(text) } catch { return null }
}

/* ─────────────────────── Fallback localStorage ─────────────────────────── */

function lsGetBalance() {
  const raw = localStorage.getItem(LS_BALANCE)
  return raw !== null ? Number(raw) : DEV_INITIAL_BALANCE
}

function lsSetBalance(n) {
  localStorage.setItem(LS_BALANCE, String(n))
}

function lsGetInventory() {
  try { return JSON.parse(localStorage.getItem(LS_INVENTORY) || '[]') } catch { return [] }
}

function lsSetInventory(arr) {
  localStorage.setItem(LS_INVENTORY, JSON.stringify(arr))
}

function lsGetEquipped() {
  try {
    return JSON.parse(localStorage.getItem(LS_EQUIPPED) || 'null') || { temaId: null, avatarId: null, bannerId: null }
  } catch {
    return { temaId: null, avatarId: null, bannerId: null }
  }
}

function lsSetEquipped(equipped) {
  localStorage.setItem(LS_EQUIPPED, JSON.stringify(equipped))
}

/* ─────────────────────────────── API pública ────────────────────────────── */

/**
 * Devuelve saldo, equipamiento activo e inventario del usuario.
 * @returns {Promise<{ balance: number, equipped: object, inventory: string[] }>}
 */
export async function getBalance() {
  if (apiBaseUrl) {
    try {
      const res = await apiFetch('/api/purple-points/balance', { headers: authHeaders() })
      if (res.ok) {
        const data = await safeJson(res)
        if (data) {
          // Normalise equipped field names (snake_case ↔ camelCase).
          const raw = data.equipped ?? {}
          return {
            ...data,
            equipped: {
              temaId:   raw.temaId   ?? raw.tema_id   ?? null,
              avatarId: raw.avatarId ?? raw.avatar_id ?? null,
              bannerId: raw.bannerId ?? raw.banner_id ?? null,
            },
            inventory: data.inventory ?? data.inventario ?? [],
          }
        }
      }
    } catch {
      // fall through
    }
  }
  return {
    balance: lsGetBalance(),
    equipped: lsGetEquipped(),
    inventory: lsGetInventory(),
  }
}

/**
 * Historial de transacciones.
 * @param {{ limit?: number, offset?: number }} params
 */
export async function getTransactions({ limit = 20, offset = 0 } = {}) {
  if (apiBaseUrl) {
    try {
      const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) })
      const res = await apiFetch(`/api/purple-points/transactions?${qs}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await safeJson(res)
        if (data) return data
      }
    } catch {
      // fall through
    }
  }
  return { transactions: [], total: 0 }
}

/**
 * Compra un ítem del catálogo.
 * @param {string} itemId
 * @param {number} precio - Precio del ítem (para fallback; el backend lo valida).
 * @returns {Promise<{ ok: boolean, newBalance: number, itemId: string, error?: string }>}
 */
export async function purchaseItem(itemId, precio) {
  if (apiBaseUrl) {
    try {
      const res = await apiFetch('/api/purple-points/purchase', {
        method: 'POST',
        headers: authHeaders(),
        body: { itemId },
      })
      if (res.ok || res.status === 402 || res.status === 409) {
        const data = await safeJson(res)
        if (res.status === 402) return { ok: false, error: 'insufficient_balance', ...data }
        if (res.status === 409) return { ok: false, error: 'already_owned', ...data }
        if (data) {
          // Sync to localStorage so the equip fallback can find this item later
          const inv = lsGetInventory()
          if (!inv.includes(itemId)) lsSetInventory([...inv, itemId])
          if (data.newBalance != null) lsSetBalance(data.newBalance)
          return { ok: true, ...data }
        }
      }
    } catch {
      // fall through
    }
  }
  const balance = lsGetBalance()
  const inventory = lsGetInventory()
  if (inventory.includes(itemId)) return { ok: false, error: 'already_owned', newBalance: balance }
  if (balance < precio) return { ok: false, error: 'insufficient_balance', newBalance: balance, required: precio }
  const newBalance = balance - precio
  lsSetBalance(newBalance)
  lsSetInventory([...inventory, itemId])
  return { ok: true, newBalance, itemId }
}

/**
 * Equipa un ítem (tema, avatar o banner).
 * @param {string} itemId
 * @param {'theme'|'avatar'|'banner'} category
 * @returns {Promise<{ ok: boolean, equipped: object, error?: string }>}
 */
export async function equipItem(itemId, category) {
  if (apiBaseUrl) {
    try {
      const res = await apiFetch('/api/purple-points/equip', {
        method: 'POST',
        headers: authHeaders(),
        body: { itemId, category },
      })
      if (res.ok) {
        const data = await safeJson(res)
        if (data) return { ok: true, ...data }
      }
      if (res.status === 403) return { ok: false, error: 'not_owned' }
    } catch {
      // fall through
    }
  }
  // Ownership is validated at the call-site (MercadoItemCard / PerfilPage check context.owns()).
  // We still check localStorage as a best-effort, but fall through anyway so the user
  // is never silently blocked when the backend handled the purchase.
  const lsInv = lsGetInventory()
  if (!lsInv.includes(itemId)) {
    // Item not in localStorage inventory — possibly purchased via real API.
    // Add it now so subsequent calls are consistent.
    lsSetInventory([...lsInv, itemId])
  }
  const current = lsGetEquipped()
  const next = { ...current }
  if (category === 'theme') next.temaId = itemId
  else if (category === 'avatar') next.avatarId = itemId
  else if (category === 'banner') next.bannerId = itemId
  lsSetEquipped(next)
  return { ok: true, equipped: next }
}

/**
 * Desequipa un ítem (vuelve a null en la categoría indicada).
 * @param {'theme'|'avatar'|'banner'} category
 * @returns {Promise<{ ok: boolean, equipped: object }>}
 */
export async function unequipItem(category) {
  if (apiBaseUrl) {
    try {
      const res = await apiFetch('/api/purple-points/equip', {
        method: 'POST',
        headers: authHeaders(),
        body: { itemId: null, category },
      })
      if (res.ok) {
        const data = await safeJson(res)
        if (data) return { ok: true, ...data }
      }
    } catch {
      // fall through
    }
  }
  const current = lsGetEquipped()
  const next = { ...current }
  if (category === 'theme') next.temaId = null
  else if (category === 'avatar') next.avatarId = null
  else if (category === 'banner') next.bannerId = null
  lsSetEquipped(next)
  return { ok: true, equipped: next }
}

/**
 * Refresca el saldo desde el backend (sin retornar; deja que el contexto haga setState).
 * Útil tras crear una reserva o hacer check-out. Devuelve el nuevo balance.
 */
export async function refreshBalance() {
  const data = await getBalance()
  return data.balance
}
