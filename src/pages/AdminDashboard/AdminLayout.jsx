import { Outlet } from 'react-router-dom'
import AdminTopBar from './components/AdminTopBar'
import './AdminDashboard.css'

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <AdminTopBar />
      <main className="admin-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
