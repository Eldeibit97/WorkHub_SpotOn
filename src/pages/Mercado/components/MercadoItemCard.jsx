import { useState } from 'react'
import PurchaseConfirmModal from './PurchaseConfirmModal'
import { usePurplePoints } from '../../../context/PurplePointsContext'

export default function MercadoItemCard({ item, onToast }) {
  const { balance, owns, equipped, purchase, equip, unequip } = usePurplePoints()
  const [showModal, setShowModal] = useState(false)
  const [buying, setBuying] = useState(false)

  const isOwned = owns(item.id)
  const isEquipped =
    (item.category === 'theme' && equipped.temaId === item.id) ||
    (item.category === 'avatar' && equipped.avatarId === item.id) ||
    (item.category === 'banner' && equipped.bannerId === item.id)

  async function handleBuy() {
    setBuying(true)
    const result = await purchase(item.id)
    setBuying(false)
    setShowModal(false)
    if (!result.ok) {
      if (result.error === 'insufficient_balance') {
        onToast('No tienes suficientes Purple Points.')
      }
    }
  }

  async function handleEquip() {
    await equip(item.id, item.category)
  }

  async function handleUnequip() {
    await unequip(item.category)
  }

  function renderPreview() {
    if (item.category === 'theme') {
      return (
        <div className="mercado-card__preview">
          <div
            className="mercado-card__preview-bg"
            style={{ background: item.gradiente }}
          >
            <div className="mercado-card__swatches">
              {item.swatches.map((color) => (
                <span
                  key={color}
                  className="mercado-card__swatch"
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )
    }
    if (item.category === 'avatar') {
      return (
        <div className="mercado-card__img-wrap">
          {item.src ? (
            <img className="mercado-card__avatar-img" src={item.src} alt={item.nombre} />
          ) : (
            <div className="mercado-card__avatar-placeholder">
              {item.nombre[0]}
            </div>
          )}
        </div>
      )
    }
    if (item.category === 'banner') {
      return (
        <div className="mercado-card__img-wrap">
          {item.src ? (
            <img className="mercado-card__banner-img" src={item.src} alt={item.nombre} />
          ) : (
            <div className="mercado-card__banner-placeholder">{item.nombre}</div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <>
      <div className={`mercado-card${isEquipped ? ' mercado-card--equipped' : ''}`}>
        {renderPreview()}
        {isEquipped && (
          <span className="mercado-card__badge mercado-card__badge--equipped">Equipado</span>
        )}
        {!isEquipped && isOwned && (
          <span className="mercado-card__badge mercado-card__badge--owned">En inventario</span>
        )}
        <div className="mercado-card__body">
          <p className="mercado-card__name">{item.nombre}</p>
          {item.descripcion && (
            <p className="mercado-card__desc">{item.descripcion}</p>
          )}
          <div className="mercado-card__footer">
            <div className="mercado-card__price">
              <span className="mercado-card__price-dot" />
              {item.precio} PP
            </div>
            {isEquipped ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
                <span className="mercado-card__btn mercado-card__btn--equipped" style={{ cursor: 'default' }}>Equipado</span>
                <button type="button" className="mercado-card__btn mercado-card__btn--unequip" onClick={handleUnequip}>
                  Desequipar
                </button>
              </div>
            ) : isOwned ? (
              <button type="button" className="mercado-card__btn mercado-card__btn--equip" onClick={handleEquip}>
                Equipar
              </button>
            ) : (
              <button
                type="button"
                className="mercado-card__btn mercado-card__btn--buy"
                onClick={() => setShowModal(true)}
              >
                Comprar
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <PurchaseConfirmModal
          item={item}
          balance={balance}
          onConfirm={handleBuy}
          onCancel={() => setShowModal(false)}
          loading={buying}
        />
      )}
    </>
  )
}
