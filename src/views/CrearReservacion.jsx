import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reservar } from '../api/reserve';
import AccentureLogo from '../components/AccentureLogo';
import './crear_reservacion.css';
import TimerDisplay from '../components/creacion/TimerDisplay';
import EstacionamientoForms from '../components/creacion/EstacionamientoForms';
import OficinasForms from '../components/creacion/OficinasForms';

const CrearReservacion = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('parking');

  const getCurrentDate = () => {
    const today = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    const dayName = days[today.getDay()];
    const monthName = months[today.getMonth()];

    return {
      dayName: dayName,
      monthName: monthName,
      day: today.getDate(),
      mont: today.getMonth(),
      year: today.getFullYear(),
      dateObj: today
    };
  };

  const formatDate = (dateData) =>{
    return `${dateData.dayName}, ${dateData.monthName} ${String(dateData.dateObj.getDate()).padStart(2, '0')} of ${dateData.dateObj.getFullYear()}`;
  }

  const handleConfirm = (data) =>{
    reservar(data)
    navigate('/confirmacion', {state: data})
  }

  const renderForm = () => {
    return activeTab === 'parking'
    ? <EstacionamientoForms currentDate={ formatDate(getCurrentDate())} dateData={getCurrentDate()} onConfirm={handleConfirm}/>
    : <OficinasForms currentDate={ formatDate(getCurrentDate()) } dateData={getCurrentDate()} onConfirm={handleConfirm}/>;
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