import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { LogIn, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      {/* Brand */}
      <Link to="/" className="navbar-brand" onClick={() => setMobileOpen(false)}>
        <img src="/logo_navbar.png" alt="Logo Ministère" className="navbar-logo" />
        <div className="navbar-brand-text">
          <span className="navbar-brand-title">HelpDesk Ministère</span>
          <span className="navbar-brand-sub">GESTION DES INTERVENTIONS</span>
        </div>
      </Link>

      <div className="navbar-spacer" />

      {/* Desktop links */}
      <ul className="navbar-links" style={{ display: mobileOpen ? 'none' : 'flex' }}>
        <li>
          <NavLink to="/" end className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
            Accueil
          </NavLink>
        </li>
        <li>
          <NavLink to="/about" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
            À propos
          </NavLink>
        </li>
        <li>
          <Link to="/login" className="navbar-cta">
            <LogIn size={15} /> Connexion
          </Link>
        </li>
      </ul>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(o => !o)}
        style={{ display: 'none', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}
        className="navbar-hamburger"
        aria-label="Menu"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 68, left: 0, right: 0,
          background: 'var(--navy)', padding: '1rem',
          borderTop: '1px solid rgba(255,255,255,.08)',
          display: 'flex', flexDirection: 'column', gap: '.25rem',
          zIndex: 999,
        }}>
          {[['/', 'Accueil', true], ['/about', 'À propos', false]].map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
              style={{ display: 'flex' }}
            >
              {label}
            </NavLink>
          ))}
          <Link to="/login" className="navbar-cta" onClick={() => setMobileOpen(false)}
            style={{ marginTop: '.5rem', justifyContent: 'center' }}>
            <LogIn size={15} /> Connexion
          </Link>
        </div>
      )}
    </nav>
  )
}
