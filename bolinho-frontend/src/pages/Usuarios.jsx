import { useState, useEffect } from 'react'
import { TopBar } from '../components/Sidebar'
import { Modal } from '../components/Modal'
import api from '../services/api'

const ROLE_LABEL = { DONO: 'Dono', GESTOR: 'Gestor', CAIXA: 'Caixa' }
const ROLE_DESC  = {
  DONO:   'Acesso total ao sistema',
  GESTOR: 'PDV, estoque e compras',
  CAIXA:  'Apenas PDV e produtos',
}
const ROLE_COLOR = { DONO: 'badge-terra', GESTOR: 'badge-gold', CAIXA: 'badge-green' }

const emptyForm = { username: '', password: '', fullName: '', role: 'CAIXA' }

export default function Usuarios() {
  const [users, setUsers]     = useState([])
  const [modal, setModal]     = useState(false)
  const [pwModal, setPwModal] = useState(null)
  const [form, setForm]       = useState(emptyForm)
  const [newPw, setNewPw]     = useState('')
  const [error, setError]     = useState('')

  const load = () => api.get('/auth/usuarios').then(r => setUsers(r.data))
  useEffect(() => { load() }, [])

  const save = async () => {
    setError('')
    try {
      await api.post('/auth/usuarios', form)
      setModal(false); setForm(emptyForm); load()
    } catch {
      setError('Erro ao criar usuário. O nome de usuário já pode estar em uso.')
    }
  }

  const deactivate = async (id) => {
    if (!confirm('Desativar este usuário? Ele não conseguirá mais fazer login.')) return
    await api.patch(`/auth/usuarios/${id}/desativar`)
    load()
  }

  const changePassword = async () => {
    await api.patch(`/auth/usuarios/${pwModal.id}/senha`, { username: pwModal.username, password: newPw })
    setPwModal(null); setNewPw('')
  }

  return (
    <div className="main-area">
      <TopBar title="Usuários" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Usuários do sistema</h1>
            <p style={{ fontSize: 13, color: 'var(--navy-muted)', marginTop: 4 }}>
              Gerencie quem tem acesso e com qual nível de permissão.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => { setModal(true); setError('') }}>
            + Novo usuário
          </button>
        </div>

        {/* Perfis explicados */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {Object.entries(ROLE_LABEL).map(([role, label]) => (
            <div key={role} className="card" style={{ padding: 16, borderLeft: `3px solid ${role === 'DONO' ? 'var(--terra)' : role === 'GESTOR' ? 'var(--gold)' : 'var(--green)'}`, borderRadius: '0 var(--radius-lg) var(--radius-lg) 0' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--navy-muted)' }}>{ROLE_DESC[role]}</div>
            </div>
          ))}
        </div>

        {/* Tabela de usuários */}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome completo</th>
                  <th>Usuário (login)</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.fullName}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{u.username}</td>
                    <td><span className={`badge ${ROLE_COLOR[u.role] || 'badge-navy'}`}>{ROLE_LABEL[u.role] || u.role}</span></td>
                    <td>
                      {u.active
                        ? <span className="badge badge-green">Ativo</span>
                        : <span className="badge badge-red">Inativo</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setPwModal(u); setNewPw('') }}>
                          Alterar senha
                        </button>
                        {u.active && u.role !== 'DONO' && (
                          <button className="btn btn-danger btn-sm" onClick={() => deactivate(u.id)}>
                            Desativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--navy-muted)', padding: 32 }}>
                    Nenhum usuário encontrado
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Novo usuário */}
      {modal && (
        <Modal
          title="Novo usuário"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Criar usuário</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Nome completo *</label>
            <input className="form-input" placeholder="Ex: João da Silva"
              value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Usuário (login) *</label>
              <input className="form-input" placeholder="sem espaços" autoComplete="off"
                value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().trim() }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Senha *</label>
              <input className="form-input" type="password" autoComplete="new-password"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Perfil *</label>
            <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              {Object.entries(ROLE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v} — {ROLE_DESC[k]}</option>
              ))}
            </select>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
        </Modal>
      )}

      {/* Modal: Alterar senha */}
      {pwModal && (
        <Modal
          title={`Alterar senha — ${pwModal.fullName}`}
          onClose={() => setPwModal(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setPwModal(null)}>Cancelar</button>
              <button className="btn btn-primary" disabled={!newPw} onClick={changePassword}>Salvar nova senha</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Nova senha *</label>
            <input className="form-input" type="password" autoComplete="new-password"
              value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="Mínimo 6 caracteres" />
          </div>
        </Modal>
      )}
    </div>
  )
}
