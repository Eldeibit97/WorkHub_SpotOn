import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/crear_reservacion.css';
import TimerDisplay from './TimerDisplay';
import EstacionamientoForms from './EstacionamientoForms';
import OficinasForms from './OficinasForms';

const CrearReservacion = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('parking');

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

  const handleConfirm = (data) =>{
    navigate('/confirmacion', {state: data})
  }

  const renderForm = () => {
    return activeTab === 'parking' 
    ? <EstacionamientoForms currentDate={ getCurrentDate()} onConfirm={handleConfirm}/>
    : <OficinasForms currentDate={ getCurrentDate() } onConfirm={handleConfirm}/>;
  };

  return (
    <div className="reservation-container">
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
      <TimerDisplay></TimerDisplay>
      {renderForm()}
    </div>
  );
}

export default CrearReservacion