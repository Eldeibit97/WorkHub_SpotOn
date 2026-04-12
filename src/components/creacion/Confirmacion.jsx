import React from 'react'
import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import '../../styles/confirmacion.css';

const Confirmacion = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const reservationData = location.state;

  useEffect(() => {
    if (!reservationData) {
      navigate('/');
    }
  }, [reservationData, navigate]);

  return (
    <div className='reservation-container'>
      <div className="confirmation-container">
        <div className="confirmation-header">
          <Link to='/' className="back-btn">
            ← Back Home
          </Link>
          <h1 className="confirmation-title">Reservation Confirmed</h1>
          <Link to='/reservar' className="reserve-again-btn">
            Reserve {reservationData.type === 'parking' ? 'Workplace' : 'Parking'} →
          </Link>
        </div>

        <div className="success-icon">
          ✓
        </div>

        <p className="confirmation-message">
          Your {reservationData.type === 'parking' ? 'parking spot' : 'workspace'} has been successfully reserved.
        </p>

        <p className="confirmation-date">
          {reservationData.date.split(',')[0].charAt(0).toUpperCase() +
            reservationData.date.split(',')[0].slice(1) +
            ', ' +
            reservationData.date.split(',')[1].trim().split(' ')[0] + ' ' +
            reservationData.date.split(',')[1].trim().split(' ')[1]}
        </p>

        <div className="details-card">
          <div className="detail-item">
            <div className="detail-label">Booker</div>
            <div className="detail-value">{reservationData.email}</div>
          </div>

          <div className="detail-item">
            <div className="detail-label">Reservation ID</div>
            <div className="detail-value">{reservationData.reservationId}</div>
          </div>

          <div className="detail-item">
            <div className="detail-label">{reservationData.type === 'parking' ? 'Parking Lot' : 'Location'}</div>
            <div className="detail-value">
              {reservationData.type === 'parking' ? reservationData.parkingLot : reservationData.location}
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-label">{reservationData.type === 'parking' ? 'Level' : 'Floor'}</div>
            <div className="detail-value">{reservationData.type === 'parking' ? reservationData.level : reservationData.floor}</div>
          </div>

          {reservationData.type === 'parking' && (
            <div className="map-preview" style={{ gridColumn: '1 / -1' }}>
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
          <Link to='/cancelar' className="cancel-btn">Cancel reservation</Link>
        </div>
      </div>
    </div>
  );
}

export default Confirmacion