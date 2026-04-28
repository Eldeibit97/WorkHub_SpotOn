import { Link } from 'react-router-dom'
import AccentureLogo from '../components/AccentureLogo'
import torresHero from '../assets/torresmoradas-login.png'
import accGtLogo from '../assets/Acc_GT_Solid_P1_RGB.png'
import './LandingPage.css'

const leftItems = [
  { title: 'Choose your spot', desc: 'Browse parking lots and workspaces on an interactive map.' },
  { title: 'Pick a date & time', desc: 'Select the day and hours that work best for you.' },
  { title: 'One-click parking', desc: 'Reserve your parking spot in seconds with our visual lot selector.' },
  { title: 'Smart notifications', desc: 'Get reminders before your reservation and real-time alerts.' },
]

const rightItems = [
  { title: 'Workspace booking', desc: 'Pick your desk from an interactive floor plan in real time.' },
  { title: 'Fast check-in / out', desc: 'Arrive, check in, and check out with minimal friction.' },
  { title: 'Show up and work', desc: 'Your spot is confirmed. Just arrive and get to work.' },
  { title: 'Manage reservations', desc: 'Modify, cancel, or release your spot with a single tap.' },
]

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <AccentureLogo />
        <div className="landing-header-actions">
          <Link to="/login" className="landing-signin-link">
            Sign In
          </Link>
          <Link to="/sugerencias" className="landing-cta-header">
            Get Started <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </header>

      <div className="landing-divider" />

      <main className="landing-hero">
        <div className="landing-content">
          <h1 className="landing-title">
            <span className="title-stop">STOP</span>
            <span className="title-wasting">WASTING</span>
            <span className="title-morning">your morning.</span>
          </h1>
          <p className="landing-subtitle">
            Reserve your desk and parking spot in under 30 seconds.
            <br />
            No calls, no emails, no guessing. Just show up and work.
          </p>
          <Link to="/reservar" className="landing-cta-main">
            Reserve Now <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="landing-visual">
          <img
            src={torresHero}
            alt=""
            className="landing-building-img"
            aria-hidden
          />
          <div className="landing-building" />
        </div>
      </main>

      {/* ── Platform Section ── */}
      <section className="platform">
        <div className="section-inner">
          <h2 className="platform-title">
            A Single Platform Built for<br />
            <span className="platform-highlight">Parking and Workspaces</span>
          </h2>
          <p className="platform-subtitle">
            WorkHub helps Accenture employees reserve desks and parking in seconds,
            eliminating conflicts and wasted time every morning.
          </p>
          <div className="platform-buttons">
            <Link to="/reservar" className="btn-filled">Reserve Now</Link>
            <a href="#platform-ring" className="btn-outlined">Learn More</a>
          </div>

          <div className="ring-layout" id="platform-ring">
            {/* Left column */}
            <div className="ring-col ring-col-left">
              <h3 className="ring-col-heading">How It Works</h3>
              {leftItems.map((item, i) => (
                <div className="ring-item ring-item-left" key={i}>
                  <span className="ring-dot" />
                  <div>
                    <h4 className="ring-item-title">{item.title}</h4>
                    <p className="ring-item-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Animated circle */}
            <div className="ring-center">
              <div className="ring-border ring-border-outer" />
              <div className="ring-border ring-border-middle" />
              <div className="ring-border ring-border-inner" />

              {/* Dots orbit on the outer ring */}
              <div className="ring-orbit ring-orbit-dots">
                <div className="dot-pos" style={{ '--angle': '0deg' }}><span className="ring-orbit-dot" /></div>
                <div className="dot-pos" style={{ '--angle': '180deg' }}><span className="ring-orbit-dot" /></div>
              </div>

              {/* Labels orbit on the middle ring, text stays upright */}
              <div className="ring-orbit ring-orbit-labels">
                <div className="label-pos" style={{ '--angle': '0deg' }}>
                  <span className="ring-label">Reserve</span>
                </div>
                <div className="label-pos" style={{ '--angle': '120deg' }}>
                  <span className="ring-label">Check-in</span>
                </div>
                <div className="label-pos" style={{ '--angle': '240deg' }}>
                  <span className="ring-label">Manage</span>
                </div>
              </div>

              <img
                src={accGtLogo}
                alt="Accenture"
                className="ring-logo"
              />
            </div>

            {/* Right column */}
            <div className="ring-col ring-col-right">
              <h3 className="ring-col-heading">Features</h3>
              {rightItems.map((item, i) => (
                <div className="ring-item ring-item-right" key={i}>
                  <span className="ring-dot" />
                  <div>
                    <h4 className="ring-item-title">{item.title}</h4>
                    <p className="ring-item-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="section-inner">
          <div className="footer-cta">
            <p className="footer-cta-text">Ready to reclaim your morning?</p>
            <Link to="/sugerencias" className="landing-cta-main">
              Get Started <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="footer-divider" />

          <div className="footer-body">
            <div className="footer-brand">
              <AccentureLogo size="small" />
              <p className="footer-tagline">Smart workspace reservations for the ATC Monterrey.</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4 className="footer-col-title">Product</h4>
                <a href="#" className="footer-link">How It Works</a>
                <a href="#" className="footer-link">Features</a>
              </div>
              <div className="footer-col">
                <h4 className="footer-col-title">Support</h4>
                <a href="#" className="footer-link">Help Center</a>
                <a href="#" className="footer-link">Contact</a>
              </div>
              <div className="footer-col">
                <h4 className="footer-col-title">Legal</h4>
                <a href="#" className="footer-link">Privacy</a>
                <a href="#" className="footer-link">Terms</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 Accenture. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
