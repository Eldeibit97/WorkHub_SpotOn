import { Routes, Route, useNavigate } from 'react-router-dom'
import './styles/AppShell.css'
import Header from './components/Header'
import Home from './views/views.test/Home'
import Parking from './views/views.test/Parking'
import Offices from './views/views.test/Offices'
import MyReservations from './views/views.test/MyReservations'

export default function AppShell() {
  const navigate = useNavigate()

  const onNavigate = (view) => {
    const routes = {
      'home': '/home',
      'parking': '/parking',
      'offices': '/offices',
      'my-reservations': '/my-reservations',
    }
    navigate(routes[view] || '/home')
  }

  return (
    <div className="app">
      <Header onNavigate={onNavigate} />
      <main className="main">
        <Routes>
          <Route path="/home" element={<Home onNavigate={onNavigate} />} />
          <Route path="/parking" element={<Parking onNavigate={onNavigate} />} />
          <Route path="/offices" element={<Offices onNavigate={onNavigate} />} />
          <Route path="/my-reservations" element={<MyReservations onNavigate={onNavigate} />} />
        </Routes>
      </main>
    </div>
  )
}
