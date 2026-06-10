import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getStoredToken,
  clearStoredToken,
  logoutRequest,
  clearReservationWizardStorage,
  getAuthMe,
} from '../api/auth'
import { apiBaseUrl, setUnauthorizedHandler } from '../api/client'

const AuthContext = createContext(null)

/**
 * Decodifica el payload del JWT sin verificar la firma.
 * La verificación real ocurre en el backend.
 */
function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

// Componente proveedor del contexto de autenticación
export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null) // { sub, correo, rol, nombre?, ... }
  const [loading, setLoading] = useState(true)
  const userRef = useRef(null)
  const signOutRunning = useRef(false)

  userRef.current = user

  const signOut = useCallback(async () => {
    if (signOutRunning.current) return
    signOutRunning.current = true
    try {
      try {
        await logoutRequest()
      } catch {
        // red de error: igual limpiamos cliente
      }
      clearStoredToken()
      clearReservationWizardStorage()
      // Clear cached suggestions so they are regenerated on next login
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('suggestions_cache_'))
        .forEach(k => sessionStorage.removeItem(k))
      setUser(null)
      navigate('/login', { replace: true })
    } finally {
      signOutRunning.current = false
    }
  }, [navigate])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const token = getStoredToken()

      if (!apiBaseUrl) {
        if (token) {
          const payload = decodeToken(token)
          if (payload && !cancelled) setUser({ ...payload, token })
        }
        if (!cancelled) setLoading(false)
        return
      }

      try {
        const res = await getAuthMe()
        if (cancelled) return

        if (res.ok) {
          const text = await res.text()
          let data = {}
          if (text) {
            try {
              data = JSON.parse(text)
            } catch {
              data = {}
            }
          }
          const apiUser = data.user
          if (apiUser && typeof apiUser === 'object') {
            const jwtPayload = token ? decodeToken(token) : null
            setUser({
              ...(jwtPayload || {}),
              ...apiUser,
              ...(token ? { token } : {}),
            })
          } else if (token) {
            const payload = decodeToken(token)
            if (payload) setUser({ ...payload, token })
          }
        } else if (res.status === 401) {
          clearStoredToken()
          setUser(null)
        }
      } catch {
        if (cancelled) return
        if (token) {
          const payload = decodeToken(token)
          if (payload) setUser({ ...payload, token })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      const hadSession = Boolean(getStoredToken() || userRef.current)
      if (!hadSession) return
      void logoutRequest().catch(() => {})
      clearStoredToken()
      clearReservationWizardStorage()
      setUser(null)
      navigate('/login', { replace: true })
    }
    setUnauthorizedHandler(onUnauthorized)
    return () => setUnauthorizedHandler(null)
  }, [navigate])

  /**
   * Llamar después de un login exitoso.
   * @param {{ token: string, user: object }} loginResponse  respuesta del backend
   */
  function signIn(loginResponse) {
    const payload = decodeToken(loginResponse.token)
    setUser({
      ...loginResponse.user,
      ...payload,
      token: loginResponse.token,
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook de acceso rápido */
export function useAuth() {
  return useContext(AuthContext)
}
