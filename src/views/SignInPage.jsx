import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import torresLogin from '../assets/torresmoradas-login.png'
import accGtLogo from '../assets/Acc_GT_Solid_P1_RGB.png'
import './SignInPage.css'

function SignUpIcon() {
  return (
    <svg className="signin-signup-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function SignInPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/home')
  }

  return (
    <div className="signin-page">
      <section className="signin-left" aria-label="WorkHub ATC">
        <img
          src={torresLogin}
          alt=""
          className="signin-left-img"
        />
        <div className="signin-left-gradient" aria-hidden="true" />
        <p className="signin-hero-tagline">Reserve spaces and parking at the ATC</p>
        <div className="signin-hero-booking-block">
          <span className="signin-ellipse signin-ellipse--outer" aria-hidden="true" />
          <span className="signin-ellipse signin-ellipse--inner" aria-hidden="true" />
          <h1 className="signin-hero-title">
            Quick
            <br />
            Booking
          </h1>
        </div>
      </section>

      <section className="signin-right" aria-label="Sign in form">
        <div className="signin-right-glow signin-right-glow--tl" aria-hidden="true" />
        <div className="signin-right-glow signin-right-glow--br" aria-hidden="true" />

        <header className="signin-card-header">
          <img src={accGtLogo} alt="Accenture" className="signin-card-logo" />
          <a
            href="#"
            className="signin-signup-link"
            onClick={(e) => {
              e.preventDefault()
            }}
          >
            <span className="signin-signup-icon-wrap" aria-hidden="true">
              <span className="signin-signup-ring-outer" />
              <span className="signin-signup-ring-inner" />
              <SignUpIcon />
            </span>
            Sign Up
          </a>
        </header>

        <form className="signin-form" onSubmit={handleSubmit}>
          <h2 className="signin-form-title">Sign In</h2>

          <label className="signin-field">
            <span className="visually-hidden">Email or Username</span>
            <input
              type="text"
              name="email"
              autoComplete="username"
              className="signin-input"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="signin-field">
            <span className="visually-hidden">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              className="signin-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <a
            href="#"
            className="signin-forgot"
            onClick={(e) => e.preventDefault()}
          >
            Forgot Password?
          </a>

          <button type="submit" className="signin-submit">
            Sign In
          </button>
        </form>
      </section>
    </div>
  )
}
