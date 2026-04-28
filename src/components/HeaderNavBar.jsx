import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import AccentureLogo from './AccentureLogo';
import './headernavbar.css';

const HeaderNavBar = () => {
  return (
    <header className='header-container'>
      <Link to="/home" className="reservation-top-bar-logo" aria-label="Inicio">
        <AccentureLogo size="small"/>
      </Link>
      <div className='nav-bar-container'>
        <NavLink
          className={({ isActive }) => `nav-bar-link ${isActive ? 'active' : ''}`}
          to='/sugerencias'>
          <p>Home</p>
        </NavLink>

        <NavLink
          className={({ isActive }) => `nav-bar-link ${isActive ? 'active' : ''}`}
          to='/reservar'>
          <p>Reservar</p>
        </NavLink>

        <NavLink
          className={({ isActive }) => `nav-bar-link ${isActive ? 'active' : ''}`}
          to='/cancelar'>
          <p>Reservas</p>
        </NavLink>
      </div>
    </header>
  );
}

export default HeaderNavBar;