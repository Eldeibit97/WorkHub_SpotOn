export default function UsersToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  roles,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [12, 25, 50],
  onOpenImport,
  onOpenCreate,
}) {
  return (
    <section className="admin-toolbar admin-toolbar--card">
      <div className="admin-toolbar__left">
        <div className="admin-search">
          <svg className="admin-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="admin-search__input"
            type="search"
            placeholder="Buscar usuario"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <select
          className="admin-select"
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value)}
        >
          <option value="">Todos los roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-toolbar__right">
        <select
          className="admin-select admin-select--ghost"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="Cantidad de filas por página"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              Mostrar {size} rows
            </option>
          ))}
        </select>

        <button className="admin-btn admin-btn--secondary" onClick={onOpenImport}>
          Import Data
        </button>
        <button className="admin-btn admin-btn--primary" onClick={onOpenCreate}>
          + New User
        </button>
      </div>
    </section>
  )
}
