import './SeatMapModals.css'

export default function SeatMapExportModal({ open, codigoZona, exportPayload, onClose, onCopy }) {
  if (!open) return null

  const zoneFile = (codigoZona || '').toLowerCase()

  return (
    <div className="export-modal" role="dialog" aria-modal="true">
      <div className="export-modal__panel">
        <div className="export-modal__header">
          <h3>Exportar JSON · {codigoZona}</h3>
          <button type="button" className="export-modal__close" onClick={onClose}>×</button>
        </div>
        <p className="export-modal__hint">
          Copia este contenido y pégalo en{' '}
          <code>src/data/floor-maps/{zoneFile}.json</code>.
        </p>
        <textarea className="export-modal__textarea" readOnly value={exportPayload} onFocus={(e) => e.currentTarget.select()} />
        <div className="export-modal__actions">
          <button type="button" className="wiz-btn wiz-btn--ghost" onClick={onClose}>Cerrar</button>
          <button type="button" className="wiz-btn wiz-btn--primary" onClick={onCopy}>Copiar al portapapeles</button>
        </div>
      </div>
    </div>
  )
}
