import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Modal from '../../components/Modal'
import StatusBadge from '../../components/StatusBadge'
import api from '../../services/api'
import { Users, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

const ROLES = ['personnel','technicien','helpdesk','admin']
const empty = { nom:'', prenom:'', email:'', mot_de_passe:'', telephone:'', role:'personnel', departement_id:'', specialite:'', numero_bureau:'' }

export default function AdminUtilisateurs({ filterRole }) {
  const [users, setUsers] = useState([])
  const [departements, setDepartements] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  
  // Indisponibilités state
  const [indisponibilites, setIndisponibilites] = useState([])
  const [activeTab, setActiveTab] = useState('list')

  const [apiError, setApiError] = useState(null)

  const load = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const [rUsers, rDep, rInd] = await Promise.all([
        api.get('/utilisateurs'),
        api.get('/departements'),
        api.get('/indisponibilites')
      ])
      let data = rUsers.data.data || []
      if (filterRole) data = data.filter(u => u.role === filterRole)
      setUsers(data)
      setDepartements(rDep.data || [])
      setIndisponibilites(rInd.data || [])
    } catch (err) {
      setApiError("Impossible de charger les données. Veuillez vérifier votre connexion.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filterRole])

  const openCreate = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (u) => { setForm({ ...u, mot_de_passe:'', specialite: u.technicien?.specialite||'', numero_bureau: u.numero_bureau||'' }); setEditing(u.id); setModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)
    try {
      const payload = { ...form }
      if (!payload.mot_de_passe) delete payload.mot_de_passe
      if (editing) await api.put(`/utilisateurs/${editing}`, payload)
      else await api.post('/utilisateurs', payload)
      setModal(false)
      load()
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement.")
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      await api.delete(`/utilisateurs/${id}`)
      load()
    } catch (err) {
      alert("Erreur lors de la suppression.")
    }
  }

  const toggleStatus = async (id) => {
    try {
      await api.patch(`/techniciens/${id}/disponibilite`)
      load()
    } catch (err) {
      alert("Erreur lors du changement de statut.")
    }
  }

  const handleIndispStatus = async (id, status) => {
    try {
      await api.patch(`/indisponibilites/${id}/statut`, { statut: status })
      load()
    } catch (err) {
      alert("Erreur lors du changement de statut d'indisponibilité.")
    }
  }

  const handleReactivate = async (id) => {
    if (!confirm('Réactiver ce technicien manuellement avant la fin du congé ?')) return
    await api.post(`/indisponibilites/${id}/reactivate`)
    load()
  }

  const ROLE_COLORS = { personnel:'#0ea5e9', technicien:'#8b5cf6', helpdesk:'#f59e0b', admin:'#ef4444' }

  return (
    <Layout title={filterRole === 'technicien' ? "Techniciens" : "Utilisateurs"}>
      <div className="page-header">
        <div>
          <h1>{filterRole === 'technicien' ? 'Gestion des techniciens' : 'Gestion des utilisateurs'}</h1>
          <p>{users.length} {filterRole === 'technicien' ? 'techniciens' : 'utilisateurs'} dans le système</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {filterRole === 'technicien' && (
            <div style={{ display: 'flex', gap: '4px', background: 'var(--gray-100)', padding: '4px', borderRadius: 'var(--radius)' }}>
              <button type="button" className={`btn btn-sm ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('list')} style={{border:'none', boxShadow:'none'}}>Techniciens</button>
              <button type="button" className={`btn btn-sm ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('requests')} style={{border:'none', boxShadow:'none'}}>
                Requêtes {indisponibilites.filter(i => i.statut === 'en_attente').length > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '0 6px', marginLeft: 6 }}>{indisponibilites.filter(i => i.statut === 'en_attente').length}</span>}
              </button>
            </div>
          )}
          {activeTab === 'list' && <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/>Nouveau</button>}
        </div>
      </div>
      <div className="card">
        {loading ? <p style={{textAlign:'center',color:'#94a3b8',padding:'2rem'}}>Chargement...</p> 
          : apiError ? (
            <div className="empty-state">
              <p style={{ color: '#ef4444', fontWeight: 600 }}>{apiError}</p>
            </div>
          )
          : activeTab === 'list' || filterRole !== 'technicien' ? (
          <div className="table-container">
            <table>
              <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Département</th>{(!filterRole || filterRole === 'personnel') && <th>Bureau</th>}{filterRole === 'technicien' && <th>Statut</th>}<th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:ROLE_COLORS[u.role]+'22', color:ROLE_COLORS[u.role], display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.75rem', flexShrink:0 }}>
                          {u.prenom?.[0]}{u.nom?.[0]}
                        </div>
                        <span style={{ fontWeight:500 }}>{u.prenom} {u.nom}</span>
                      </div>
                    </td>
                    <td style={{ color:'#64748b', fontSize:'0.85rem' }}>{u.email}</td>
                    <td><span className="badge" style={{ background:ROLE_COLORS[u.role]+'22', color:ROLE_COLORS[u.role] }}>{u.role}</span></td>
                    <td style={{ fontSize:'0.85rem', color:'#64748b' }}>{u.departement?.nom_departement ?? '—'}</td>
                    {(!filterRole || filterRole === 'personnel') && (
                      <td style={{ fontSize:'0.85rem', color:'#64748b', fontWeight:500 }}>
                        {u.role === 'personnel' ? (u.numero_bureau || 'Non défini') : '—'}
                      </td>
                    )}
                    {filterRole === 'technicien' && (
                      <td>
                        {u.technicien ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <StatusBadge status={u.technicien.disponibilite} />
                            <button onClick={()=>toggleStatus(u.id)} className={`btn btn-sm ${u.technicien.disponibilite === 'disponible' ? 'btn-danger' : 'btn-success'}`}>
                              {u.technicien.disponibilite === 'disponible' ? <ToggleRight size={14}/> : <ToggleLeft size={14}/>}
                            </button>
                          </div>
                        ) : '—'}
                      </td>
                    )}
                    <td>
                      <button className="btn btn-secondary btn-sm" style={{ marginRight:4 }} onClick={() => openEdit(u)}><Pencil size={13}/></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}><Trash2 size={13}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Technicien</th><th>Type</th><th>Période</th><th>Statut</th><th>Commentaire</th><th>Action</th></tr></thead>
              <tbody>
                {indisponibilites.length === 0 ? <tr><td colSpan="6" style={{textAlign:'center',color:'#94a3b8'}}>Aucune requête trouvée</td></tr> : indisponibilites.map(i => (
                  <tr key={i.id}>
                    <td style={{fontWeight:600}}>{i.technicien?.prenom} {i.technicien?.nom}</td>
                    <td style={{textTransform:'capitalize'}}>{i.type}</td>
                    <td style={{fontSize:'0.85rem'}}>
                      {new Date(i.date_debut).toLocaleDateString('fr-FR')} au {new Date(i.date_fin).toLocaleDateString('fr-FR')}
                    </td>
                    <td><StatusBadge status={i.statut} /></td>
                    <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:'0.85rem'}}>{i.commentaire || '—'}</td>
                    <td>
                      {i.statut === 'en_attente' && (
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn btn-success btn-sm" onClick={() => handleIndispStatus(i.id, 'approuve')}>Approuver</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleIndispStatus(i.id, 'refuse')}>Refuser</button>
                        </div>
                      )}
                      {i.statut === 'approuve' && !i.is_processed && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleReactivate(i.id)}
                          title="Réactiver manuellement avant la fin du congé">
                          ↩ Réactiver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editing ? 'Modifier utilisateur' : 'Nouvel utilisateur'}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.9rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div className="form-group"><label className="form-label">Prénom *</label><input className="form-input" value={form.prenom} onChange={e=>setForm(f=>({...f,prenom:e.target.value}))} required/></div>
            <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} required/></div>
          </div>
          <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required/></div>
          <div className="form-group"><label className="form-label">Mot de passe {editing?'(laisser vide pour conserver)':'*'}</label><input type="password" className="form-input" value={form.mot_de_passe} onChange={e=>setForm(f=>({...f,mot_de_passe:e.target.value}))} required={!editing} minLength={8}/></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Rôle *</label>
              <select className="form-input form-select" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} required>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Département</label>
              <select className="form-input form-select" value={form.departement_id||''} onChange={e=>setForm(f=>({...f,departement_id:e.target.value}))}>
                <option value="">— Aucun —</option>
                {departements.map(d=><option key={d.id} value={d.id}>{d.nom_departement}</option>)}
              </select>
            </div>
          </div>
          {form.role === 'technicien' && (
            <div className="form-group">
              <label className="form-label">Spécialité</label>
              <select className="form-input form-select" value={form.specialite} onChange={e=>setForm(f=>({...f,specialite:e.target.value}))}>
                {['Hardware','Software','Réseau','Autre'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {form.role === 'personnel' && (
            <div className="form-group">
              <label className="form-label">Numéro de bureau</label>
              <input className="form-input" value={form.numero_bureau||''} onChange={e=>setForm(f=>({...f,numero_bureau:e.target.value}))} placeholder="Ex: A-214"/>
            </div>
          )}
          <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={form.telephone||''} onChange={e=>setForm(f=>({...f,telephone:e.target.value}))}/></div>
          <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end', marginTop:'0.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
