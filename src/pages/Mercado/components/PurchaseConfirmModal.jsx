export default function PurchaseConfirmModal({ item, balance, onConfirm, onCancel, loading }) {
  const canAfford = balance >= item.precio

  return (
    <div className="mercado-modal__overlay" onClick={onCancel}>
      <div className="mercado-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="mercado-modal__title">Confirmar compra</h2>
        <p className="mercado-modal__body">
          ¿Deseas comprar <strong>{item.nombre}</strong>?
        </p>
        <div className="mercado-modal__cost">
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--acn-gradient)',
              display: 'inline-block',
            }}
          />
          {item.precio} PP
        </div>
        {!canAfford && (
          <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>
            Saldo insuficiente. Necesitas {item.precio - balance} PP más.
          </p>
        )}
        <div className="mercado-modal__actions">
          <button type="button" className="mercado-modal__cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className="mercado-modal__confirm"
            onClick={onConfirm}
            disabled={!canAfford || loading}
          >
            {loading ? 'Comprando…' : 'Comprar'}
          </button>
        </div>
      </div>
    </div>
  )
}
