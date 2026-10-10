import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import api from '../../services/api'
import { ClipboardList } from 'lucide-react'

export default function PersonnelHistorique() {
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)

  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setApiError(null)
    Promise.all([
      api.get('/demandes?statut=resolue'),
      api.get('/demandes?statut=cloturee'),
    ])
      .then(([res1, res2]) => {
        const combined = [
          ...(res1.data.data || []),
          ...(res2.data.data || []),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setDemandes(combined)
      })
      .catch((err) => setApiError("Impossible de charger l'historique."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout title="Historique">
      <div className="page-header">
        <div>
          <h1>Historique</h1>
          <p>Vos demandes résolues et clôturées</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Chargement...</p>
        ) : apiError ? (
          <div className="empty-state"><p style={{color:'#ef4444',fontWeight:600}}>{apiError}</p></div>
        ) : demandes.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={40} style={{ color: '#94a3b8', marginBottom: '0.75rem' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Vous n'avez pas encore de demandes résolues ou clôturées.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Catégorie</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {demandes.map(d => (
                  <tr key={d.id}>
                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>#{d.id}</td>
                    <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.description}
                    </td>
                    <td>{d.categorie?.libelle ?? '—'}</td>
                    <td><StatusBadge status={d.statut} /></td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(d.created_at).toLocaleDateString('fr-FR')}
                    </td>
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
