import React, { useEffect } from 'react';

export default function ReservationDetailModal({ reservation, onClose }) {

  useEffect(() => {
    const handleKeyDown = (e) => { 
      if (e.key === 'Escape') onClose(); 
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleModalClick = (e) => e.stopPropagation();

  // Reutilizamos la lógica matemática para saber si es Hoy, Próximo o Pasado
  const getTimeLogic = (isoDateString) => {
    if (!isoDateString || isoDateString.includes('undefined')) return { status: null };
    
    const resDate = new Date(isoDateString);
    const today = new Date();
    
    const resDateOnly = new Date(resDate);
    const todayOnly = new Date(today);
    resDateOnly.setHours(0, 0, 0, 0);
    todayOnly.setHours(0, 0, 0, 0);

    const diffTimeDays = resDateOnly - todayOnly;
    const diffDays = Math.ceil(diffTimeDays / (1000 * 60 * 60 * 24));

    let statusData = { text: 'Pasado', color: '#a4b0be' }; // Gris
    if (diffDays === 0) statusData = { text: 'Hoy', color: '#2ed573' }; // Verde
    else if (diffDays > 0) statusData = { text: 'Próximo', color: '#ffa502' }; // Naranja

    return { status: statusData };
  };

  if (!reservation) return null;

  const { status } = getTimeLogic(reservation.isoDate);

  // Decidimos el texto y el color final del estado
  let finalStatusText = 'Desconocido';
  let finalStatusColor = 'var(--text-main)';

  if (reservation.estado_reserva === 'COMPLETADO') {
    finalStatusText = 'Completado';
    finalStatusColor = '#a4b0be'; // Gris
  } else if (reservation.estado_reserva === 'CHECKED_IN') {
    finalStatusText = 'Check-in Realizado';
    finalStatusColor = '#2ed573'; // Verde
  } else if (status) {
    finalStatusText = status.text;
    finalStatusColor = status.color;
  }

  // Coloreamos los íconos (relojito, calendario, ubicación) del mismo color que el estatus
  const getIconColor = (estado) => {
    if (estado === 'CHECKED_IN') return '#2ed573';
    if (estado === 'COMPLETADO' || status?.text === 'Pasado') return '#a4b0be';
    if (status?.text === 'Próximo') return '#ffa502';
    if (status?.text === 'Hoy') return '#2ed573';
    return 'var(--accent-purple)';
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content detail-modal" onClick={handleModalClick}>
        
        <button className="btn-close-modal" onClick={onClose} aria-label="Cerrar">✕</button>
        <h3 className="modal-title">Detalles de la Reserva</h3>

        <div className="detail-data-content">
          <div className="step3__type-pill" style={{ marginBottom: '15px' }}>
            Estado actual: <strong style={{ color: finalStatusColor }}>{finalStatusText}</strong>
          </div>

          <section className="step3__section">
            <div className="step3__section-head"><h3>Cuándo</h3></div>
            <div className="step3__row">
              <div className="step3__row-icon" aria-hidden="true" style={{ color: getIconColor(reservation.estado_reserva) }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div>
                <div className="step3__row-label">Fecha</div>
                <div className="step3__row-value">{reservation.date}</div> 
              </div>
            </div>
            <div className="step3__row">
              <div className="step3__row-icon" aria-hidden="true" style={{ color: getIconColor(reservation.estado_reserva) }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <div className="step3__row-label">Horario</div>
                <div className="step3__row-value">{reservation.time}</div>
              </div>
            </div>
          </section>

          <section className="step3__section">
            <div className="step3__section-head"><h3>Dónde</h3></div>
            <div className="step3__row">
              <div className="step3__row-icon" aria-hidden="true" style={{ color: getIconColor(reservation.estado_reserva) }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5"/><path d="M5 9.5V21h14V9.5"/></svg>
              </div>
              <div>
                <div className="step3__row-label">Espacio</div>
                <div className="step3__row-value">{reservation.details} ({reservation.location})</div>
              </div>
            </div>
          </section>
        </div>
        
      </div>
    </div>
  );
}