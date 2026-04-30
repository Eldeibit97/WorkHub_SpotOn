import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import accGtLogo from '../../assets/Acc_GT_Solid_P1_RGB.png'
import { loginRequest } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'
import './SignInPage.css'

function MailIcon() {
  return (
    <svg className="signin-field-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16v10H4V7zm0 0l8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="signin-field-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SignInCircuitBg() {
  const lines = [
    {
      id: 'tl',
      d: 'M 0 5 L 18 5 L 26 5.5 L 34 12 L 34 30 L 41 38',
      delay: '0s',
    },
    {
      id: 'tr',
      d: 'M 100 5 L 82 5 L 74 5.5 L 66 12 L 66 30 L 59 38',
      delay: '0.45s',
    },
    {
      id: 'bl',
      d: 'M 0 95 L 18 95 L 26 94.5 L 34 88 L 34 70 L 41 62',
      delay: '0.9s',
    },
    {
      id: 'br',
      d: 'M 100 95 L 82 95 L 74 94.5 L 66 88 L 66 70 L 59 62',
      delay: '1.35s',
    },
  ]

  return (
    <svg
      className="signin-circuits"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {lines.map(({ id, d, delay }) => (
        <g key={id} className={`signin-circuit-group signin-circuit-group--${id}`}>
          <path className="signin-circuit-track" d={d} pathLength="100" />
          <path
            className="signin-circuit-pulse"
            d={d}
            pathLength="100"
            style={{ animationDelay: delay }}
          />
        </g>
      ))}
    </svg>
  )
}

export default function SignInPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await loginRequest({ email, password })
      signIn(data)
      if (data.user.rol === 'admin') {
        navigate('/admin')
      } else {
        navigate('/sugerencias')
      }
        
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="signin-page">
      <SignInCircuitBg />

      <div className="signin-form-card">
        <div className="signin-form-brand">
          <img src={accGtLogo} alt="Accenture" className="signin-brand-logo" />
        </div>

        <h1 className="signin-form-title">Sign In</h1>
        <p className="signin-subtitle">
          Don&apos;t have an account yet?{' '}
          <Link to="/" className="signin-subtitle-link">
            Sign up
          </Link>
        </p>

        <form className="signin-form" onSubmit={handleSubmit}>
          {error ? (
            <p className="signin-form-error" role="alert">
              {error}
            </p>
          ) : null}
          <label className="signin-field">
            <span className="visually-hidden">Email or Username</span>
            <span className="signin-input-wrap">
              <MailIcon />
              <input
                type="text"
                name="email"
                autoComplete="username"
                className="signin-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </span>
          </label>

          <label className="signin-field">
            <span className="visually-hidden">Password</span>
            <span className="signin-input-wrap">
              <LockIcon />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                className="signin-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </span>
          </label>

          <a href="#" className="signin-forgot" onClick={(e) => e.preventDefault()}>
            Forgot Password?
          </a>

          <button type="submit" className="signin-submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
          <Link to="/" className="signin-submit" style={{
            textAlign: 'center',
            alignContent: 'center'
          }}>
            Regresar a landing page
          </Link>
        </form>
      </div>
    </div>
  )
}
