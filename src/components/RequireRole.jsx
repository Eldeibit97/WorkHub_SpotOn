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
export default function RequireRole({ 
  allowedRoles = null,
  redirectTo = '/', 
  fallback = null, 
  children 
}) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  // Si se especifican roles permitidos y el rol del usuario no está entre ellos
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // Si se proporciona un fallback, mostrarlo en lugar de redirigir
    if (fallback !== null) return fallback
    return <Navigate to={redirectTo} replace />
  }

  return children
}
