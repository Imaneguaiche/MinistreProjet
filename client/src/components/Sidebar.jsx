import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Inbox, Users, BarChart2,
  Wrench, FileText, Package, Building2,
  LogOut, ClipboardList, Plus, Shield, Calendar,
} from 'lucide-react'

/* ── Role-based menus (only content changes, never structure) ── */
const NAV = {
  admin: [
    { to: '/admin',                label: 'Tableau de bord',     icon: LayoutDashboard },
    { to: '/admin/audit-log',      label: "Journal d'audit",     icon: Shield },
    { to: '/admin/utilisateurs',   label: 'Utilisateurs',        icon: Users },
    { to: '/admin/techniciens',    label: 'Techniciens',         icon: Wrench },
    { to: '/admin/categories',     label: 'Catégories de panne', icon: ClipboardList },
    { to: '/admin/materiels',      label: 'Matériels',           icon: Package },
    { to: '/admin/departements',   label: 'Départements',        icon: Building2 },
    { to: '/admin/statistiques',   label: 'Statistiques',        icon: BarChart2 },
  ],
  helpdesk: [
    { to: '/helpdesk',              label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/helpdesk/reception',    label: 'Réception',        icon: Inbox },
    { to: '/helpdesk/techniciens',  label: 'Techniciens',      icon: Users },
    { to: '/helpdesk/statistiques', label: 'Statistiques',     icon: BarChart2 },
  ],
  personnel: [
    { to: '/personnel',                  label: 'Tableau de bord',  icon: LayoutDashboard },
    { to: '/personnel/nouvelle-demande', label: 'Nouvelle demande', icon: Plus },
    { to: '/personnel/materiels',        label: 'Mes matériels',    icon: Package },
    { to: '/personnel/historique',       label: 'Historique',       icon: ClipboardList },
  ],
  technicien: [
    { to: '/technicien',            label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/technicien/calendrier', label: 'Calendrier',      icon: Calendar },
    { to: '/technicien/historique', label: 'Historique',      icon: FileText },
  ],
}

const ROLE_LABELS = {
  admin:      'Administrateur',
  helpdesk:   'HelpDesk',
  personnel:  'Personnel',
  technicien: 'Technicien',
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = NAV[user?.role] ?? []

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>

      {/* ── Logo ───────────────────────────────────── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-square">HD</div>
        <div>
          <div className="sidebar-logo-text">HelpDesk</div>
          <div className="sidebar-logo-sub">Ministère</div>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────── */}
      <nav className="sidebar-nav">
        <div className="nav-group-label">Navigation</div>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === `/${user?.role}`}
            onClick={onClose}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon className="icon" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── User footer ────────────────────────────── */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">{user?.prenom} {user?.nom}</div>
            <div className="sidebar-user-role">{ROLE_LABELS[user?.role]}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-logout">
          <LogOut size={13} />
          Déconnexion
        </button>
      </div>

    </aside>
  )
}
