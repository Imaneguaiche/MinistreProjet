import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Modal from '../../components/Modal'
import api from '../../services/api'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const empty = { libelle:'', description:'' }

export default function AdminCategories() {
  const [cats, setCats] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)

  const load = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const r = await api.get('/categories')
      setCats(r.data || [])
    } catch (err) {
      setApiError("Impossible de charger les catégories.")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)
    try {
      if (editing) await api.put(`/categories/${editing}`, form)
      else await api.post('/categories', form)
      setModal(false); load()
    } catch (err) {
      alert("Erreur lors de l'enregistrement.")
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette catégorie ?')) return
    try {
      await api.delete(`/categories/${id}`); load()
    } catch (err) {
      alert("Erreur lors de la suppression.")
    }
  }

  return (
    <Layout title="Catégories">
      <div className="page-header">
        <div><h1>Catégories de pannes</h1><p>{cats.length} catégories définies</p></div>
        <button className="btn btn-primary" onClick={()=>{setForm(empty);setEditing(null);setModal(true)}}><Plus size={16}/>Nouvelle</button>
      </div>
      {loading ? <p style={{textAlign:'center',padding:'2rem'}}>Chargement...</p> 
        : apiError ? <div className="empty-state"><p style={{color:'#ef4444',fontWeight:600}}>{apiError}</p></div>
        : cats.length === 0 ? <div className="empty-state"><p>Aucune catégorie enregistrée</p></div> : (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' }}>
        {cats.map((c,i) => (
          <div key={c.id} className="card" style={{ borderTop:`3px solid hsl(${i*60},70%,55%)` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <h3 style={{ fontWeight:700, marginBottom:'0.35rem' }}>{c.libelle}</h3>
                <p style={{ fontSize:'0.82rem', color:'#64748b' }}>{c.description || 'Aucune description'}</p>
              </div>
              <div style={{ display:'flex', gap:'0.3rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={()=>{setForm(c);setEditing(c.id);setModal(true)}}><Pencil size={13}/></button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(c.id)}><Trash2 size={13}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editing?'Modifier catégorie':'Nouvelle catégorie'}>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div className="form-group"><label className="form-label">Libellé *</label><input className="form-input" value={form.libelle} onChange={e=>setForm(f=>({...f,libelle:e.target.value}))} required/></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description||''} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{resize:'vertical'}}/></div>
          <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
