import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../services/api'
import { Users, BarChart2, Shield, Clock } from 'lucide-react'

export default function AdminGlobal() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/stats/admin').then(r => setStats(r.data)),
      api.get('/audit-logs').then(r => setLogs(r.data.data || [])),
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <Layout title="Administration globale">
      <div className="page-header"><div><h1>Administration globale</h1><p>Statistiques système et journal d'audit</p></div></div>

      {loading ? <p style={{textAlign:'center',color:'#94a3b8',padding:'2rem'}}>Chargement...</p> : (
        <>
          {stats && (
            <div className="stats-grid" style={{ marginBottom:'1.5rem' }}>
              {[
                { label:'Utilisateurs', value:stats.total_utilisateurs, icon:Users, color:'#1e40af', bg:'#dbeafe' },
                { label:'Interventions', value:stats.total_interventions, icon:BarChart2, color:'#0ea5e9', bg:'#e0f2fe' },
                { label:'Taux résolution', value:`${stats.taux_resolution}%`, icon:Shield, color:'#10b981', bg:'#d1fae5' },
                { label:'Durée moy. (h)', value:stats.duree_moyenne !== null && stats.duree_moyenne !== undefined ? `${Number(stats.duree_moyenne).toFixed(1)}h` : '0h', icon:Clock, color:'#f59e0b', bg:'#fef3c7' },
              ].map(({ label,value,icon:Icon,color,bg }) => (
                <div key={label} className="stat-card" style={{ borderLeftColor:color }}>
                  <div className="stat-icon" style={{ background:bg }}><Icon size={20} style={{ color }}/></div>
                  <div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h2 style={{ fontWeight:700, marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <Shield size={18} style={{ color:'#64748b' }}/> Journal d'audit
            </h2>
            <div className="table-container">
              <table>
                <thead><tr><th>Action</th><th>Utilisateur</th><th>Entité</th><th>IP</th><th>Date</th></tr></thead>
                <tbody>
                  {logs.slice(0, 50).map(log => (
                    <tr key={log.id}>
                      <td><code style={{ background:'#f1f5f9', padding:'2px 6px', borderRadius:4, fontSize:'0.78rem' }}>{log.action}</code></td>
                      <td style={{ fontSize:'0.85rem' }}>{log.user ? `${log.user.prenom} ${log.user.nom}` : '—'}</td>
                      <td style={{ fontSize:'0.82rem', color:'#64748b' }}>{log.entity_type} #{log.entity_id}</td>
                      <td style={{ fontSize:'0.78rem', color:'#94a3b8' }}>{log.ip_address}</td>
                      <td style={{ fontSize:'0.78rem', color:'#64748b' }}>{new Date(log.created_at).toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
