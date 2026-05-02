import { Outlet } from 'react-router-dom'
import UserTopBar from './components/UserTopBar'
import './UserLayout.css'
import '../../pages/AdminDashboard/AdminDashboard.css'

export default function UserLayout() {
  return (
    <div className="user-shell">
      <UserTopBar />
      <main className="user-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
