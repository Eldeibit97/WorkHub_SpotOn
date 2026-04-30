import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservar } from '../../api/reserve';
import './CrearReservacion.css';
import TimerDisplay from './components/TimerDisplay';
import EstacionamientoForms from './components/EstacionamientoForms';
import OficinasForms from './components/OficinasForms';

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

  const handleConfirm = async (data) =>{
    //reservar(data)
    //navigate('/confirmacion', {state: data})
    try {
      const response = await reservar(data);
      
      if (response.ok || response.status === 200 || response.status === 201) {
        navigate('/confirmacion', { state: data });
      } else {
        const errorMessage = await response.text();
        navigate('/error', { 
          state: { 
            statusCode: response.status,
            message: errorMessage,
            reservationData: data
          } 
        });
      }
    } catch (error) {
      navigate('/error', { 
        state: { 
          statusCode: error.response?.status || 500,
          message: error.message || 'Network error occurred',
          reservationData: data
        } 
      });
    }
  }

  const renderForm = () => {
    return activeTab === 'parking'
    ? <EstacionamientoForms currentDate={ formatDate(getCurrentDate())} dateData={getCurrentDate()} onConfirm={handleConfirm}/>
    : <OficinasForms currentDate={ formatDate(getCurrentDate()) } dateData={getCurrentDate()} onConfirm={handleConfirm}/>;
  };

  return (
    <div className="reservation-container">
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