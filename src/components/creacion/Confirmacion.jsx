import React from 'react'
import '../../styles/confirmacion.css';
 
const Confirmacion = ({ onBack, onReserveAgain, reservationData, type }) => {
  return (
    <div className="confirmation-container">
      <div className="confirmation-header">
        <button className="back-btn" onClick={onBack}>
          ← Back Home
        </button>
        <button className="reserve-again-btn" onClick={onReserveAgain}>
          Reserve {type === 'parking' ? 'Parking' : 'Workplace'} →
        </button>
      </div>
 
      <h1 className="confirmation-title">Reservation Confirmed</h1>
 
      <div className="success-icon">
        ✓
      </div>
 
      <p className="confirmation-message">
        Your {type === 'parking' ? 'parking spot' : 'workspace'} has been successfully reserved.
      </p>
 
      <p className="confirmation-date">
        {reservationData.date.split(',')[0].charAt(0).toUpperCase() + 
         reservationData.date.split(',')[0].slice(1) + 
         ', ' + 
         reservationData.date.split(',')[1].trim().split(' ')[0] + ' ' +
         reservationData.date.split(',')[1].trim().split(' ')[1]}
      </p>
 
      <div className="details-card">
        <div style={{gridColumn: '1 / -1'}}>
          <div className="detail-item">
            <div className="detail-label">{type === 'parking' ? 'Parking Lot' : 'Location'}</div>
            <div className="detail-value">
              {type === 'parking' ? reservationData.parkingLot : reservationData.location}
            </div>
          </div>
        </div>
 
        <div className="detail-item">
          <div className="detail-label">Level</div>
          <div className="detail-value">{type === 'parking' ? reservationData.level : reservationData.floor}</div>
        </div>
 
        <div className="detail-item">
          <div className="detail-label">Reservation ID</div>
          <div className="detail-value">{reservationData.reservationId}</div>
        </div>
 
        {type === 'parking' && (
          <div className="map-preview" style={{gridColumn: '1 / -1'}}>
            <div className="detail-label">Location</div>
            <div style={{
              width: '100%',
              height: '150px',
              background: 'rgba(168, 85, 247, 0.1)',
              borderRadius: '12px',
              margin: '10px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}>
              Map Preview
            </div>
            <button className="open-maps-btn">Open in Maps</button>
          </div>
        )}
      </div>
 
      <div className="action-buttons">
        <button className="modify-btn">Modify reservation</button>
        <button className="cancel-btn">Cancel reservation</button>
      </div>
    </div>
  );
}

export default Confirmacion