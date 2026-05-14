import { useEffect, useMemo, useState } from 'react'

const EMPTY_FORM = {
  nombre: '',
  apellido: '',
  correo_institucional: '',
  rol: '',
  password: '',
}

function normalizeForm(user, roles) {
  if (!user) return { ...EMPTY_FORM, rol: roles[0] || '' }
  return {
    nombre: user.nombre || '',
    apellido: user.apellido || '',
    correo_institucional: user.correo_institucional || '',
    rol: user.rol || roles[0] || '',
    password: '',
  }
}

export default function UserFormModal({
  mode,
  user,
  roles,
  loading,
  error,
  onClose,
  onSave,
  onDeleteRequest,
}) {
  const [form, setForm] = useState(() => normalizeForm(user, roles))
  const [showDiscardWarning, setShowDiscardWarning] = useState(false)

  useEffect(() => {
    setForm(normalizeForm(user, roles))
    setShowDiscardWarning(false)
  }, [user, roles, mode])

  const originalForm = useMemo(() => normalizeForm(user, roles), [user, roles])

  const hasChanges = useMemo(() => {
    return (
      form.nombre !== originalForm.nombre ||
      form.apellido !== originalForm.apellido ||
      form.correo_institucional !== originalForm.correo_institucional ||
      form.rol !== originalForm.rol ||
      form.password.trim() !== ''
    )
  }, [form, originalForm])

  useEffect(() => {
    function onEscape(event) {
      if (event.key !== 'Escape') return
      if (hasChanges) {
        setShowDiscardWarning(true)
        return
      }
      onClose()
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [hasChanges, onClose])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function closeAttempt() {
    if (hasChanges) {
      setShowDiscardWarning(true)
      return
    }
    onClose()
  }

  function submit(event) {
    event.preventDefault()
    onSave(form)
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={closeAttempt}>
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="admin-modal-close" onClick={closeAttempt} aria-label="Cerrar formulario">
          x
        </button>
        <h3>{mode === 'create' ? 'Crear nuevo usuario' : 'Editar usuario'}</h3>

        {error && (
          <div className="admin-feedback admin-feedback--error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form className="admin-form" onSubmit={submit}>
          <label>
            Nombre
            <input
              className="admin-input"
              value={form.nombre}
              onChange={(event) => updateField('nombre', event.target.value)}
              required
            />
          </label>

          <label>
            Apellido
            <input
              className="admin-input"
              value={form.apellido}
              onChange={(event) => updateField('apellido', event.target.value)}
              required
            />
          </label>

          <label>
            Correo institucional
            <input
              className="admin-input"
              type="email"
              value={form.correo_institucional}
              onChange={(event) => updateField('correo_institucional', event.target.value)}
              required
            />
          </label>

          <label>
            Rol
            <select
              className="admin-select"
              value={form.rol}
              onChange={(event) => updateField('rol', event.target.value)}
              required
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label>
            {mode === 'create' ? 'Contraseña' : 'Nueva contraseña (opcional)'}
            <input
              className="admin-input"
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              required={mode === 'create'}
            />
          </label>

          <div className="admin-modal-actions">
            {mode === 'edit' && (
              <button
                type="button"
                className="admin-btn admin-btn--danger-ghost"
                onClick={onDeleteRequest}
                disabled={loading}
              >
                Eliminar usuario
              </button>
            )}
            <button type="button" className="admin-btn admin-btn--secondary" onClick={closeAttempt} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
              {loading ? 'Guardando...' : mode === 'create' ? 'Guardar' : 'Actualizar'}
            </button>
          </div>
        </form>

        {showDiscardWarning && (
          <div className="admin-inline-warning">
            <p>Si sales ahora, los cambios no serán actualizados. ¿Deseas salir?</p>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn--secondary" onClick={() => setShowDiscardWarning(false)}>
                Seguir editando
              </button>
              <button className="admin-btn admin-btn--danger" onClick={onClose}>
                Salir sin guardar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
