import React from 'react'
import { useState, useCallback } from 'react'
import { reservarEstacionamiento } from '../../../api/reserve'
import EstacionamientoForms from './EstacionamientoForms'
import EstacionamientoConfirm from './EstacionamientoConfirm'

const EstacionamientoWizard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [data, setData] = useState(null);

  const handleConfirm = useCallback(async (datosReserva) => {
    setLoading(true);
    setError('');
    try {
      const response = await reservarEstacionamiento(datosReserva);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.log(error);
      setError('Ocurrio un error al intentar realizar la reserva, vuelva a intentarlo porfavor');
      setConfirmed(false);
      setLoading(false);
      return;
    }
    setConfirmed(true);
    setLoading(false);
  });

  const onBack = useCallback(() => {
    setData(null);
    setConfirmed(false);
  });

  return (
    <div>
      {loading ?
        <div> Realizando la reserva </div>
        : ( confirmed ? <EstacionamientoConfirm onHome={onBack} data={data}/> : <EstacionamientoForms onConfirm={handleConfirm}/>)
      }
    </div>
  )
}

export default EstacionamientoWizard