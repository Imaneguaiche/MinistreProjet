import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import api from '../../services/api'
import { FileText } from 'lucide-react'

export default function TechnicienHistorique() {
  const [interventions, setInterventions] = useState([])
  const [loading, setLoading] = useState(true)

  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setApiError(null)
    api.get('/demandes').then(r => {
      const allInterventions = (r.data.data || []).flatMap(d =>
        (d.interventions || []).map(i => ({ ...i, demande: d }))
      )
      const terminees = allInterventions.filter(i => i.statut === 'terminee')
      // Sort by recency (most recently updated first)
      terminees.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
      setInterventions(terminees)
    }).catch(err => setApiError("Impossible de charger les interventions passées."))
    .finally(() => setLoading(false))
  }, [])

  return (
    <Layout title="Historique">
      <div className="page-header"><h1>Historique des interventions</h1><p>Vos interventions terminées</p></div>
      <div className="card">
        {loading ? <p style={{textAlign:'center',color:'#94a3b8',padding:'2rem'}}>Chargement...</p>
          : apiError ? <div className="empty-state"><p style={{color:'#ef4444',fontWeight:600}}>{apiError}</p></div>
          : interventions.length === 0
            ? <div className="empty-state"><FileText/><p>Aucune intervention terminée</p></div>
            : (
              <div className="table-container">
                <table>
                  <thead><tr><th># Intervention</th><th>Description de la demande</th><th>Catégorie</th><th>Statut</th><th>Date d'achèvement</th></tr></thead>
                  <tbody>
                    {interventions.map(i => (
                      <tr key={i.id}>
                        <td style={{color:'#94a3b8',fontSize:'0.8rem'}}>#{i.id}</td>
                        <td style={{maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.demande?.description}</td>
                        <td>{i.demande?.categorie?.libelle ?? '—'}</td>
                        <td><StatusBadge status={i.statut}/></td>
                        <td style={{color:'#64748b',fontSize:'0.8rem'}}>{new Date(i.updated_at || i.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>
    </Layout>
  )
}
