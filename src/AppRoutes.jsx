import React from 'react'
import { Routes, Route } from 'react-router-dom'
import CrearReservacion from './views/CrearReservacion'
import Confirmacion from './components/creacion/Confirmacion'
import LandingPage from './views/LandingPage'
import SignInPage from './views/SignInPage'
import ManageReservationsPage from './views/ManageReservationsPage'
import AdminDashboard from './views/AdminDashboard'         
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