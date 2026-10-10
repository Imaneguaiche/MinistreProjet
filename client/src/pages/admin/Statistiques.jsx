import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../services/api'
import { BarChart2, Users, CheckCircle, Clock, PieChart, TrendingUp } from 'lucide-react'
import {
  PieChart as RechartsPie, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  LineChart, Line,
} from 'recharts'

// ── Palette ─────────────────────────────────────────────────────────────────
const DONUT_COLORS  = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ef4444', '#8b5cf6']
const PRIORITY_COLORS = { basse: '#10b981', normale: '#6366f1', haute: '#f59e0b', urgente: '#ef4444' }

// ── Angled X-axis tick ──────────────────────────────────────────────────────
function AngledTick({ x, y, payload, maxLen = 14 }) {
  const label = payload.value?.length > maxLen ? payload.value.slice(0, maxLen - 1) + '…' : payload.value
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="end" transform="rotate(-38)"
        style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}>
        {label}
      </text>
    </g>
  )
}

// ── Shared tooltip style ────────────────────────────────────────────────────
const TOOLTIP_STYLE = {
  contentStyle: { borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)', fontSize: '.82rem', padding: '8px 14px', background: '#fff' },
}

// ── Empty state ──────────────────────────────────────────────────────────────
function Empty() {
  return (
    <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#94a3b8' }}>
      <span style={{ fontSize: 32 }}>📭</span>
      <span style={{ fontSize: '.82rem' }}>Aucune donnée disponible</span>
    </div>
  )
}

// ── Pro card ─────────────────────────────────────────────────────────────────
function ProCard({ id, title, emoji, accent, gradient, delay = 0, children }) {
  return (
    <div
      id={id}
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '20px 22px 18px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
        animation: `fadeInUp 0.45s ease ${delay}ms both`,
      }}
    >
      {/* Accent top border */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '16px 16px 0 0', background: accent }} />
      {/* Subtle gradient bg */}
      <div style={{ position: 'absolute', inset: 0, background: gradient, pointerEvents: 'none' }} />
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.92rem', color: '#1e293b', marginBottom: 16, position: 'relative' }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: accent + '1a', flexShrink: 0 }}>
          {emoji}
        </div>
        <span>{title}</span>
      </div>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  )
}

