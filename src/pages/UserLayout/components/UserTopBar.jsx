import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { getInitialsFromNames } from '../../../lib/userDisplay'
import AccentureLogo from '../../../components/AccentureLogo'

const TABS = [
  { to: '/sugerencias', label: 'Home', end: true },
  { to: '/reservar', label: 'Reservar', end: true },
  { to: '/cancelar', label: 'Mis Reservas', end: true },
]

export default function UserTopBar() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  const fullName = `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Usuario'
  const initials = getInitialsFromNames(user?.nombre, user?.apellido, 'U')
  const email = user?.correo_institucional || user?.correo || ''

  useEffect(() => {
    if (!open) return

    function onDocumentClick(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    function onEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDocumentClick)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onDocumentClick)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  async function handleLogout() {
    setOpen(false)
    await signOut()
  }

  return (
    <header className="user-topbar">
      <div className="user-topbar__inner">
        {/* Left: logo + module name */}
        <div className="admin-topbar__brand">
          <AccentureLogo size="small" />
          <span className="admin-topbar__module">workhub</span>
        </div>

        {/* Center: nav tabs */}
        <nav className="admin-topbar__tabs" aria-label="Navegación principal">
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

        {/* Right: theme toggle + profile dropdown */}
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

          <div className="admin-topbar__profile-wrapper" ref={wrapperRef}>
            <button
              type="button"
              className="admin-topbar__profile-btn"
              onClick={() => setOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={open}
              aria-label="Perfil de usuario"
            >
              <div className="admin-topbar__avatar">{initials}</div>
              <div className="admin-topbar__profile-text">
                <span className="admin-topbar__profile-name">{fullName}</span>
                <span className="admin-topbar__profile-role">{user?.rol || 'employee'}</span>
              </div>
              <svg
                className={`admin-topbar__chevron${open ? ' admin-topbar__chevron--open' : ''}`}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {open && (
              <div className="admin-profile-dropdown" role="menu">
                <div className="admin-profile-dropdown__header">
                  <div className="admin-profile-dropdown__avatar">{initials}</div>
                  <div className="admin-profile-dropdown__info">
                    <span className="admin-profile-dropdown__name">{fullName}</span>
                    {email && (
                      <span className="admin-profile-dropdown__email">{email}</span>
                    )}
                    <span className="admin-role-pill admin-role-pill--employee admin-profile-dropdown__badge">
                      {user?.rol || 'employee'}
                    </span>
                  </div>
                </div>

                <div className="admin-profile-dropdown__divider" />

                <button
                  type="button"
                  className="admin-profile-dropdown__logout"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
