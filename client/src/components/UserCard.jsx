import { useAuth } from '../context/AuthContext'

const ROLE_LABELS = {
  personnel: 'Personnel',
  technicien: 'Technicien',
  helpdesk: 'Agent HelpDesk',
  admin: 'Administrateur système',
}

const ROLE_COLORS = {
  personnel:  { bg: '#dbeafe', color: '#1e40af' },
  technicien: { bg: '#fef3c7', color: '#b45309' },
  helpdesk:   { bg: '#e0e7ff', color: '#4338ca' },
  admin:      { bg: 'var(--yellow-light)', color: '#92700a' },
}

/**
 * Reusable user info header card — drop it at the top of any dashboard page.
 * Usage: <UserCard />
 */
export default function UserCard() {
  const { user } = useAuth()
  if (!user) return null

  const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`
  const roleStyle = ROLE_COLORS[user?.role] ?? { bg: 'var(--gray-100)', color: 'var(--gray-700)' }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      background: 'white',
      borderRadius: 'var(--radius-md)',
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--gray-200)',
      borderLeft: '4px solid var(--yellow)',
    }}>
      {/* Avatar */}
      <div style={{
        width: 52, height: 52,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--yellow) 0%, var(--yellow-dark) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--navy)', fontWeight: 900, fontSize: '1.1rem',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(247,220,111,.35)',
      }}>
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--navy)', lineHeight: 1.2 }}>
          {user?.prenom} {user?.nom}
        </div>
        <div style={{ fontSize: '.8rem', color: 'var(--gray-400)', marginTop: 2 }}>
          {user?.email}
        </div>
      </div>

      {/* Role badge + Office info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
        <div style={{
          padding: '.35rem .9rem',
          borderRadius: 999,
          background: roleStyle.bg,
          color: roleStyle.color,
          fontSize: '.75rem',
          fontWeight: 700,
          letterSpacing: '.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {ROLE_LABELS[user?.role] ?? user?.role}
        </div>
        {user?.role === 'personnel' && (
          <div style={{ fontSize: '.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>
            Bureau : <span style={{ color: 'var(--navy)' }}>{user?.numero_bureau || 'Non défini'}</span>
          </div>
        )}
      </div>
    </div>
  )
}
