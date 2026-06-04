import React from 'react'
import { useState } from 'react';
import './EstacionamientoForms.css';
import DateStrip from './DateStrip';
import TimeSelector from './TimeSelector';

const ZONES = [
  { id: 1, nombre: "Zona 1", disponibles: 0, total: 0, colorClass: "dotZona1", badgeClass: "badgeZona1" },
  { id: 2, nombre: "Zona 2", disponibles: 0, total: 0, colorClass: "dotZona2", badgeClass: "badgeZona2" },
  { id: 3, nombre: "Zona 3", disponibles: 0, total: 0, colorClass: "dotZona3", badgeClass: "badgeZona3" },
];

const EstacionamientoForms = () => {
  const [reservationData, setReservationData] = useState({
    mail: '',
    fechaReserva: new Date(),
    horaInicio: '00:00',
    horaSalida: '00:00',
    fechaCreacion: new Date(),
    tipoReserva: 'ESTACIONAMIENTO',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (patch) => {
    setReservationData(prev => ({ ...prev , ...patch}));
  };

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
            <DateStrip value={reservationData.fechaReserva} onChange={(date) => handleChange({fechaReserva: date})}></DateStrip>
          </div>
        </div>
 
        <div className="fieldGroup">
          <label className="fieldLabel" htmlFor="hora">
            Tiempo de reserva
          </label>
          <p className="fieldSublabel">Hora estimada de llegada y salida</p>
          <div className="inputWrapper">
            <TimeSelector horaInicio={reservationData.horaInicio} horaSalida={reservationData.horaSalida} onTimeChange={(inicio, fin) => handleChange({horaInicio: inicio, horaSalida: fin})}></TimeSelector>
          </div>
        </div>
 
        <div className="fieldGroup">
          <label className="fieldLabel" htmlFor="correo">
            Correo del responsable
          </label>
          <div className="inputWrapper">
            <span className="inputIcon">✉️</span>
            <input
              id="correo"
              type="email"
              placeholder="ejemplo@correo.com"
              className="input inputWithIcon"
              value={reservationData.mail}
              onChange={(e) => handleChange({mail: e.target.value})}
            />
          </div>
        </div>
          <button
            className="confirm-btn"
            onClick={""}
            disabled={loading}
          >
            {loading ? (<p> Confirmando reserva... </p>) : (<p> Confirmar </p>)}
          </button>
      </div>
 
      <div className="panel panelRight">
        <div>
          <p className="availabilityTitle">Disponibilidad de zonas</p>
          <p className="availabilitySubtitle">Actualizado en tiempo real</p>
        </div>
 
        <div className="zonesCard">
          {ZONES.map((zona, idx) => (
            <div key={zona.id}>
              <div className="zoneRow">
                <div className="zoneName">
                  <span className={`$"zoneDot} ${zona.colorClass}`} />
                  {zona.nombre}
                </div>
                <span className={`$"zoneBadge} ${zona.badgeClass}`}>
                  {zona.disponibles} / {zona.total}
                </span>
              </div>
              {idx < ZONES.length - 1 && <div className="zoneDivider" style={{ marginTop: 12 }} />}
            </div>
          ))}
        </div>
 
        <p className="legendNote">ℹ️ Disponibles / Total por zona</p>
      </div>
    </div>
  );
}

export default EstacionamientoForms