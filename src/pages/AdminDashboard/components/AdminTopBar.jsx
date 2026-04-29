import { NavLink } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import AccentureLogo from '../../../components/AccentureLogo'

const TABS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/usuarios', label: 'Usuarios', end: false },
]

function getInitials(first, last) {
  const a = (first || '').charAt(0).toUpperCase()
  const b = (last || '').charAt(0).toUpperCase()
  return `${a}${b}` || 'A'
}

export default function AdminTopBar() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const fullName = `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Administrador'
  const initials = getInitials(user?.nombre, user?.apellido)

  return (
    <header className="admin-topbar">
      <div className="admin-topbar__inner">
        <div className="admin-topbar__brand">
          <AccentureLogo size="small" />
          <span className="admin-topbar__module">workhub admin</span>
        </div>

        <nav className="admin-topbar__tabs" aria-label="Secciones de admin">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `admin-topbar__tab${isActive ? ' admin-topbar__tab--active' : ''}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-topbar__actions">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <div className="admin-topbar__profile" title={fullName}>
            <div className="admin-topbar__avatar">{initials}</div>
            <div className="admin-topbar__profile-text">
              <span className="admin-topbar__profile-name">{fullName}</span>
              <span className="admin-topbar__profile-role">{user?.rol || 'admin'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
