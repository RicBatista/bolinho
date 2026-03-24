import { useState, useEffect } from 'react'
import { TopBar } from '../components/Sidebar'
import { Modal } from '../components/Modal'
import {
  getProdutos,
  createProduto,
  updateProduto,
  deleteProduto,
  getIngredientes,
  getProdutoReceita,
  putProdutoReceita,
} from '../services/api'

const CAT_LABELS = { BOLINHO_BACALHAU: 'Bolinho de Bacalhau', FRANGO_ASSADO: 'Frango Assado', MIX_SALGADINHOS: 'Mix Salgadinhos', BEBIDA: 'Bebida', OUTROS: 'Outros' }
const CAT_COLORS = { BOLINHO_BACALHAU: 'badge-terra', FRANGO_ASSADO: 'badge-gold', MIX_SALGADINHOS: 'badge-green', BEBIDA: 'badge-navy', OUTROS: 'badge-navy' }
const fmt = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const empty = { name: '', description: '', category: 'BOLINHO_BACALHAU', salePrice: '', productionCost: '', unitQuantity: 1 }
const emptyRecipeLine = () => ({ ingredientId: '', quantity: '' })

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [catFilter, setCatFilter] = useState('TODOS')
  const [ingredientes, setIngredientes] = useState([])
  const [recipeLines, setRecipeLines] = useState([emptyRecipeLine()])

  const load = () => getProdutos().then(setProdutos)
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!modal) return
    getIngredientes().then(setIngredientes).catch(() => setIngredientes([]))
  }, [modal])

  const openNew = () => {
    setForm(empty)
    setEditing(null)
    setRecipeLines([emptyRecipeLine()])
    setModal(true)
  }

  const openEdit = async (p) => {
    setForm({
      name: p.name,
      description: p.description || '',
      category: p.category,
      salePrice: p.salePrice,
      productionCost: p.productionCost,
      unitQuantity: p.unitQuantity,
    })
    setEditing(p.id)
    setRecipeLines([emptyRecipeLine()])
    try {
      const lines = await getProdutoReceita(p.id)
      if (lines?.length) {
        setRecipeLines(
          lines.map((l) => ({
            ingredientId: String(l.ingredient?.id ?? ''),
            quantity: String(l.quantity ?? ''),
          }))
        )
      }
    } catch {
      setRecipeLines([emptyRecipeLine()])
    }
    setModal(true)
  }

  const save = async () => {
    const payload = {
      ...form,
      salePrice: parseFloat(form.salePrice),
      productionCost: parseFloat(form.productionCost),
      unitQuantity: parseInt(form.unitQuantity, 10),
    }
    let pid = editing
    if (editing) {
      await updateProduto(editing, payload)
    } else {
      const created = await createProduto(payload)
      pid = created.id
    }
    const receitaPayload = recipeLines
      .filter((r) => r.ingredientId && r.quantity !== '' && Number(r.quantity) > 0)
      .map((r) => ({ ingredientId: Number(r.ingredientId), quantity: Number(r.quantity) }))
    await putProdutoReceita(pid, receitaPayload)
    setModal(false)
    load()
  }

  const deactivate = async (id) => {
    if (!confirm('Desativar este produto?')) return
    await deleteProduto(id); load()
  }

  const cats = ['TODOS', ...Object.keys(CAT_LABELS)]
  const filtered = catFilter === 'TODOS' ? produtos : produtos.filter(p => p.category === catFilter)

  const margin = (p) => {
    if (!p.salePrice || !p.productionCost) return null
    return ((p.salePrice - p.productionCost) / p.salePrice * 100).toFixed(0)
  }

  return (
    <div className="main-area">
      <TopBar title="Produtos" />
      <div className="page-content">
        <div className="page-header">
          <h1>Cardápio / Produtos</h1>
          <button className="btn btn-primary" onClick={openNew}>+ Novo produto</button>
        </div>

        <div className="seg-control">
          {cats.map(c => (
            <button key={c} className={`seg-btn${catFilter === c ? ' active' : ''}`} onClick={() => setCatFilter(c)}>
              {c === 'TODOS' ? 'Todos' : CAT_LABELS[c]}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filtered.map(p => (
            <div key={p.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span className={`badge ${CAT_COLORS[p.category] || 'badge-navy'}`}>{CAT_LABELS[p.category] || p.category}</span>
                {margin(p) && <span className="badge badge-green">{margin(p)}% margem</span>}
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{p.name}</div>
              {p.description && <div style={{ fontSize: 12, color: 'var(--navy-muted)', marginBottom: 10 }}>{p.description}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--navy-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Venda</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--terra)' }}>{fmt(p.salePrice)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--navy-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Custo</div>
                  <div style={{ fontSize: 15, color: 'var(--navy-muted)' }}>{fmt(p.productionCost)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(p)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => deactivate(p.id)}>Desativar</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">Nenhum produto encontrado</div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <Modal title={editing ? 'Editar produto' : 'Novo produto'} onClose={() => setModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Categoria *</label>
            <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Preço de venda *</label>
              <input className="form-input" type="number" step="0.01" value={form.salePrice} onChange={e => setForm(p => ({ ...p, salePrice: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Custo produção *</label>
              <input className="form-input" type="number" step="0.01" value={form.productionCost} onChange={e => setForm(p => ({ ...p, productionCost: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Qtd. por unidade</label>
              <input className="form-input" type="number" min="1" value={form.unitQuantity} onChange={e => setForm(p => ({ ...p, unitQuantity: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border, #e8e4df)' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Receita (BOM)</div>
            <p style={{ fontSize: 12, color: 'var(--navy-muted)', marginBottom: 12 }}>
              Ingredientes consumidos por <strong>1 unidade</strong> vendida deste produto no PDV. Deixe em branco se não houver baixa automática de estoque.
            </p>
            {recipeLines.map((row, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 8, alignItems: 'end', marginBottom: 8 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ingrediente</label>
                  <select
                    className="form-select"
                    value={row.ingredientId}
                    onChange={(e) =>
                      setRecipeLines((lines) =>
                        lines.map((l, i) => (i === idx ? { ...l, ingredientId: e.target.value } : l))
                      )
                    }
                  >
                    <option value="">—</option>
                    {ingredientes.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Qtd.</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.0001"
                    value={row.quantity}
                    onChange={(e) =>
                      setRecipeLines((lines) =>
                        lines.map((l, i) => (i === idx ? { ...l, quantity: e.target.value } : l))
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setRecipeLines((lines) => lines.filter((_, i) => i !== idx))}
                  disabled={recipeLines.length <= 1}
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setRecipeLines((lines) => [...lines, emptyRecipeLine()])}
            >
              + Linha
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
