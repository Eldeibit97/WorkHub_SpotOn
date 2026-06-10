import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import CrearReservacion from './pages/CrearReservacion/CrearReservacion'
import Confirmacion from './pages/Confirmacion/Confirmacion'
import Sugerencias from './pages/Sugerencias/Sugerencias'
import Error from './pages/Error/Error'
import LandingPage from './pages/LandingPage/LandingPage'
import SignInPage from './pages/SignInPage/SignInPage'
import ManageReservationsPage from './pages/ManageReservations/ManageReservationsPage'
import AdminLayout from './pages/AdminDashboard/AdminLayout'
import AdminDashboard from './pages/AdminDashboard/AdminDashboard'
import DashboardOverview from './pages/AdminDashboard/DashboardOverview'
import UserLayout from './pages/UserLayout/UserLayout'
import FloorEditor from './pages/FloorEditor/FloorEditor'
import FloorEditorOffices from './pages/FloorEditor/FloorEditorOffices'
import FloorEditorFloors from './pages/FloorEditor/FloorEditorFloors'
import RequireRole from './components/RequireRole'
import AdminUserReservations from './pages/AdminDashboard/AdminUserReservations'
import Verificacion from './pages/GuardView/Verificacion'
import GuardOverView from './pages/GuardView/GuardOverView'
import EditarReservaWorkplace from "./pages/ManageReservations/components/EditarReservaWorkplace";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas sin layout de usuario */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<SignInPage />} />
      <Route path='/login/reservationCheck/:reservaId' element={<SignInPage/>}/>
      <Route path="/error" element={<Error />} />

      {/* Rutas de usuario con UserTopBar compartido */}
      <Route
        element={
          <RequireRole allowedRoles={['employee', 'admin']}>
            <UserLayout />
          </RequireRole>
        }
      >
        <Route path="/sugerencias" element={<Sugerencias />} />
        <Route path="/reservar" element={<CrearReservacion />} />
        <Route path="/confirmacion" element={<Confirmacion />} />
        <Route path="/cancelar" element={<ManageReservationsPage />} />
        
        {/* RUTA ÚNICA PARA MODIFICAR WORKPLACE */}
        <Route path="/edit-workplace/:id" element={<EditarReservaWorkplace />} />
      </Route>

      {/* Rutas exclusivas para admins (layout con top bar de pestañas) */}
      <Route
        element={
          <RequireRole allowedRoles={['guard']} >
            <GuardOverView/>
          </RequireRole>
        }>
          <Route path='/verificacion/:reservaId' element={<Verificacion></Verificacion>}></Route>
      </Route>

      <Route
        path="/admin"
        element={
          <RequireRole allowedRoles={['admin']}>
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<DashboardOverview />} />
        <Route path="usuarios" element={<AdminDashboard />} />
        <Route path="usuarios/:id/reservaciones" element={<AdminUserReservations />} />
        <Route path="floor-editor">
          <Route index element={<FloorEditorOffices />} />
          <Route path="edificios/:edificioSlug" element={<FloorEditorFloors />} />
          <Route path="edificios/:edificioSlug/pisos/:zonaId" element={<FloorEditor />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route path="/floor-editor" element={<Navigate to="/admin/floor-editor" replace />} />

      {/* Ruta catch-all */}
      <Route path="/*" element={<LandingPage />} />
    </Routes>
  )
}

export default AppRoutes