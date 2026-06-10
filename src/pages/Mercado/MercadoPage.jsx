import { useEffect, useRef, useState } from 'react'
import { usePurplePoints } from '../../context/PurplePointsContext'
import { CATALOG_THEMES, CATALOG_AVATARS, CATALOG_BANNERS } from '../../data/mercadoCatalog'
import MercadoItemCard from './components/MercadoItemCard'
import './MercadoPage.css'

const CATEGORIES = [
  { id: 'theme', label: 'Temas', items: CATALOG_THEMES },
  { id: 'avatar', label: 'Avatares', items: CATALOG_AVATARS },
  { id: 'banner', label: 'Banners', items: CATALOG_BANNERS },
]

export default function MercadoPage() {
  const { balance } = usePurplePoints()
  const [activeCategory, setActiveCategory] = useState('theme')
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const activeItems = CATEGORIES.find((c) => c.id === activeCategory)?.items ?? []

  return (
    <div className="mercado">
      <div className="mercado__header">
        <h1 className="mercado__title">Mercado</h1>
        <p className="mercado__subtitle">
          Gana Purple Points al reservar tu espacio o estacionamiento y al completar tu visita.
          Úsalos para personalizar tu experiencia.
        </p>
      </div>

      <div className="mercado__balance">
        <span className="mercado__balance-icon">PP</span>
        <span className="mercado__balance-amount">{balance.toLocaleString('es-MX')}</span>
        <span className="mercado__balance-label">Purple Points</span>
      </div>

      <div className="mercado__tabs" role="tablist">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat.id}
            className={`mercado__tab${activeCategory === cat.id ? ' mercado__tab--active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="mercado__grid" role="tabpanel">
        {activeItems.map((item) => (
          <MercadoItemCard key={item.id} item={item} onToast={showToast} />
        ))}
      </div>

      {toast && <div className="mercado__toast">{toast}</div>}
    </div>
  )
}
