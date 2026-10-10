import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Modal from '../../components/Modal'
import api from '../../services/api'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const empty = { nom_departement: '' }

export default function AdminDepartements() {
  const [depts, setDepts] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)

  const load = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const r = await api.get('/departements')
      setDepts(r.data || [])
    } catch (err) {
      setApiError("Impossible de charger les départements.")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) await api.put(`/departements/${editing}`, form)
      else await api.post('/departements', form)
      setModal(false); load()
    } catch (err) {
      alert("Erreur lors de l'enregistrement.")
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce département ?')) return
    try {
      await api.delete(`/departements/${id}`); load()
    } catch (err) {
      alert("Erreur lors de la suppression.")
    }
  }

  return (
    <Layout title="Départements">
      <div className="page-header">
        <div><h1>Départements</h1><p>{depts.length} départements</p></div>
        <button className="btn btn-primary" onClick={()=>{setForm(empty);setEditing(null);setModal(true)}}><Plus size={16}/>Nouveau</button>
      </div>
      <div className="card">
        {loading ? <p style={{textAlign:'center',padding:'2rem'}}>Chargement...</p> 
          : apiError ? <div className="empty-state"><p style={{color:'#ef4444',fontWeight:600}}>{apiError}</p></div>
          : depts.length === 0 ? <div className="empty-state"><p>Aucun département enregistré</p></div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Nom du département</th><th>Utilisateurs</th><th>Actions</th></tr></thead>
            <tbody>
              {depts.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight:500 }}>{d.nom_departement}</td>
                  <td style={{ color:'#64748b' }}>{d.users_count ?? 0} utilisateur(s)</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" style={{ marginRight:4 }} onClick={()=>{setForm(d);setEditing(d.id);setModal(true)}}><Pencil size={13}/></button>
                    <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(d.id)}><Trash2 size={13}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editing?'Modifier département':'Nouveau département'}>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" value={form.nom_departement} onChange={e=>setForm(f=>({...f,nom_departement:e.target.value}))} required/></div>
          <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