export default function AdminStatistiques() {
  const [stats, setStats]           = useState(null)
  const [adminStats, setAdminStats] = useState(null)
  const [loading, setLoading]       = useState(true)

  const [apiError, setApiError]       = useState(null)

  const fetchStats = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true)
      setApiError(null)
    }
    try {
      const [rStats, rAdmin] = await Promise.all([
        api.get('/stats/helpdesk'),
        api.get('/stats/admin')
      ])
      setStats(rStats.data)
      setAdminStats(rAdmin.data)
      setApiError(null) // clear any previous errors on success
    } catch (err) {
      if (isInitial) setApiError("Impossible de charger les statistiques.")
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats(true)
    const intervalId = setInterval(() => fetchStats(false), 10000) // Poll every 10 seconds
    return () => clearInterval(intervalId)
  }, [])

  if (loading) return (
    <Layout title="Statistiques">
      <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>Chargement des statistiques…</p>
    </Layout>
  )

  if (apiError) return (
    <Layout title="Statistiques">
      <div style={{ textAlign: 'center', color: '#ef4444', padding: '3rem', fontWeight: 600 }}>{apiError}</div>
    </Layout>
  )

  // ── Data transforms ────────────────────────────────────────────────────────
  const statut    = stats?.par_statut    ? Object.entries(stats.par_statut).map(([name, value])   => ({ name, value })) : []
  const priorite  = stats?.par_priorite  ? Object.entries(stats.par_priorite).map(([name, value]) => ({ name, value })) : []
  const monthly   = stats?.par_mois      ? Object.entries(stats.par_mois).map(([name, value])     => ({ name, value })) : []
  const categorie = stats?.par_categorie ? Object.entries(stats.par_categorie).map(([name, value]) => ({ name, value })).slice(0, 8) : []

  const TASK_LABELS  = { terminee: 'Terminée', en_cours: 'En cours', en_attente: 'À faire' }
  const taches       = adminStats?.par_tache_statut
    ? adminStats.par_tache_statut.map(t => ({ name: TASK_LABELS[t.statut] || t.statut, value: t.total }))
    : []
  const BASE_MATERIELS = [
    { key: 'fonctionnel',   name: 'Fonctionnel',    value: 0 },
    { key: 'en_panne',      name: 'En panne',       value: 0 },
    { key: 'en_reparation', name: 'En maintenance', value: 0 }, // DB stores en_reparation
    { key: 'hors_service',  name: 'Hors service',   value: 0 },
  ]
  const rawMateriels = adminStats?.par_materiel || []
  const materiels = BASE_MATERIELS.map(base => {
    const found = rawMateriels.find(m => m.etat === base.key)
    return { name: base.name, value: found ? Number(found.total) : 0 }
  })
  const departements = adminStats?.par_departement
    ? adminStats.par_departement.map(d => ({ name: d.nom, value: d.total }))
    : []

  const kpis = [
    { label: 'Total demandes',    value: stats?.total ?? 0,                   icon: BarChart2,   color: '#6366f1', bg: '#eef2ff' },
    { label: 'En attente',        value: stats?.en_attente ?? 0,               icon: Clock,       color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Résolues',          value: stats?.resolues ?? 0,                 icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
    { label: 'Techs disponibles', value: stats?.techniciens_disponibles ?? 0,  icon: Users,       color: '#0ea5e9', bg: '#e0f2fe' },
  ]

  const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 20 }

  return (
    <Layout title="Statistiques">
      {/* Keyframe injection */}
      <style>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .layout-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
      `}</style>

      <div className="page-header">
        <div>
          <h1>Statistiques</h1>
          <p>Vue d'ensemble des indicateurs clés du système</p>
        </div>
      </div>

      {/* ── ROW 1: 2 colonnes ── */}
      <div className="layout-grid">
        {/* KPI Total */}
        <ProCard title="Vue globale des demandes" emoji="📊" accent="#6366f1" gradient="linear-gradient(135deg,rgba(99,102,241,.05) 0%,transparent 60%)" delay={0}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
            {kpis.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 12, padding: '1.25rem', borderLeft: `4px solid ${color}` }}>
                 <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>{label}</p>
                 <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{value}</div>
              </div>
            ))}
          </div>
        </ProCard>

        {/* Doughnut Chart -> Statuts interventions */}
        <ProCard title="Statut des interventions" emoji="⚡" accent="#0ea5e9" gradient="linear-gradient(135deg,rgba(14,165,233,.04) 0%,transparent 60%)" delay={80}>
          {taches.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <RechartsPie>
                <Pie data={taches} dataKey="value" cx="50%" cy="46%" innerRadius="38%" outerRadius="62%" paddingAngle={4}
                  isAnimationActive animationDuration={900}
                  label={({ percent }) => percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                  {taches.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={9} formatter={v => <span style={{ fontSize: '.78rem', color: '#475569', fontWeight: 600 }}>{v}</span>} wrapperStyle={{ paddingTop: 10 }} />
              </RechartsPie>
            </ResponsiveContainer>
          )}
        </ProCard>
      </div>

      {/* ── ROW 2: 2 colonnes ── */}
      <div className="layout-grid">
        {/* Matériels */}
        <ProCard title="État du matériel" emoji="⚙️" accent="#ef4444" gradient="linear-gradient(135deg,rgba(239,68,68,.04) 0%,transparent 60%)" delay={160}>
          <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.85rem' }}>Nombre de matériels par état</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={materiels} barCategoryGap="40%" margin={{ top: 20, right: 10, bottom: 40, left: 0 }}>
              <defs>
                <linearGradient id="adminRedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={<AngledTick maxLen={15} />} interval={0} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: 'rgba(239,68,68,.08)', radius: 6 }} 
                formatter={v => [`${v} matériel${v > 1 ? 's' : ''}`, 'Total']} />
              <Bar dataKey="value" fill="url(#adminRedGrad)" radius={[6, 6, 0, 0]} maxBarSize={45} isAnimationActive animationDuration={900}>
                <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#dc2626' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ProCard>

        {/* Départements */}
        <ProCard title="Départements les plus touchés" emoji="🏢" accent="#f59e0b" gradient="linear-gradient(135deg,rgba(245,158,11,.04) 0%,transparent 60%)" delay={240}>
          {departements.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={departements} barCategoryGap="40%" margin={{ top: 20, right: 10, bottom: 40, left: 0 }}>
                <defs>
                  <linearGradient id="adminOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={<AngledTick maxLen={15} />} interval={0} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: 'rgba(245,158,11,.09)', radius: 6 }} />
                <Bar dataKey="value" fill="url(#adminOrangeGrad)" radius={[6, 6, 0, 0]} maxBarSize={45} isAnimationActive animationDuration={900}>
                  <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#d97706' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ProCard>
      </div>

      {/* ── ROW 3: 1 colonne (Full Width) ── */}
      <ProCard title="Évolution mensuelle des interventions" emoji="📈" accent="#10b981" gradient="linear-gradient(135deg,rgba(16,185,129,.04) 0%,transparent 60%)" delay={320}>
        {monthly.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthly} margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3}
                dot={{ fill: '#10b981', r: 5, strokeWidth: 0 }}
                activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }} isAnimationActive animationDuration={900} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ProCard>

    </Layout>
  )
}
