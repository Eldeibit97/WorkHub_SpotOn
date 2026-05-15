import { Outlet } from 'react-router-dom'
import UserTopBar from './components/UserTopBar'
import './UserLayout.css'
import '../../styles/appTopbar.css'

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
