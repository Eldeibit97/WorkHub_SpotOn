import './Step4Done.css'

export default function Step4Done({ data, onHome, onAnother }) {
  return (
    <div className="step4">
      <div className="step4__check">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 className="step4__title">¡Reserva confirmada!</h2>
      <p className="step4__subtitle">
        Hemos enviado los detalles a tu correo. También puedes revisarlas en
        “Mis Reservas”.
      </p>

      <div className="step4__card">
        <div className="step4__card-row">
          <span className="step4__card-label">Espacios reservados</span>
          <span className="step4__card-value">{data.selectedSpaces.length}</span>
        </div>
        <ul className="step4__ids">
          {data.createdReservations.map((r) => (
            <li key={r.id_reserva || r.id_espacio}>
              <span className="step4__id-pill">#{r.id_reserva || '—'}</span>
              <span className="step4__id-label">Espacio {r.id_espacio} · {r.estado || 'PENDIENTE'}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="wiz-actions wiz-actions--end">
        <button type="button" className="wiz-btn wiz-btn--ghost" onClick={onAnother}>
          Hacer otra reserva
        </button>
        <button type="button" className="wiz-btn wiz-btn--primary" onClick={onHome}>
          Ir al inicio
        </button>
      </div>
    </div>
  )
}
