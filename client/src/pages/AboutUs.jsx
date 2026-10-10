import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Github, Linkedin, Mail } from 'lucide-react'

const DEVS = [
  {
    initials: 'MR',
    image: '/images/mehdi.jpeg',
    imagePosition: 'center 15%',
    name: 'Mehdi Rhouarhi',
    role: 'Développeur Full Stack',
    bio: "Passionné par le développement web moderne, spécialisé en Laravel et React. A conçu l'architecture backend et l'API RESTful de la plateforme.",
    email: 'mehdirhou06@gmail.com',
  },
  {
    initials: 'IG',
    image: '/images/imane.jpeg',
    imagePosition: 'center 20%',
    name: 'Imane Guaiche',
    role: 'Développeur Frontend',
    bio: "Expert en design UI/UX et en développement React. Responsable de l'interface utilisateur, du design system et de l'expérience utilisateur.",
    email: 'guaicheimmane10@gmail.com',
  },
]

export default function AboutUs() {

  return (
    <>
      <Navbar />
      <div className="public-page">


        {/* ── HERO ───────────────────────────────────────────────── */}
        <section style={{
          background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-soft) 100%)',
          padding: '5rem 0 6rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(247,220,111,.06) 0%, transparent 70%)',
            top: -200, left: -100, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(247,220,111,.05) 0%, transparent 70%)',
            bottom: -150, right: -80, pointerEvents: 'none',
          }} />

          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div className="section-badge" style={{
              margin: '0 auto 1.25rem',
              background: 'rgba(247,220,111,.12)',
              border: '1px solid rgba(247,220,111,.25)',
              color: 'var(--yellow)',
            }}>
              👥 Notre équipe
            </div>
            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 900,
              color: 'var(--white)',
              marginBottom: '1rem',
              lineHeight: 1.2,
            }}>
              À propos du <span style={{ color: 'var(--yellow)' }}>projet</span>
            </h1>
            <p style={{
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,.65)',
              maxWidth: 580,
              margin: '0 auto',
              lineHeight: 1.75,
            }}>
              HelpDesk Ministère est une plateforme de gestion des interventions techniques,
              développée dans le cadre d'un projet académique pour moderniser le service public.
            </p>
          </div>
        </section>

        {/* ── PROJECT DESCRIPTION ─────────────────────────────────── */}
        <section className="section">
          <div className="container">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '4rem',
            }}>
              {[
                { icon: '🎯', title: 'Objectif', text: "Digitaliser et optimiser la gestion des demandes d'intervention technique au sein du ministère, en réduisant les délais et en améliorant la traçabilité." },
                { icon: '🛠️', title: 'Technologie', text: 'React 18 + Vite pour le frontend, Laravel 12 + MySQL pour le backend, avec une architecture REST et authentification Sanctum.' },
                { icon: '🌿', title: 'Contexte', text: 'Projet académique aligné avec les objectifs de développement durable et de modernisation du service public marocain.' },
              ].map(({ icon, title, text }) => (
                <div key={title} className="card" style={{ borderTop: '3px solid var(--yellow)' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '.75rem' }}>{icon}</div>
                  <h3 style={{ fontWeight: 800, color: 'var(--navy)', marginBottom: '.5rem' }}>{title}</h3>
                  <p style={{ fontSize: '.875rem', color: 'var(--gray-500)', lineHeight: 1.65 }}>{text}</p>
                </div>
              ))}
            </div>

            {/* ── DEV CARDS ──────────────────────────────────────── */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="section-badge" style={{ margin: '0 auto .75rem' }}>👨‍💻 Développeurs</div>
              <h2 className="section-title" style={{ textAlign: 'center' }}>
                L'équipe de <span>développement</span>
              </h2>
              <p className="section-subtitle" style={{ margin: '0 auto' }}>
                Ce projet a été réalisé par deux étudiants passionnés.
              </p>
            </div>

            <div className="devs-grid">
              {DEVS.map((dev) => (
                <div key={dev.name} className="dev-card">
                  {/* Card header with avatar */}
                  <div className="dev-card-header">
                    <img 
                      src={dev.image} 
                      alt={dev.name} 
                      className="dev-avatar" 
                      style={{ objectPosition: dev.imagePosition || 'top center' }}
                    />
                  </div>

                  {/* Card body */}
                  <div className="dev-card-body">
                    <h3 className="dev-name">{dev.name}</h3>
                    <span className="dev-role">{dev.role}</span>
                    <p className="dev-bio">{dev.bio}</p>

                    {/* Contact links */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '.6rem',
                      marginTop: '1.25rem',
                    }}>
                      {[
                        { icon: <Mail size={15} />, href: `https://mail.google.com/mail/?view=cm&to=${dev.email}`, label: 'Email' },
                        { icon: <Github size={15} />, href: '#', label: 'GitHub' },
                        { icon: <Linkedin size={15} />, href: '#', label: 'LinkedIn' },
                      ].map(({ icon, href, label }) => (
                        <button
                          key={label}
                          type="button"
                          aria-label={label}
                          title={label === 'Email' ? `Envoyer un email à ${dev.email}` : label}
                          onClick={() => {
                            if (href && href !== '#') {
                              window.open(href, '_blank', 'noopener,noreferrer')
                            }
                          }}
                          style={{
                            width: 36, height: 36,
                            borderRadius: '50%',
                            background: 'var(--yellow-light)',
                            border: '1.5px solid rgba(247,220,111,.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#92700a',
                            transition: 'all var(--transition)',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--yellow)'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'var(--yellow-light)'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <Footer />

      </div>

    </>
  )
}
