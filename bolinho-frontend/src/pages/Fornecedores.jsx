import { useState, useEffect } from 'react'
import { TopBar } from '../components/Sidebar'
import { Modal } from '../components/Modal'
import { getFornecedores, createFornecedor, updateFornecedor, deleteFornecedor } from '../services/api'

const empty = { name: '', cnpjCpf: '', contactName: '', phone: '', email: '', address: '', notes: '' }

export default function Fornecedores() {
  const [items, setItems] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')

  const load = () => getFornecedores().then(setItems)
  useEffect(() => { load() }, [])

  const openNew  = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (f) => { setForm({ name: f.name, cnpjCpf: f.cnpjCpf || '', contactName: f.contactName || '', phone: f.phone || '', email: f.email || '', address: f.address || '', notes: '' }); setEditing(f.id); setModal(true) }

  const save = async () => {
    editing ? await updateFornecedor(editing, form) : await createFornecedor(form)
    setModal(false); load()
  }

  const deactivate = async (id) => {
    if (!confirm('Desativar este fornecedor?')) return
    await deleteFornecedor(id); load()
  }

  const filtered = items.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="main-area">
      <TopBar title="Fornecedores" />
      <div className="page-content">
        <div className="page-header">
          <h1>Fornecedores</h1>
          <button className="btn btn-primary" onClick={openNew}>+ Novo fornecedor</button>
        </div>

        <input className="form-input" style={{ width: 300, marginBottom: 16 }} placeholder="Buscar fornecedor..." value={search} onChange={e => setSearch(e.target.value)} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(f => (
            <div key={f.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-serif)', fontSize: 16, flexShrink: 0 }}>
                  {f.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{f.name}</div>
                  {f.cnpjCpf && <div style={{ fontSize: 11, color: 'var(--navy-muted)' }}>{f.cnpjCpf}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, marginBottom: 12 }}>
                {f.contactName && <div style={{ color: 'var(--navy-muted)' }}>Contato: <strong>{f.contactName}</strong></div>}
                {f.phone && <div style={{ color: 'var(--navy-muted)' }}>Tel: <strong>{f.phone}</strong></div>}
                {f.email && <div style={{ color: 'var(--navy-muted)' }}>Email: <strong>{f.email}</strong></div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(f)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => deactivate(f.id)}>Remover</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state-icon">🤝</div>
              <div className="empty-state-text">Nenhum fornecedor cadastrado</div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <Modal title={editing ? 'Editar fornecedor' : 'Novo fornecedor'} onClose={() => setModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">CNPJ / CPF</label>
              <input className="form-input" value={form.cnpjCpf} onChange={e => setForm(p => ({ ...p, cnpjCpf: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Contato</label>
              <input className="form-input" value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Endereço</label>
            <input className="form-input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          </div>
        </Modal>
      )}
    </div>
  )
}
