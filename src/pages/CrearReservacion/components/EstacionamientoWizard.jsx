import React from 'react'
import { useState, useCallback } from 'react'
import EstacionamientoForms from './EstacionamientoForms'
import EstacionamientoConfirm from './EstacionamientoConfirm'

const EstacionamientoWizard = () => {
  const [confirmed, setConfirmed] = useState(false);
  const [data, setData] = useState(null);

  const handleConfirm = useCallback((reservationData) => {
    setData(reservationData);
    setConfirmed(true);
  });

  const onBack = useCallback(() => {
    setData(null);
    setConfirmed(false);
  });

  return (
    <div>
      { confirmed ? 
       <EstacionamientoConfirm onHome={onBack} data={data}/>
       : <EstacionamientoForms onConfirm={handleConfirm}/>
      }
    </div>
  )
}

export default EstacionamientoWizard