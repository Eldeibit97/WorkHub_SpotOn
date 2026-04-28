import { createContext, useContext, useState, useEffect } from 'react'
import { getStoredToken, clearStoredToken } from '../api/auth'

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
  const [user, setUser] = useState(null)   // { sub, correo, rol, nombre?, ... }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Al recargar la página, recuperar sesión desde sessionStorage
    const token = getStoredToken()
    if (token) {
      const payload = decodeToken(token)
      if (payload) setUser({ ...payload, token })
    }
    setLoading(false)
  }, [])

  /**
   * Llamar después de un login exitoso.
   * @param {{ token: string, user: object }} loginResponse  respuesta del backend
   */
  function signIn(loginResponse) {
    const token =
      loginResponse?.token ??
      loginResponse?.accessToken ??
      loginResponse?.access_token
    const payload = token ? decodeToken(token) : null
    const responseUser = loginResponse?.user ?? loginResponse?.usuario ?? {}
    const normalizedRole =
      responseUser.rol ??
      responseUser.role ??
      payload?.rol ??
      payload?.role ??
      null

    setUser({
      ...responseUser,         // nombre, apellido, correo_institucional, rol
      ...payload,              // sub, correo, rol (desde el token)
      rol: normalizedRole,
      token,
    })
  }

  function signOut() {
    clearStoredToken()
    setUser(null)
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
