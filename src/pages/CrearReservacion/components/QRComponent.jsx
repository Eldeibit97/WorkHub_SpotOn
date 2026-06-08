import React from 'react'
import QRCode from 'react-qr-code'
import './QRComponent.css'

const QRComponent = ({reservationId}) => {
  return (
    <div className='QRContainer'>
      <h2 className='QR-title' >QR de tu reserva</h2>
      <QRCode value={``} fgColor={"#a100ff"} className='QRCode'/>
      <p className='description-text'>Asegurate de mostrarle el QR al guardia del estacionamiento al llegar</p>
    </div>
  )
}

export default QRComponent