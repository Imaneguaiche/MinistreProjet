import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import api from '../../services/api'
import { Package } from 'lucide-react'

export default function PersonnelMateriels() {
  const [materiels, setMateriels] = useState([])
  const [loading, setLoading] = useState(true)

  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setApiError(null)
    api.get('/materiels')
      .then(r => setMateriels(r.data.data || []))
      .catch(err => setApiError("Impossible de charger vos matériels."))
      .finally(() => setLoading(false))
  }, [])



  return (
    <Layout title="Mes matériels">
      <div className="page-header">
        <div><h1>Mes matériels</h1><p>Gérez votre équipement informatique</p></div>
      </div>

      <div className="card">
        {loading ? <p style={{textAlign:'center',color:'#94a3b8',padding:'2rem'}}>Chargement...</p> :
          apiError ? <div className="empty-state"><p style={{color:'#ef4444',fontWeight:600}}>{apiError}</p></div> :
          materiels.length === 0 ? <div className="empty-state"><Package/><p>Aucun matériel enregistré</p></div> : (
          <div className="table-container">
            <table>
              <thead><tr><th>Nom</th><th>Type</th><th>N° Série</th><th>État</th></tr></thead>
              <tbody>
                {materiels.map(m => (
                  <tr key={m.id}>
                    <td style={{fontWeight:500}}>{m.nom_materiel}</td>
                    <td>{m.type_materiel}</td>
                    <td style={{color:'#94a3b8',fontSize:'0.8rem'}}>{m.numero_serie || '—'}</td>
                    <td><StatusBadge status={m.etat}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
