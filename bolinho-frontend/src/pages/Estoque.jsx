import { useState, useEffect } from 'react'
import { TopBar } from '../components/Sidebar'
import { Modal } from '../components/Modal'
import { getIngredientes, getFornecedores, createIngrediente, updateIngrediente } from '../services/api'

const empty = { name: '', unit: 'KG', minimumStock: '', preferredSupplierId: '' }

export default function Estoque() {
  const [items, setItems] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('todos')

  const load = () => Promise.all([getIngredientes(), getFornecedores()])
    .then(([ing, forn]) => { setItems(ing); setFornecedores(forn) })

  useEffect(() => { load() }, [])

  const openNew   = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit  = (i) => {
    const byName = i.preferredSupplierName && fornecedores.find(f => f.name === i.preferredSupplierName)?.id
    setForm({
      name: i.name, unit: i.unit, minimumStock: i.minimumStock,
      preferredSupplierId: i.preferredSupplierId ?? byName ?? '',
    })
    setEditing(i.id); setModal(true)
  }

  const save = async () => {
    const payload = { ...form, minimumStock: parseFloat(form.minimumStock) || 0, preferredSupplierId: form.preferredSupplierId || null }
    editing ? await updateIngrediente(editing, payload) : await createIngrediente(payload)
    setModal(false); load()
  }

  const filtered = items
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    .filter(i => tab === 'todos' || (tab === 'baixo' && i.belowMinimumStock))

  const belowCount = items.filter(i => i.belowMinimumStock).length

  const stockPct = (i) => {
    const min = parseFloat(i.minimumStock)
    if (!min) return 100
    return Math.min(100, (parseFloat(i.currentStock) / min) * 100)
  }

  return (
    <div className="main-area">
      <TopBar title="Estoque de Ingredientes" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Estoque</h1>
            {belowCount > 0 && <div className="alert alert-warn" style={{ marginTop: 8 }}>⚠ {belowCount} ingrediente(s) abaixo do estoque mínimo</div>}
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ Novo ingrediente</button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input className="form-input" style={{ width: 260 }} placeholder="Buscar ingrediente..." value={search} onChange={e => setSearch(e.target.value)} />
          <div className="seg-control" style={{ margin: 0 }}>
            <button className={`seg-btn${tab === 'todos' ? ' active' : ''}`} onClick={() => setTab('todos')}>Todos ({items.length})</button>
            <button className={`seg-btn${tab === 'baixo' ? ' active' : ''}`} onClick={() => setTab('baixo')}>
              Estoque baixo {belowCount > 0 && `(${belowCount})`}
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Estoque atual</th>
                  <th>Mínimo</th>
                  <th>Nível</th>
                  <th>Custo médio</th>
                  <th>Fornecedor</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => {
                  const pct = stockPct(i)
                  const barColor = pct === 0 ? '#C0392B' : pct < 50 ? '#D4960A' : '#2E7D52'
                  return (
                    <tr key={i.id}>
                      <td style={{ fontWeight: 500 }}>{i.name}</td>
                      <td><strong>{Number(i.currentStock).toFixed(3)}</strong> {i.unit}</td>
                      <td>{Number(i.minimumStock).toFixed(3)} {i.unit}</td>
                      <td style={{ width: 120 }}>
                        <div className="stock-bar-wrap">
                          <div className="stock-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--navy-muted)', marginTop: 2 }}>{Math.round(pct)}%</div>
                      </td>
                      <td>R$ {Number(i.averageCost || 0).toFixed(4)}</td>
                      <td style={{ color: 'var(--navy-muted)' }}>{i.preferredSupplierName || '—'}</td>
                      <td>
                        {i.belowMinimumStock
                          ? <span className="badge badge-red">Baixo</span>
                          : <span className="badge badge-green">Normal</span>}
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(i)}>Editar</button>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--navy-muted)', padding: 32 }}>Nenhum ingrediente encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <Modal title={editing ? 'Editar ingrediente' : 'Novo ingrediente'} onClose={() => setModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Nome *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Unidade *</label>
              <select className="form-select" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                {['KG','G','L','ML','UN'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estoque mínimo</label>
              <input className="form-input" type="number" step="0.001" value={form.minimumStock} onChange={e => setForm(p => ({ ...p, minimumStock: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Fornecedor preferido</label>
              <select className="form-select" value={form.preferredSupplierId} onChange={e => setForm(p => ({ ...p, preferredSupplierId: e.target.value }))}>
                <option value="">— Nenhum —</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
