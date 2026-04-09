import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import CrearReservacion from './components/creacion/CrearReservacion.jsx'
import CaruselMapas from './components/creacion/CaruselMapas.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CaruselMapas />
  </StrictMode>,
)
