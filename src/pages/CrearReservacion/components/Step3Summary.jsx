import { useEffect, useState } from 'react'
import { getFloorMap } from '../../../api/spaces'
import './Step3Summary.css'

const TIPO_LABEL = {
  1: 'Estación de trabajo',
  2: 'Sala de juntas',
  3: 'Phone Booth',
  4: 'Media Scape',
  5: 'Área especial',
}

const TIPO_ICON = {
  1: '💺',
  2: '🪑',
  3: '📞',
  4: '🖥️',
  5: '☕',
}

function formatFecha(d) {
  const date = d instanceof Date ? d : new Date(d)
  return date.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

export default function Step3Summary({
  data,
  tipoReserva,
  bookerName,
  onBack,
  onConfirm,
  submitting,
  error,
}) {
  const [floorMap, setFloorMap] = useState(null)

  useEffect(() => {
    if (!data.zonaId) return
    let cancelled = false
    getFloorMap(data.zonaId).then((m) => { if (!cancelled) setFloorMap(m) })
    return () => { cancelled = true }
  }, [data.zonaId])

  return (
    <div className="step3">
      <header className="step3__header">
        <h2 className="step3__title">Revisa tu reserva</h2>
        <p className="step3__subtitle">
          Verifica que todo esté correcto antes de confirmar.
        </p>
      </header>

      <div className="step3__card">
        <section className="step3__section">
          <div className="step3__section-head">
            <h3>Cuándo</h3>
          </div>
          <div className="step3__row">
            <div className="step3__row-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div className="step3__row-label">Fecha</div>
              <div className="step3__row-value">{formatFecha(data.fecha)}</div>
            </div>
          </div>
          <div className="step3__row">
            <div className="step3__row-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div className="step3__row-label">Horario</div>
              <div className="step3__row-value">{data.horaInicio} → {data.horaFin}</div>
            </div>
          </div>
        </section>

        <section className="step3__section">
          <div className="step3__section-head">
            <h3>Dónde</h3>
          </div>
          <div className="step3__row">
            <div className="step3__row-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5"/><path d="M5 9.5V21h14V9.5"/></svg>
            </div>
            <div>
              <div className="step3__row-label">Piso</div>
              <div className="step3__row-value">
                {floorMap ? `${floorMap.codigoZona} · ${floorMap.nombre}` : '—'}
                {floorMap?.edificio && <span className="step3__edificio"> · {floorMap.edificio}</span>}
              </div>
            </div>
          </div>
        </section>

        <section className="step3__section">
          <div className="step3__section-head">
            <h3>Espacios reservados ({data.selectedSpaces.length})</h3>
          </div>
          <ul className="step3__spaces">
            {data.selectedSpaces.map((sp) => (
              <li key={sp.id_espacio} className="step3__space">
                <span className="step3__space-icon" aria-hidden="true">{TIPO_ICON[sp.tipo] || '📍'}</span>
                <div className="step3__space-meta">
                  <div className="step3__space-codigo">{sp.codigo}</div>
                  <div className="step3__space-nombre">{sp.nombre}</div>
                </div>
                <span className="step3__space-tipo">{TIPO_LABEL[sp.tipo] || `Tipo ${sp.tipo}`}</span>
                <span className="step3__space-assignee">
                  {sp.assigneeMail
                    ? <>Para: <strong>{sp.assigneeMail}</strong></>
                    : <>Para: <strong>{bookerName}</strong></>}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {data.coworkers.length > 0 && (
          <section className="step3__section">
            <div className="step3__section-head">
              <h3>Compañeros añadidos</h3>
            </div>
            <div className="step3__coworkers">
              {data.coworkers.map((c) => (
                <span key={c.email} className="step3__coworker-pill">{c.email}</span>
              ))}
            </div>
          </section>
        )}

        <div className="step3__type-pill">Tipo de reserva: <strong>{tipoReserva}</strong></div>
      </div>

      {error && <div className="step3__error">{error}</div>}

      <div className="wiz-actions">
        <button type="button" className="wiz-btn wiz-btn--ghost" onClick={onBack} disabled={submitting}>
          ← Atrás
        </button>
        <button type="button" className="wiz-btn wiz-btn--primary" onClick={onConfirm} disabled={submitting}>
          {submitting ? 'Confirmando…' : 'Confirmar reserva'}
        </button>
      </div>
    </div>
  )
}
