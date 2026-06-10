import React, { useState } from 'react';
import './CrearReservacion.css';
import ReservationWizard from './components/ReservationWizard';
import EstacionamientoWizard from './components/EstacionamientoWizard';
import workplaceImg from '../../assets/floors/workplace-view.png';
import parkingImg from '../../assets/floors/parking-view.png';
import { liberarEspaciosTemporal } from '../../api/reserve';

const ReservationTypeSelector = ({ onSelect }) => (
  <div className="res-type-selector">
    <div className="res-type-selector__header">
      <h1 className="res-type-selector__title">¿Qué quieres reservar?</h1>
      <p className="res-type-selector__subtitle">Elige el tipo de espacio que necesitas</p>
    </div>
    <div className="res-type-selector__cards">
      <button className="res-type-card" onClick={() => onSelect('workplace')}>
        <span className="res-type-card__img-wrap">
          <img src={workplaceImg} alt="Workplace" className="res-type-card__img" />
        </span>
        <span className="res-type-card__body">
          <span className="res-type-card__title">Workplace</span>
          <span className="res-type-card__desc">Reserva un escritorio, sala o espacio de trabajo en las oficinas</span>
          <span className="res-type-card__cta">Seleccionar →</span>
        </span>
      </button>
      <button className="res-type-card" onClick={() => onSelect('parking')}>
        <span className="res-type-card__img-wrap">
          <img src={parkingImg} alt="Parking" className="res-type-card__img" />
        </span>
        <span className="res-type-card__body">
          <span className="res-type-card__title">Parking</span>
          <span className="res-type-card__desc">Reserva un lugar de estacionamiento en el edificio</span>
          <span className="res-type-card__cta">Seleccionar →</span>
        </span>
      </button>
    </div>
  </div>
);

const CrearReservacion = () => {
  const [view, setView] = useState('selector');

  const getCurrentDate = () => {
    const today = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    return {
      dayName: days[today.getDay()],
      monthName: months[today.getMonth()],
      day: today.getDate(),
      mont: today.getMonth(),
      year: today.getFullYear(),
      dateObj: today,
    };
  };

  return (
    <div className="reservation-container">
      {view === 'selector' && (
        <ReservationTypeSelector onSelect={setView} />
      )}

      {view === 'workplace' && (
        <>
          <button className="res-back-btn" onClick={() => setView('selector')}>
            ← Volver
          </button>
          <ReservationWizard tipoReserva="OFICINA" />
        </>
      )}

      {view === 'parking' && (
        <>
          <button className="res-back-btn" onClick={() => setView('selector')}>
            ← Volver
          </button>
          <EstacionamientoWizard/>
        </>
      )}
    </div>
  );
};

export default CrearReservacion;
