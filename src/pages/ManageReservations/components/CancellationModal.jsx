import React from 'react';

export default function CancellationModal({ reservation, onClose, onConfirm }) {
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={handleModalClick}>
        <h3 className="modal-title">¿Confirmar Cancelación?</h3>
        
        <p className="modal-warning">
          Estás a punto de cancelar la siguiente reservación. Esta acción no se puede deshacer.
        </p>

        <div className="modal-reservation-summary">
          <p><strong>Tipo:</strong> {reservation.type}</p>
          <p><strong>Fecha:</strong> {reservation.date}</p>
          <p><strong>Lugar:</strong> {reservation.location} ({reservation.details})</p>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            No, Regresar
          </button>
          <button className="btn-primary-danger" onClick={onConfirm}>
            Sí, Confirmar Cancelación
          </button>
        </div>
      </div>
    </div>
  );
}