import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  ChevronUp, ChevronDown, LogIn,
  Shield, Zap, Users, BarChart2, Clock, Headphones
} from 'lucide-react'

// Carousel slides — images go in /public/carousel/
// User places: slide1.jpg, slide2.jpg, slide3.jpg, slide4.jpg
const SLIDES = [
  { bg: '/images/carroussel1.jpeg' },
  { bg: '/images/carroussel3.jpeg' },
  { bg: '/images/carroussel4.jpeg' },
  { bg: '/images/carroussel5.jpeg' },
]

const FEATURES = [
  { icon: '🎫', title: 'Gestion des tickets',     desc: "Créez et suivez vos demandes d’intervention technique en quelques clics, 24h/24." },
  { icon: '⚡', title: 'Affectation instantanée',  desc: "Le HelpDesk affecte automatiquement les techniciens disponibles selon leur spécialité." },
  { icon: '📊', title: 'Tableau de bord complet',  desc: "Visualisez les statistiques et KPIs en temps réel via des graphiques interactifs." },
  { icon: '🛡️', title: 'Sécurité par rôle',       desc: "Chaque acteur (personnel, technicien, helpdesk, admin) accède à son espace dédié." },
  { icon: '🤖', title: 'IA de catégorisation',    desc: "Suggestion automatique de catégorie de panne basée sur la description du problème." },
  { icon: '📋', title: 'Rapports détaillés',       desc: "Les techniciens soumettent des rapports d’intervention complets après chaque tâche." },
]

const STATS = [
  { value: '4', label: 'Rôles utilisateurs' },
  { value: '12', label: 'Modules fonctionnels' },
  { value: '99%', label: 'Disponibilité système' },
  { value: '< 2h', label: 'Délai de réponse moyen' },
]

// Fallback gradient for missing images
const FALLBACK_COLORS = [
  'linear-gradient(135deg, #0D1B2A 0%, #1a2d42 100%)',
  'linear-gradient(135deg, #1a2d42 0%, #0D1B2A 100%)',
  'linear-gradient(135deg, #243447 0%, #0D1B2A 100%)',
  'linear-gradient(135deg, #0D1B2A 0%, #243447 100%)',
]

