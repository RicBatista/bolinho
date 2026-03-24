import { useEffect, useState, useMemo } from 'react'
import { TopBar } from '../components/Sidebar'
import { Modal } from '../components/Modal'
import { getClientes, createCliente, updateCliente, deleteCliente } from '../services/api'
import { formatPhoneBR, formatCpf, onlyDigits, displayPhone, displayCpf } from '../utils/brFormat'
import CepBusca from '../components/CepBusca'

const empty = { name: '', phone: '', cpf: '', cep: '', address: '', notes: '' }

export default function Clientes() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    return getClientes()
      .then(setItems)
      .catch(() => {
        setItems([])
        alert('Não foi possível carregar os clientes. Verifique a API.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (c) => {
    setForm({
      name: c.name,
      phone: formatPhoneBR(c.phone || ''),
      cpf: formatCpf(c.cpf || ''),
      cep: '',
      address: c.address || '',
      notes: c.notes || '',
    })
    setEditing(c.id)
    setModal(true)
  }

  const save = async () => {
    const name = form.name?.trim()
    if (!name) {
      alert('Informe o nome do cliente.')
      return
    }
    const payload = { ...form, name }
    setSaving(true)
    try {
      editing ? await updateCliente(editing, payload) : await createCliente(payload)
      setModal(false)
      await load()
    } catch {
      alert('Não foi possível salvar. Verifique os dados e tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (id) => {
    if (!confirm('Desativar este cliente?')) return
    try {
      await deleteCliente(id)
      await load()
    } catch {
      alert('Não foi possível remover o cliente.')
    }
  }

  const filtered = useMemo(() => items.filter(c => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const qd = onlyDigits(q)
    return (c.name || '').toLowerCase().includes(q)
      || (c.phone || '').toLowerCase().includes(q)
      || (c.address || '').toLowerCase().includes(q)
      || (qd.length > 0 && c.cpf && onlyDigits(c.cpf).includes(qd))
      || (qd.length >= 3 && onlyDigits(c.phone || '').includes(qd))
  }), [items, search])

  const listEmpty = items.length === 0
  const noMatch = !listEmpty && filtered.length === 0

  return (
    <div className="main-area">
      <TopBar title="Clientes" />
      <div className="page-content">
        <div className="page-header">
          <h1>Clientes</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => load()} disabled={loading}>
              {loading ? 'Atualizando…' : 'Atualizar'}
            </button>
            <button className="btn btn-primary" onClick={openNew}>+ Novo cliente</button>
          </div>
        </div>

        <input
          className="form-input"
          style={{ width: 320, marginBottom: 16 }}
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading && (
          <div style={{ color: 'var(--navy-muted)', fontSize: 14, marginBottom: 12 }}>Carregando clientes…</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(c => (
            <div key={c.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-serif)', fontSize: 16, flexShrink: 0 }}>
                  {c.name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 650, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  {c.phone && (
                    <div style={{ fontSize: 11, color: 'var(--navy-muted)' }}>Tel: <strong>{displayPhone(c.phone)}</strong></div>
                  )}
                  {c.cpf && (
                    <div style={{ fontSize: 11, color: 'var(--navy-muted)' }}>CPF: <strong>{displayCpf(c.cpf)}</strong></div>
                  )}
                </div>
              </div>

              {(c.address || c.notes) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--navy-muted)', marginBottom: 12 }}>
                  {c.address && <div><strong style={{ color: 'var(--navy-muted)' }}>Endereço:</strong> {c.address}</div>}
                  {c.notes && <div><strong style={{ color: 'var(--navy-muted)' }}>Obs.:</strong> {c.notes}</div>}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(c)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => deactivate(c.id)}>Remover</button>
              </div>
            </div>
          ))}

          {!loading && listEmpty && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-text">Nenhum cliente cadastrado</div>
              <div className="empty-state-sub" style={{ marginTop: 8, fontSize: 13, color: 'var(--navy-muted)' }}>
                Clique em <strong>Novo cliente</strong> para começar.
              </div>
            </div>
          )}
          {!loading && noMatch && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-text">Nenhum cliente corresponde à busca</div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <Modal
          title={editing ? 'Editar cliente' : 'Novo cliente'}
          onClose={() => !saving && setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" disabled={saving} onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" disabled={saving || !form.name?.trim()} onClick={save}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                className="form-input"
                placeholder="(21) 99999-9999"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: formatPhoneBR(e.target.value) }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">CPF</label>
              <input
                className="form-input"
                placeholder="000.000.000-00"
                inputMode="numeric"
                autoComplete="off"
                value={form.cpf}
                onChange={e => setForm(p => ({ ...p, cpf: formatCpf(e.target.value) }))}
              />
            </div>
          </div>
          <CepBusca
            cep={form.cep}
            onCepChange={v => setForm(p => ({ ...p, cep: v }))}
            enderecoAtual={form.address}
            onEndereco={text => setForm(p => ({ ...p, address: text }))}
          />
          <div className="form-group">
            <label className="form-label">Endereço completo</label>
            <input
              className="form-input"
              placeholder="Rua, número, complemento, bairro…"
              value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Preferências, observações, etc." />
          </div>
        </Modal>
      )}
    </div>
  )
}

