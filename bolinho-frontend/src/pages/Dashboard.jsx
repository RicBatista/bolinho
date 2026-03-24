import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../components/Sidebar'
import { getDashboard } from '../services/api'
import { LoadErrorPanel } from '../components/LoadErrorPanel'
import { getApiErrorMessage } from '../utils/apiError'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'

const fmt = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtShort = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`

const ORDER_STATUS_LABEL = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const fetchDashboard = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    return getDashboard()
      .then((d) => {
        setData(d)
        setLoadError(null)
      })
      .catch((err) => {
        setData(null)
        setLoadError(getApiErrorMessage(err, 'Não foi possível carregar o dashboard.'))
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const last7 = data?.revenueLast7Days
    ? Object.entries(data.revenueLast7Days).map(([date, val]) => ({
        day: new Date(date + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
        valor: Number(val)
      }))
    : []

  const byChannel = data?.revenueByChannel
    ? Object.entries(data.revenueByChannel).map(([k, v]) => ({ name: k, valor: Number(v) }))
    : []

  const COLORS = ['#C85A2E', '#1C2B3A', '#D4960A', '#2E7D52']

  if (loading && !loadError) {
    return (
      <div className="main-area">
        <TopBar title="Dashboard" />
        <div className="page-content app-boot-screen">
          <span className="spinner" aria-hidden />
          <span>Carregando dashboard…</span>
        </div>
      </div>
    )
  }

  if (loadError && !data) {
    return (
      <div className="main-area">
        <TopBar title="Dashboard" />
        <div className="page-content">
          <LoadErrorPanel
            title="Não foi possível carregar o dashboard"
            message={loadError}
            onRetry={fetchDashboard}
            busy={loading}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="main-area">
      <TopBar title="Dashboard" />
      <div className="page-content">

        <p style={{ fontSize: 13, color: 'var(--navy-muted)', margin: '0 0 16px', maxWidth: 720 }}>
          O faturamento abaixo é das <strong>vendas no PDV</strong> (balcão, delivery, canal Encomenda no caixa, etc.).
          Encomendas agendadas cadastradas em <Link to="/encomendas" style={{ color: 'var(--terra)', fontWeight: 600 }}>Encomendas</Link> aparecem na seção seguinte.
        </p>

        {/* KPIs */}
        <div className="stat-grid">
          <div className="stat-card accent">
            <div className="stat-label">Hoje (PDV)</div>
            <div className="stat-value">{fmtShort(data?.revenueToday)}</div>
            <div className="stat-sub">{data?.salesToday ?? 0} vendas no caixa</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Esta semana</div>
            <div className="stat-value">{fmtShort(data?.revenueThisWeek)}</div>
            <div className="stat-sub">faturamento</div>
          </div>
          <div className="stat-card terra">
            <div className="stat-label">Este mês (PDV)</div>
            <div className="stat-value">{fmtShort(data?.revenueThisMonth)}</div>
            <div className="stat-sub">{data?.salesThisMonth ?? 0} vendas no caixa</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Encomendas em aberto</div>
            <div className="stat-value">{data?.activeOrdersCount ?? 0}</div>
            <div className="stat-sub">{data?.ordersDeliveryTodayCount ?? 0} com entrega hoje</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">A pagar fornecedores</div>
            <div className="stat-value" style={{ color: data?.totalPendingPayments > 0 ? 'var(--red)' : 'var(--navy)' }}>
              {fmtShort(data?.totalPendingPayments)}
            </div>
            <div className="stat-sub">{data?.overduePaymentsCount ?? 0} vencida(s)</div>
          </div>
        </div>

        {/* Encomendas (pedidos futuros — tela Encomendas) */}
        <div className="card dashboard-panel" style={{ marginBottom: 20 }}>
          <div className="section-header">
            <div className="card-title">Últimas encomendas cadastradas</div>
            <Link to="/encomendas" className="link-action">Ver todas →</Link>
          </div>
          {data?.recentOrders?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {data.recentOrders.map((o) => (
                <div
                  key={o.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 13,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>#{o.id} · {o.customerName}</div>
                    <div style={{ fontSize: 12, color: 'var(--navy-muted)' }}>
                      Entrega: {o.deliveryDate
                        ? new Date(o.deliveryDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--terra)' }}>{fmt(o.totalAmount)}</div>
                    <div style={{ fontSize: 11, color: 'var(--navy-muted)' }}>{ORDER_STATUS_LABEL[o.status] || o.status}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--navy-muted)', fontSize: 13 }}>
              Nenhuma encomenda cadastrada ainda. Use o menu <strong>Encomendas</strong> para registrar pedidos futuros.
            </div>
          )}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
          <div className="card dashboard-panel">
            <div className="card-title">Faturamento — últimos 7 dias</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={last7} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#C85A2E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#C85A2E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#4A6070' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#4A6070' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [fmt(v), 'Faturamento']} labelStyle={{ color: '#1C2B3A', fontWeight: 600 }} contentStyle={{ borderRadius: 8, border: '1px solid #eee', fontSize: 12 }} />
                <Area type="monotone" dataKey="valor" stroke="#C85A2E" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card dashboard-panel">
            <div className="card-title">Por canal</div>
            {byChannel.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byChannel} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#4A6070' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={v => [fmt(v), 'Receita']} contentStyle={{ borderRadius: 8, border: '1px solid #eee', fontSize: 12 }} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {byChannel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-text">Sem dados</div>
              </div>
            )}
          </div>
        </div>

        {/* Alerts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Low stock */}
          <div className="card dashboard-panel">
            <div className="card-title">Alertas de estoque</div>
            {data?.lowStockAlerts?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.lowStockAlerts.map(a => (
                  <div key={a.ingredientId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.ingredientName}</div>
                      <div className="stock-bar-wrap">
                        <div className="stock-bar-fill" style={{
                          width: `${Math.min(100, (Number(a.currentStock) / Number(a.minimumStock)) * 100)}%`,
                          background: Number(a.currentStock) === 0 ? '#C0392B' : '#D4960A'
                        }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, color: 'var(--red)' }}>{a.currentStock} {a.unit}</div>
                      <div style={{ color: 'var(--navy-muted)' }}>mín: {a.minimumStock}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--green)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✓</span> Estoque dentro do normal
              </div>
            )}
          </div>

          {/* Upcoming payments */}
          <div className="card dashboard-panel">
            <div className="card-title">Contas a pagar (próximos 7 dias)</div>
            {data?.upcomingPayments?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.upcomingPayments.map(p => (
                  <div key={p.purchaseId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.supplierName}</div>
                      <div style={{ fontSize: 11, color: 'var(--navy-muted)' }}>
                        Vence: {new Date(p.dueDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{fmt(p.remainingAmount)}</div>
                      {p.overdue && <span className="badge badge-red">Vencida</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--green)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✓</span> Nenhuma conta vencendo em breve
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
