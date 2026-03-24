import { useState, useEffect } from 'react'
import { TopBar } from '../components/Sidebar'
import {
  getHistoricoNotificacoes,
  getZApiEstado,
  testarEstoqueBaixo,
  testarContasVencidas,
  testarResumoDiario,
} from '../services/api'

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

const SIMULATED_PREFIX = 'SIMULADO:'

function statusCell(n) {
  if (n.success) {
    return <span className="badge badge-green">Enviado</span>
  }
  const err = n.errorMessage || ''
  if (err.startsWith(SIMULATED_PREFIX)) {
    return <span className="badge badge-gold" title={err}>Simulado</span>
  }
  return <span className="badge badge-red" title={err}>Falhou</span>
}

export default function Notificacoes() {
  const [historico, setHistorico] = useState([])
  const [zapiEstado, setZapiEstado] = useState(null)
  const [loading, setLoading] = useState({})

  const load = () => {
    getHistoricoNotificacoes().then(setHistorico).catch(() => {})
    getZApiEstado().then(setZapiEstado).catch(() => { setZapiEstado(null) })
  }
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

        <div className="alert alert-info" style={{ marginBottom: 20, lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 10px' }}>
            O WhatsApp só é enviado pela <strong>Z-API no serviço da API (Java)</strong>, não por este site.
            Se o telemóvel não recebe nada, o problema está nas <strong>Variables</strong> / credenciais desse backend — não aqui.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>
              <strong>Produção (Railway):</strong> serviço da API → Variables →{' '}
              <code>ZAPI_ENABLED=true</code>, <code>ZAPI_INSTANCE_ID</code>, <code>ZAPI_TOKEN</code>, <code>ZAPI_OWNER_PHONE</code>.
              {' '}Não coloques tokens no Git; em prod o Spring lê só estas variáveis (não edites <code>application.properties</code> no repositório para segredos).
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Docker:</strong> as mesmas chaves no <code>.env</code> do container da API — ver <code>.env.example</code>.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>PC local (API a correr na máquina):</strong> ficheiro{' '}
              <code style={{ wordBreak: 'break-all' }}>bolinho-bacalhau/src/main/resources/application.properties</code>
              {' — '}<code>zapi.enabled=true</code> e <code>zapi.instance-id</code>, <code>zapi.token</code>, <code>zapi.owner-phone</code>.
            </li>
          </ul>
          <p style={{ margin: '10px 0 0' }}>
            Na tabela: <strong>Simulado</strong> = a API não chamou a Z-API (envio desligado ou registo interno).
            <strong> Enviado</strong> = a Z-API respondeu com sucesso.
            <strong> Falhou</strong> = erro HTTP ou resposta da Z-API (passe o rato no estado para ver o detalhe).
          </p>
        </div>

        {zapiEstado && (
          <div
            className="card"
            style={{
              marginBottom: 20,
              padding: 14,
              lineHeight: 1.6,
              border: '1px solid',
              borderColor: zapiEstado.prontoParaEnviar ? 'var(--green)' : '#f0c94a',
              background: zapiEstado.prontoParaEnviar ? 'var(--green-pale)' : 'var(--gold-pale)',
            }}
          >
            <strong style={{ display: 'block', marginBottom: 8 }}>Estado da Z-API neste deploy (só o que o servidor “vê”)</strong>
            <div style={{ fontSize: 13 }}>
              {zapiEstado.prontoParaEnviar
                ? 'Tudo certo para a API tentar enviar: envio ativado e instance + token + telefone do dono preenchidos nas variáveis.'
                : 'Ainda não dá para enviar de verdade. Corrige no Railway (serviço da API) o que estiver em falta:'}
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                <li>{zapiEstado.envioAtivado ? '✓' : '✗'} <code>ZAPI_ENABLED=true</code> (envio ativado)</li>
                <li>{zapiEstado.instanceIdDefinido ? '✓' : '✗'} <code>ZAPI_INSTANCE_ID</code></li>
                <li>{zapiEstado.tokenDefinido ? '✓' : '✗'} <code>ZAPI_TOKEN</code></li>
                <li>{zapiEstado.telefoneDonoDefinido ? '✓' : '✗'} <code>ZAPI_OWNER_PHONE</code> (só dígitos, ex. 5521…)</li>
              </ul>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--navy-muted)' }}>
                Isto não testa se a Z-API aceita o pedido; só confirma que as variáveis chegaram ao Java. Depois do ajuste, faz redeploy da API.
              </p>
            </div>
          </div>
        )}

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
                    <td>{statusCell(n)}</td>
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
