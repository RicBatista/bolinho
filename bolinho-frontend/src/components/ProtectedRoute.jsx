import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--navy-muted)' }}>
      Carregando...
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12 }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <h2 style={{ fontFamily: 'var(--font-serif)' }}>Acesso não autorizado</h2>
      <p style={{ color: 'var(--navy-muted)' }}>Seu perfil não tem permissão para acessar esta página.</p>
    </div>
  )

  return children
}
