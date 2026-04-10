import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import EditarReservaWorkplace from './components/creacion/EditarReservaWorkplace.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EditarReservaWorkplace />
  </StrictMode>,
)