export default function Accueil() {
  const [current, setCurrent] = useState(0)
  const [imgErrors, setImgErrors] = useState({})

  // Auto-advance carousel
  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 5500)
    return () => clearInterval(id)
  }, [])

  const prev = () => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length)
  const next = () => setCurrent(c => (c + 1) % SLIDES.length)

  return (
    <>
      <Navbar />
      <div className="public-page" style={{ margin: 0, padding: 0 }}>

        {/* ── CAROUSEL ───────────────────────────────────────────── */}
        <section className="carousel">
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`carousel-slide${i === current ? ' active' : ''}`}
              style={
                imgErrors[i] 
                  ? { background: FALLBACK_COLORS[i] } 
                  : { backgroundImage: `url("${slide.bg}")` }
              }
            >
              {/* Preload image to detect errors */}
              <img
                src={slide.bg} alt="" aria-hidden
                style={{ display: 'none' }}
                onError={(e) => {
                  console.error("Failed to load image:", slide.bg);
                  setImgErrors(errs => ({ ...errs, [i]: true }))
                }}
              />
              <div 
                className="carousel-overlay" 
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 1
                }} 
              />
              {i === current && (
                <div 
                  className="carousel-content animate-fade-in" 
                  style={{ 
                    position: 'absolute', 
                    inset: 0,
                    zIndex: 2, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    textAlign: 'center',
                    width: '100%',
                    padding: '60px 2rem 0', // padding-top to avoid navbar
                    boxSizing: 'border-box'
                  }}
                >
                  <h1 
                    style={{ 
                      color: '#ffffff', 
                      fontSize: 'clamp(2rem, 5vw, 4rem)', 
                      fontWeight: 900, 
                      letterSpacing: '0',
                      textShadow: '0 4px 15px rgba(0,0,0,0.5)', 
                      margin: '0 0 1rem 0'
                    }}
                  >
                    Système HelpDesk
                  </h1>
                  <h2 
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.85)', 
                      fontSize: 'clamp(1rem, 2vw, 1.4rem)', 
                      fontWeight: 500, 
                      maxWidth: '800px', 
                      lineHeight: '1.5',
                      margin: '0 auto 2.5rem', 
                      textShadow: '0 4px 15px rgba(0,0,0,0.5)' 
                    }}
                  >
                    Ministère de la Transition Énergétique et du Développement Durable
                  </h2>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Link 
                      to="/login" 
                      className="carousel-btn" 
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '1rem 2rem',
                        fontSize: '1.05rem',
                        fontWeight: 700
                      }}
                    >
                      <LogIn size={20} /> Accéder à la plateforme
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Arrows */}
          <div className="carousel-arrows">
            <button className="carousel-arrow" onClick={prev} aria-label="Précédent">
              <ChevronUp size={20} />
            </button>
            <button className="carousel-arrow" onClick={next} aria-label="Suivant">
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Dots */}
          <div className="carousel-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot${i === current ? ' active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* ── STATS BAND ─────────────────────────────────────────── */}
        <div className="stats-band">
          <div className="container">
            <div className="stats-band-grid">
              {STATS.map(({ value, label }) => (
                <div key={label} className="stat-band-item">
                  <div className="stat-band-value">{value}</div>
                  <div className="stat-band-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FEATURES ───────────────────────────────────────────── */}
        <section className="section">
          <div className="container">
            <div style={{ maxWidth: 560 }}>
              <div className="section-badge">✨ Fonctionnalités</div>
              <h2 className="section-title">Tout ce dont vous avez<br/><span>besoin en un seul endroit</span></h2>
              <p className="section-subtitle">
                Une plateforme complète et moderne pour digitaliser la gestion des interventions techniques au sein du ministère.
              </p>
            </div>
            <div className="features-grid">
              {FEATURES.map(({ icon, title, desc }) => (
                <div key={title} className="feature-card">
                  <div className="feature-icon">{icon}</div>
                  <h3 className="feature-title">{title}</h3>
                  <p className="feature-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────────── */}
        <section className="section section-alt">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="section-badge" style={{ margin: '0 auto .75rem' }}>⚙️ Processus</div>
              <h2 className="section-title" style={{ textAlign: 'center' }}>Comment ça <span>fonctionne</span> ?</h2>
              <p className="section-subtitle" style={{ margin: '0 auto' }}>Trois étapes simples pour résoudre vos problèmes techniques</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', position: 'relative' }}>
              {[
                { step: '01', icon: <Headphones size={26} />, title: 'Soumettre', desc: "Le personnel crée une demande d’intervention et décrit le problème technique rencontré." },
                { step: '02', icon: <Users size={26} />, title: 'Affecter', desc: "L’équipe HelpDesk analyse la demande et affecte le technicien le plus adapté." },
                { step: '03', icon: <Shield size={26} />, title: 'Résoudre', desc: "Le technicien intervient et soumet un rapport complet. Le dossier est clôturé." },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} style={{
                  background: 'white',
                  borderRadius: 'var(--radius-md)',
                  padding: '2rem 1.75rem',
                  border: '1px solid var(--gray-200)',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  transition: 'all var(--transition)',
                }} onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }} onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}>
                  <div style={{
                    position: 'absolute', top: '1.25rem', right: '1.25rem',
                    fontSize: '3rem', fontWeight: 900,
                    color: 'var(--yellow-light)',
                    lineHeight: 1,
                  }}>{step}</div>
                  <div style={{
                    width: 52, height: 52,
                    borderRadius: 'var(--radius)',
                    background: 'var(--navy)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--yellow)',
                    marginBottom: '1.25rem',
                  }}>{icon}</div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '.5rem' }}>{title}</h3>
                  <p style={{ fontSize: '.875rem', color: 'var(--gray-500)', lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <section style={{
          background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-soft) 100%)',
          padding: '5rem 0',
          textAlign: 'center',
        }}>
          <div className="container">
            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 900, color: 'var(--white)', marginBottom: '1rem' }}>
              Prêt à <span style={{ color: 'var(--yellow)' }}>démarrer</span> ?
            </h2>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,.6)', marginBottom: '2rem', maxWidth: 480, margin: '0 auto 2rem' }}>
              Connectez-vous pour accéder à votre espace personnel et gérer vos interventions techniques.
            </p>
            <Link to="/login" className="carousel-btn" style={{ fontSize: '1rem', padding: '1rem 2.5rem' }}>
              <LogIn size={18} /> Se connecter maintenant
            </Link>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <Footer />

      </div>
    </>
  )
}
