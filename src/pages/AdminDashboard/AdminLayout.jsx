import { Outlet, useLocation } from 'react-router-dom'
import AdminTopBar from './components/AdminTopBar'
import './AdminDashboard.css'

export default function AdminLayout() {
  const { pathname } = useLocation()
  const isFloorEditor =
    pathname.includes('/floor-editor/') && pathname.includes('/pisos/')

  return (
    <div className={`admin-shell${isFloorEditor ? ' admin-shell--floor-editor' : ''}`}>
      {!isFloorEditor && <AdminTopBar />}
      <main
        className={`admin-shell__main${isFloorEditor ? ' admin-shell__main--floor-editor' : ''}`}
      >
        <Outlet />
      </main>
    </div>
  )
}
