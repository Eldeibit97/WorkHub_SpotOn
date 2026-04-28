import { Routes, Route, useNavigate } from 'react-router-dom'
import './styles/AppShell.css'
import Header from './components/Header'
import LandingPage from './pages/LandingPage/LandingPage'
import CrearReservacion from './pages/CrearReservacion/CrearReservacion'
import ManageReservationsPage from './pages/ManageReservations/ManageReservationsPage'

export default function AppShell() {
  const navigate = useNavigate()

  const onNavigate = (view) => {
    const routes = {
      'home': '/',
      'parking': '/reservar',
      'offices': '/reservar',
      'my-reservations': '/cancelar',
    }
    navigate(routes[view] || '/')
  }

  return (
    <div className="app">
      <Header onNavigate={onNavigate} />
      <main className="main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/reservar" element={<CrearReservacion />} />
          <Route path="/cancelar" element={<ManageReservationsPage />} />
        </Routes>
      </main>
    </div>
  )
}
