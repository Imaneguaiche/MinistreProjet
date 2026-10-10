import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

// Public pages
import Accueil from './pages/Accueil'
import AboutUs from './pages/AboutUs'
import Login   from './pages/Login'

// Personnel
import PersonnelAccueil    from './pages/personnel/Accueil'
import NouvelleDemande     from './pages/personnel/NouvelleDemande'
import PersonnelMateriels  from './pages/personnel/Materiels'
import PersonnelHistorique from './pages/personnel/Historique'

// Technicien
import TechnicienTaches    from './pages/technicien/Taches'
import TechnicienHistorique from './pages/technicien/Historique'
import TechnicienCalendrier from './pages/technicien/Calendrier'

// Helpdesk
import HelpdeskReception    from './pages/helpdesk/Reception'
import HelpdeskTechniciens  from './pages/helpdesk/Techniciens'
import HelpdeskStatistiques from './pages/helpdesk/Statistiques'

// Admin
import AdminUtilisateurs  from './pages/admin/Utilisateurs'
import AdminCategories    from './pages/admin/Categories'
import AdminDepartements  from './pages/admin/Departements'
import AdminGlobal        from './pages/admin/Global'
import AdminAuditLog      from './pages/admin/AuditLog'
import AdminStatistiques  from './pages/admin/Statistiques'
import AdminMateriels     from './pages/admin/Materiels'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Accueil />
  return <Navigate to={`/${user.role}`} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
          {/* Public */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/login" element={<Login />} />

          {/* Personnel */}
          <Route path="/personnel" element={<ProtectedRoute roles={['personnel']}><PersonnelAccueil /></ProtectedRoute>} />
          <Route path="/personnel/nouvelle-demande" element={<ProtectedRoute roles={['personnel']}><NouvelleDemande /></ProtectedRoute>} />
          <Route path="/personnel/materiels" element={<ProtectedRoute roles={['personnel']}><PersonnelMateriels /></ProtectedRoute>} />
          <Route path="/personnel/historique" element={<ProtectedRoute roles={['personnel']}><PersonnelHistorique /></ProtectedRoute>} />

          {/* Technicien */}
          <Route path="/technicien"              element={<ProtectedRoute roles={['technicien']}><TechnicienTaches /></ProtectedRoute>} />
          <Route path="/technicien/calendrier"   element={<ProtectedRoute roles={['technicien']}><TechnicienCalendrier /></ProtectedRoute>} />
          <Route path="/technicien/historique"   element={<ProtectedRoute roles={['technicien']}><TechnicienHistorique /></ProtectedRoute>} />

          {/* Helpdesk */}
          <Route path="/helpdesk" element={<ProtectedRoute roles={['helpdesk']}><HelpdeskReception /></ProtectedRoute>} />
          <Route path="/helpdesk/reception" element={<ProtectedRoute roles={['helpdesk']}><HelpdeskReception /></ProtectedRoute>} />
          <Route path="/helpdesk/techniciens" element={<ProtectedRoute roles={['helpdesk']}><HelpdeskTechniciens /></ProtectedRoute>} />
          <Route path="/helpdesk/statistiques" element={<ProtectedRoute roles={['helpdesk']}><HelpdeskStatistiques /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin"                   element={<ProtectedRoute roles={['admin']}><AdminGlobal /></ProtectedRoute>} />
          <Route path="/admin/audit-log"         element={<ProtectedRoute roles={['admin']}><AdminAuditLog /></ProtectedRoute>} />
          <Route path="/admin/utilisateurs"      element={<ProtectedRoute roles={['admin']}><AdminUtilisateurs /></ProtectedRoute>} />
          <Route path="/admin/techniciens"       element={<ProtectedRoute roles={['admin']}><AdminUtilisateurs filterRole="technicien" /></ProtectedRoute>} />
          <Route path="/admin/categories"        element={<ProtectedRoute roles={['admin']}><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/materiels"         element={<ProtectedRoute roles={['admin']}><AdminMateriels /></ProtectedRoute>} />
          <Route path="/admin/departements"      element={<ProtectedRoute roles={['admin']}><AdminDepartements /></ProtectedRoute>} />
          <Route path="/admin/statistiques"      element={<ProtectedRoute roles={['admin']}><AdminStatistiques /></ProtectedRoute>} />
          <Route path="/admin/global"            element={<ProtectedRoute roles={['admin']}><AdminGlobal /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  )
}
