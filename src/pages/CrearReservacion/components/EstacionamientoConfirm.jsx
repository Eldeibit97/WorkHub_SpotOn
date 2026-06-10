import React from 'react'
import QRComponent from './QRComponent'
import { toYyyyMmDd } from '../../../lib/dateFormat'
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
          <p className="detailsTitle">Detalles de la reserva - id reserva {data.id_reserva ?? 'no se obtuvo id'}</p>
          <div className='details-layout'>
            <div className='detail-item'>
              <p className='detail-data-title'> Edificio de Estacionamiento </p>
              <p className='detail-data-text'> {data.descripcion ?? 'Cargando...'} </p>
            </div>
            <div className='detail-item'>
              <p className='detail-data-title'> Lugar asignado </p>
              <p className='detail-data-text'> {data.codigo_espacio ?? 'Cargando...'} </p>
            </div>
            <div className='detail-item'>
              <p className='detail-data-title'> Fecha </p>
              <p className='detail-data-text'> {`${toYyyyMmDd(data.fecha_reserva)}` ?? 'No disponible'} </p>
            </div>
            <div className='detail-item'>
              <p className='detail-data-title'> Horario </p>
              <p className='detail-data-text'> {`${data.hora_inicio ?? '--'} - ${data.hora_fin ?? '--'}`} </p>
            </div>
            <div className='detail-item'>
              <p className='detail-data-title'> Titular </p>
              <p className='detail-data-text'> {data.correo_institucional ?? 'No disponible'} </p>
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
      <QRComponent reservationId={data.id_reserva} />
    </div>
  )
}

export default EstacionamientoConfirm;