import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import api from '../../services/api'
import { Wrench, Play, CheckCircle, FileText } from 'lucide-react'

const COLS = [
  { key: 'en_attente', label: 'À faire', color: '#94a3b8', border: '#e2e8f0' },
  { key: 'en_cours',   label: 'En cours', color: '#f59e0b', border: '#fbbf24' },
  { key: 'terminee',   label: 'Terminé',  color: '#10b981', border: '#34d399' },
]

export default function TechnicienTaches() {
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [rapport, setRapport]   = useState({ remarque: '', date_debut: '', date_fin: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const openRapport = (intervention) => {
    setError('')
    setRapport({ remarque: '', date_debut: '', date_fin: '' })
    setSelected(intervention)
  }

  const load = () => api.get('/demandes').then(r => setDemandes(r.data.data || [])).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  // Group by intervention status
  const interventions = demandes.flatMap(d =>
    (d.interventions || []).map(i => ({ ...i, demande: d }))
  )
  const byCol = (key) => interventions.filter(i => i.statut === key)

  const demarrer = async (intervention) => {
    await api.patch(`/interventions/${intervention.id}/statut`, { statut: 'en_cours' })
    load()
  }

  const submitRapport = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/rapports', { ...rapport, intervention_id: selected.id })
      setSelected(null)
      setRapport({ remarque: '', date_debut: '', date_fin: '' })
      load()
    } catch (err) {
      setError(err?.response?.data?.message || 'Une erreur est survenue. Vérifiez les dates.')
    } finally { setSubmitting(false) }
  }

  return (
    <Layout title="Tableau de bord">
      <div className="page-header">
        <div><h1>Mes interventions</h1><p>Gérez vos tâches techniques assignées</p></div>
      </div>

      {loading ? <p style={{ color:'#94a3b8', textAlign:'center', padding:'3rem' }}>Chargement...</p> : (
        <div className="kanban-grid">
          {COLS.map(col => {
            const cards = byCol(col.key)
            return (
              <div key={col.key} className="kanban-col">
                <div className="kanban-col-header">
                  <span style={{ color: col.color }}>{col.label}</span>
                  <span style={{ background: col.color, color:'white', borderRadius:999, padding:'0 8px', fontSize:'0.75rem', fontWeight:700 }}>{cards.length}</span>
                </div>

                {cards.length === 0
                  ? <p style={{ color:'#94a3b8', fontSize:'0.8rem', textAlign:'center', padding:'1rem' }}>Aucune tâche</p>
                  : cards.map(i => (
                    <div key={i.id} className="kanban-card" style={{ borderLeftColor: col.border }}>
                      <div style={{ fontWeight:600, fontSize:'0.85rem', marginBottom:'0.4rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {i.demande?.description}
                      </div>
                      <div style={{ display:'flex', gap:'0.4rem', marginBottom:'0.5rem', flexWrap:'wrap' }}>
                        <StatusBadge status={i.demande?.priorite} />
                        <span style={{ fontSize:'0.72rem', color:'#64748b' }}>#{i.demande?.id}</span>
                      </div>
                      <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginBottom:'0.5rem' }}>
                        {i.demande?.categorie?.libelle ?? 'Sans catégorie'}
                      </div>
                      <div style={{ display:'flex', gap:'0.4rem' }}>
                        {i.statut === 'en_attente' && (
                          <button className="btn btn-success btn-sm" onClick={() => demarrer(i)}>
                            <Play size={12}/> Démarrer
                          </button>
                        )}
                        {i.statut === 'en_cours' && (
                          <button className="btn btn-primary btn-sm" onClick={() => openRapport(i)}>
                            <CheckCircle size={12}/> Terminer la tâche
                          </button>
                        )}
                        {i.statut === 'terminee' && (
                          <span style={{ fontSize:'0.75rem', color:'#10b981', display:'flex', alignItems:'center', gap:4 }}>
                            <CheckCircle size={13}/> Complété
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setError('') }} title="Soumettre le rapport d'intervention">
        <form onSubmit={submitRapport} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem', fontSize: '0.85rem', color: '#b91c1c' }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Remarque / commentaire *</label>
            <textarea className="form-input" rows={4} required
              value={rapport.remarque}
              onChange={e => setRapport(r => ({...r, remarque:e.target.value}))}
              style={{ resize:'vertical' }}
            />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Date de début *</label>
              <input type="datetime-local" className="form-input" required
                value={rapport.date_debut}
                onChange={e => setRapport(r => ({...r, date_debut:e.target.value}))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date de fin *</label>
              <input type="datetime-local" className="form-input" required
                value={rapport.date_fin}
                onChange={e => setRapport(r => ({...r, date_fin:e.target.value}))}
              />
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setSelected(null); setError('') }}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Wrench size={15}/> {submitting ? 'Envoi...' : 'Soumettre'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
