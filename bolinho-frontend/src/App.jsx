import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Sidebar } from './components/Sidebar'
import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import PDV          from './pages/PDV'
import Produtos     from './pages/Produtos'
import Estoque      from './pages/Estoque'
import Fornecedores from './pages/Fornecedores'
import Compras      from './pages/Compras'
import Notificacoes from './pages/Notificacoes'
import Usuarios     from './pages/Usuarios'
import Encomendas   from './pages/Encomendas'
import Clientes     from './pages/Clientes'

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      {children}
    </div>
  )
}

/** CAIXA não usa Dashboard; evita tela de “acesso negado” se abrir "/" manualmente */
function HomeEntry() {
  const { user } = useAuth()
  if (user?.role === 'CAIXA') return <Navigate to="/pdv" replace />
  return <Dashboard />
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute roles={['DONO','GESTOR','CAIXA']}>
              <AppLayout><HomeEntry /></AppLayout>
            </ProtectedRoute>} />

          <Route path="/pdv" element={
            <ProtectedRoute roles={['DONO','GESTOR','CAIXA']}>
              <AppLayout><PDV /></AppLayout>
            </ProtectedRoute>} />

          <Route path="/encomendas" element={
            <ProtectedRoute roles={['DONO','GESTOR','CAIXA']}>
              <AppLayout><Encomendas /></AppLayout>
            </ProtectedRoute>} />

          <Route path="/produtos" element={
            <ProtectedRoute roles={['DONO','GESTOR','CAIXA']}>
              <AppLayout><Produtos /></AppLayout>
            </ProtectedRoute>} />

          <Route path="/estoque" element={
            <ProtectedRoute roles={['DONO','GESTOR']}>
              <AppLayout><Estoque /></AppLayout>
            </ProtectedRoute>} />

          <Route path="/fornecedores" element={
            <ProtectedRoute roles={['DONO','GESTOR']}>
              <AppLayout><Fornecedores /></AppLayout>
            </ProtectedRoute>} />

          <Route path="/compras" element={
            <ProtectedRoute roles={['DONO','GESTOR']}>
              <AppLayout><Compras /></AppLayout>
            </ProtectedRoute>} />

          <Route path="/notificacoes" element={
            <ProtectedRoute roles={['DONO']}>
              <AppLayout><Notificacoes /></AppLayout>
            </ProtectedRoute>} />

          <Route path="/usuarios" element={
            <ProtectedRoute roles={['DONO']}>
              <AppLayout><Usuarios /></AppLayout>
            </ProtectedRoute>} />

          <Route path="/clientes" element={
            <ProtectedRoute roles={['DONO','GESTOR']}>
              <AppLayout><Clientes /></AppLayout>
            </ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
