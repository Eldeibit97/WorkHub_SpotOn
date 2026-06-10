import React from 'react'
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { toMinutes } from '../../../lib/dateFormat';
import './EstacionamientoForms.css';
import { useParkingCapacidad } from '../../../hooks/useParkingCapacity';
import DateStrip from './DateStrip';
import TimeSelector from './TimeSelector';

// Configuración de estilos para las zonas
const ZONE_STYLES = {
  9: { colorClass: "dotZona1", badgeClass: "badgeZona1" },
  10: { colorClass: "dotZona2", badgeClass: "badgeZona2" },
  8: { colorClass: "dotZona3", badgeClass: "badgeZona3" },
};

const startData = {
  mail: '',
  fechaReserva: new Date(),
  horaInicio: '00:00',
  horaSalida: '00:00',
  fechaCreacion: new Date(),
  tipoReserva: 'ESTACIONAMIENTO'
};

const EstacionamientoForms = ({ onConfirm }) => {
  const [reservationData, setReservationData] = useState(startData);
  const [allowConfirm, setAllowConfirm] = useState(false);
  const [timesError, setTimesError] = useState(false);
  const [reservaError, setReservaError] = useState(null);

  // Hook para obtener capacidad de zonas en tiempo real y función de reservación
  const {
    zonas,
    loading: loadingCapacity,
    error: errorCapacity,
    reservar,
    reservando
  } = useParkingCapacidad({
    fecha: reservationData.fechaReserva.toISOString().split('T')[0],
    horaInicio: reservationData.horaInicio,
    horaFin: reservationData.horaSalida
  });

  const handleChange = (patch) => {
    setReservationData(prev => ({ ...prev, ...patch }));
  };

  // Manejo de la confirmación: primero reserva via API, luego notifica al componente padre
  const handleConfirm = async () => {
    try {
      setReservaError(null);
      
      // Usar la función reservar del hook
      const resultado = await reservar(reservationData);
      console.log('Resultado API:', resultado);

      // Si hubo error en la reservación
      if (!resultado.ok) {
        setReservaError(resultado.error || 'Error al realizar la reservación');
        return;
      }
      onConfirm(resultado.data);
    } catch (error) {
      setReservaError(error.message || 'Error inesperado al realizar la reservación');
    }
  };

  useEffect(() => {
    if (toMinutes(reservationData.horaInicio) >= toMinutes(reservationData.horaSalida) && !(reservationData.horaInicio === '00:00' && reservationData.horaSalida === '00:00')) {
      setTimesError(true);
      return;
    }
    setTimesError(false);
  }, [reservationData.horaInicio, reservationData.horaSalida]);

  const emailRegex = /^[a-z0-9._]+@[a-z]+\.[a-z]{3,6}$/i;
  useEffect(() => {
    if (emailRegex.test(reservationData.mail) && (reservationData.horaInicio !== '00:00' && reservationData.horaSalida !== '00:00')) {
      setAllowConfirm(true);
    } else {
      setAllowConfirm(false);
    };
  }, [reservationData.mail, reservationData.horaInicio, reservationData.horaSalida]);

  return (
    <div className="main-layout">
      <div className="panel panelLeft">
        <p className="panelTitle">Nueva reserva de estacionamiento</p>

        <div className="fieldGroup">
          <label className="fieldLabel" htmlFor="fecha">
            Fecha de reserva
          </label>
          <p className="fieldSublabel">Selecciona el dia ha reservar</p>
          <div className="inputWrapper">
            <DateStrip value={reservationData.fechaReserva} onChange={(date) => handleChange({ fechaReserva: date })}></DateStrip>
          </div>
        </div>
        <div className="fieldGroup">
          <label className="fieldLabel" htmlFor="hora">
            Tiempo de reserva
          </label>
          {timesError ? <p className='error-text'> La hora de llegada a la reserva no puede ser antes o igual a la hora de salida</p> : ''}
          <p className="fieldSublabel">Hora estimada de llegada y salida</p>
          <div className="inputWrapper">
            <TimeSelector horaInicio={reservationData.horaInicio} horaSalida={reservationData.horaSalida} onTimeChange={(inicio, fin) => handleChange({ horaInicio: inicio, horaSalida: fin })}></TimeSelector>
          </div>
        </div>

        <div className="fieldGroup">
          <label className="fieldLabel" htmlFor="correo">
            Correo del responsable
          </label>
          <div className="inputWrapper">
            <input
              id="correo"
              type="email"
              placeholder="ejemplo@correo.com"
              className="input"
              value={reservationData.mail}
              onChange={(e) => handleChange({ mail: e.target.value })}
            />
          </div>
        </div>

        {reservaError && <p className='error-text'>{reservaError}</p>}

        <button
          className='confirm-btn'
          onClick={handleConfirm}
          disabled={reservando || !allowConfirm || loadingCapacity}
        >
          {reservando ? (<p>Confirmando reserva...</p>) : (<p>Confirmar</p>)}
        </button>
      </div>

      <div className="panel panelRight">
        <div>
          <p className="availabilityTitle">Disponibilidad de zonas</p>
          <p className="availabilitySubtitle">Actualizado en tiempo real</p>
        </div>

        {errorCapacity && <p className='error-text'>{errorCapacity}</p>}
        {loadingCapacity && <p>Cargando disponibilidad...</p>}

        <div className="zonesCard">
          {zonas.map((zona, idx) => {
            const styles = ZONE_STYLES[zona.id_zona] || { colorClass: '', badgeClass: '' };
            return (
              <div key={zona.id_zona}>
                <div className="zoneRow">
                  <div className="zoneName">
                    <span className={`zoneDot ${styles.colorClass}`} />
                    {zona.nombre_zona}
                  </div>
                  <span className={`zoneBadge ${styles.badgeClass}`}>
                    {zona.disponibles} / {zona.total}
                  </span>
                </div>
                {idx < zonas.length - 1 && <div className="zoneDivider" style={{ marginTop: 12 }} />}
              </div>
            );
          })}
        </div>
        <p className="legendNote">ℹ️ Disponibles / Total por zona</p>
      </div>
    </div>
  );
}

export default EstacionamientoForms