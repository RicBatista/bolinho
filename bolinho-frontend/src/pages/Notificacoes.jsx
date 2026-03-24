import { useState, useEffect } from 'react'
import { TopBar } from '../components/Sidebar'
import { getHistoricoNotificacoes, testarEstoqueBaixo, testarContasVencidas, testarResumoDiario } from '../services/api'

const TYPE_LABEL = {
  ESTOQUE_BAIXO: 'Estoque baixo', CONTA_VENCENDO: 'Conta a vencer',
  CONTA_VENCIDA: 'Conta vencida', VENDA_REALIZADA: 'Venda', RESUMO_DIARIO: 'Resumo diário',
  CLIENTE_WHATSAPP: 'Cliente (pedido)',
}
const TYPE_BADGE = {
  ESTOQUE_BAIXO: 'badge-gold', CONTA_VENCENDO: 'badge-terra',
  CONTA_VENCIDA: 'badge-red', VENDA_REALIZADA: 'badge-green', RESUMO_DIARIO: 'badge-navy',
  CLIENTE_WHATSAPP: 'badge-green',
}

export default function Notificacoes() {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState({})

  const load = () => getHistoricoNotificacoes().then(setHistorico).catch(() => {})
  useEffect(() => { load() }, [])

  const trigger = async (key, fn) => {
    setLoading(l => ({ ...l, [key]: true }))
    try { await fn() } catch (e) { alert('Erro ao disparar. Verifique a API.') }
    setLoading(l => ({ ...l, [key]: false }))
    setTimeout(load, 800)
  }

  return (
    <div className="main-area">
      <TopBar title="Notificações WhatsApp" />
      <div className="page-content">
        <div className="page-header">
          <h1>Notificações WhatsApp</h1>
        </div>

        <div className="alert alert-warn" style={{ marginBottom: 20, lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 10px' }}>
            <strong>Envio real (Z-API):</strong> use <code>zapi.enabled=true</code> e credenciais preenchidas.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>
              <strong>Desenvolvimento local:</strong> ficheiro{' '}
              <code style={{ wordBreak: 'break-all' }}>bolinho-bacalhau/src/main/resources/application.properties</code>
              {' — '}<code>zapi.instance-id</code>, <code>zapi.token</code>, <code>zapi.owner-phone</code>.
            </li>
            <li>
              <strong>Railway / Docker:</strong> variáveis{' '}
              <code>ZAPI_ENABLED=true</code>, <code>ZAPI_INSTANCE_ID</code>, <code>ZAPI_TOKEN</code>, <code>ZAPI_OWNER_PHONE</code>
              {' '}(modelo em <code>.env.example</code>).
            </li>
          </ul>
        </div>

        {/* Trigger cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { key: 'estoque', label: 'Verificar estoque baixo', desc: 'Roda todos os dias às 8h. Clique para testar agora.', fn: testarEstoqueBaixo, icon: '📦' },
            { key: 'contas',  label: 'Verificar contas vencidas', desc: 'Roda todos os dias às 9h. Clique para testar agora.', fn: testarContasVencidas, icon: '💰' },
            { key: 'resumo',  label: 'Enviar resumo diário', desc: 'Roda todos os dias às 20h. Clique para testar agora.', fn: testarResumoDiario, icon: '📊' },
          ].map(item => (
            <div key={item.key} className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'var(--navy-muted)', marginBottom: 14 }}>{item.desc}</div>
              <button className="btn btn-primary btn-sm btn-block" disabled={loading[item.key]}
                onClick={() => trigger(item.key, item.fn)}>
                {loading[item.key] ? 'Disparando...' : 'Disparar agora'}
              </button>
            </div>
          ))}
        </div>

        {/* History */}
        <h2 style={{ marginBottom: 14, fontSize: 16 }}>Últimas notificações enviadas</h2>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tipo</th><th>Para</th><th>Data / hora</th><th>Status</th><th>Mensagem</th></tr></thead>
              <tbody>
                {historico.map(n => (
                  <tr key={n.id}>
                    <td><span className={`badge ${TYPE_BADGE[n.type] || 'badge-navy'}`}>{TYPE_LABEL[n.type] || n.type}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>{n.phone}</td>
                    <td style={{ fontSize: 12, color: 'var(--navy-muted)' }}>{new Date(n.sentAt).toLocaleString('pt-BR')}</td>
                    <td>
                      {n.success
                        ? <span className="badge badge-green">Enviado</span>
                        : <span className="badge badge-red" title={n.errorMessage}>Falhou</span>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--navy-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.message?.replace(/\*/g, '').substring(0, 80)}...
                    </td>
                  </tr>
                ))}
                {historico.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--navy-muted)', padding: 32 }}>Nenhuma notificação enviada ainda</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
