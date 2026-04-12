import React from 'react'
import { Routes, Route } from 'react-router-dom'
import CrearReservacion from './components/creacion/CrearReservacion'
import Confirmacion from './components/creacion/Confirmacion'
import LandingPage from './views/LandingPage'
import AppShell from './AppShell'
import ManageReservationsPage from './Pages/ManageReservationsPage'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/*" element={<AppShell />} />
      <Route path="/" element={<LandingPage />} />
      <Route path='/reservar' element={<CrearReservacion />} />
      <Route path='/confirmacion' element={<Confirmacion />} />
      <Route path='/cancelar' element={<ManageReservationsPage/>} />
    </Routes>
  )
}

export default AppRoutes