import { useState } from 'react'
import Sidebar from './Sidebar'
import UserCard from './UserCard'
import { useAuth } from '../context/AuthContext'
import { Menu, X } from 'lucide-react'

const ROLE_TITLES = {
  personnel: 'Espace Personnel',
  technicien: 'Espace Technicien',
  helpdesk: 'Espace HelpDesk',
  admin: 'Administration',
}

export default function Layout({ children, title }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div style={{ display: 'flex' }}>

      {/* ── Mobile overlay ──────────────────────────── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(13,27,42,.55)',
            backdropFilter: 'blur(2px)',
            zIndex: 49,
            display: 'none',  /* overridden by media query below */
          }}
          className="sidebar-overlay"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────── */}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* ── Main ────────────────────────────────────── */}
      <div className="layout-main">

        {/* Topbar */}
        <header className="topbar no-print">
          {/* Left section (Hamburger) */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setOpen(s => !s)}
              className="sidebar-hamburger"
              aria-label="Menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Center section (Titles) */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '2px', minWidth: 0 }}>
            <div className="topbar-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {title || ROLE_TITLES[user?.role]}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontWeight: 500, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              Ministère de la Transition Énergétique et du Développement Durable
            </div>
          </div>

          {/* Right section (Date) */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div className="topbar-date">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </div>
          </div>
        </header>

        <main style={{ padding: '1.5rem' }} className="animate-fade-in print-main">
          <div className="no-print">
            <UserCard />
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
