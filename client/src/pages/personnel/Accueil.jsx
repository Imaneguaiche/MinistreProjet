import { useEffect, useState, useCallback } from 'react'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Modal from '../../components/Modal'
import { FileText, Clock, CheckCircle, Plus, AlertTriangle, Send, Pencil, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const styles = {
    success: { bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: <CheckCircle size={16} /> },
    error:   { bg: '#fff7ed', border: '#fed7aa', color: '#9a3412', icon: <AlertTriangle size={16} /> },
  }
  const s = styles[type] || styles.success

  return (
    <div style={{
      position: 'fixed', top: 22, right: 26, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      padding: '0.7rem 1.1rem',
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10,
      color: s.color, fontWeight: 600, fontSize: '0.875rem',
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      animation: 'toastIn 0.22s ease',
    }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
      {s.icon}
      {message}
      <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:s.color, display:'flex', marginLeft:4, padding:0 }}>
        <X size={14} />
      </button>
    </div>
  )
}

// ── Action button ───────────────────────────────────────────────────────────
function ActionBtn({ onClick, disabled, icon: Icon, label, variant = 'default', loading = false }) {
  const [hovered, setHovered] = useState(false)

  const variants = {
    default: {
      base:  { background: '#fff', border: '1px solid #cbd5e1', color: '#334155' },
      hover: { background: '#f1f5f9', borderColor: '#94a3b8' },
    },
    primary: {
      base:  { background: '#2563eb', border: '1px solid #2563eb', color: '#fff' },
      hover: { background: '#1d4ed8', borderColor: '#1d4ed8' },
    },
    warning: {
      base:  { background: '#fff7ed', border: '1px solid #fb923c', color: '#c2410c' },
      hover: { background: '#ffedd5', borderColor: '#f97316' },
    },
  }

  const v = variants[variant] || variants.default
  const style = {
    ...v.base,
    ...(hovered && !disabled ? v.hover : {}),
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '6px 12px', borderRadius: 8, fontWeight: 500, fontSize: '0.8rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.55 : 1,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    transition: 'all 0.15s ease',
    transform: hovered && !disabled ? 'scale(1.02)' : 'scale(1)',
    whiteSpace: 'nowrap',
  }

  return (
    <button
      onClick={!disabled && !loading ? onClick : undefined}
      disabled={disabled || loading}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon size={13} />
      {loading ? 'En cours...' : label}
    </button>
  )
}

// ── Field error ─────────────────────────────────────────────────────────────
const FieldErr = ({ msg }) => msg
  ? <span style={{ color:'#ef4444', fontSize:'0.75rem', marginTop:3, display:'block', fontWeight:500 }}>{msg}</span>
  : null

