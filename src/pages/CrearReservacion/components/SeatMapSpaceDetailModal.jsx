import './SeatMapModals.css'

export default function SeatMapSpaceDetailModal({
  space,
  scheduleLoading,
  spaceSchedule,
  horaInicio,
  horaFin,
  availabilityState,
  tipoLabel,
  onClose,
}) {
  if (!space) return null

  const stateLower = (availabilityState || 'DISPONIBLE').toLowerCase()

  return (
    <div
      className="export-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="export-modal__panel space-detail-modal">
        <div className="export-modal__header">
          <div>
            <h3 className="space-detail-modal__title">{space.codigo}</h3>
            <p className="space-detail-modal__subtitle">{tipoLabel}</p>
          </div>
          <button type="button" className="export-modal__close" onClick={onClose}>×</button>
        </div>

        <div className="space-detail-modal__current">
          <span className="space-detail-modal__label">Horario seleccionado</span>
          <span className="space-detail-modal__range">{horaInicio} – {horaFin}</span>
          <span className={`seat-tooltip__state seat-tooltip__state--${stateLower}`}>
            {availabilityState || 'DISPONIBLE'}
          </span>
        </div>

        <div className="space-detail-modal__schedule">
          <span className="space-detail-modal__label">Horario del día</span>
          {scheduleLoading && <p className="space-detail-modal__loading">Cargando horario…</p>}
          {!scheduleLoading && spaceSchedule && Array.isArray(spaceSchedule.bloques) && spaceSchedule.bloques.length > 0 && (
            <div className="space-detail-modal__blocks">
              {spaceSchedule.bloques.map((b, i) => (
                <div key={i} className={`space-detail-modal__block space-detail-modal__block--${b.estado?.toLowerCase() === 'ocupado' ? 'ocupado' : 'libre'}`}>
                  <span className="space-detail-modal__block-time">{b.inicio} – {b.fin}</span>
                  <span className="space-detail-modal__block-state">{b.estado}</span>
                </div>
              ))}
            </div>
          )}
          {!scheduleLoading && !spaceSchedule && (
            <p className="space-detail-modal__no-data">Sin datos de horario detallado disponibles</p>
          )}
        </div>

        <div className="export-modal__actions">
          <button type="button" className="wiz-btn wiz-btn--primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
