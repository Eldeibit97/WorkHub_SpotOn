import { Routes, Route } from 'react-router-dom'
import LandingPage from './views/LandingPage'
import AppShell from './AppShell'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  )
}
