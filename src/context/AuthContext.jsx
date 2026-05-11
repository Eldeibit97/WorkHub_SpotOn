import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, clearStoredToken, logoutRequest, clearReservationWizardStorage } from '../api/auth'
import { setUnauthorizedHandler } from '../api/client'

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
      setUser(null)
      navigate('/login', { replace: true })
    } finally {
      signOutRunning.current = false
    }
  }, [navigate])

  useEffect(() => {
    // Al recargar: estado UI desde JWT local; sesión HTTP = cookie workhub.sid
    const token = getStoredToken()
    if (token) {
      const payload = decodeToken(token)
      if (payload) setUser({ ...payload, token })
    }
    setLoading(false)
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
