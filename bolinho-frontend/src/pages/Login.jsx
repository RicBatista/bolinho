import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]   = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form.username, form.password)
      // CAIXA não tem Dashboard; ir direto ao PDV (evita "Acesso não autorizado" em /)
      navigate(data.role === 'CAIXA' ? '/pdv' : '/')
    } catch {
      setError('Usuário ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--cream)',
    }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 20px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--navy)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 28
          }}>🐟</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--navy)', marginBottom: 4 }}>
            Bolinho de Bacalhau
          </h1>
          <p style={{ color: 'var(--navy-muted)', fontSize: 14 }}>Sistema de gestão — faça login para continuar</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Usuário</label>
              <input
                className="form-input"
                placeholder="ex: dono"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                autoFocus
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || !form.username || !form.password}
              style={{ marginTop: 8 }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Hint de usuários padrão */}
        <div style={{
          marginTop: 20, padding: 14,
          background: 'rgba(28,43,58,.06)', borderRadius: 'var(--radius-md)',
          fontSize: 12, color: 'var(--navy-muted)', lineHeight: 1.7
        }}>
          <strong style={{ color: 'var(--navy)' }}>Usuários padrão:</strong><br />
          dono / bolinho123 — acesso total<br />
          gestor / gestor123 — estoque e compras<br />
          caixa / caixa123 — apenas PDV
        </div>
      </div>
    </div>
  )
}
