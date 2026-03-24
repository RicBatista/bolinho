import { useState, useEffect } from 'react'
import { TopBar } from '../components/Sidebar'
import { Modal } from '../components/Modal'
import { getCompras, getFornecedores, getIngredientes, createCompra, pagarCompra } from '../services/api'

const STATUS_BADGE = {
  PENDENTE: 'badge-gold', PAGO: 'badge-green',
  VENCIDO: 'badge-red', PARCIALMENTE_PAGO: 'badge-terra'
}
const STATUS_LABEL = {
  PENDENTE: 'Pendente', PAGO: 'Pago', VENCIDO: 'Vencida', PARCIALMENTE_PAGO: 'Parcial'
}
const fmt = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

export default function Compras() {
  const [compras, setCompras]         = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [tab, setTab]                 = useState('todas')
  const [modalCompra, setModalCompra] = useState(false)
  const [modalPagar, setModalPagar]   = useState(null)
  const [payAmount, setPayAmount]     = useState('')
  const [form, setForm]               = useState({ supplierId: '', dueDate: '', invoiceNumber: '', items: [{ ingredientId: '', quantity: '', unitPrice: '' }] })

  const load = () => Promise.all([getCompras(), getFornecedores(), getIngredientes()])
    .then(([c, f, i]) => { setCompras(c); setFornecedores(f); setIngredientes(i) })

  useEffect(() => { load() }, [])

  const addItem  = () => setForm(f => ({ ...f, items: [...f.items, { ingredientId: '', quantity: '', unitPrice: '' }] }))
  const rmItem   = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const setItem  = (i, k, v) => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }))

  const saveCompra = async () => {
    const payload = {
      supplierId: parseInt(form.supplierId),
      dueDate: form.dueDate || null,
      invoiceNumber: form.invoiceNumber || null,
      items: form.items.map(i => ({ ingredientId: parseInt(i.ingredientId), quantity: parseFloat(i.quantity), unitPrice: parseFloat(i.unitPrice) }))
    }
    await createCompra(payload)
    setModalCompra(false)
    setForm({ supplierId: '', dueDate: '', invoiceNumber: '', items: [{ ingredientId: '', quantity: '', unitPrice: '' }] })
    load()
  }

  const handlePagar = async () => {
    await pagarCompra(modalPagar.id, parseFloat(payAmount))
    setModalPagar(null); setPayAmount(''); load()
  }

  const filtered = compras.filter(c => tab === 'todas' || (tab === 'pendentes' && c.paymentStatus !== 'PAGO') || (tab === 'vencidas' && c.overdue))

  return (
    <div className="main-area">
      <TopBar title="Compras / Contas a Pagar" />
      <div className="page-content">
        <div className="page-header">
          <h1>Compras & Contas</h1>
          <button className="btn btn-primary" onClick={() => setModalCompra(true)}>+ Nova compra</button>
        </div>

        <div className="seg-control">
          <button className={`seg-btn${tab === 'todas'    ? ' active' : ''}`} onClick={() => setTab('todas')}>Todas</button>
          <button className={`seg-btn${tab === 'pendentes'? ' active' : ''}`} onClick={() => setTab('pendentes')}>Pendentes</button>
          <button className={`seg-btn${tab === 'vencidas' ? ' active' : ''}`} onClick={() => setTab('vencidas')}>Vencidas</button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fornecedor</th><th>Data</th><th>Vencimento</th><th>Total</th><th>Pago</th><th>Saldo</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.supplierName}</td>
                    <td>{new Date(c.purchaseDate).toLocaleDateString('pt-BR')}</td>
                    <td style={{ color: c.overdue ? 'var(--red)' : 'inherit', fontWeight: c.overdue ? 600 : 400 }}>
                      {c.dueDate ? new Date(c.dueDate).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>{fmt(c.totalAmount)}</td>
                    <td>{fmt(c.amountPaid)}</td>
                    <td style={{ fontWeight: 600, color: c.remainingAmount > 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(c.remainingAmount)}</td>
                    <td><span className={`badge ${STATUS_BADGE[c.paymentStatus] || 'badge-navy'}`}>{STATUS_LABEL[c.paymentStatus] || c.paymentStatus}</span></td>
                    <td>
                      {c.paymentStatus !== 'PAGO' && (
                        <button className="btn btn-primary btn-sm" onClick={() => { setModalPagar(c); setPayAmount(c.remainingAmount) }}>Pagar</button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--navy-muted)', padding: 32 }}>Nenhuma compra encontrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: Nova compra */}
      {modalCompra && (
        <Modal title="Nova compra" onClose={() => setModalCompra(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setModalCompra(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveCompra}>Registrar compra</button></>}>
          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Fornecedor *</label>
              <select className="form-select" value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
                <option value="">— Selecione —</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data de vencimento</label>
              <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Nº da nota fiscal</label>
              <input className="form-input" value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} />
            </div>
          </div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, marginTop: 4 }}>Itens da compra</div>
          {form.items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
              <div>
                {i === 0 && <label className="form-label">Ingrediente</label>}
                <select className="form-select" value={item.ingredientId} onChange={e => setItem(i, 'ingredientId', e.target.value)}>
                  <option value="">— Selecione —</option>
                  {ingredientes.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                </select>
              </div>
              <div>
                {i === 0 && <label className="form-label">Qtd.</label>}
                <input className="form-input" type="number" step="0.001" placeholder="0,000" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} />
              </div>
              <div>
                {i === 0 && <label className="form-label">Preço unit.</label>}
                <input className="form-input" type="number" step="0.01" placeholder="0,00" value={item.unitPrice} onChange={e => setItem(i, 'unitPrice', e.target.value)} />
              </div>
              <button className="btn btn-danger btn-sm" style={{ marginBottom: 0 }} onClick={() => rmItem(i)}>×</button>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={addItem} style={{ marginTop: 4 }}>+ Adicionar item</button>
        </Modal>
      )}

      {/* MODAL: Pagar */}
      {modalPagar && (
        <Modal title={`Pagar — ${modalPagar.supplierName}`} onClose={() => setModalPagar(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setModalPagar(null)}>Cancelar</button><button className="btn btn-primary" onClick={handlePagar}>Confirmar pagamento</button></>}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--navy-muted)', marginBottom: 4 }}>Saldo em aberto</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28 }}>{fmt(modalPagar.remainingAmount)}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Valor a pagar (R$) *</label>
            <input className="form-input" type="number" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  )
}
