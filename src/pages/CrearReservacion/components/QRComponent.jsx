import React from 'react'
import QRCode from 'react-qr-code'
import './QRComponent.css'

const QRComponent = ({reservationId}) => {
  // Generar URL que incluya el login + reservaId como parámetro
  const loginUrl = `${window.location.origin}/login/detalles/${reservationId}`
  
  return (
    <div className='QRContainer'>
      <h2 className='QR-title' >QR de tu reserva</h2>
      <QRCode value={loginUrl} fgColor={"#a100ff"} className='QRCode'/>
      <p className='description-text'>Asegurate de mostrarle el QR al guardia al momento de llegar</p>
    </div>
  )
}

export default QRComponent
