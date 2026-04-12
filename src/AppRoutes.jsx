import React from 'react'
import { Routes, Route } from 'react-router-dom'
import CrearReservacion from './components/creacion/CrearReservacion'
import Confirmacion from './components/creacion/Confirmacion'
import LandingPage from './views/LandingPage'
import AppShell from './AppShell'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<CrearReservacion />} />
      <Route path='/confirmacion' element={<Confirmacion />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  )
}

export default AppRoutes