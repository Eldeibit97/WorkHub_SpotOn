import React, { useState } from 'react';
import '../../styles/crear_reservacion.css';
import EstacionamientoForms from './EstacionamientoForms';
import OficinasForms from './OficinasForms';
import Confirmacion from './Confirmacion';
 
const CrearReservacion = () => {
  const [activeTab, setActiveTab] = useState('parking');
  const [currentScreen, setCurrentScreen] = useState('reservation');
  
  const getCurrentDate = () => {
    const today = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    
    const dayName = days[today.getDay()];
    const monthName = months[today.getMonth()];
    const day = today.getDate();
    const year = today.getFullYear();
    
    return `${dayName}, ${monthName} ${String(day).padStart(2, '0')} of ${year}`;
  };
 
  const [reservationData, setReservationData] = useState({
    date: getCurrentDate(),
    startTime: '08:00',
    endTime: '13:00',
    floor: '3rd floor',
    location: 'SIERRA MADRE - ICSJ-3040',
    email: 'pedrosanchez@gmail.com',
    parkingLot: 'South Parking Lot',
    level: '2nd Floor',
    reservationId: 'PK-23941'
  });
 
  const handleConfirm = () => {
    setCurrentScreen('confirmed');
  };
 
  const handleBack = () => {
    setCurrentScreen('reservation');
  };
 
  const handleReserveAgain = () => {
    setCurrentScreen('reservation');
  };
 
  const renderScreen = () => {
    if (currentScreen === 'reservation') {
      return activeTab === 'parking' ? 
        <EstacionamientoForms 
          onConfirm={handleConfirm}
          reservationData={reservationData}
          setReservationData={setReservationData}
        /> : 
        <OficinasForms 
          onConfirm={handleConfirm}
          reservationData={reservationData}
          setReservationData={setReservationData}
        />;
    } else {
      return <Confirmacion 
        onBack={handleBack}
        onReserveAgain={handleReserveAgain}
        reservationData={reservationData}
        type={activeTab}
      />;
    }
  };
 
  return (
    <div className="reservation-container">
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
 
        body {
          margin: 0;
          padding: 0;
        }
 
        .reservation-container {
          background: linear-gradient(135deg, #0f1419 0%, #1a0b2e 50%, #2d1b4e 100%);
          min-height: 100vh;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          padding: 20px;
        }
 
        .nav-tabs-custom {
          border: none;
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          justify-content: center;
        }
 
        .nav-link {
          background: transparent;
          border: none;
          color: #666;
          font-size: 24px;
          font-weight: 500;
          padding: 10px 20px;
          transition: all 0.3s;
          cursor: pointer;
        }
 
        .nav-link.active {
          color: white;
          border-bottom: 2px solid #a855f7;
        }
 
        .nav-link:hover {
          color: #999;
        }
 
        .time-display {
          font-size: 32px;
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
      `}</style>
 
      {currentScreen === 'reservation' && (
        <div className="nav-tabs-custom">
          <div 
            className={`nav-link ${activeTab === 'parking' ? 'active' : ''}`}
            onClick={() => setActiveTab('parking')}
          >
            Parking
          </div>
          <div 
            className={`nav-link ${activeTab === 'workplace' ? 'active' : ''}`}
            onClick={() => setActiveTab('workplace')}
          >
            Workplace
          </div>
        </div>
      )}
 
      <div className="time-display">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2"/>
          <path d="M12 6v6l4 2" strokeWidth="2"/>
        </svg>
        {new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })}
      </div>
 
      {renderScreen()}
    </div>
  );
}

export default CrearReservacion