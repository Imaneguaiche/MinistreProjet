import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react'

const ROLE_ROUTES = {
  personnel: '/personnel', technicien: '/technicien',
  helpdesk: '/helpdesk', admin: '/admin',
}



const FEATURES = [
  { icon: '🎫', text: "Soumission de demandes d'intervention" },
  { icon: '👥', text: "Affectation intelligente aux techniciens" },
  { icon: '📊', text: "Tableau de bord statistiques en temps réel" },
  { icon: '🛡️', text: "Sécurité et gestion des accès par rôle" },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', motDePasse: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.motDePasse)
      navigate(ROLE_ROUTES[user.role] || '/')
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="login-wrapper">

      {/* ── LEFT PANEL ──────────────────────────────────────────── */}
      <div className="login-left">
        <div className="login-left-content">

          {/* Ministry logo — white filter applied in CSS */}
          <img src="/logo_new.png" alt="Logo Ministère" className="login-logo" />

          {/* Golden divider accent */}
          <div className="login-logo-divider" />

          {/* Main title */}
          <h1 className="login-left-title">
            HelpDesk<span>Ministère</span>
          </h1>

          {/* Description */}
          <p className="login-left-desc">
            Plateforme centralisée de gestion des demandes et interventions techniques.
          </p>

          {/* Feature list */}
          <div className="login-features">
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="login-feature-item">
                <div className="login-feature-icon">{icon}</div>
                <span>{text}</span>
              </div>
            ))}
          </div>

        </div>
      </div>


      {/* ── RIGHT PANEL ─────────────────────────────────────────── */}
      <div className="login-right">
        <div className="login-form-box animate-fade-in">

          {/* Back link */}
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '.35rem',
            fontSize: '.8rem', color: 'var(--gray-400)', textDecoration: 'none',
            marginBottom: '1.75rem', transition: 'color var(--transition)',
          }} onMouseEnter={e => e.currentTarget.style.color = 'var(--navy)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-400)'}>
            <ArrowLeft size={14} /> Retour à l'accueil
          </Link>

          <h1 className="login-form-title">Connexion</h1>
          <p className="login-form-sub">Accédez à votre espace de travail</p>

          {/* Error */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group">
              <label className="form-label">Adresse Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="votre@ministre.ma"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={form.motDePasse}
                  onChange={e => setForm(f => ({ ...f, motDePasse: e.target.value }))}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  style={{
                    position: 'absolute', right: '.875rem', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--gray-400)', padding: 0, display: 'flex',
                  }}
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: '.25rem' }}
              disabled={loading}
            >
              {loading
                ? <><span style={{ animation: 'pulse 1s infinite' }}>⏳</span> Connexion en cours...</>
                : <><LogIn size={18} /> Se connecter</>
              }
            </button>
          </form>



        </div>
      </div>
    </div>
  )
}
