function getDisplayName(user) {
  const first = user.nombre ?? ''
  const last = user.apellido ?? ''
  return `${first} ${last}`.trim() || 'Sin nombre'
}

function getInitials(user) {
  const first = (user.nombre || '').charAt(0).toUpperCase()
  const last = (user.apellido || '').charAt(0).toUpperCase()
  return `${first}${last}` || '?'
}

function getRolePillClass(role) {
  if (!role) return 'admin-role-pill admin-role-pill--neutral'
  const normalized = role.toLowerCase()
  if (normalized === 'admin') return 'admin-role-pill admin-role-pill--admin'
  if (normalized === 'employee') return 'admin-role-pill admin-role-pill--employee'
  return 'admin-role-pill admin-role-pill--neutral'
}

function SortIcon({ direction }) {
  return (
    <span className="admin-sort-icon" aria-hidden>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: direction === 'asc' ? 1 : 0.3 }}>
        <polyline points="6 15 12 9 18 15" />
      </svg>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: direction === 'desc' ? 1 : 0.3 }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  )
}

function buildPageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set([1, totalPages, currentPage])
  if (currentPage - 1 >= 1) pages.add(currentPage - 1)
  if (currentPage + 1 <= totalPages) pages.add(currentPage + 1)

  const sorted = [...pages].sort((a, b) => a - b)
  const result = []
  let prev = 0
  for (const page of sorted) {
    if (page - prev > 1) result.push('...')
    result.push(page)
    prev = page
  }
  return result
}

export default function UsersTable({
  users,
  loading,
  page,
  totalPages,
  totalItems = 0,
  pageSize = 12,
  sortKey,
  sortDirection,
  onSortChange,
  onPageChange,
  onEdit,
  onDelete,
  onViewReservations,
}) {
  const sortable = ['nombre', 'correo_institucional', 'rol']

  function renderSort(column) {
    if (!sortable.includes(column)) return null
    if (sortKey !== column) return <SortIcon direction="none" />
    return <SortIcon direction={sortDirection} />
  }

  function handleSort(column) {
    if (!sortable.includes(column)) return
    const nextDirection = sortKey === column && sortDirection === 'asc' ? 'desc' : 'asc'
    onSortChange?.(column, nextDirection)
  }

  if (loading) {
    return (
      <section className="admin-table-card">
        <div className="admin-state">Cargando usuarios...</div>
      </section>
    )
  }

  if (!users.length) {
    return (
      <section className="admin-table-card">
        <div className="admin-state">No se encontraron usuarios con esos filtros.</div>
      </section>
    )
  }

  const showingFrom = (page - 1) * pageSize + 1
  const showingTo = Math.min(showingFrom + users.length - 1, totalItems || page * pageSize)
  const totalLabel = totalItems || users.length
  const pageNumbers = buildPageNumbers(page, totalPages)

  return (
    <section className="admin-table-card">
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-table__sortable" onClick={() => handleSort('nombre')}>
                <span>Nombre</span>
                {renderSort('nombre')}
              </th>
              <th className="admin-table__sortable" onClick={() => handleSort('correo_institucional')}>
                <span>Correo</span>
                {renderSort('correo_institucional')}
              </th>
              <th className="admin-table__sortable" onClick={() => handleSort('rol')}>
                <span>Rol actual</span>
                {renderSort('rol')}
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr 
                key={user.id_usuario}
                onClick={() => onViewReservations?.(user)}
                style={{ cursor: 'pointer' }}
                title={`Ver reservaciones de ${getDisplayName(user)}`}
              >
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-user-cell__avatar">{getInitials(user)}</div>
                    <span className="admin-user-cell__name">{getDisplayName(user)}</span>
                  </div>
                </td>
                <td className="admin-table__muted">{user.correo_institucional || 'Sin correo'}</td>
                <td>
                  <span className={getRolePillClass(user.rol)}>{user.rol || 'Sin rol'}</span>
                </td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      className="admin-icon-btn admin-icon-btn--ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(user)
                      }}
                      aria-label={`Editar ${getDisplayName(user)}`}
                      title="Editar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="admin-icon-btn admin-icon-btn--danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete?.(user)
                      }}
                      aria-label={`Eliminar ${getDisplayName(user)}`}
                      title="Eliminar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="admin-pagination">
        <span className="admin-pagination__info">
          Mostrando <strong>{showingFrom}-{showingTo}</strong> de {totalLabel} usuarios
        </span>
        <div className="admin-pagination__controls">
          <button
            className="admin-icon-btn admin-icon-btn--ghost"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          {pageNumbers.map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="admin-pagination__ellipsis">
                ...
              </span>
            ) : (
              <button
                key={p}
                className={`admin-pagination__page${p === page ? ' admin-pagination__page--active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            ),
          )}
          <button
            className="admin-icon-btn admin-icon-btn--ghost"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </footer>
    </section>
  )
}
