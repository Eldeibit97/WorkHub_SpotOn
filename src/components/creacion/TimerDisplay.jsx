import React from 'react'
import { useState, useEffect } from 'react';

const TimerDisplay = () => {
  const [segundos, setSegundos] = useState(300); // 5 minutos = 300 segundos
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (!activo || segundos <= 0) {
      return undefined;
    }
    const intervalo = setInterval(() => {
      setSegundos((segundosActual) => {
        if (segundosActual <= 1) {
          setActivo(false);
          return 0;
        }
        return segundosActual - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [activo, segundos]);

  // Formatear tiempo como MM:SS
  const formatearTiempo = () => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="time-display">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path d="M12 6v6l4 2" strokeWidth="2" />
        </svg>
        {formatearTiempo(segundos)}
      </div>
    </>
  )
}

export default TimerDisplay