export default function PersonnelAccueil() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [demandes, setDemandes]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [apiError, setApiError]     = useState(null)
  const [toast, setToast]           = useState(null)

  // Per-row loading state for instant complaint button
  const [reclamLoading, setReclamLoading] = useState({}) // { [demandeId]: true }

  // Edit modal state
  const [editModal, setEditModal]       = useState(false)
  const [targetDemande, setTargetDemande] = useState(null)
  const [editForm, setEditForm]         = useState({ description: '', priorite: 'normale', categorie_id: '' })
  const [editErrors, setEditErrors]     = useState({})
  const [editSaving, setEditSaving]     = useState(false)
  const [editApiError, setEditApiError] = useState('')

  const showToast = (message, type = 'success') => setToast({ message, type })
  const closeToast = useCallback(() => setToast(null), [])

  const fetchDemandes = () => {
    setLoading(true); setApiError(null)
    Promise.all([api.get('/demandes'), api.get('/categories')])
      .then(([rDem, rCat]) => {
        setDemandes(rDem.data.data || [])
        const seen = new Set()
        setCategories((rCat.data || []).filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true }))
      })
      .catch(() => setApiError("Impossible de charger vos demandes."))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchDemandes() }, [])

  // ── Instant réclamation (no modal, no form) ─────────────────────────────
  const handleReclamation = async (demande) => {
    setReclamLoading(s => ({ ...s, [demande.id]: true }))
    try {
      await api.post('/reclamations', { demande_id: demande.id })
      // Optimistically update local state so button disappears immediately
      setDemandes(prev => prev.map(d =>
        d.id === demande.id ? { ...d, reclamations: [{ id: Date.now() }] } : d
      ))
      showToast('Réclamation de retard envoyée avec succès ✓')
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'envoi.", 'error')
    } finally {
      setReclamLoading(s => ({ ...s, [demande.id]: false }))
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────
  const openEdit = (d) => {
    setTargetDemande(d)
    setEditForm({ description: d.description, priorite: d.priorite, categorie_id: d.categorie_id ?? '' })
    setEditErrors({}); setEditApiError(''); setEditModal(true)
  }

  const validateEdit = (f) => {
    const errs = {}
    if (!f.description || f.description.trim().length < 10)
      errs.description = 'La description doit contenir au moins 10 caractères.'
    if (!f.priorite)     errs.priorite = 'Veuillez sélectionner une priorité.'
    if (!f.categorie_id) errs.categorie_id = 'Veuillez sélectionner une catégorie.'
    return errs
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    const errs = validateEdit(editForm)
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return }
    setEditSaving(true); setEditApiError('')
    try {
      const updated = await api.patch(`/demandes/${targetDemande.id}`, editForm)
      setEditModal(false)
      // Optimistic update
      setDemandes(prev => prev.map(d => d.id === targetDemande.id ? { ...d, ...updated.data } : d))
      showToast('Demande modifiée avec succès ✓')
    } catch (err) {
      setEditApiError(err.response?.data?.message || 'Erreur lors de la modification.')
    } finally {
      setEditSaving(false)
    }
  }

  const counts = {
    total:    demandes.length,
    nouvelles: demandes.filter(d => d.statut === 'nouvelle').length,
    enCours:  demandes.filter(d => ['affectee','en_cours'].includes(d.statut)).length,
    resolues: demandes.filter(d => d.statut === 'resolue').length,
  }

  return (
    <Layout title="Tableau de bord">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div className="page-header">
        <div>
          <h1>Bonjour, {user?.prenom} 👋</h1>
          <p>Gérez vos demandes d'intervention technique</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/personnel/nouvelle-demande')}>
          <Plus size={16} /> Nouvelle demande
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total demandes',  value: counts.total,     icon: FileText,    color: '#1e40af', bg: '#dbeafe' },
          { label: 'Nouvelles',       value: counts.nouvelles,  icon: Plus,        color: '#0ea5e9', bg: '#e0f2fe' },
          { label: 'En cours',        value: counts.enCours,    icon: Clock,       color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Résolues',        value: counts.resolues,   icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card" style={{ borderLeftColor: color }}>
            <div className="stat-icon" style={{ background: bg }}><Icon size={20} style={{ color }} /></div>
            <div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Mes demandes récentes</h2>

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Chargement...</p>
        ) : apiError ? (
          <div className="empty-state"><p style={{ color:'#ef4444', fontWeight:600 }}>{apiError}</p></div>
        ) : demandes.length === 0 ? (
          <div className="empty-state"><FileText /><p>Aucune demande pour le moment</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr>
                <th>#</th><th>Description</th><th>Catégorie</th>
                <th>Priorité</th><th>Statut</th><th>Date</th>
                <th style={{ minWidth: 180 }}>Actions</th>
              </tr></thead>
              <tbody>
                {demandes.map(d => {
                  const isActive       = !['resolue','cloturee','rejetee'].includes(d.statut)
                  const hasReclamation = d.reclamations?.length > 0
                  const canEdit        = d.statut === 'nouvelle'
                  const reclamPending  = !!reclamLoading[d.id]

                  return (
                    <tr key={d.id}>
                      <td style={{ color:'#94a3b8', fontSize:'0.8rem' }}>#{d.id}</td>
                      <td style={{ maxWidth: 210, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.description}</td>
                      <td style={{ fontSize:'0.82rem' }}>{d.categorie?.libelle ?? '—'}</td>
                      <td><StatusBadge status={d.priorite} /></td>
                      <td><StatusBadge status={d.statut} /></td>
                      <td style={{ color:'#64748b', fontSize:'0.8rem' }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <div style={{ display:'flex', flexWrap:'wrap', gap: 8, alignItems:'center' }}>

                          {/* ── Modifier ──────────────────────────── */}
                          {canEdit && (
                            <ActionBtn
                              variant="primary"
                              icon={Pencil}
                              label="Modifier"
                              onClick={() => openEdit(d)}
                            />
                          )}

                          {/* ── Réclamation ── instant, one click ── */}
                          {isActive && !hasReclamation && (
                            <ActionBtn
                              variant="warning"
                              icon={AlertTriangle}
                              label="Réclamation de retard"
                              loading={reclamPending}
                              onClick={() => handleReclamation(d)}
                            />
                          )}

                          {/* ── Already flagged ─────────────────── */}
                          {isActive && hasReclamation && (
                            <span style={{
                              display:'inline-flex', alignItems:'center', gap:4,
                              fontSize:'0.78rem', color:'#c2410c', fontWeight:600,
                              padding:'4px 8px', background:'#fff7ed', borderRadius:6,
                              border:'1px solid #fed7aa',
                            }}>
                              <AlertTriangle size={12} /> Retard signalé
                            </span>
                          )}

                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Modifier la demande">
        <div style={{
          padding:'0.65rem 0.85rem', marginBottom:'0.85rem',
          background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8,
          fontSize:'0.82rem', color:'#1d4ed8', display:'flex', alignItems:'center', gap:6,
        }}>
          <Pencil size={14} style={{ flexShrink:0 }} />
          Modifiable uniquement tant qu'elle n'est pas encore prise en charge.
        </div>

        {editApiError && (
          <div style={{
            padding:'0.65rem 0.85rem', marginBottom:'0.75rem',
            background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8,
            fontSize:'0.84rem', color:'#dc2626', fontWeight:500,
          }}>
            {editApiError}
          </div>
        )}

        <form onSubmit={handleEdit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }} noValidate>
          <div>
            <label className="form-label">Description *</label>
            <textarea
              className="form-input" rows={4}
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              style={{ resize:'vertical', borderColor: editErrors.description ? '#ef4444' : undefined }}
            />
            <FieldErr msg={editErrors.description} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div>
              <label className="form-label">Priorité *</label>
              <select className="form-input form-select" value={editForm.priorite}
                onChange={e => setEditForm(f => ({ ...f, priorite: e.target.value }))}
                style={{ borderColor: editErrors.priorite ? '#ef4444' : undefined }}>
                <option value="">— Sélectionner —</option>
                <option value="basse">Basse</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
              <FieldErr msg={editErrors.priorite} />
            </div>
            <div>
              <label className="form-label">Catégorie *</label>
              <select className="form-input form-select" value={editForm.categorie_id}
                onChange={e => setEditForm(f => ({ ...f, categorie_id: e.target.value }))}
                style={{ borderColor: editErrors.categorie_id ? '#ef4444' : undefined }}>
                <option value="">— Sélectionner —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
              </select>
              <FieldErr msg={editErrors.categorie_id} />
            </div>
          </div>

          <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={editSaving}>
              {editSaving ? 'Enregistrement...' : <><Send size={14} /> Enregistrer les modifications</>}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
