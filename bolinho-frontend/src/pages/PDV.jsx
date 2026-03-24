import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../components/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { getProdutos, createVenda, getClientes } from '../services/api'
import { formatPhoneBR, formatCpf, onlyDigits } from '../utils/brFormat'

const CAT_LABELS = {
  BOLINHO_BACALHAU: 'Bolinho',
  FRANGO_ASSADO: 'Frango',
  MIX_SALGADINHOS: 'Salgadinhos',
  BEBIDA: 'Bebida',
  OUTROS: 'Outros'
}

const PAYMENT_METHODS = [
  { value: 'PIX',            label: 'PIX' },
  { value: 'DINHEIRO',       label: 'Dinheiro' },
  { value: 'CARTAO_CREDITO', label: 'Crédito' },
  { value: 'CARTAO_DEBITO',  label: 'Débito' },
]

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

export default function PDV() {
  const { user } = useAuth()
  const canManageClients = user && ['DONO', 'GESTOR'].includes(user.role)

  const [produtos, setProdutos] = useState([])
  const [cart, setCart] = useState([])
  const [catFilter, setCatFilter] = useState('TODOS')
  const [payment, setPayment] = useState('PIX')
  const [channel, setChannel] = useState('BALCAO')
  const [customer, setCustomer] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerCpf, setCustomerCpf] = useState('')
  const [clientes, setClientes] = useState([])
  const [clientFilter, setClientFilter] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [discount, setDiscount] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    getProdutos().then(setProdutos)
    getClientes().then(setClientes).catch(() => setClientes([]))
  }, [])

  const filteredClientes = useMemo(() => {
    const q = clientFilter.trim().toLowerCase()
    let list = !q
      ? clientes
      : clientes.filter(c => {
          const qd = onlyDigits(q)
          if ((c.name || '').toLowerCase().includes(q)) return true
          if ((c.phone || '').toLowerCase().includes(q)) return true
          if (qd.length > 0 && c.cpf && onlyDigits(c.cpf).includes(qd)) return true
          if (qd.length >= 3 && onlyDigits(c.phone || '').includes(qd)) return true
          return false
        })
    if (selectedClientId) {
      const sel = clientes.find(c => String(c.id) === String(selectedClientId))
      if (sel && !list.some(c => String(c.id) === String(selectedClientId)))
        list = [sel, ...list]
    }
    return list
  }, [clientes, clientFilter, selectedClientId])

  const cats = ['TODOS', ...new Set(produtos.map(p => p.category))]
  const filtered = catFilter === 'TODOS' ? produtos : produtos.filter(p => p.category === catFilter)

  const addToCart = (produto) => {
    setCart(prev => {
      const ex = prev.find(i => i.productId === produto.id)
      if (ex) return prev.map(i => i.productId === produto.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: produto.id, name: produto.name, unitPrice: produto.salePrice, quantity: 1 }]
    })
  }

  const updateQty = (productId, delta) => {
    setCart(prev => prev
      .map(i => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    )
  }

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const disc = parseFloat(discount) || 0
  const total = Math.max(0, subtotal - disc)

  const handleVender = async () => {
    if (cart.length === 0) return
    setLoading(true)
    try {
      await createVenda({
        saleChannel: channel,
        customerName: customer || null,
        customerPhone: customerPhone || null,
        customerCpf: customerCpf || null,
        paymentMethod: payment,
        discountAmount: disc || 0,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice }))
      })
      setSuccess(true)
      setCart([])
      setCustomer('')
      setCustomerPhone('')
      setCustomerCpf('')
      setSelectedClientId('')
      setClientFilter('')
      setDiscount('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      alert('Erro ao registrar venda. Verifique a conexão com a API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="main-area">
      <TopBar title="Ponto de Venda" />
      <div className="page-content" style={{ padding: 16 }}>
        {success && (
          <div className="alert alert-success" style={{ marginBottom: 12 }}>
            ✓ Venda registrada com sucesso!
          </div>
        )}
        <div className="pdv-grid">
          {/* LEFT: Products */}
          <div className="pdv-products">
            {/* Category filter */}
            <div className="seg-control" style={{ marginBottom: 12 }}>
              {cats.map(c => (
                <button key={c} className={`seg-btn${catFilter === c ? ' active' : ''}`} onClick={() => setCatFilter(c)}>
                  {c === 'TODOS' ? 'Todos' : (CAT_LABELS[c] || c)}
                </button>
              ))}
            </div>
            <div className="product-grid">
              {filtered.map(p => (
                <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                  <div className="product-cat">{CAT_LABELS[p.category] || p.category}</div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-price">{fmt(p.salePrice)}</div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                  <div className="empty-state-text">Nenhum produto nessa categoria</div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Cart */}
          <div className="pdv-cart">
            <div className="pdv-cart-header">
              <h3>Carrinho {cart.length > 0 && <span className="badge badge-terra" style={{ marginLeft: 6 }}>{cart.length}</span>}</h3>
            </div>

            <div className="pdv-cart-items">
              {cart.length === 0 ? (
                <div className="empty-state" style={{ padding: 30 }}>
                  <div className="empty-state-icon" style={{ fontSize: 32 }}>🛒</div>
                  <div className="empty-state-text">Clique nos produtos para adicionar</div>
                </div>
              ) : cart.map(item => (
                <div key={item.productId} className="cart-item">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-qty">
                    <button className="qty-btn" onClick={() => updateQty(item.productId, -1)}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.productId, +1)}>+</button>
                  </div>
                  <div className="cart-item-price">{fmt(item.unitPrice * item.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="pdv-cart-footer">
              {/* Channel + customer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div>
                  <div className="form-label" style={{ marginBottom: 4 }}>Canal</div>
                  <select className="form-select" value={channel} onChange={e => setChannel(e.target.value)} style={{ padding: '7px 10px' }}>
                    <option value="BALCAO">Balcão</option>
                    <option value="DELIVERY">Delivery</option>
                    <option value="ENCOMENDA">Encomenda</option>
                    <option value="IFOOD">iFood</option>
                  </select>
                </div>
                <div>
                  <div className="form-label" style={{ marginBottom: 4 }}>Desconto (R$)</div>
                  <input className="form-input" type="number" min="0" step="0.50" placeholder="0,00"
                    value={discount} onChange={e => setDiscount(e.target.value)} style={{ padding: '7px 10px' }} />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div className="form-label" style={{ marginBottom: 4 }}>Cliente cadastrado (opcional)</div>
                <input
                  className="form-input"
                  placeholder="Filtrar por nome, telefone ou CPF…"
                  value={clientFilter}
                  onChange={e => setClientFilter(e.target.value)}
                  style={{ padding: '7px 10px', marginBottom: 8 }}
                />
                <select
                  className="form-select"
                  value={selectedClientId}
                  onChange={e => {
                    const id = e.target.value
                    setSelectedClientId(id)
                    const c = clientes.find(c => String(c.id) === String(id))
                    if (!c) {
                      setCustomer('')
                      setCustomerPhone('')
                      setCustomerCpf('')
                      return
                    }
                    setCustomer(c.name || '')
                    setCustomerPhone(formatPhoneBR(c.phone || ''))
                    setCustomerCpf(formatCpf(c.cpf || ''))
                  }}
                  style={{ padding: '7px 10px', marginBottom: 8 }}
                >
                  <option value="">— Sem cadastro / manual —</option>
                  {filteredClientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.phone ? ` · ${formatPhoneBR(c.phone)}` : ''}
                      {c.cpf ? ` · ${formatCpf(c.cpf)}` : ''}
                    </option>
                  ))}
                </select>
                {clientes.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--navy-muted)', marginBottom: 8 }}>
                    Nenhum cliente ativo.
                    {canManageClients && (
                      <> <Link to="/clientes" style={{ color: 'var(--terra)', fontWeight: 600 }}>Cadastrar</Link></>
                    )}
                  </div>
                )}
                {canManageClients && clientes.length > 0 && (
                  <div style={{ fontSize: 11, marginBottom: 8 }}>
                    <Link to="/clientes" style={{ color: 'var(--terra)', fontWeight: 500 }}>Gerenciar clientes →</Link>
                  </div>
                )}

                <div style={{ fontSize: 10, color: 'var(--navy-muted)', margin: '6px 0 6px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  Ou manual
                </div>
                <input
                  className="form-input"
                  placeholder="Nome do cliente"
                  value={customer}
                  onChange={e => {
                    setCustomer(e.target.value)
                    setSelectedClientId('')
                    setCustomerPhone('')
                    setCustomerCpf('')
                  }}
                  style={{ padding: '7px 10px', marginBottom: 8 }}
                />
                <input
                  className="form-input"
                  placeholder="(21) 99999-9999"
                  inputMode="tel"
                  autoComplete="tel"
                  value={customerPhone}
                  onChange={e => {
                    setCustomerPhone(formatPhoneBR(e.target.value))
                    setSelectedClientId('')
                  }}
                  style={{ padding: '7px 10px', marginBottom: 8 }}
                />
                <input
                  className="form-input"
                  placeholder="CPF (opcional)"
                  inputMode="numeric"
                  autoComplete="off"
                  value={customerCpf}
                  onChange={e => {
                    setCustomerCpf(formatCpf(e.target.value))
                    setSelectedClientId('')
                  }}
                  style={{ padding: '7px 10px' }}
                />
              </div>

              {/* Payment */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
                {PAYMENT_METHODS.map(m => (
                  <button key={m.value}
                    className={`btn${payment === m.value ? ' btn-navy' : ' btn-ghost'}`}
                    style={{ padding: '7px 4px', fontSize: 12, justifyContent: 'center' }}
                    onClick={() => setPayment(m.value)}>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--navy-muted)', marginBottom: 4 }}>
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              {disc > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--red)', marginBottom: 4 }}>
                  <span>Desconto</span><span>− {fmt(disc)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--navy)', marginBottom: 14, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span>Total</span><span>{fmt(total)}</span>
              </div>

              <button className="btn btn-primary btn-block btn-lg" onClick={handleVender} disabled={loading || cart.length === 0}>
                {loading ? 'Registrando...' : `Confirmar Venda — ${fmt(total)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
