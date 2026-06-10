import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { usePurplePoints } from '../../../context/PurplePointsContext'
import { getInitialsFromNames } from '../../../lib/userDisplay'
import AccentureLogo from '../../../components/AccentureLogo'
import { CATALOG_BY_ID } from '../../../data/mercadoCatalog'

const TABS = [
  { to: '/sugerencias', label: 'Home', end: true },
  { to: '/reservar', label: 'Reservar', end: true },
  { to: '/cancelar', label: 'Mis Reservas', end: true },
  { to: '/mercado', label: 'Mercado', end: true },
]

export default function UserTopBar() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme, isPremium } = useTheme()
  const { balance, equipped } = usePurplePoints()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  const fullName = `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Usuario'
  const initials = getInitialsFromNames(user?.nombre, user?.apellido, 'U')
  const email = user?.correo_institucional || user?.correo || ''

  const equippedAvatar = equipped?.avatarId ? CATALOG_BY_ID[equipped.avatarId] : null
  const equippedBanner = equipped?.bannerId ? CATALOG_BY_ID[equipped.bannerId] : null

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

  function handleGoPerfil() {
    setOpen(false)
    navigate('/perfil')
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

        {/* Right: PP chip + theme toggle + profile dropdown */}
        <div className="admin-topbar__actions">
          {/* Purple Points chip */}
          <div className="pp-chip" title="Purple Points">
            <span className="pp-chip__dot" aria-hidden="true" />
            <span className="pp-chip__amount">{balance.toLocaleString('es-MX')}</span>
            <span className="pp-chip__label">PP</span>
          </div>

          {/* Theme toggle — shows sun/moon for free themes, paintbrush for premium */}
          <button
            type="button"
            className="admin-icon-btn"
            onClick={isPremium ? undefined : toggleTheme}
            aria-label={isPremium ? 'Tema personalizado activo' : theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isPremium ? `Tema: ${equipped?.temaId ?? 'premium'}` : theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {isPremium ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
            ) : theme === 'dark' ? (
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
              {/* Avatar: imagen equipada o iniciales */}
              {equippedAvatar?.src ? (
                <img
                  src={equippedAvatar.src}
                  alt={fullName}
                  className="admin-topbar__avatar admin-topbar__avatar--img"
                />
              ) : (
                <div className="admin-topbar__avatar">{initials}</div>
              )}
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
                {/* Banner de perfil en la cabecera */}
                <div
                  className="pp-dropdown__banner"
                  style={
                    equippedBanner?.src
                      ? { backgroundImage: `url(${equippedBanner.src})` }
                      : undefined
                  }
                >
                  {/* Avatar grande superpuesto */}
                  {equippedAvatar?.src ? (
                    <img
                      src={equippedAvatar.src}
                      alt={fullName}
                      className="pp-dropdown__avatar-img"
                    />
                  ) : (
                    <div className="pp-dropdown__avatar-initials">{initials}</div>
                  )}
                </div>

                <div className="admin-profile-dropdown__header">
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

                {/* Saldo PP */}
                <div className="pp-dropdown__balance">
                  <span className="pp-chip__dot" aria-hidden="true" />
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                    {balance.toLocaleString('es-MX')}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Purple Points
                  </span>
                </div>

                <div className="admin-profile-dropdown__divider" />

                <button
                  type="button"
                  className="admin-profile-dropdown__nav-link"
                  onClick={handleGoPerfil}
                  role="menuitem"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Ver perfil
                </button>

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
