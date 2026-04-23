import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Protege rutas y secciones según el rol.
 *
 * Como ruta:
 *   <Route path="/admin" element={<RequireRole role="admin"><AdminPage /></RequireRole>} />
 *
 * Como bloque condicional en un componente:
 *   <RequireRole role="admin">
 *     <button>Bloquear espacio</button>
 *   </RequireRole>
 *
 * Props:
 *   role       — 'admin' | 'employee' (obligatorio)
 *   redirectTo — ruta a redirigir si no tiene permiso (default '/home')
 *   fallback   — elemento a mostrar en lugar de redirigir (para bloques inline)
 */
export default function RequireRole({ role, redirectTo = '/home', fallback = null, children }) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) return <Navigate to="/login" replace />

  if (role && user.rol !== role) {
    // Si hay fallback, renderizarlo en vez de redirigir (útil para botones/secciones)
    if (fallback !== null) return fallback
    return <Navigate to={redirectTo} replace />
  }

  return children
}
