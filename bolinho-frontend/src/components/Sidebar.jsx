import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ROLE_LABEL = { DONO: 'Dono', GESTOR: 'Gestor', CAIXA: 'Caixa' }
const ROLE_COLOR = { DONO: '#C85A2E', GESTOR: '#D4960A', CAIXA: '#2E7D52' }

const allNavItems = [
  { to: '/',             icon: '▦', label: 'Dashboard',       roles: ['DONO', 'GESTOR'] },
  { to: '/pdv',          icon: '◎', label: 'Venda (PDV)',      roles: ['DONO', 'GESTOR', 'CAIXA'] },
  { to: '/encomendas',   icon: '📦', label: 'Encomendas',      roles: ['DONO', 'GESTOR', 'CAIXA'] },
  { to: '/produtos',     icon: '▣', label: 'Produtos',         roles: ['DONO', 'GESTOR', 'CAIXA'] },
  { to: '/clientes',     icon: '👥', label: 'Clientes',         roles: ['DONO', 'GESTOR'] },
  { to: '/estoque',      icon: '◈', label: 'Estoque',          roles: ['DONO', 'GESTOR'] },
  { to: '/fornecedores', icon: '◉', label: 'Fornecedores',     roles: ['DONO', 'GESTOR'] },
  { to: '/compras',      icon: '◇', label: 'Compras / Contas', roles: ['DONO', 'GESTOR'] },
  { to: '/notificacoes', icon: '◆', label: 'Notificações',     roles: ['DONO'] },
  { to: '/usuarios',     icon: '◑', label: 'Usuários',         roles: ['DONO'] },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = allNavItems.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  )

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">Bolinho de<br />Bacalhau</div>
        <div className="sidebar-logo-sub">Gestão do negócio</div>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-section-label">Menu</div>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            {({ isActive }) => (
              <button className={`nav-item${isActive ? ' active' : ''}`}>
                <span className="nav-icon" style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label}
              </button>
            )}
          </NavLink>
        ))}
      </div>
      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,.07)', padding: '14px 16px' }}>
        {user && (
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: ROLE_COLOR[user.role] || '#4A6070', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
              {user.fullName?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.fullName}</div>
              <div style={{ display: 'inline-block', marginTop: 2, fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 8, background: ROLE_COLOR[user.role] + '33', color: ROLE_COLOR[user.role] }}>
                {ROLE_LABEL[user.role] || user.role}
              </div>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(200,90,46,.3)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}>
          ↩ Sair
        </button>
      </div>
    </aside>
  )
}

export function TopBar({ title, children }) {
  const now  = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const date = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  return (
    <div className="top-bar">
      <span className="top-bar-title">{title}</span>
      {children}
      <span className="top-bar-time">{date} — {now}</span>
    </div>
  )
}
