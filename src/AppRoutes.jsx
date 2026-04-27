import React from 'react'
import { Routes, Route } from 'react-router-dom'
import CrearReservacion from './views/CrearReservacion'
import Confirmacion from './components/creacion/Confirmacion'
import Sugerencias from './views/Sugerencias'
import Error from './components/creacion/Error'
import LandingPage from './views/LandingPage'
import SignInPage from './views/SignInPage'
import ManageReservationsPage from './views/ManageReservationsPage'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<SignInPage />} />
      <Route path='/sugerencias' element={<Sugerencias />}/>
      <Route path="/reservar" element={<CrearReservacion />} />
      <Route path="/confirmacion" element={<Confirmacion />} />
      <Route path='/error' element = {<Error />} />
      <Route path="/cancelar" element={<ManageReservationsPage />} />
      <Route path="/*" element={<LandingPage />} />
    </Routes>
  )
}

export default AppRoutes