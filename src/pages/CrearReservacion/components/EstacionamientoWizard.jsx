import React, { useEffect } from 'react'
import { useState, useCallback } from 'react'
import EstacionamientoForms from './EstacionamientoForms'
import EstacionamientoConfirm from './EstacionamientoConfirm'

const EstacionamientoWizard = () => {
  const [confirmed, setConfirmed] = useState(false);
  const [reservationData, setReservationData] = useState(null);

  // Recibe datos ya reservados desde EstacionamientoForms
  // La reservación ya se hizo en el hook useParkingCapacidad
  const handleConfirm = useCallback((datosReserva) => {
    // datosReserva contiene: mail, fechaReserva, horaInicio, horaSalida, id_reserva, etc.
    console.log('✅ Datos recibidos en Wizard:', datosReserva);
    // Nota: setReservationData es asincrónico, el estado se actualiza en el siguiente render
    // Por eso primero guardamos los datos y luego cambiamos de vista
    setReservationData(datosReserva);
  });

  useEffect(() => {
    if (reservationData === null){
      return;
    }
    setConfirmed(true);
  }, [reservationData])

  const onBack = useCallback(() => {
    setReservationData(null);
    setConfirmed(false);
  });

  return (
    <div>
      {confirmed ? 
        <EstacionamientoConfirm onHome={onBack} data={reservationData} /> 
        : 
        <EstacionamientoForms onConfirm={handleConfirm} />
      }
    </div>
  )
}

export default EstacionamientoWizard