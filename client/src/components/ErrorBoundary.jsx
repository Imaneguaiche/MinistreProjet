import { Component } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
          background: '#f8fafc',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed #cbd5e1'
        }}>
          <AlertTriangle size={48} color="#ef4444" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Une erreur inattendue s'est produite.
          </h2>
          <p style={{ color: '#64748b', maxWidth: '400px', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            Nous n'avons pas pu afficher ce composant. L'équipe technique a été informée.
          </p>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem' }}
          >
            <RefreshCcw size={16} /> Recharger la page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
