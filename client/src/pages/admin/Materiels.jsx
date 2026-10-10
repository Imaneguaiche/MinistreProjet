import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import api from '../../services/api'
import { Package, Plus, Pencil, Trash2, Ban } from 'lucide-react'

const ETAT_OPTIONS = ['fonctionnel','en_panne','en_reparation','hors_service']
const empty = { nom_materiel:'', type_materiel:'', numero_serie:'', etat:'fonctionnel', personnel_id: '' }

export default function AdminMateriels() {
  const [materiels, setMateriels] = useState([])
  const [personnels, setPersonnels] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  const [apiError, setApiError] = useState(null)

  const load = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true)
      setApiError(null)
    }
    try {
      const [rMat, rUsers] = await Promise.all([
        api.get('/materiels'),
        api.get('/utilisateurs')
      ])
      setMateriels(rMat.data.data || [])
      const users = rUsers.data.data || []
      setPersonnels(users.filter(u => u.role === 'personnel'))
      setApiError(null)
    } catch (err) {
      if (isInitial) setApiError("Impossible de charger les matériels.")
    } finally {
      if (isInitial) setLoading(false)
    }
  }
  
  useEffect(() => {
    load(true)
    const intervalId = setInterval(() => load(false), 10000)
    return () => clearInterval(intervalId)
  }, [])

  const openCreate = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (m) => { setForm({ ...m, personnel_id: m.personnel?.id || '' }); setEditing(m.id); setModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setModal(false)
    const payload = { ...form }
    if (!payload.personnel_id) payload.personnel_id = null
    
    setApiError(null)
    try {
      if (editing) {
        await api.put(`/materiels/${editing}`, payload)
      } else {
        const res = await api.post('/materiels', payload)
        if (payload.personnel_id && res.data?.id) {
          await api.put(`/materiels/${res.data.id}`, { personnel_id: payload.personnel_id })
        }
      }
      load()
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement.")
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce matériel ?')) return
    try {
      await api.delete(`/materiels/${id}`)
      load()
    } catch (err) {
      alert("Erreur lors de la suppression.")
    }
  }

  const handleHorsService = async (m) => {
    if (!confirm(`Marquer "${m.nom_materiel}" comme HORS SERVICE ?\nCette action est permanente et ne peut pas être annulée automatiquement.`)) return
    try {
      await api.patch(`/materiels/${m.id}/hors-service`)
      load(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour.')
    }
  }

  return (
    <Layout title="Matériels">
      <div className="page-header">
        <div><h1>Tous les matériels</h1><p>Gérez et assignez l'équipement informatique</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/>Ajouter</button>
      </div>

      <div className="card">
        {loading ? <p style={{textAlign:'center',color:'#94a3b8',padding:'2rem'}}>Chargement...</p> 
          : apiError ? <div className="empty-state"><p style={{color:'#ef4444',fontWeight:600}}>{apiError}</p></div>
          : materiels.length === 0 ? <div className="empty-state"><Package/><p>Aucun matériel enregistré</p></div> : (
          <div className="table-container">
            <table>
              <thead><tr><th>Nom</th><th>Type</th><th>N° Série</th><th>État</th><th>Assigné à</th><th>Actions</th></tr></thead>
              <tbody>
                {materiels.map(m => (
                  <tr key={m.id}>
                    <td style={{fontWeight:500}}>{m.nom_materiel}</td>
                    <td>{m.type_materiel}</td>
                    <td style={{color:'#94a3b8',fontSize:'0.8rem'}}>{m.numero_serie || '—'}</td>
                    <td><StatusBadge status={m.etat}/></td>
                    <td style={{fontSize:'0.85rem', color: m.personnel ? 'var(--navy)' : '#94a3b8'}}>
                      {m.personnel ? `${m.personnel.prenom} ${m.personnel.nom}` : 'Non assigné'}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" style={{marginRight:4}} onClick={()=>openEdit(m)}><Pencil size={13}/></button>
                      {m.etat !== 'hors_service' && (
                        <button
                          className="btn btn-sm"
                          style={{marginRight:4, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca'}}
                          title="Marquer comme hors service (irréparable)"
                          onClick={()=>handleHorsService(m)}
                        >
                          <Ban size={13}/>
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(m.id)}><Trash2 size={13}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editing ? 'Modifier matériel' : 'Nouveau matériel'}>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div className="form-group">
            <label className="form-label">Nom *</label>
            <input className="form-input" value={form.nom_materiel} onChange={e=>setForm(f=>({...f,nom_materiel:e.target.value}))} required/>
          </div>
          <div className="form-group">
            <label className="form-label">Type *</label>
            <input className="form-input" placeholder="PC, Imprimante, ..." value={form.type_materiel} onChange={e=>setForm(f=>({...f,type_materiel:e.target.value}))} required/>
          </div>
          <div className="form-group">
            <label className="form-label">Numéro de série</label>
            <input className="form-input" value={form.numero_serie||''} onChange={e=>setForm(f=>({...f,numero_serie:e.target.value}))}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div className="form-group">
              <label className="form-label">État</label>
              <select className="form-input form-select" value={form.etat} onChange={e=>setForm(f=>({...f,etat:e.target.value}))}>
                {ETAT_OPTIONS.map(o=><option key={o} value={o}>{o.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assigner à</label>
              <select className="form-input form-select" value={form.personnel_id||''} onChange={e=>setForm(f=>({...f,personnel_id:e.target.value}))}>
                <option value="">— Non assigné —</option>
                {personnels.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
