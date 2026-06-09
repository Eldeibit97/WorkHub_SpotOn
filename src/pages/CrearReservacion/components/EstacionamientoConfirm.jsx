import React from 'react'
import QRComponent from './QRComponent'
import './EstacionamientoConfirm.css'

const EstacionamientoConfirm = ({ onHome, data = {} }) => {
  return (
    <div className='placeholder-container'>
      <div className='reservation-info-container'>
        <div className='svg-container'>
          <div className="confirm-svg">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <h2 className="confirmation-title">¡Reserva confirmada!</h2>
        <p style={{padding: '10px'}}> Porfavor ten encuenta la siguiente información sobre tu asignación.</p>
        <div className='reservation-details-container'>
          <p className="detailsTitle">Detalles de la reserva</p>
          <div className='details-layout'>
            <div className='detail-item'>
              <p className='detail-data-title'> Edificio de Estacionamiento </p>
              <p className='detail-data-text'> {data.edificio ?? 'Cargando...'} </p>
            </div>
            <div className='detail-item'>
              <p className='detail-data-title'> Lugar asignado </p>
              <p className='detail-data-text'> {data.lugarAsignado ?? 'Cargando...'} </p>
            </div>
            <div className='detail-item'>
              <p className='detail-data-title'> Fecha </p>
              <p className='detail-data-text'> {`${data.fechaReserva}` ?? 'No disponible'} </p>
            </div>
            <div className='detail-item'>
              <p className='detail-data-title'> Horario </p>
              <p className='detail-data-text'> {`${data.horaInicio ?? '--'} - ${data.horaSalida ?? '--'}`} </p>
            </div>
            <div className='detail-item'>
              <p className='detail-data-title'> Titular </p>
              <p className='detail-data-text'> {data.mail ?? 'No disponible'} </p>
            </div>
            <div className='detail-item'>
              <p className='detail-data-title'> Placas </p>
              <p className='detail-data-text'> {data.placa ?? 'No disponible'} </p>
            </div>
          </div>
        </div>
        <div className='btn-container'>
          <button 
            type='button'
            onClick={onHome}
            className='to-home-btn btn-primary-placeholder' > 
              Regresar a Home 
          </button>
        </div>
      </div>
      <QRComponent reservationId={'https://www.youtube.com/watch?v=dQw4w9WgXcQ'} />
    </div>
  )
}

export default EstacionamientoConfirm;