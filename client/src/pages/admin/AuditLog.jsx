import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../services/api'
import { Shield, Search, RefreshCw } from 'lucide-react'

export default function AdminAuditLog() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  const [apiError, setApiError] = useState(null)

  const fetch = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const r = await api.get('/audit-logs')
      setLogs(r.data.data || [])
    } catch (err) {
      setApiError("Impossible de charger le journal d'audit.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const filtered = logs.filter(l => {
    const s = search.toLowerCase()
    const fullName = `${l.user?.prenom || ''} ${l.user?.nom || ''}`.toLowerCase()
    return (
      l.action?.toLowerCase().includes(s) ||
      fullName.includes(s) ||
      l.entity_type?.toLowerCase().includes(s)
    )
  })

  return (
    <Layout title="Journal d'audit">
      <div className="page-header">
        <div>
          <h1>Journal d'audit</h1>
          <p>Historique complet de toutes les actions système</p>
        </div>
        <button onClick={fetch} className="btn btn-secondary btn-sm" style={{ gap: '.35rem' }}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: 380 }}>
        <Search size={15} style={{
          position: 'absolute', left: '.75rem', top: '50%',
          transform: 'translateY(-50%)', color: 'var(--gray-400)',
        }} />
        <input
          className="form-input"
          placeholder="Rechercher une action, un utilisateur…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '.875rem 1.25rem',
          borderBottom: '1px solid var(--gray-100)',
          display: 'flex', alignItems: 'center', gap: '.5rem',
          background: 'var(--gray-50)',
        }}>
          <Shield size={16} style={{ color: 'var(--gray-400)' }} />
          <span style={{ fontWeight: 700, fontSize: '.875rem', color: 'var(--navy)' }}>
            {loading ? '—' : filtered.length} entrées
          </span>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Chargement…</p>
        ) : apiError ? (
          <div className="empty-state"><p style={{color:'#ef4444',fontWeight:600}}>{apiError}</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem 1rem' }}>
            <Shield size={36} style={{ color: 'var(--gray-300)', marginBottom: '.75rem' }} />
            <p>Aucun journal correspondant trouvé</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Utilisateur</th>
                  <th>Entité</th>
                  <th>IP</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Aucun résultat</td></tr>
                ) : filtered.map(log => (
                  <tr key={log.id}>
                    <td>
                      <code style={{
                        background: 'var(--gray-100)',
                        padding: '2px 7px',
                        borderRadius: 4,
                        fontSize: '.78rem',
                        color: 'var(--navy)',
                      }}>
                        {log.action}
                      </code>
                    </td>
                    <td style={{ fontSize: '.85rem' }}>
                      {log.user ? `${log.user.prenom} ${log.user.nom}` : '—'}
                    </td>
                    <td style={{ fontSize: '.82rem', color: 'var(--gray-500)' }}>
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td style={{ fontSize: '.78rem', color: 'var(--gray-400)' }}>
                      {log.ip_address}
                    </td>
                    <td style={{ fontSize: '.78rem', color: 'var(--gray-500)' }}>
                      {new Date(log.created_at).toLocaleString('fr-FR')}
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
