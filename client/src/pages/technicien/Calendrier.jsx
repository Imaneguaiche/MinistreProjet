import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../services/api'
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Clock, Wrench, Play, CheckCircle, FileText } from 'lucide-react'
import Modal from '../../components/Modal'

// ── Helpers ────────────────────────────────────────────────────────
const DAYS_FR  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAYS_SHT = ['Lun',   'Mar',   'Mer',       'Jeu',   'Ven',      'Sam',    'Dim']

/** Build an array of 7 Date objects starting from Monday of the given week offset */
function getWeek(offsetWeeks = 0) {
  const now = new Date()
  const day  = now.getDay() === 0 ? 7 : now.getDay() // Mon=1 … Sun=7
  const mon  = new Date(now)
  mon.setDate(now.getDate() - (day - 1) + offsetWeeks * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

/** Given an intervention, pick a display color by statut */
const STATUT_STYLE = {
  en_attente: { bg: '#e0e7ff', border: '#818cf8', color: '#3730a3', label: 'À faire' },
  en_cours:   { bg: '#fef3c7', border: '#fbbf24', color: '#92400e', label: 'En cours' },
  terminee:   { bg: '#d1fae5', border: '#34d399', color: '#065f46', label: 'Terminé'  },
}

const PRIORITE_DOT = {
  basse:   '#10b981',
  normale: '#F7DC6F',
  haute:   '#f59e0b',
  urgente: '#ef4444',
}

// ── Component ──────────────────────────────────────────────────────
export default function TechnicienCalendrier() {
  const [interventions, setInterventions] = useState([])
  const [loading, setLoading]             = useState(true)
  const [weekOffset, setWeekOffset]       = useState(0)
  const [selected, setSelected]           = useState(null)
  const [actionReport, setActionReport]   = useState(null)
  const [rapport, setRapport]   = useState({ description: '', duree: '', diagnostic: '', remarque: '' })
  const [submitting, setSubmitting] = useState(false)
  
  // Absence State
  const [showAbsenceModal, setShowAbsenceModal] = useState(false)
  const [absenceData, setAbsenceData] = useState({ type: 'maladie', date_debut: '', date_fin: '', commentaire: '' })
  const [submittingAbsence, setSubmittingAbsence] = useState(false)

  const week = getWeek(weekOffset)
  const weekLabel = `${week[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${week[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const load = () => {
    setLoading(true)
    api.get('/demandes')
      .then(r => {
        const all = (r.data.data || []).flatMap(d =>
          (d.interventions || []).map(i => ({ ...i, demande: d }))
        )
        setInterventions(all)
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const demarrer = async (intervention) => {
    await api.patch(`/demandes/${intervention.demande_id}/statut`, { statut: 'en_cours' })
    load()
  }

  const submitRapport = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/rapports', { ...rapport, intervention_id: actionReport.id, duree: Number(rapport.duree) })
      setActionReport(null)
      load()
    } finally { setSubmitting(false) }
  }

  const submitAbsence = async (e) => {
    e.preventDefault()
    setSubmittingAbsence(true)
    try {
      await api.post('/indisponibilites', absenceData)
      setShowAbsenceModal(false)
      setAbsenceData({ type: 'maladie', date_debut: '', date_fin: '', commentaire: '' })
      alert('Demande d\'absence envoyée avec succès.')
    } catch (e) {
      alert('Erreur lors de la soumission de la demande.')
    } finally { setSubmittingAbsence(false) }
  }

  /**
   * Assign each intervention to a weekday column.
   * Use `created_at` date of the intervention as the scheduled day.
   * Falls back to spreading by index across the week if no date matches.
   */
  const getForDay = (date) => {
    const dateStr = date.toISOString().slice(0, 10)
    const byDate  = interventions.filter(i => {
      const d = i.created_at ? i.created_at.slice(0, 10) : null
      return d === dateStr
    })
    return byDate
  }

  // Count per statut for the summary strip
  const total    = interventions.length
  const enCours  = interventions.filter(i => i.statut === 'en_cours').length
  const termine  = interventions.filter(i => i.statut === 'terminee').length
  const aFaire   = interventions.filter(i => i.statut === 'en_attente').length

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Layout title="Calendrier">

      {/* ── Page header ──────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>Calendrier</h1>
          <p>Planning hebdomadaire de vos interventions</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button onClick={() => setShowAbsenceModal(true)} className="btn btn-primary btn-sm">
            Signaler une absence
          </button>
          <button onClick={load} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      {/* ── Summary strip ────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '.75rem',
        marginBottom: '1.5rem',
      }}>
        {[
          { label: 'À faire',   count: aFaire,  bg: '#e0e7ff', color: '#3730a3' },
          { label: 'En cours',  count: enCours,  bg: '#fef3c7', color: '#92400e' },
          { label: 'Terminées', count: termine,  bg: '#d1fae5', color: '#065f46' },
        ].map(({ label, count, bg, color }) => (
          <div key={label} style={{
            background: bg,
            borderRadius: 'var(--radius-md)',
            padding: '.875rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '.75rem',
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: '.8rem', fontWeight: 600, color }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Week navigation ─────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        padding: '.75rem 1rem',
        background: 'white',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          className="btn btn-secondary btn-sm"
          style={{ gap: '.3rem' }}
        >
          <ChevronLeft size={15} /> Préc.
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <Calendar size={16} style={{ color: 'var(--yellow-dark)' }} />
          <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--navy)' }}>
            {weekLabel}
          </span>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '.72rem', padding: '.2rem .6rem' }}
            >
              Aujourd'hui
            </button>
          )}
        </div>

        <button
          onClick={() => setWeekOffset(w => w + 1)}
          className="btn btn-secondary btn-sm"
          style={{ gap: '.3rem' }}
        >
          Suiv. <ChevronRight size={15} />
        </button>
      </div>

      {/* ── Weekly grid ─────────────────────────────────── */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>Chargement…</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '.5rem',
        }}>
          {week.map((date, idx) => {
            const dateStr   = date.toISOString().slice(0, 10)
            const isToday   = dateStr === today
            const dayItems  = getForDay(date)

            return (
              <div key={idx}>
                {/* Day header */}
                <div style={{
                  textAlign: 'center',
                  padding: '.5rem .25rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '.4rem',
                  background: isToday ? 'var(--navy)' : 'var(--gray-50)',
                  border: isToday ? '2px solid var(--yellow)' : '1.5px solid var(--gray-100)',
                }}>
                  <div style={{
                    fontSize: '.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    color: isToday ? 'var(--yellow)' : 'var(--gray-400)',
                  }}>
                    {DAYS_SHT[idx]}
                  </div>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    color: isToday ? 'white' : 'var(--navy)',
                    lineHeight: 1.1,
                  }}>
                    {date.getDate()}
                  </div>
                </div>

                {/* Day column */}
                <div style={{
                  minHeight: 200,
                  background: isToday ? 'rgba(247,220,111,.06)' : 'var(--gray-50)',
                  border: isToday ? '1.5px solid rgba(247,220,111,.4)' : '1.5px solid var(--gray-100)',
                  borderRadius: 'var(--radius)',
                  padding: '.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '.35rem',
                }}>
                  {dayItems.length === 0 ? (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--gray-300)',
                      fontSize: '.7rem',
                    }}>
                      —
                    </div>
                  ) : dayItems.map(item => {
                    const s = STATUT_STYLE[item.statut] ?? STATUT_STYLE.en_attente
                    const dotColor = PRIORITE_DOT[item.demande?.priorite] ?? '#94a3b8'
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelected(item)}
                        title={item.demande?.description}
                        style={{
                          background: s.bg,
                          border: `1.5px solid ${s.border}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '.35rem .45rem',
                          cursor: 'pointer',
                          transition: 'transform var(--transition), box-shadow var(--transition)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        {/* Priority dot */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', marginBottom: '.15rem' }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: dotColor, flexShrink: 0,
                          }} />
                          <span style={{
                            fontSize: '.62rem', fontWeight: 700,
                            color: s.color, textTransform: 'uppercase',
                            letterSpacing: '.04em',
                          }}>
                            {s.label}
                          </span>
                        </div>
                        {/* Description truncated */}
                        <div style={{
                          fontSize: '.72rem',
                          fontWeight: 600,
                          color: s.color,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.3,
                        }}>
                          {item.demande?.description ?? `Intervention #${item.id}`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── All interventions list (fallback / overview) ─ */}
      {!loading && interventions.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2 style={{
            fontWeight: 800, fontSize: '.95rem',
            color: 'var(--navy)', marginBottom: '1rem',
            display: 'flex', alignItems: 'center', gap: '.5rem',
          }}>
            <Wrench size={16} style={{ color: 'var(--yellow-dark)' }} />
            Toutes mes interventions ({total})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {interventions.map(item => {
              const s = STATUT_STYLE[item.statut] ?? STATUT_STYLE.en_attente
              const dotColor = PRIORITE_DOT[item.demande?.priorite] ?? '#94a3b8'
              return (
                <div
                  key={item.id}
                  onClick={() => setSelected(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.875rem',
                    padding: '.75rem 1rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--gray-100)',
                    background: 'var(--gray-50)',
                    cursor: 'pointer',
                    transition: 'all var(--transition)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = s.bg}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--gray-50)'}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: dotColor, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, fontSize: '.875rem', fontWeight: 600, color: 'var(--navy)' }}>
                    {item.demande?.description ?? `Intervention #${item.id}`}
                  </div>
                  <span style={{
                    fontSize: '.72rem', fontWeight: 700,
                    padding: '.22rem .65rem',
                    borderRadius: 999,
                    background: s.bg,
                    color: s.color,
                    border: `1px solid ${s.border}`,
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                    whiteSpace: 'nowrap',
                  }}>
                    {s.label}
                  </span>
                  <div style={{ fontSize: '.75rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                    <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Detail popover ───────────────────────────────── */}
      {selected && (
        <div
          className="modal-overlay"
          onClick={() => setSelected(null)}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <span className="modal-title">Détail — Intervention #{selected.id}</span>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>
            {(() => {
              const s = STATUT_STYLE[selected.statut] ?? STATUT_STYLE.en_attente
              const dotColor = PRIORITE_DOT[selected.demande?.priorite] ?? '#94a3b8'
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  <div>
                    <div style={{ fontSize: '.72rem', color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.25rem' }}>Description</div>
                    <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                      {selected.demande?.description ?? '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '.72rem', color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.25rem' }}>Statut</div>
                      <span style={{
                        fontSize: '.78rem', fontWeight: 700,
                        padding: '.25rem .75rem',
                        borderRadius: 999,
                        background: s.bg,
                        color: s.color,
                        border: `1px solid ${s.border}`,
                        textTransform: 'uppercase',
                      }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '.72rem', color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.25rem' }}>Priorité</div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.85rem', fontWeight: 700 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor }} />
                        {selected.demande?.priorite ?? '—'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.72rem', color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.25rem' }}>Catégorie</div>
                    <div style={{ fontSize: '.875rem', color: 'var(--gray-700)' }}>
                      {selected.demande?.categorie?.libelle ?? 'Sans catégorie'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.72rem', color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.25rem' }}>Date de création</div>
                    <div style={{ fontSize: '.875rem', color: 'var(--gray-700)' }}>
                      {selected.created_at ? new Date(selected.created_at).toLocaleString('fr-FR') : '—'}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-100)' }}>
                    {selected.statut === 'en_attente' && (
                      <button className="btn btn-success btn-sm" onClick={() => { demarrer(selected); setSelected(null); }}>
                        <Play size={13}/> Démarrer
                      </button>
                    )}
                    {selected.statut === 'en_cours' && (
                      <button className="btn btn-primary btn-sm" onClick={() => { setActionReport(selected); setSelected(null); }}>
                        <FileText size={13}/> Rapport
                      </button>
                    )}
                    {selected.statut === 'terminee' && (
                      <span style={{ fontSize:'.8rem', color:'#10b981', display:'flex', alignItems:'center', gap:4, paddingRight: '0.5rem' }}>
                        <CheckCircle size={14}/> Complété
                      </span>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Fermer</button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Rapport modal */}
      <Modal isOpen={!!actionReport} onClose={() => setActionReport(null)} title="Soumettre le rapport d'intervention">
        <form onSubmit={submitRapport} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div className="form-group">
            <label className="form-label">Description de l'intervention *</label>
            <textarea className="form-input" rows={3} required
              value={rapport.description}
              onChange={e => setRapport(r => ({...r, description:e.target.value}))}
              style={{ resize:'vertical' }}
            />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Durée (minutes)</label>
              <input type="number" className="form-input" min={1}
                value={rapport.duree}
                onChange={e => setRapport(r => ({...r, duree:e.target.value}))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Diagnostic</label>
              <input className="form-input"
                value={rapport.diagnostic}
                onChange={e => setRapport(r => ({...r, diagnostic:e.target.value}))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Remarques</label>
            <textarea className="form-input" rows={2} style={{ resize:'vertical' }}
              value={rapport.remarque}
              onChange={e => setRapport(r => ({...r, remarque:e.target.value}))}
            />
          </div>
          <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setActionReport(null)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Wrench size={15}/> {submitting ? 'Envoi...' : 'Soumettre'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Absence Modal */}
      <Modal isOpen={showAbsenceModal} onClose={() => setShowAbsenceModal(false)} title="Signaler une nouvelle absence">
        <form onSubmit={submitAbsence} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div className="form-group">
            <label className="form-label">Type d'absence *</label>
            <select className="form-input" required value={absenceData.type} onChange={e => setAbsenceData(d => ({...d, type: e.target.value}))}>
              <option value="maladie">Maladie</option>
              <option value="conge">Congé</option>
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Date de début *</label>
              <input type="date" className="form-input" required
                value={absenceData.date_debut}
                onChange={e => setAbsenceData(d => ({...d, date_debut:e.target.value}))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date de fin *</label>
              <input type="date" className="form-input" required
                value={absenceData.date_fin}
                onChange={e => setAbsenceData(d => ({...d, date_fin:e.target.value}))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Commentaire</label>
            <textarea className="form-input" rows={3} style={{ resize:'vertical' }}
              value={absenceData.commentaire}
              onChange={e => setAbsenceData(d => ({...d, commentaire:e.target.value}))}
            />
          </div>
          <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAbsenceModal(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={submittingAbsence}>
              {submittingAbsence ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
