import React, { useState } from 'react';
import '../../styles/crear_reservacion.css';
import TimerDisplay from './TimerDisplay';
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
    email: '',
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
      <TimerDisplay></TimerDisplay>
      {renderScreen()}
    </div>
  );
}

export default CrearReservacion