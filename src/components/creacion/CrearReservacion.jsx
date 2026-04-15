import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AccentureLogo from '../AccentureLogo';
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
      <header className="reservation-top-bar">
        <Link to="/home" className="reservation-top-bar-logo" aria-label="Inicio">
          <AccentureLogo size="small" />
        </Link>
        <Link to="/home" className="reservation-back-link">
          ← Back
        </Link>
      </header>
      <div className="nav-tabs-custom">
        <div
          className={`nav-link-sections ${activeTab === 'parking' ? 'active' : ''}`}
          onClick={() => setActiveTab('parking')}
        >
          Parking
        </div>
        <div
          className={`nav-link-sections ${activeTab === 'workplace' ? 'active' : ''}`}
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