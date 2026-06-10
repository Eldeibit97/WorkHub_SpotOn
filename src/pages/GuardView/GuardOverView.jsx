import { Outlet } from 'react-router-dom';
import GuardTopBar from './components/GuardTopBar';
import './GuardOverView.css'
import '../../styles/appTopbar.css'

const GuardOverView = () => {
  return (
    <div>
      <GuardTopBar />
      <main>
        <Outlet/>
      </main>
    </div>
  );
}

export default GuardOverView