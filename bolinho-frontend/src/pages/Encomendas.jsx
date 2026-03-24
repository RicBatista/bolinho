import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../components/Sidebar'
import { Modal } from '../components/Modal'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { formatPhoneBR, formatCpf, onlyDigits, displayPhone, displayCpf } from '../utils/brFormat'
import CepBusca from '../components/CepBusca'
import { montarEnderecoPedido, TIPOS_RESIDENCIA } from '../utils/addressDisplay'

const STATUS_FLOW = [
  { key: 'PENDENTE',    label: 'Pendente',    color: '#888780', bg: '#F1EFE8' },
  { key: 'CONFIRMADO',  label: 'Confirmado',  color: '#854F0B', bg: '#FAEEDA' },
  { key: 'EM_PREPARO',  label: 'Em preparo',  color: '#185FA5', bg: '#E6F1FB' },
  { key: 'PRONTO',      label: 'Pronto',      color: '#0F6E56', bg: '#E1F5EE' },
  { key: 'ENTREGUE',    label: 'Entregue',    color: '#2E7D52', bg: '#E0F5E9' },
  { key: 'CANCELADO',   label: 'Cancelado',   color: '#C0392B', bg: '#FDECEA' },
]
const STATUS_MAP = Object.fromEntries(STATUS_FLOW.map(s => [s.key, s]))

const fmt = (v) => v != null
  ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  : 'R$ 0,00'

const fmtDate = (d) => d
  ? new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
  : '—'

const today = () => {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}

const emptyForm = {
  customerName: '', customerPhone: '', customerCpf: '',
  cepEntrega: '', customerAddress: '',
  customerAddressNumber: '', customerAddressComplement: '', customerResidenceType: '',
  deliveryDate: today(), delivery: false, depositAmount: '', notes: '',
  items: [{ productId: '', quantity: 1, unitPrice: '', notes: '' }]
}

/** Resposta da API pode vir como array ou envelope (ex.: Spring Page com `content`). */
const asList = (data) => {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray(data.content)) return data.content
  return []
}

