import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'
import { getBalance, purchaseItem, equipItem, unequipItem } from '../api/purplePoints'
import { CATALOG_BY_ID } from '../data/mercadoCatalog'

const PurplePointsContext = createContext(null)

export function PurplePointsProvider({ children }) {
  const { user } = useAuth()
  const { setTheme } = useTheme()

  const [balance, setBalance] = useState(0)
  const [inventory, setInventory] = useState([])
  const [equipped, setEquipped] = useState({ temaId: null, avatarId: null, bannerId: null })
  const [loading, setLoading] = useState(true)

  // Keep a ref to the latest setTheme so callbacks never capture a stale closure.
  const setThemeRef = useRef(setTheme)
  useEffect(() => { setThemeRef.current = setTheme }, [setTheme])

  // ── Reactive sync: apply theme whenever equipped.temaId changes ────────────
  // This is the authoritative sync point. It fires on:
  //   • Initial load from backend (getBalance → setEquipped)
  //   • After equip() updates setEquipped
  useEffect(() => {
    if (equipped.temaId) setThemeRef.current(equipped.temaId)
  }, [equipped.temaId])

  const loadBalance = useCallback(async () => {
    if (!user) return
    try {
      const data = await getBalance()
      setBalance(data.balance ?? 0)
      setInventory(data.inventory ?? [])
      // Normalise field names: backend may return snake_case or camelCase.
      const raw = data.equipped ?? {}
      setEquipped({
        temaId:   raw.temaId   ?? raw.tema_id   ?? null,
        avatarId: raw.avatarId ?? raw.avatar_id ?? null,
        bannerId: raw.bannerId ?? raw.banner_id ?? null,
      })
      // The useEffect above will apply the theme once state updates.
    } catch {
      // no connection – keep current state
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      setLoading(true)
      loadBalance()
    } else {
      setBalance(0)
      setInventory([])
      setEquipped({ temaId: null, avatarId: null, bannerId: null })
      setLoading(false)
    }
  }, [user, loadBalance])

  /** Refresca solo el saldo (útil tras crear reserva o check-out). */
  const refreshBalance = useCallback(async () => {
    if (!user) return
    try {
      const data = await getBalance()
      setBalance(data.balance ?? 0)
      setInventory(data.inventory ?? [])
    } catch { /* ignorar */ }
  }, [user])

  /** Compra un ítem y actualiza el estado local. */
  const purchase = useCallback(async (itemId) => {
    const catalogItem = CATALOG_BY_ID[itemId]
    if (!catalogItem) return { ok: false, error: 'not_found' }
    const result = await purchaseItem(itemId, catalogItem.precio)
    if (result.ok) {
      setBalance(result.newBalance)
      setInventory((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]))
    }
    return result
  }, [])

  /**
   * Equipa un ítem (tema, avatar o banner).
   * Aplica el cambio optimistamente ANTES de esperar la respuesta del API
   * para que la UI reaccione de inmediato.
   */
  const equip = useCallback(async (itemId, category) => {
    // ── Optimistic update ────────────────────────────────────────────────────
    if (category === 'theme') setThemeRef.current(itemId)
    setEquipped((prev) => ({
      ...prev,
      ...(category === 'theme'  && { temaId: itemId }),
      ...(category === 'avatar' && { avatarId: itemId }),
      ...(category === 'banner' && { bannerId: itemId }),
    }))

    // ── Persist via API ──────────────────────────────────────────────────────
    const result = await equipItem(itemId, category)

    if (result.ok) {
      // Normalise the server response (snake_case or camelCase) and merge.
      const raw = result.equipped ?? {}
      if (Object.keys(raw).length > 0) {
        setEquipped({
          temaId:   raw.temaId   ?? raw.tema_id   ?? itemId,
          avatarId: raw.avatarId ?? raw.avatar_id ?? null,
          bannerId: raw.bannerId ?? raw.banner_id ?? null,
        })
      }
      // Guarantee theme is applied even if the response has an unexpected shape.
      if (category === 'theme') setThemeRef.current(itemId)
    } else {
      // Revert optimistic update on failure.
      setEquipped((prev) => ({
        ...prev,
        ...(category === 'theme'  && { temaId: null }),
        ...(category === 'avatar' && { avatarId: null }),
        ...(category === 'banner' && { bannerId: null }),
      }))
      if (category === 'theme') setThemeRef.current('dark')
    }

    return result
  }, [])

  /** Desequipa una categoría y vuelve al estilo por defecto. */
  const unequip = useCallback(async (category) => {
    // Optimistic update.
    setEquipped((prev) => ({
      ...prev,
      ...(category === 'theme'  && { temaId: null }),
      ...(category === 'avatar' && { avatarId: null }),
      ...(category === 'banner' && { bannerId: null }),
    }))
    if (category === 'theme') setThemeRef.current('dark')

    const result = await unequipItem(category)

    if (!result.ok) {
      // Revert on failure – reload full state from backend.
      loadBalance()
    }

    return result
  }, [loadBalance])

  const value = useMemo(
    () => ({
      balance,
      inventory,
      equipped,
      loading,
      refreshBalance,
      purchase,
      equip,
      unequip,
      owns: (itemId) => inventory.includes(itemId),
    }),
    [balance, inventory, equipped, loading, refreshBalance, purchase, equip, unequip],
  )

  return <PurplePointsContext.Provider value={value}>{children}</PurplePointsContext.Provider>
}

export function usePurplePoints() {
  const ctx = useContext(PurplePointsContext)
  if (!ctx) throw new Error('usePurplePoints debe usarse dentro de PurplePointsProvider')
  return ctx
}
