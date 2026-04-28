import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getStoredToken } from '../api/auth'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(true)

  const apiUrl = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    fetchUsuarios()
  }, [])

  async function fetchUsuarios() {
    setCargando(true)
    try {
      const token = getStoredToken()
      const res = await fetch(`${apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setUsuarios(data.usuarios || [])
    } catch {
      setMensaje('Error al cargar usuarios')
    } finally {
      setCargando(false)
    }
  }

  async function cambiarRol(id_usuario, nuevoRol) {
    try {
      const token = getStoredToken()
      const res = await fetch(`${apiUrl}/api/users/${id_usuario}/rol`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rol: nuevoRol }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMensaje(`Error: ${data.message}`)
        return
      }
      setMensaje(`Rol actualizado: ${data.usuario.correo_institucional} → ${data.usuario.rol}`)
      fetchUsuarios()
    } catch {
      setMensaje('Error al actualizar rol')
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>Dashboard Administrativo</h1>
      <p>Bienvenido, <strong>{user?.nombre}</strong> — rol: <em>{user?.rol}</em></p>

      {mensaje && (
        <div style={{ background: '#f0f4ff', border: '1px solid #a0b0ff', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
          {mensaje}
        </div>
      )}

      <h2>Gestión de Roles</h2>
      {cargando ? (
        <p>Cargando usuarios…</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>Nombre</th>
              <th style={{ padding: '0.5rem' }}>Correo</th>
              <th style={{ padding: '0.5rem' }}>Rol actual</th>
              <th style={{ padding: '0.5rem' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id_usuario} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>{u.nombre} {u.apellido}</td>
                <td style={{ padding: '0.5rem' }}>{u.correo_institucional}</td>
                <td style={{ padding: '0.5rem' }}>
                  <span style={{
                    background: u.rol === 'admin' ? '#6c5ce7' : '#00b894',
                    color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12
                  }}>
                    {u.rol}
                  </span>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {/* No se puede quitar el rol al admin actual */}
                  {u.id_usuario !== user?.sub && (
                    <button
                      onClick={() => cambiarRol(u.id_usuario, u.rol === 'admin' ? 'employee' : 'admin')}
                      style={{ padding: '4px 12px', cursor: 'pointer' }}
                    >
                      {u.rol === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
