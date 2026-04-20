import React from 'react'
import './sugerencias.css'

const Sugerencias = () => {
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

  return (
    <>
      <div className='today-info-container'>
        <p className='greeting'>Buenos dias ...</p>
        <p className='date'>{getCurrentDate()}</p>
      </div>
      <div className='suggestions-container'>
        <div className="info-box"></div>
        <div className="info-box">
          <p className='info-box-title'>Sobre tu ruta...</p>
          <p className='info-box-text'>ETA </p>
        </div>
        <div className="info-box">
          <p className='info-box-title'>Sugerencias</p>
        </div>
      </div>
      <button className='reserve-button'> Reservar lugar → </button>
    </>
  )
}

export default Sugerencias