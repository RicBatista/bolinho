import { useEffect, useState, useMemo } from 'react'
import { TopBar } from '../components/Sidebar'
import { Modal } from '../components/Modal'
import { getClientes, createCliente, updateCliente, deleteCliente } from '../services/api'
import { LoadErrorPanel } from '../components/LoadErrorPanel'
import { formatPhoneBR, formatCpf, onlyDigits, displayPhone, displayCpf } from '../utils/brFormat'
import { getApiErrorMessage } from '../utils/apiError'
import CepBusca from '../components/CepBusca'
import { montarEnderecoCompleto, TIPOS_RESIDENCIA } from '../utils/addressDisplay'

const empty = {
  name: '', phone: '', cpf: '', cep: '',
  address: '', addressNumber: '', addressComplement: '', residenceType: '',
  notes: '',
  whatsappOrderUpdatesOptIn: false,
}

export default function Clientes() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(null)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    return getClientes()
      .then((data) => {
        setItems(data)
        setLoadError(null)
      })
      .catch((err) => {
        setItems([])
        setLoadError(getApiErrorMessage(err, 'Não foi possível carregar os clientes.'))
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
      addressNumber: c.addressNumber ?? '',
      addressComplement: c.addressComplement ?? '',
      residenceType: c.residenceType ?? '',
      notes: c.notes || '',
      whatsappOrderUpdatesOptIn: !!c.whatsappOrderUpdatesOptIn,
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
    } catch (e) {
      alert(getApiErrorMessage(e, 'Não foi possível salvar. Verifique os dados e tente de novo.'))
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (id) => {
    if (!confirm('Desativar este cliente?')) return
    try {
      await deleteCliente(id)
      await load()
    } catch (e) {
      alert(getApiErrorMessage(e, 'Não foi possível remover o cliente.'))
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
          className="form-input form-input--search"
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Buscar cliente"
        />

        {loadError && (
          <LoadErrorPanel
            title="Não foi possível carregar os clientes"
            message={loadError}
            onRetry={load}
            busy={loading}
          />
        )}

        {loading && !loadError && (
          <div className="inline-loading" aria-live="polite">
            <span className="spinner" aria-hidden />
            <span>Carregando clientes…</span>
          </div>
        )}

        <div className="card-grid card-grid--clients">
          {filtered.map(c => {
            const enderecoTxt = montarEnderecoCompleto(c)
            return (
            <div key={c.id} className="card card--interactive" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-serif)', fontSize: 16, flexShrink: 0 }}>
                  {c.name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 650, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  {c.phone && (
                    <div style={{ fontSize: 11, color: 'var(--navy-muted)' }}>Tel: <strong>{displayPhone(c.phone)}</strong>
                      {c.whatsappOrderUpdatesOptIn && (
                        <span style={{ marginLeft: 6, color: 'var(--green)', fontWeight: 600 }}>· WhatsApp ok</span>
                      )}
                    </div>
                  )}
                  {c.cpf && (
                    <div style={{ fontSize: 11, color: 'var(--navy-muted)' }}>CPF: <strong>{displayCpf(c.cpf)}</strong></div>
                  )}
                </div>
              </div>

              {(enderecoTxt || c.notes) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--navy-muted)', marginBottom: 12 }}>
                  {enderecoTxt && (
                    <div><strong style={{ color: 'var(--navy-muted)' }}>Endereço:</strong> {enderecoTxt}</div>
                  )}
                  {c.notes && <div><strong style={{ color: 'var(--navy-muted)' }}>Obs.:</strong> {c.notes}</div>}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(c)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => deactivate(c.id)}>Remover</button>
              </div>
            </div>
          )})}

          {!loading && !loadError && listEmpty && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-text">Nenhum cliente cadastrado</div>
              <div className="empty-state-sub" style={{ marginTop: 8, fontSize: 13, color: 'var(--navy-muted)' }}>
                Clique em <strong>Novo cliente</strong> para começar.
              </div>
            </div>
          )}
          {!loading && !loadError && noMatch && (
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
            <label className="form-label">Logradouro, bairro e cidade</label>
            <input
              className="form-input"
              placeholder="Preenchido pelo CEP ou digite à mão"
              value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
            />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Número</label>
              <input
                className="form-input"
                placeholder="Ex.: 120 ou S/N"
                value={form.addressNumber}
                onChange={e => setForm(p => ({ ...p, addressNumber: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Complemento</label>
              <input
                className="form-input"
                placeholder="Apto, bloco, sala…"
                value={form.addressComplement}
                onChange={e => setForm(p => ({ ...p, addressComplement: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tipo de residência</label>
            <select
              className="form-select"
              value={form.residenceType}
              onChange={e => setForm(p => ({ ...p, residenceType: e.target.value }))}
            >
              {TIPOS_RESIDENCIA.map(o => (
                <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={form.whatsappOrderUpdatesOptIn}
                onChange={e => setForm(p => ({ ...p, whatsappOrderUpdatesOptIn: e.target.checked }))}
                style={{ marginTop: 3 }}
              />
              <span>
                Cliente autoriza receber por WhatsApp avisos sobre pedidos e atualizações. Sem esta opção, não enviamos mensagens automáticas ao número cadastrado.
              </span>
            </label>
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

