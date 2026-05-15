import './SeatMapModals.css'

export default function SeatMapExpiredModal({ open, onReload }) {
  if (!open) return null

  return (
    <div className="export-modal export-modal--expired" role="alertdialog" aria-modal="true">
      <div className="export-modal__panel expired-modal">
        <div className="expired-modal__icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h3 className="expired-modal__title">Tu tiempo de reserva ha acabado</h3>
        <p className="expired-modal__body">Para continuar con tu reserva necesitas recargar la página e iniciar de nuevo.</p>
        <button type="button" className="wiz-btn wiz-btn--primary expired-modal__reload" onClick={onReload}>
          Recargar página
        </button>
      </div>
    </div>
  )
}
