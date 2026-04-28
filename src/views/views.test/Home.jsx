import './Home.css'

export default function Home({ onNavigate }) {
  return (
    <div className="home">
      <section className="hero">
        <h2 className="hero-title">Bienvenido a WorkHub MTY</h2>
        <p className="hero-subtitle">
          Reserva escritorios y estacionamiento en el ATC Monterrey.
          Simple, rápido y al alcance de tu mano.
        </p>
      </section>

      <section className="actions">
        <button
          className="action-card action-parking"
          onClick={() => onNavigate('parking')}
        >
          <div className="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="16" rx="2"/>
              <path d="M3 10h18M3 14h18"/>
              <path d="M7 4v16M17 4v16"/>
            </svg>
          </div>
          <h3 className="action-title">Estacionamiento</h3>
          <p className="action-desc">Reserva un cajón para tu vehículo</p>
        </button>

        <button
          className="action-card action-office"
          onClick={() => onNavigate('offices')}
        >
          <div className="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
              <path d="M8 7h.01M16 7h.01M8 11h.01M16 11h.01"/>
            </svg>
          </div>
          <h3 className="action-title">Oficina</h3>
          <p className="action-desc">Reserva un escritorio para trabajar</p>
        </button>
      </section>
    </div>
  )
}
