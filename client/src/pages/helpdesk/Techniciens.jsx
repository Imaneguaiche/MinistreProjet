import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import api from '../../services/api'
import { Users } from 'lucide-react'

export default function HelpdeskTechniciens() {
  const [techniciens, setTechniciens] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/techniciens').then(r => setTechniciens(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const [filterSpec, setFilterSpec] = useState('Tous')
  const SPECIALITES = ['Tous', 'Software', 'Hardware', 'Réseau']

  return (
    <Layout title="Techniciens">
      <div className="page-header"><div><h1>Gestion techniciens</h1><p>Monitorer la disponibilité des techniciens</p></div></div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {SPECIALITES.map(s => (
          <button
            key={s} 
            type="button" 
            onClick={() => setFilterSpec(s)}
            className="badge"
            style={{ 
              cursor:'pointer', border:'none', padding:'0.5rem 1rem', fontSize:'0.85rem',
              background: filterSpec === s ? '#3b82f6' : '#e2e8f0', 
              color: filterSpec === s ? '#fff' : '#475569',
              transition: 'all 0.2s'
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? <p style={{textAlign:'center',color:'#94a3b8',padding:'3rem'}}>Chargement...</p> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
          {techniciens.filter(t => filterSpec === 'Tous' || t.specialite === filterSpec).map(t => (
            <div key={t.id} className="card" style={{ borderTop:`3px solid ${t.disponibilite==='disponible'?'#10b981':'#ef4444'}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'0.75rem' }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background: t.disponibilite==='disponible'?'#d1fae5':'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem', color: t.disponibilite==='disponible'?'#059669':'#dc2626', flexShrink:0 }}>
                  {t.prenom?.[0]}{t.nom?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{t.prenom} {t.nom}</div>
                  <div style={{ fontSize:'0.8rem', color:'#64748b' }}>{t.specialite}</div>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <StatusBadge status={t.disponibilite}/>
                {/* Available for view only */}
              </div>
              {t.interventions_count > 0 && (
                <div style={{ marginTop:'0.5rem', fontSize:'0.78rem', color:'#94a3b8' }}>{t.interventions_count} intervention(s) en cours</div>
              )}
            </div>
          ))}
          {techniciens.filter(t => filterSpec === 'Tous' || t.specialite === filterSpec).length === 0 && (
            <div style={{ gridColumn:'1 / -1', textAlign:'center', color:'#94a3b8', padding:'3rem', background:'#f8fafc', borderRadius:8 }}>
              Aucun technicien trouvé pour la spécialité : {filterSpec}
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
