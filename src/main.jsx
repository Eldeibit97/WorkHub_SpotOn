import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Sugerencias from './components/sugerencias/Sugerencias.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sugerencias />
  </StrictMode>,
)