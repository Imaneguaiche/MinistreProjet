import { useEffect, useState, useMemo } from 'react'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import api from '../../services/api'
import { Inbox, UserCheck, AlertTriangle, Search, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ── Inline search bar, consistent with HelpDesk design ─────────────────────
function SearchBar({ value, onChange, placeholder = 'Rechercher...' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
      padding: '0.45rem 0.85rem', marginBottom: '1rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      maxWidth: 380,
    }}>
      <Search size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          fontSize: '0.85rem', color: '#334155', width: '100%',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}
        >
          ×
        </button>
      )}
    </div>
  )
}

export default function HelpdeskReception() {
  const [demandes, setDemandes]       = useState([])
  const [techniciens, setTechniciens] = useState([])
  const [loading, setLoading]         = useState(true)
  const [apiError, setApiError]       = useState(null)
  const [selected, setSelected]       = useState(null)
  const [techId, setTechId]           = useState('')
  const [filterSpec, setFilterSpec]   = useState('Tous')
  const [rapports, setRapports]       = useState([])
  const [exportingId, setExportingId] = useState(null)
  const [rapportToExport, setRapportToExport] = useState(null)

  // ── Per-section search state ──────────────────────────────────────────────
  const [searchDemandes, setSearchDemandes] = useState('')
  const [searchRapports, setSearchRapports] = useState('')

  const load = async () => {
    setLoading(true); setApiError(null)
    try {
      const [rDem, rTech, rRap] = await Promise.all([
        api.get('/demandes'),
        api.get('/techniciens'),
        api.get('/rapports'),
      ])
      setDemandes(rDem.data.data || [])
      setTechniciens(rTech.data || [])
      setRapports(rRap.data || [])
    } catch (err) {
      setApiError("Impossible de charger les données du Helpdesk.")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredDemandes = useMemo(() => {
    const q = searchDemandes.trim().toLowerCase()
    if (!q) return demandes
    return demandes.filter(d => {
      const nom = `${d.personnel?.prenom ?? ''} ${d.personnel?.nom ?? ''}`.toLowerCase()
      const dept = d.personnel?.departement?.nom_departement?.toLowerCase() ?? ''
      const mat  = d.materiel?.nom_materiel?.toLowerCase() ?? ''
      const cat  = d.categorie?.libelle?.toLowerCase() ?? ''
      const date = d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : ''
      return (
        String(d.id).includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        nom.includes(q) ||
        dept.includes(q) ||
        mat.includes(q) ||
        cat.includes(q) ||
        d.statut?.toLowerCase().includes(q) ||
        d.priorite?.toLowerCase().includes(q) ||
        date.includes(q)
      )
    })
  }, [demandes, searchDemandes])

  const filteredRapports = useMemo(() => {
    const q = searchRapports.trim().toLowerCase()
    if (!q) return rapports
    return rapports.filter(r => {
      const tech  = `${r.intervention?.technicien?.prenom ?? ''} ${r.intervention?.technicien?.nom ?? ''}`.toLowerCase()
      const email = r.intervention?.technicien?.email?.toLowerCase() ?? ''
      const pers  = `${r.intervention?.demande?.personnel?.prenom ?? ''} ${r.intervention?.demande?.personnel?.nom ?? ''}`.toLowerCase()
      const date  = r.intervention?.date_debut
        ? new Date(r.intervention.date_debut).toLocaleDateString('fr-FR') : ''
      return (
        String(r.id).includes(q) ||
        String(r.intervention?.demande?.id ?? '').includes(q) ||
        r.remarque?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.intervention?.demande?.description?.toLowerCase().includes(q) ||
        tech.includes(q) ||
        email.includes(q) ||
        pers.includes(q) ||
        date.includes(q)
      )
    })
  }, [rapports, searchRapports])

  const handleAffecter = async (e) => {
    e.preventDefault()
    if (!techId) return
    await api.patch(`/demandes/${selected.id}/affecter`, { technicien_id: Number(techId) })
    setSelected(null); setTechId(''); load()
  }

  // ── Print Logic for individual Report (NATIVE BROWSER PRINT) ──
  const triggerExport = (r) => {
      setExportingId(r.id)
      setRapportToExport(r)
      
      // Laisser le DOM s'actualiser avec le template
      setTimeout(() => {
          // Add listener to clear after print dialog closes
          window.addEventListener('afterprint', () => {
              setExportingId(null)
              setRapportToExport(null)
          }, { once: true })
          
          window.print()
      }, 500)
  }

  // Hide the main content from print layout when exporting an individual report
  const mainContentPrintStyle = rapportToExport ? 'none' : 'block'

  return (
    <Layout title="Réception">
      <style>{`
        @media print {
            .hide-on-individual-print { display: ${mainContentPrintStyle} !important; }
        }
      `}</style>
      
      <div className="page-header hide-on-individual-print">
        <div>
          <h1>Tableau de bord HelpDesk</h1>
          <p>Supervisez les demandes du personnel et les rapports des techniciens</p>
        </div>
      </div>

      {/* ── SECTION 1: Demandes du Personnel ─────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }} className="hide-on-individual-print">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>
          Demandes des personnels
        </h2>
        <div className="card">
          {loading ? (
            <p style={{ textAlign:'center', color:'#94a3b8', padding:'2rem' }}>Chargement...</p>
          ) : apiError ? (
            <div className="empty-state"><p style={{ color:'#ef4444', fontWeight:600 }}>{apiError}</p></div>
          ) : (
            <>
              <SearchBar
                value={searchDemandes}
                onChange={setSearchDemandes}
                placeholder="Rechercher par ID, nom, département, matériel, statut..."
              />
              {filteredDemandes.length === 0 ? (
                <div className="empty-state">
                  <Inbox />
                  <p>{searchDemandes ? 'Aucun résultat trouvé' : 'Aucune demande trouvée'}</p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead><tr>
                      <th>#</th><th>Description</th><th>Personnel</th>
                      <th>Priorité</th><th>Statut</th><th>Catégorie</th><th>Action</th>
                    </tr></thead>
                    <tbody>
                      {filteredDemandes.map(d => (
                        <tr key={d.id} style={d.reclamations?.length > 0 ? { backgroundColor: '#fef2f2' } : {}}>
                          <td style={{ color:'#94a3b8', fontSize:'0.8rem' }}>#{d.id}</td>
                          <td style={{ maxWidth: 250 }}>
                            {d.reclamations && d.reclamations.length > 0 && (
                              <div style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:'#ef4444', color:'#fff', padding:'2px 6px', borderRadius:'4px', fontSize:'0.7rem', fontWeight:600, marginBottom:'6px' }}>
                                <AlertTriangle size={12} /> Demande en retard signalée
                              </div>
                            )}
                            <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {d.description}
                            </div>
                          </td>
                          <td style={{ fontSize:'0.85rem' }}>{d.personnel?.prenom} {d.personnel?.nom}</td>
                          <td><StatusBadge status={d.priorite} /></td>
                          <td><StatusBadge status={d.statut} /></td>
                          <td style={{ fontSize:'0.82rem', color:'#64748b' }}>{d.categorie?.libelle ?? '—'}</td>
                          <td>
                            {['nouvelle','en_attente'].includes(d.statut) ? (
                              <button className="btn btn-primary btn-sm" onClick={() => { setSelected(d); setTechId('') }}>
                                <UserCheck size={13} /> Affecter
                              </button>
                            ) : (
                              d.interventions?.length > 0 ? (
                                <div style={{ fontSize:'0.8rem', color:'#475569', lineHeight:1.3 }}>
                                  <span style={{ fontWeight:600 }}>Assigné à :</span><br />
                                  {d.interventions[0].technicien?.prenom} {d.interventions[0].technicien?.nom}
                                </div>
                              ) : <span style={{ color:'#94a3b8' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── SECTION 2: Rapports des Techniciens ──────────────────────────── */}
      <div className="hide-on-individual-print">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>
          Rapports des techniciens
        </h2>
        <div className="card">
          {loading ? (
            <p style={{ textAlign:'center', color:'#94a3b8', padding:'2rem' }}>Chargement...</p>
          ) : (
            <>
              <SearchBar
                value={searchRapports}
                onChange={setSearchRapports}
                placeholder="Rechercher par ID rapport, technicien, demande, remarque..."
              />
              {filteredRapports.length === 0 ? (
                <div className="empty-state">
                  <Inbox />
                  <p>{searchRapports ? 'Aucun résultat trouvé' : 'Aucun rapport trouvé'}</p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead><tr>
                      <th>Rapport #</th><th>Demande #</th><th>Intervention</th>
                      <th>Technicien</th><th>Date de début</th><th>Date fin</th><th>Remarque</th><th>Action</th>
                    </tr></thead>
                    <tbody>
                      {filteredRapports.map(r => (
                        <tr key={r.id}>
                          <td style={{ color:'#94a3b8', fontSize:'0.8rem' }}>R-{r.id}</td>
                          <td style={{ fontSize:'0.85rem' }}>#{r.intervention?.demande?.id}</td>
                          <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.85rem' }}>
                            {r.intervention?.demande?.description ?? 'N/A'}
                          </td>
                          <td style={{ fontSize:'0.85rem' }}>
                            {r.intervention?.technicien?.prenom} {r.intervention?.technicien?.nom}
                          </td>
                          <td style={{ fontSize:'0.85rem' }}>
                            {r.intervention?.date_debut
                              ? new Date(r.intervention.date_debut).toLocaleDateString('fr-FR')
                              : '—'}
                          </td>
                          <td style={{ fontSize:'0.85rem' }}>
                            {r.intervention?.date_fin
                              ? new Date(r.intervention.date_fin).toLocaleDateString('fr-FR')
                              : '—'}
                          </td>
                          <td style={{ maxWidth:250, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.85rem' }}>
                            {r.remarque || 'Aucune remarque'}
                          </td>
                          <td>
                            <button 
                               className="btn btn-secondary btn-sm" 
                               onClick={() => triggerExport(r)} 
                               disabled={exportingId === r.id}
                               style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                            >
                               <Download size={14} /> {exportingId === r.id ? 'Export...' : 'PDF'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Affecter Modal ────────────────────────────────────────────────── */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Affecter la demande">
        <div style={{ marginBottom:'1rem', padding:'0.75rem', background:'#f8fafc', borderRadius:8 }}>
          <p style={{ fontWeight:600, fontSize:'0.875rem', marginBottom:4 }}>Demande #{selected?.id}</p>
          <p style={{ fontSize:'0.82rem', color:'#64748b' }}>{selected?.description}</p>
        </div>
        <form onSubmit={handleAffecter} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div>
            <label className="form-label">Technicien *</label>
            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
              {['Tous','Software','Hardware','Réseau','Autre'].map(s => (
                <button
                  key={s} type="button" onClick={() => setFilterSpec(s)}
                  className="badge"
                  style={{ cursor:'pointer', border:'none', padding:'0.4rem 0.8rem', background: filterSpec===s ? '#3b82f6' : '#e2e8f0', color: filterSpec===s ? '#fff' : '#475569' }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight:'280px', overflowY:'auto', paddingRight:'0.25rem' }}>
              {techniciens.filter(t => filterSpec === 'Tous' || t.specialite === filterSpec).map(t => {
                const isSelected = String(techId) === String(t.id)
                const isDispo    = t.disponibilite === 'disponible'
                return (
                  <label key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem', border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0', borderRadius:8, cursor: isDispo ? 'pointer' : 'not-allowed', background: isDispo ? '#fff' : '#f8fafc', opacity: isDispo ? 1 : 0.6, transition:'all 0.2s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <input type="radio" name="tech_select" value={t.id} checked={isSelected}
                        onChange={e => { if (isDispo) setTechId(e.target.value) }}
                        disabled={!isDispo} style={{ margin:0, cursor: isDispo ? 'pointer' : 'not-allowed' }} />
                      <div>
                        <div style={{ fontWeight:600, fontSize:'0.9rem', color:'#0f172a' }}>{t.prenom} {t.nom}</div>
                        <div style={{ fontSize:'0.8rem', color:'#64748b' }}>{t.specialite} {t.interventions_count > 0 ? `• ${t.interventions_count} intervention(s)` : ''}</div>
                      </div>
                    </div>
                    <StatusBadge status={t.disponibilite} />
                  </label>
                )
              })}
              {techniciens.filter(t => filterSpec === 'Tous' || t.specialite === filterSpec).length === 0 && (
                <p style={{ fontSize:'0.85rem', color:'#64748b', textAlign:'center', padding:'1rem', border:'1px dashed #cbd5e1', borderRadius:8 }}>
                  Aucun technicien trouvé pour cette spécialité.
                </p>
              )}
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={!techId}>
              <UserCheck size={15} /> Confirmer
            </button>
          </div>
        </form>
      </Modal>

      {/* ── HIDDEN EXPORT TEMPLATE FOR INDIVIDUAL REPORTS ── */}
      {rapportToExport && (
         <div id="individual-rapport-export" style={{ background: '#fff', width: '100%', padding: '0' }}>
            {/* EN-TÊTE PDF INVISIBLE NORMALEMENT (VISIBLE SEULEMENT A L'IMPRESSION VIA MEDIA PRINT) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', width: '100%' }}>
              <img src="/images/logo_export.png" alt="Logo Ministère" style={{ height: '120px', objectFit: 'contain', marginBottom: '2rem' }} />
              <h1 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 900 }}>Détail du Rapport Technicien</h1>
              <h2 style={{ fontSize: '15px', color: '#475569', margin: '0', fontWeight: '600' }}>Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</h2>
            </div>

            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '1.5rem', background: '#f8fafc', overflow: 'hidden' }}>
              <div style={{ background: '#1e293b', color: '#fff', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '14px' }}>Rapport #R-{rapportToExport.id}</span>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>Demande #D-{rapportToExport.intervention?.demande?.id || 'N/A'}</span>
              </div>
              
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '13px' }}>
                {/* Colonne Gauche */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '12px', fontWeight: 800 }}>Informations Générales</h4>
                  <div style={{ marginBottom: 6 }}><strong>Créé le :</strong> {new Date(rapportToExport.created_at).toLocaleString('fr-FR')}</div>
                  <div style={{ marginBottom: 6 }}><strong>Durée d'intervention :</strong> {rapportToExport.duree ? `${(rapportToExport.duree / 60).toFixed(1)} heures` : '—'}</div>
                  <div style={{ marginBottom: 6 }}><strong>Réclamation retard :</strong> {(rapportToExport.intervention?.demande?.reclamations?.length > 0) ? <span style={{color: '#ef4444', fontWeight: 700}}>OUI</span> : 'Non'}</div>
                  
                  <h4 style={{ margin: '20px 0 10px 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '12px', fontWeight: 800 }}>Informations de la Demande</h4>
                  <div style={{ marginBottom: 6 }}><strong>Demandeur :</strong> {rapportToExport.intervention?.demande?.personnel ? `${rapportToExport.intervention.demande.personnel.prenom} ${rapportToExport.intervention.demande.personnel.nom}` : '—'}</div>
                  <div style={{ marginBottom: 6 }}><strong>Département :</strong> {rapportToExport.intervention?.demande?.personnel?.departement?.nom_departement || '—'}</div>
                  <div style={{ marginBottom: 6 }}><strong>Catégorie :</strong> {rapportToExport.intervention?.demande?.categorie?.libelle || '—'}</div>
                  <div style={{ marginBottom: 6 }}><strong>Statut Global :</strong> {rapportToExport.intervention?.demande?.statut || '—'}</div>
                </div>
                
                {/* Colonne Droite */}
                <div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '12px', fontWeight: 800 }}>Informations du Matériel</h4>
                    <div style={{ marginBottom: 6 }}><strong>Matériel concerné :</strong> {rapportToExport.intervention?.demande?.materiel?.nom_materiel || 'Aucun'}</div>
                    <div style={{ marginBottom: 6 }}><strong>État Matériel :</strong> {rapportToExport.intervention?.demande?.materiel?.etat || '—'}</div>
                    
                    <h4 style={{ margin: '20px 0 10px 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '12px', fontWeight: 800 }}>Informations du Technicien</h4>
                    <div style={{ marginBottom: 6 }}><strong>Technicien affecté :</strong> {rapportToExport.intervention?.technicien?.nom ? `${rapportToExport.intervention.technicien.prenom} ${rapportToExport.intervention.technicien.nom}` : '—'}</div>
                    <div style={{ marginBottom: 6 }}><strong>Mise à disposition :</strong> {rapportToExport.intervention?.date_debut ? new Date(rapportToExport.intervention.date_debut).toLocaleString('fr-FR') : '—'}</div>
                    <div style={{ marginBottom: 6 }}><strong>Résolution finalisée :</strong> {rapportToExport.intervention?.date_fin ? new Date(rapportToExport.intervention.date_fin).toLocaleString('fr-FR') : '—'}</div>
                </div>
              </div>
              
              <div style={{ padding: '0 20px 20px', fontSize: '13px' }}>
                 <h4 style={{ margin: '0 0 8px 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '12px', fontWeight: 800 }}>Symptômes et Motif / Description originale</h4>
                 <p style={{ background: '#e2e8f0', padding: '12px', borderRadius: '4px', margin: 0, fontStyle: 'italic', borderLeft: '3px solid #94a3b8' }}>
                   {rapportToExport.intervention?.demande?.description || '—'}
                 </p>
              </div>
              
              <div style={{ padding: '0 20px 20px', fontSize: '13px' }}>
                 <h4 style={{ margin: '0 0 8px 0', color: '#10b981', textTransform: 'uppercase', fontSize: '12px', fontWeight: 800 }}>Résolution / Remarque du Technicien</h4>
                 <p style={{ background: '#ecfdf5', padding: '12px', borderRadius: '4px', margin: 0, borderLeft: '3px solid #10b981', fontWeight: 600 }}>
                   {rapportToExport.remarque || '—'}
                 </p>
              </div>
            </div>
         </div>
      )}
    </Layout>
  )
}
