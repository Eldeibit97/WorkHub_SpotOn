import { useLocation } from 'react-router-dom'
import AccentureLogo from './AccentureLogo'
import './Header.css'

export default function Header({ onNavigate }) {
  const location = useLocation()

  const links = [
    { id: 'home', path: '/', label: 'Inicio' },
    { id: 'parking', path: '/parking', label: 'Estacionamiento' },
    { id: 'offices', path: '/offices', label: 'Oficinas' },
    { id: 'my-reservations', path: '/my-reservations', label: 'Mis reservas' },
  ]

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-logo" onClick={() => onNavigate('home')}>
          <AccentureLogo size="small" />
        </div>
        <nav className="nav">
          {links.map(({ id, path, label }) => (
            <button
              key={id}
              className={`nav-link ${location.pathname === path ? 'active' : ''}`}
              onClick={() => onNavigate(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
