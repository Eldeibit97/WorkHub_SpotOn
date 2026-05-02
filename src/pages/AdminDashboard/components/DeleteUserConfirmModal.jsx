export default function DeleteUserConfirmModal({ user, onCancel, onConfirm, loading }) {
  if (!user) return null

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <div className="admin-modal admin-modal--danger" role="dialog" aria-modal="true">
        <h3>Eliminar usuario</h3>
        <p>
          Estás por eliminar a <strong>{user.nombre} {user.apellido}</strong>.
        </p>
        <p className="admin-warning-text">
          Esta acción no se puede revertir. ¿Deseas continuar?
        </p>
        <div className="admin-modal-actions">
          <button className="admin-btn admin-btn--secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="admin-btn admin-btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
