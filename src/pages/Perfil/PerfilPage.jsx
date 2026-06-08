import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePurplePoints } from '../../context/PurplePointsContext'
import { useTheme } from '../../context/ThemeContext'
import { getInitialsFromNames } from '../../lib/userDisplay'
import { CATALOG_THEMES, CATALOG_AVATARS, CATALOG_BANNERS, CATALOG_BY_ID } from '../../data/mercadoCatalog'
import './PerfilPage.css'

const CATEGORIES = [
  { id: 'theme', label: 'Temas', items: CATALOG_THEMES },
  { id: 'avatar', label: 'Avatares', items: CATALOG_AVATARS },
  { id: 'banner', label: 'Banners', items: CATALOG_BANNERS },
]

function EquippedThemePreview({ temaId }) {
  if (!temaId) return <span className="perfil__equipped-none">Sin tema</span>
  const item = CATALOG_BY_ID[temaId]
  if (!item) return <span className="perfil__equipped-none">{temaId}</span>
  return (
    <div className="perfil__equipped-item">
      <div
        className="perfil__equipped-preview perfil__equipped-preview--theme"
        style={{ background: item.gradiente }}
      >
        <div
          className="perfil__equipped-preview-dot"
          style={{ background: item.swatches?.[1] || '#fff' }}
        />
      </div>
      <span className="perfil__equipped-label">{item.nombre}</span>
    </div>
  )
}

function EquippedAvatarPreview({ avatarId, initials }) {
  if (!avatarId) {
    return (
      <div className="perfil__equipped-item">
        <div className="perfil__equipped-preview">
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {initials}
          </span>
        </div>
        <span className="perfil__equipped-label">Iniciales</span>
      </div>
    )
  }
  const item = CATALOG_BY_ID[avatarId]
  return (
    <div className="perfil__equipped-item">
      <div className="perfil__equipped-preview" style={{ borderRadius: '50%' }}>
        {item?.src ? (
          <img className="perfil__equipped-preview-img" src={item.src} alt={item.nombre} />
        ) : (
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>?</span>
        )}
      </div>
      <span className="perfil__equipped-label">{item?.nombre ?? avatarId}</span>
    </div>
  )
}

function EquippedBannerPreview({ bannerId }) {
  if (!bannerId) return <span className="perfil__equipped-none">Sin banner</span>
  const item = CATALOG_BY_ID[bannerId]
  return (
    <div className="perfil__equipped-item">
      <div className="perfil__equipped-preview" style={{ borderRadius: '8px' }}>
        {item?.src ? (
          <img className="perfil__equipped-preview-img" src={item.src} alt={item.nombre} />
        ) : (
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>?</span>
        )}
      </div>
      <span className="perfil__equipped-label">{item?.nombre ?? bannerId}</span>
    </div>
  )
}

function InventoryCard({ item, owned, equipped, onEquip, onUnequip }) {
  const isEquipped =
    (item.category === 'theme' && equipped.temaId === item.id) ||
    (item.category === 'avatar' && equipped.avatarId === item.id) ||
    (item.category === 'banner' && equipped.bannerId === item.id)

  function renderPreview() {
    if (item.category === 'theme') {
      return (
        <div className="perfil-icard__preview">
          <div className="perfil-icard__preview-bg" style={{ background: item.gradiente }}>
            <div className="perfil-icard__swatches">
              {item.swatches.slice(0, 4).map((c) => (
                <span key={c} className="perfil-icard__swatch" style={{ background: c }} />
              ))}
            </div>
          </div>
          {isEquipped && <span className="perfil-icard__badge perfil-icard__badge--equipped">Equipado</span>}
          {!owned && <span className="perfil-icard__badge perfil-icard__badge--locked">No comprado</span>}
        </div>
      )
    }
    if (item.category === 'avatar') {
      return (
        <div className="perfil-icard__img-wrap" style={{ position: 'relative' }}>
          {item.src ? (
            <img className="perfil-icard__avatar-img" src={item.src} alt={item.nombre} />
          ) : (
            <div className="perfil-icard__avatar-placeholder">{item.nombre[0]}</div>
          )}
          {isEquipped && <span className="perfil-icard__badge perfil-icard__badge--equipped" style={{ position: 'absolute', top: 6, right: 6 }}>Equipado</span>}
          {!owned && <span className="perfil-icard__badge perfil-icard__badge--locked" style={{ position: 'absolute', top: 6, right: 6 }}>No comprado</span>}
        </div>
      )
    }
    if (item.category === 'banner') {
      return (
        <div className="perfil-icard__img-wrap" style={{ position: 'relative' }}>
          {item.src ? (
            <img className="perfil-icard__banner-img" src={item.src} alt={item.nombre} />
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{item.nombre}</div>
          )}
          {isEquipped && <span className="perfil-icard__badge perfil-icard__badge--equipped" style={{ position: 'absolute', top: 6, right: 6 }}>Equipado</span>}
          {!owned && <span className="perfil-icard__badge perfil-icard__badge--locked" style={{ position: 'absolute', top: 6, right: 6 }}>No comprado</span>}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`perfil-icard${isEquipped ? ' perfil-icard--equipped' : ''}${!owned ? ' perfil-icard--not-owned' : ''}`}>
      {renderPreview()}
      <div className="perfil-icard__body">
        <p className="perfil-icard__name">{item.nombre}</p>
        {isEquipped ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end' }}>
            <span className="perfil-icard__btn perfil-icard__btn--equipped" style={{ display: 'inline-block', cursor: 'default' }}>
              Equipado
            </span>
            <button type="button" className="perfil-icard__btn perfil-icard__btn--unequip" onClick={() => onUnequip(item.category)}>
              Desequipar
            </button>
          </div>
        ) : owned ? (
          <button type="button" className="perfil-icard__btn perfil-icard__btn--equip" onClick={() => onEquip(item)}>
            Equipar
          </button>
        ) : (
          <button type="button" className="perfil-icard__btn perfil-icard__btn--buy" disabled>
            {item.precio} PP
          </button>
        )}
      </div>
    </div>
  )
}

