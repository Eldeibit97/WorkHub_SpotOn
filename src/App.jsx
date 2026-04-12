import ManageReservationsPage from "./Pages/ManageReservationsPage.jsx";
import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './AppRoutes'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App;