import React from 'react'
import { Routes, Route } from 'react-router-dom'
import CrearReservacion from './pages/CrearReservacion/CrearReservacion'
import Confirmacion from './pages/Confirmacion/Confirmacion'
import LandingPage from './pages/LandingPage/LandingPage'
import SignInPage from './pages/SignInPage/SignInPage'
import ManageReservationsPage from './pages/ManageReservations/ManageReservationsPage'
import AdminDashboard from './pages/AdminDashboard/AdminDashboard'
import RequireRole from './components/RequireRole'

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<SignInPage />} />

      {/* Rutas para empleados y admins (requieren sesión) */}
      <Route path="/reservar" element={<RequireRole allowedRoles={['employee', 'admin']}><CrearReservacion /></RequireRole>} />
      <Route path="/confirmacion" element={<RequireRole allowedRoles={['employee', 'admin']}><Confirmacion /></RequireRole>} />
      <Route path="/cancelar" element={<RequireRole allowedRoles={['employee', 'admin']}><ManageReservationsPage /></RequireRole>} />

      {/* Ruta exclusiva para admins */}
      <Route path="/admin" element={<RequireRole allowedRoles={['admin']}><AdminDashboard /></RequireRole>} />

      {/* Ruta catch-all para redirigir a landing page */}
      <Route path="/*" element={<LandingPage />} />
    </Routes>
  )
}

export default AppRoutes