export default function Encomendas() {
  const { user } = useAuth()
  const canManageClients = user && ['DONO', 'GESTOR'].includes(user.role)

  const [orders, setOrders]     = useState([])
  const [products, setProducts] = useState([])
  const [clients, setClients]   = useState([])
  const [clientFilter, setClientFilter] = useState('')
  const [tab, setTab]           = useState('todos')
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [detailModal, setDetailModal] = useState(null)
  const [depositModal, setDepositModal] = useState(null)
  const [form, setForm]         = useState(emptyForm)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [editing, setEditing]   = useState(null)
  const [depositAmt, setDepositAmt] = useState('')
  const [saving, setSaving]     = useState(false)

  const load = useCallback(() => {
    api.get('/encomendas').then(r => setOrders(asList(r.data))).catch(() => setOrders([]))
    api.get('/produtos').then(r => setProducts(asList(r.data))).catch(() => setProducts([]))
    api.get('/clientes').then(r => setClients(asList(r.data))).catch(() => setClients([]))
  }, [])

  useEffect(() => { load() }, [load])

  const filteredClients = useMemo(() => {
    const q = clientFilter.trim().toLowerCase()
    let list = !q
      ? clients
      : clients.filter(c => {
          const qd = onlyDigits(q)
          if ((c.name || '').toLowerCase().includes(q)) return true
          if ((c.phone || '').toLowerCase().includes(q)) return true
          if (qd.length > 0 && c.cpf && onlyDigits(c.cpf).includes(qd)) return true
          if (qd.length >= 3 && onlyDigits(c.phone || '').includes(qd)) return true
          return false
        })
    if (selectedClientId) {
      const sel = clients.find(c => String(c.id) === String(selectedClientId))
      if (sel && !list.some(c => String(c.id) === String(selectedClientId)))
        list = [sel, ...list]
    }
    return list
  }, [clients, clientFilter, selectedClientId])

  const filtered = orders.filter(o => {
    const matchTab = tab === 'todos' || o.status === tab
    const sq = search.trim().toLowerCase()
    const sqd = onlyDigits(search)
    const matchSearch = !search.trim() || o.customerName?.toLowerCase().includes(sq)
      || (o.customerPhone && o.customerPhone.toLowerCase().includes(sq))
      || (sqd.length > 0 && o.customerCpf && onlyDigits(o.customerCpf).includes(sqd))
      || (sqd.length >= 3 && o.customerPhone && onlyDigits(o.customerPhone).includes(sqd))
    return matchTab && matchSearch
  })

  const openNew = () => { setForm(emptyForm); setSelectedClientId(''); setClientFilter(''); setEditing(null); setModal(true) }
  const openEdit = (o) => {
    setForm({
      customerName: o.customerName,
      customerPhone: formatPhoneBR(o.customerPhone || ''),
      customerCpf: formatCpf(o.customerCpf || ''),
      cepEntrega: '',
      customerAddress: o.customerAddress || '',
      customerAddressNumber: o.customerAddressNumber ?? '',
      customerAddressComplement: o.customerAddressComplement ?? '',
      customerResidenceType: o.customerResidenceType ?? '',
      deliveryDate: o.deliveryDate ? o.deliveryDate.slice(0,16) : today(),
      delivery: o.delivery || false, depositAmount: o.depositAmount || '',
      notes: o.notes || '',
      items: o.items?.map(i => ({
        productId: i.product?.id || '', quantity: i.quantity,
        unitPrice: i.unitPrice, notes: i.notes || ''
      })) || [{ productId: '', quantity: 1, unitPrice: '', notes: '' }]
    })
    const match = clients.find(c =>
      (c.phone && o.customerPhone && onlyDigits(c.phone) === onlyDigits(o.customerPhone))
        || (c.name && o.customerName && String(c.name) === String(o.customerName))
        || (c.cpf && o.customerCpf && onlyDigits(c.cpf) === onlyDigits(o.customerCpf))
    )
    setSelectedClientId(match ? String(match.id) : '')
    setClientFilter('')
    setEditing(o.id)
    setModal(true)
  }

  const addItem  = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: 1, unitPrice: '', notes: '' }] }))
  const rmItem   = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const setItem  = (i, k, v) => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }))

  const calcTotal = () => form.items.reduce((s, i) => {
    const p = products.find(p => String(p.id) === String(i.productId))
    const price = parseFloat(i.unitPrice) || (p?.salePrice || 0)
    return s + price * (parseInt(i.quantity) || 0)
  }, 0)

  const save = async () => {
    setSaving(true)
    try {
      const { cepEntrega, ...restForm } = form
      const payload = {
        ...restForm,
        depositAmount: parseFloat(form.depositAmount) || 0,
        items: form.items.map(i => ({
          productId: parseInt(i.productId),
          quantity: parseInt(i.quantity),
          unitPrice: parseFloat(i.unitPrice) || null,
          notes: i.notes || null
        }))
      }
      editing ? await api.put(`/encomendas/${editing}`, payload)
              : await api.post('/encomendas', payload)
      setModal(false); load()
    } catch (e) { alert('Erro ao salvar. Verifique os campos.') }
    finally { setSaving(false) }
  }

  const updateStatus = async (id, status) => {
    await api.patch(`/encomendas/${id}/status`, { status })
    load()
    if (detailModal?.id === id) setDetailModal(orders.find(o => o.id === id))
  }

  const registerDeposit = async () => {
    await api.post(`/encomendas/${depositModal.id}/sinal`, { amount: parseFloat(depositAmt) })
    setDepositModal(null); setDepositAmt(''); load()
  }

  const cancel = async (id) => {
    if (!confirm('Cancelar esta encomenda?')) return
    await api.patch(`/encomendas/${id}/cancelar`)
    setDetailModal(null); load()
  }

  // Próximo status disponível
  const nextStatus = (current) => {
    const flow = ['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE']
    const idx = flow.indexOf(current)
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null
  }

  const todayCount = orders.filter(o => {
    const d = o.deliveryDate ? new Date(o.deliveryDate).toDateString() : null
    return d === new Date().toDateString() && o.status !== 'CANCELADO'
  }).length

  const pendingBalance = orders
    .filter(o => o.status !== 'ENTREGUE' && o.status !== 'CANCELADO')
    .reduce((s, o) => s + (o.remainingBalance || 0), 0)

  return (
    <div className="main-area">
      <TopBar title="Encomendas" />
      <div className="page-content">

        {/* KPIs */}
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card accent">
            <div className="stat-label">Encomendas hoje</div>
            <div className="stat-value">{todayCount}</div>
            <div className="stat-sub">para entregar/retirar</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total em aberto</div>
            <div className="stat-value" style={{ fontSize: 22 }}>
              {orders.filter(o => !['ENTREGUE','CANCELADO'].includes(o.status)).length}
            </div>
            <div className="stat-sub">encomendas ativas</div>
          </div>
          <div className="stat-card terra">
            <div className="stat-label">Saldo a receber</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{fmt(pendingBalance)}</div>
            <div className="stat-sub">nas entregas</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Prontas p/ entrega</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>
              {orders.filter(o => o.status === 'PRONTO').length}
            </div>
            <div className="stat-sub">aguardando retirada</div>
          </div>
        </div>

        {/* Pipeline de status */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {STATUS_FLOW.map(s => {
            const count = orders.filter(o => o.status === s.key).length
            return (
              <div key={s.key} onClick={() => setTab(tab === s.key ? 'todos' : s.key)}
                style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: 20,
                  background: tab === s.key ? s.color : s.bg,
                  color: tab === s.key ? '#fff' : s.color,
                  border: `1px solid ${s.color}33`, fontSize: 12, fontWeight: 500,
                  transition: 'all .15s' }}>
                {s.label} {count > 0 && <span style={{ fontWeight: 700 }}>({count})</span>}
              </div>
            )
          })}
          <div onClick={() => setTab('todos')} style={{ cursor: 'pointer', padding: '6px 14px',
            borderRadius: 20, background: tab === 'todos' ? 'var(--navy)' : 'var(--cream-dark)',
            color: tab === 'todos' ? '#fff' : 'var(--navy)', border: '1px solid var(--border)',
            fontSize: 12, fontWeight: 500, marginLeft: 'auto' }}>
            Todos ({orders.length})
          </div>
        </div>

        {/* Controles */}
        <div className="page-header" style={{ marginBottom: 16 }}>
          <input className="form-input" style={{ width: 280 }}
            placeholder="Buscar por nome, telefone ou CPF..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={openNew}>+ Nova encomenda</button>
        </div>

        {/* Cards de encomendas */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ fontSize: 40 }}>📦</div>
            <div className="empty-state-text">Nenhuma encomenda encontrada</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {filtered.map(o => {
              const s = STATUS_MAP[o.status] || STATUS_MAP['PENDENTE']
              const overdue = o.overdue && o.status !== 'ENTREGUE' && o.status !== 'CANCELADO'
              const next = nextStatus(o.status)
              return (
                <div key={o.id} className="card" style={{ padding: 16, cursor: 'pointer',
                  borderLeft: `4px solid ${s.color}`, borderRadius: '0 var(--radius-lg) var(--radius-lg) 0' }}
                  onClick={() => setDetailModal(o)}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{o.customerName}</div>
                      <div style={{ fontSize: 12, color: 'var(--navy-muted)' }}>
                        {displayPhone(o.customerPhone)}
                        {o.customerCpf && (
                          <span style={{ display: 'block', marginTop: 2 }}>CPF {displayCpf(o.customerCpf)}</span>
                        )}
                      </div>
                    </div>
                    <span style={{ background: s.bg, color: s.color, padding: '2px 10px',
                      borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 13 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--navy-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Entrega</div>
                      <div style={{ fontWeight: 500, color: overdue ? 'var(--red)' : 'var(--navy)' }}>
                        {overdue && '⚠ '}{fmtDate(o.deliveryDate)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--navy-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Tipo</div>
                      <div style={{ fontWeight: 500 }}>{o.delivery ? '🚚 Entrega' : '🏪 Retirada'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderTop: '1px solid var(--border)', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--navy-muted)' }}>Total</div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--terra)' }}>{fmt(o.totalAmount)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--navy-muted)' }}>Saldo</div>
                      <div style={{ fontSize: 15, fontWeight: 600,
                        color: o.remainingBalance > 0 ? 'var(--red)' : 'var(--green)' }}>
                        {fmt(o.remainingBalance)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    {next && (
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
                        onClick={() => updateStatus(o.id, next)}>
                        → {STATUS_MAP[next]?.label}
                      </button>
                    )}
                    {o.remainingBalance > 0 && o.status !== 'CANCELADO' && (
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => { setDepositModal(o); setDepositAmt(o.remainingBalance) }}>
                        Receber
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(o)}>✏</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL: Nova / Editar encomenda */}
      {modal && (
        <Modal title={editing ? 'Editar encomenda' : 'Nova encomenda'} onClose={() => setModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" disabled={saving} onClick={save}>
              {saving ? 'Salvando...' : 'Salvar encomenda'}
            </button>
          </>}>

          <div className="form-group">
            <label className="form-label">Cliente cadastrado (opcional)</label>
            <input
              className="form-input"
              style={{ marginBottom: 8 }}
              placeholder="Filtrar por nome, telefone ou CPF…"
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
            />
            <select className="form-select" value={selectedClientId}
              onChange={e => {
                const id = e.target.value
                setSelectedClientId(id)
                const c = clients.find(c => String(c.id) === String(id))
                if (!c) return
                setForm(f => ({
                  ...f,
                  customerName: c.name || '',
                  customerPhone: formatPhoneBR(c.phone || ''),
                  customerCpf: formatCpf(c.cpf || ''),
                  cepEntrega: '',
                  customerAddress: c.address || '',
                  customerAddressNumber: c.addressNumber ?? '',
                  customerAddressComplement: c.addressComplement ?? '',
                  customerResidenceType: c.residenceType ?? '',
                }))
              }}>
              <option value="">— Preencher manualmente —</option>
              {filteredClients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.phone ? ` · ${formatPhoneBR(c.phone)}` : ''}{c.cpf ? ` · ${formatCpf(c.cpf)}` : ''}
                </option>
              ))}
            </select>
            {clients.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--navy-muted)', marginTop: 6 }}>
                Nenhum cliente ativo no cadastro.
                {canManageClients && (
                  <> <Link to="/clientes" style={{ color: 'var(--terra)', fontWeight: 600 }}>Cadastrar clientes</Link></>
                )}
              </div>
            )}
            {canManageClients && clients.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12 }}>
                <Link to="/clientes" style={{ color: 'var(--terra)', fontWeight: 500 }}>Gerenciar cadastro de clientes →</Link>
              </div>
            )}
          </div>

          <div style={{ fontSize: 11, color: 'var(--navy-muted)', margin: '12px 0 8px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Ou preencha manualmente
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nome do cliente *</label>
              <input className="form-input" value={form.customerName}
                onChange={e => { setSelectedClientId(''); setForm(f => ({ ...f, customerName: e.target.value })) }} />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone / WhatsApp *</label>
              <input className="form-input" placeholder="(21) 99999-9999" inputMode="tel" autoComplete="tel"
                value={form.customerPhone}
                onChange={e => { setSelectedClientId(''); setForm(f => ({ ...f, customerPhone: formatPhoneBR(e.target.value) })) }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">CPF (opcional)</label>
            <input className="form-input" placeholder="000.000.000-00" inputMode="numeric" autoComplete="off"
              value={form.customerCpf}
              onChange={e => { setSelectedClientId(''); setForm(f => ({ ...f, customerCpf: formatCpf(e.target.value) })) }} />
          </div>

          <div className="form-group">
            <label className="form-label">Data e hora da entrega *</label>
            <input className="form-input" type="datetime-local" value={form.deliveryDate}
              onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.delivery}
                onChange={e => setForm(f => ({ ...f, delivery: e.target.checked }))} />
              Entrega no endereço do cliente
            </label>
          </div>

          {form.delivery && (
            <>
              <CepBusca
                cep={form.cepEntrega}
                onCepChange={v => { setSelectedClientId(''); setForm(f => ({ ...f, cepEntrega: v })) }}
                enderecoAtual={form.customerAddress}
                onEndereco={text => { setSelectedClientId(''); setForm(f => ({ ...f, customerAddress: text })) }}
              />
              <div className="form-group">
                <label className="form-label">Logradouro, bairro e cidade</label>
                <input className="form-input" placeholder="Preenchido pelo CEP ou digite à mão"
                  value={form.customerAddress}
                  onChange={e => { setSelectedClientId(''); setForm(f => ({ ...f, customerAddress: e.target.value })) }} />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Número</label>
                  <input className="form-input" placeholder="Ex.: 120 ou S/N"
                    value={form.customerAddressNumber}
                    onChange={e => { setSelectedClientId(''); setForm(f => ({ ...f, customerAddressNumber: e.target.value })) }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Complemento</label>
                  <input className="form-input" placeholder="Apto, bloco, sala…"
                    value={form.customerAddressComplement}
                    onChange={e => { setSelectedClientId(''); setForm(f => ({ ...f, customerAddressComplement: e.target.value })) }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de residência</label>
                <select
                  className="form-select"
                  value={form.customerResidenceType}
                  onChange={e => { setSelectedClientId(''); setForm(f => ({ ...f, customerResidenceType: e.target.value })) }}
                >
                  {TIPOS_RESIDENCIA.map(o => (
                    <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Itens */}
          <div style={{ fontWeight: 600, fontSize: 13, margin: '12px 0 8px' }}>Itens da encomenda</div>
          {form.items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px auto',
              gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
              <div>
                {i === 0 && <label className="form-label">Produto</label>}
                <select className="form-select" value={item.productId}
                  onChange={e => {
                    const p = products.find(p => String(p.id) === e.target.value)
                    setItem(i, 'productId', e.target.value)
                    if (p) setItem(i, 'unitPrice', p.salePrice)
                  }}>
                  <option value="">— Selecione —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                {i === 0 && <label className="form-label">Qtd.</label>}
                <input className="form-input" type="number" min="1" value={item.quantity}
                  onChange={e => setItem(i, 'quantity', e.target.value)} />
              </div>
              <div>
                {i === 0 && <label className="form-label">Preço unit.</label>}
                <input className="form-input" type="number" step="0.01" value={item.unitPrice}
                  onChange={e => setItem(i, 'unitPrice', e.target.value)} />
              </div>
              <button className="btn btn-danger btn-sm" style={{ marginBottom: 0 }}
                onClick={() => rmItem(i)}>×</button>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={addItem} style={{ marginBottom: 14 }}>
            + Adicionar item
          </button>

          <div style={{ background: 'var(--cream-dark)', borderRadius: 'var(--radius-md)',
            padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--navy-muted)' }}>Total calculado:</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--terra)' }}>
              {fmt(calcTotal())}
            </span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Sinal / Entrada (R$)</label>
              <input className="form-input" type="number" step="0.01" placeholder="0,00"
                value={form.depositAmount}
                onChange={e => setForm(f => ({ ...f, depositAmount: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Saldo a receber</label>
              <input className="form-input" readOnly
                value={fmt(Math.max(0, calcTotal() - (parseFloat(form.depositAmount) || 0)))}
                style={{ background: 'var(--cream-dark)', color: 'var(--navy-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea className="form-input" rows={2} placeholder="Alergias, preferências, horário..."
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </Modal>
      )}

      {/* MODAL: Detalhe */}
      {detailModal && (() => {
        const o = orders.find(x => x.id === detailModal.id) || detailModal
        const enderecoPedido = montarEnderecoPedido(o)
        const s = STATUS_MAP[o.status] || STATUS_MAP['PENDENTE']
        const next = nextStatus(o.status)
        return (
          <Modal title={`Encomenda #${o.id}`} onClose={() => setDetailModal(null)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{o.customerName}</div>
                <div style={{ fontSize: 13, color: 'var(--navy-muted)' }}>
                  {displayPhone(o.customerPhone)}
                  {o.customerCpf && (
                    <div style={{ marginTop: 4 }}>CPF {displayCpf(o.customerCpf)}</div>
                  )}
                </div>
              </div>
              <span style={{ background: s.bg, color: s.color, padding: '4px 14px',
                borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                ['Entrega', fmtDate(o.deliveryDate)],
                ['Tipo', o.delivery ? '🚚 Entrega no endereço' : '🏪 Retirada no balcão'],
                o.customerCpf && ['CPF', displayCpf(o.customerCpf)],
                ['Total', fmt(o.totalAmount)],
                ['Saldo', fmt(o.remainingBalance)],
                enderecoPedido && ['Endereço', enderecoPedido],
                o.notes && ['Obs.', o.notes],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={{ background: 'var(--cream)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--navy-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            {o.items?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Itens</div>
                {o.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                    padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span>{it.quantity}× {it.product?.name}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(it.subtotal || it.unitPrice * it.quantity)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {next && (
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
                  onClick={() => updateStatus(o.id, next)}>
                  Avançar → {STATUS_MAP[next]?.label}
                </button>
              )}
              {o.remainingBalance > 0 && o.status !== 'CANCELADO' && (
                <button className="btn btn-secondary btn-sm"
                  onClick={() => { setDetailModal(null); setDepositModal(o); setDepositAmt(o.remainingBalance) }}>
                  Receber saldo
                </button>
              )}
              {o.status !== 'ENTREGUE' && o.status !== 'CANCELADO' && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setDetailModal(null); openEdit(o) }}>
                  Editar
                </button>
              )}
              {o.status !== 'ENTREGUE' && o.status !== 'CANCELADO' && (
                <button className="btn btn-danger btn-sm" onClick={() => cancel(o.id)}>
                  Cancelar
                </button>
              )}
            </div>
          </Modal>
        )
      })()}

      {/* MODAL: Receber pagamento */}
      {depositModal && (
        <Modal title={`Receber pagamento — ${depositModal.customerName}`}
          onClose={() => setDepositModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setDepositModal(null)}>Cancelar</button>
            <button className="btn btn-primary" disabled={!depositAmt} onClick={registerDeposit}>
              Confirmar recebimento
            </button>
          </>}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--navy-muted)', marginBottom: 4 }}>Saldo em aberto</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--terra)' }}>
              {fmt(depositModal.remainingBalance)}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Valor recebido (R$) *</label>
            <input className="form-input" type="number" step="0.01"
              value={depositAmt} onChange={e => setDepositAmt(e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  )
}
