import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="main-footer-content container">
        {/* LEFT SIDE: Description */}
        <div className="footer-col footer-col-about">
          <h3 className="footer-title">Gestion des interventions</h3>
          <p className="footer-subtitle">Ministère de la Transition Énergétique et du Développement Durable</p>
          <p className="footer-desc">
            Système centralisé de gestion et de suivi des interventions techniques au sein du ministère.
          </p>
        </div>

        {/* CENTER: Navigation */}
        <div className="footer-col footer-col-links">
          <h3 className="footer-title">Navigation</h3>
          <div className="footer-links">
            <Link to="/">Accueil</Link>
            <Link to="/about">À propos</Link>
            <Link to="/login">Connexion</Link>
          </div>
        </div>

        {/* RIGHT SIDE: Contact */}
        <div className="footer-col footer-col-contact">
          <h3 className="footer-title">Contact</h3>
          <p className="footer-text">Mehdi Rhouarhi</p>
          <p className="footer-text">Imane Guaiche</p>
          <p className="footer-text footer-tutrice">Tutrice : Khadija Elgajoui</p>
        </div>
      </div>

      {/* FOOTER BAR: Bottom */}
      <div className="main-footer-bottom">
        <div className="container bottom-container">
          <p>© {currentYear} Gestion des interventions — Tous droits réservés.</p>
          <p>Stage de fin de formation — ISTA</p>
        </div>
      </div>
    </footer>
  )
}
