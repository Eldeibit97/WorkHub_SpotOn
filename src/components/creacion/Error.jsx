import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './error.css';

const Error = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const errorData = location.state;

  React.useEffect(() => {
    if (!errorData) {
      navigate('/home');
    }
  }, [errorData, navigate]);

  if (!errorData) {
    return null;
  }

  // Mensajes de error personalizados según el código HTTP
  const getErrorMessage = (statusCode) => {
    const messages = {
      400: 'The reservation data provided is invalid. Please check your information and try again.',
      401: 'You are not authorized to make this reservation. Please log in and try again.',
      403: 'Access denied. You do not have permission to make this reservation.',
      404: 'The requested resource was not found. The parking spot or workspace may no longer be available.',
      409: 'This spot is already reserved for the selected time. Please choose a different time or location.',
      422: 'The reservation cannot be processed. Please verify all required fields are filled correctly.',
      500: 'An internal server error occurred. Please try again later.',
      503: 'The reservation service is temporarily unavailable. Please try again in a few moments.',
      default: 'An unexpected error occurred while processing your reservation. Please try again.'
    };

    return messages[statusCode] || messages.default;
  };

  const getErrorTitle = (statusCode) => {
    if (statusCode >= 500) return 'Server Error';
    if (statusCode === 409) return 'Spot Already Reserved';
    if (statusCode >= 400) return 'Reservation Failed';
    return 'Error';
  };

  const handleRetry = () => {
    // Regresar a la página de reservación con los datos previos si existen
    navigate('/reservar', { 
      state: errorData.reservationData 
    });
  };

  return (
    <div className='reservation-container'>
      <div className="error-container">
        <div className="error-header">
          <Link to='/home' className="back-btn">
            ← Back Home
          </Link>
        </div>

        <h1 className="error-title">{getErrorTitle(errorData.statusCode)}</h1>

        <div className="error-icon">
          ✕
        </div>

        <p className="error-message">
          {getErrorMessage(errorData.statusCode)}
        </p>

        {errorData.statusCode && (
          <p className="error-code">Error Code: {errorData.statusCode}</p>
        )}

        {errorData.message && (
          <div className="error-details-card">
            <div className="error-detail-label">Technical Details:</div>
            <div className="error-detail-value">{errorData.message}</div>
          </div>
        )}

        {errorData.reservationData && (
          <div className="attempted-reservation-card">
            <h3>Attempted Reservation Details</h3>
            <div className="detail-item">
              <div className="detail-label">Type</div>
              <div className="detail-value">
                {errorData.reservationData.tipoReserva === 'parking' ? 'Parking' : 'Workplace'}
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Date</div>
              <div className="detail-value">
                {new Date(errorData.reservationData.fechaReserva).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Time</div>
              <div className="detail-value">
                {new Date(errorData.reservationData.horaInicio).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })} - {new Date(errorData.reservationData.horaSalida).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Email</div>
              <div className="detail-value">{errorData.reservationData.mail}</div>
            </div>
          </div>
        )}

        <div className="error-action-buttons">
          <button className="retry-btn" onClick={handleRetry}>
            Try Again
          </button>
          <Link to='/home' className="home-btn">
            Go to Home
          </Link>
          <Link to='/reservar' className="new-reservation-btn">
            New Reservation
          </Link>
        </div>

        <div className="error-help-section">
          <p className="help-text">
            If this problem persists, please contact support at{' '}
            <a href="mailto:support@accenture.com">support@accenture.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Error;