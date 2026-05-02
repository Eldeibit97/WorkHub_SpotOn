import React from 'react';
import './Sugerencias.css';

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
    <div className='page-container'>
      <div className='today-info-container'>
        <p className='greeting'>Buenos dias ...</p>
        <p className='date'>{getCurrentDate()}</p>
      </div>
      <div className='suggestions-container'>
        <div className="info-box">
          <p> Aqui se mostrara el mapa que utilizara la ubicacion del usuario para darle sugerencias de ruta</p>
        </div>
        <div className="info-box">
          <p className='info-box-title'>Sobre tu ruta...</p>
          <p className='info-box-text'>ETA </p>
          <p> Al realizar la conexion con el servicio de IA que creamos la informacion se desplegara aqui</p>
        </div>
        <div className="info-box">
          <p className='info-box-title'>Sugerencias para tu salida</p>
          <p> Al realizar la conexion con el servicio de IA que creamos la informacion se desplegara aqui</p>
        </div>
      </div>
    </div>
  )
}

export default Sugerencias