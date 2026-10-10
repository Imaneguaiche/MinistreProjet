import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../services/api'
import { Send, AlertCircle, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Inline error message component keeping current design style
const FieldError = ({ msg }) =>
  msg ? (
    <span style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', fontWeight: 500
    }}>
      <AlertCircle size={13} /> {msg}
    </span>
  ) : null

export default function NouvelleDemande() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ description: '', priorite: 'normale', categorie_id: '', materiel_id: '' })
  const [categories, setCategories] = useState([])
  const [materiels, setMateriels] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState(null)

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({})
  // Track which fields have been touched (blurred) so we don't show errors before interaction
  const [touched, setTouched] = useState({})

  useEffect(() => {
    setApiError(null)
    Promise.all([
      api.get('/categories'),
      api.get('/materiels')
    ]).then(([rCat, rMat]) => {
      const raw = rCat.data || []
      const seen = new Set()
      const unique = raw.filter(c => {
        if (seen.has(c.id)) return false
        seen.add(c.id)
        return true
      })
      setCategories(unique)
      setMateriels(rMat.data.data || [])
    }).catch(err => setApiError("Impossible de charger le formulaire de création."))
  }, [])

  // Validate a single field and return error message (or '')
  const validateField = (name, value) => {
    switch (name) {
      case 'description':
        if (!value || !value.trim()) return 'La description est obligatoire.'
        if (value.trim().length < 10) return 'La description doit contenir au moins 10 caractères.'
        return ''
      case 'categorie_id':
        if (!value) return 'Veuillez sélectionner une catégorie.'
        return ''
      case 'priorite':
        if (!value) return 'Veuillez sélectionner une priorité.'
        return ''
      default:
        return ''
    }
  }

  // Recompute all errors on the current form state
  const computeErrors = (f) => ({
    description: validateField('description', f.description),
    categorie_id: validateField('categorie_id', f.categorie_id),
    priorite: validateField('priorite', f.priorite),
  })

  const handleChange = (name, value) => {
    const updated = { ...form, [name]: value }
    setForm(updated)
    // Revalidate this field live only if it has been touched already
    if (touched[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
    }
  }

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, form[name]) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Mark all validated fields as touched and run full validation
    const allErrors = computeErrors(form)
    setFieldErrors(allErrors)
    setTouched({ description: true, categorie_id: true, priorite: true })

    const hasErrors = Object.values(allErrors).some(msg => msg !== '')
    if (hasErrors) return   // Stop here — don't hit the backend

    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
      await api.post('/demandes', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSuccess(true)
      setTimeout(() => navigate('/personnel'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission.')
    } finally {
      setLoading(false)
    }
  }

  // Helper: border color for invalid touched field
  const fieldStyle = (name) => ({
    borderColor: touched[name] && fieldErrors[name] ? '#ef4444' : undefined,
    outline: touched[name] && fieldErrors[name] ? 'none' : undefined,
  })

  return (
    <Layout title="Nouvelle demande">
      <div style={{ maxWidth: 640 }}>
        <div className="page-header">
          <div>
            <h1>Nouvelle demande</h1>
            <p>Décrivez votre problème technique</p>
          </div>
        </div>

        <div className="card">
          {success && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.85rem 1rem', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, marginBottom:'1rem', color:'#166534', fontWeight:600 }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              Demande soumise avec succès ! Redirection en cours...
            </div>
          )}
          {apiError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} /> {apiError}
            </div>
          )}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} noValidate>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Décrivez votre problème en détail (min. 10 caractères)..."
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                style={{ resize: 'vertical', ...fieldStyle('description') }}
              />
              <FieldError msg={touched.description && fieldErrors.description} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Priorité */}
              <div className="form-group">
                <label className="form-label">Priorité *</label>
                <select
                  className="form-input form-select"
                  value={form.priorite}
                  onChange={e => handleChange('priorite', e.target.value)}
                  onBlur={() => handleBlur('priorite')}
                  style={fieldStyle('priorite')}
                >
                  <option value="">— Sélectionner —</option>
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
                <FieldError msg={touched.priorite && fieldErrors.priorite} />
              </div>

              {/* Catégorie */}
              <div className="form-group">
                <label className="form-label">Catégorie *</label>
                <select
                  className="form-input form-select"
                  value={form.categorie_id}
                  onChange={e => handleChange('categorie_id', e.target.value)}
                  onBlur={() => handleBlur('categorie_id')}
                  style={fieldStyle('categorie_id')}
                >
                  <option value="">— Sélectionner —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
                </select>
                <FieldError msg={touched.categorie_id && fieldErrors.categorie_id} />
              </div>
            </div>

            {/* Matériel (optional) */}
            <div className="form-group">
              <label className="form-label">Matériel concerné <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optionnel)</span></label>
              <select
                className="form-input form-select"
                value={form.materiel_id}
                onChange={e => handleChange('materiel_id', e.target.value)}
              >
                <option value="">— Aucun —</option>
                {materiels.map(m => (
                  <option key={m.id} value={m.id}>{m.nom_materiel} ({m.type_materiel})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/personnel')}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Send size={16} /> {loading ? 'Envoi...' : 'Soumettre la demande'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  )
}