export default function PerfilPage() {
  const { user } = useAuth()
  const { balance, equipped, owns, equip, unequip } = usePurplePoints()
  const { theme } = useTheme()
  const [activeCategory, setActiveCategory] = useState('theme')

  const fullName = `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Usuario'
  const initials = getInitialsFromNames(user?.nombre, user?.apellido, 'U')
  const email = user?.correo_institucional || user?.correo || ''
  const rol = user?.rol || 'employee'

  const equippedAvatar = equipped?.avatarId ? CATALOG_BY_ID[equipped.avatarId] : null
  const equippedBanner = equipped?.bannerId ? CATALOG_BY_ID[equipped.bannerId] : null

  const activeItems = CATEGORIES.find((c) => c.id === activeCategory)?.items ?? []

  async function handleEquip(item) {
    await equip(item.id, item.category)
  }

  async function handleUnequip(category) {
    await unequip(category)
  }

  return (
    <div className="perfil">
      {/* ── User card ── */}
      <div className="perfil__card">
        <div
          className="perfil__banner"
          style={equippedBanner?.src ? { backgroundImage: `url(${equippedBanner.src})` } : undefined}
        >
          <div className="perfil__avatar-wrap">
            {equippedAvatar?.src ? (
              <img className="perfil__avatar-img" src={equippedAvatar.src} alt={fullName} />
            ) : (
              <div className="perfil__avatar-initials">{initials}</div>
            )}
          </div>
        </div>

        <div className="perfil__info">
          <div>
            <h1 className="perfil__name">{fullName}</h1>
            {email && <p className="perfil__email">{email}</p>}
            <span className={`admin-role-pill admin-role-pill--${rol === 'admin' ? 'admin' : 'employee'}`}>
              {rol}
            </span>
          </div>
          <div className="perfil__balance">
            <span className="perfil__balance-dot" />
            <span className="perfil__balance-amount">{balance.toLocaleString('es-MX')}</span>
            <span className="perfil__balance-label">PP</span>
          </div>
        </div>

        {/* Equipped summary */}
        <div className="perfil__equipped">
          <p className="perfil__equipped-title">Personalización activa</p>
          <div className="perfil__equipped-grid">
            <EquippedThemePreview temaId={equipped?.temaId} />
            <EquippedAvatarPreview avatarId={equipped?.avatarId} initials={initials} />
            <EquippedBannerPreview bannerId={equipped?.bannerId} />
          </div>
        </div>
      </div>

      {/* ── Inventory management ── */}
      <div className="perfil__tabs" role="tablist">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat.id}
            className={`perfil__tab${activeCategory === cat.id ? ' perfil__tab--active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="perfil__grid" role="tabpanel">
        {activeItems.map((item) => (
          <InventoryCard
            key={item.id}
            item={item}
            owned={owns(item.id)}
            equipped={equipped}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
          />
        ))}
      </div>

      <div className="perfil__mercado-cta">
        <Link to="/mercado" className="perfil__mercado-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          Ir al Mercado a comprar más
        </Link>
      </div>
    </div>
  )
}
