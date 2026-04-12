import React from 'react'
import { Routes, Route } from 'react-router-dom'
import CrearReservacion from './components/creacion/CrearReservacion'
import Confirmacion from './components/creacion/Confirmacion'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<CrearReservacion />} />
      <Route path='/confirmacion' element={<Confirmacion />} />
    </Routes>
  )
}

export default AppRoutes