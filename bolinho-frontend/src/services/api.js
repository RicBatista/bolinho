import axios from 'axios'

// Dev: proxy Vite em /api. Produção: VITE_API_URL = origem do backend (https://…, sem barra no fim).
// Sem esquema na variável, assume https. Aceita sufixo …/api (evita …/api/api/…).
function buildApiBaseURL() {
  const raw = import.meta.env.VITE_API_URL?.trim()
  if (!raw) {
    if (import.meta.env.PROD) {
      console.warn(
        '[api] VITE_API_URL vazia no build. Defina no Railway (Build Time) ou as chamadas usam /api no mesmo host.'
      )
    }
    return '/api'
  }
  let base = raw.replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base.replace(/^\/+/, '')}`
  }
  if (base.endsWith('/api')) base = base.slice(0, -4).replace(/\/+$/, '')
  return `${base.replace(/\/+$/, '')}/api`
}

const baseURL = buildApiBaseURL()

const api = axios.create({ baseURL })

/** Sempre envia o token atual (evita requisições sem Bearer após login / refresh). */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }
  return config
})

const token = localStorage.getItem('token')
if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ---- Dashboard ----
export const getDashboard = () => api.get('/dashboard').then(r => r.data)

// ---- Produtos ----
export const getProdutos    = () => api.get('/produtos').then(r => r.data)
export const createProduto  = (d) => api.post('/produtos', d).then(r => r.data)
export const updateProduto  = (id, d) => api.put(`/produtos/${id}`, d).then(r => r.data)
export const deleteProduto  = (id) => api.delete(`/produtos/${id}`)
export const getProdutoReceita = (id) => api.get(`/produtos/${id}/receita`).then(r => r.data)
export const putProdutoReceita = (id, lines) => api.put(`/produtos/${id}/receita`, lines).then(r => r.data)

// ---- Ingredientes ----
export const getIngredientes   = () => api.get('/ingredientes').then(r => r.data)
export const getEstoqueBaixo   = () => api.get('/ingredientes/estoque-baixo').then(r => r.data)
export const createIngrediente = (d) => api.post('/ingredientes', d).then(r => r.data)
export const updateIngrediente = (id, d) => api.put(`/ingredientes/${id}`, d).then(r => r.data)

// ---- Fornecedores ----
export const getFornecedores  = () => api.get('/fornecedores').then(r => r.data)
export const createFornecedor = (d) => api.post('/fornecedores', d).then(r => r.data)
export const updateFornecedor = (id, d) => api.put(`/fornecedores/${id}`, d).then(r => r.data)
export const deleteFornecedor = (id) => api.delete(`/fornecedores/${id}`)

// ---- Compras ----
export const getCompras          = () => api.get('/compras').then(r => r.data)
export const getComprasPendentes = () => api.get('/compras/pendentes').then(r => r.data)
export const createCompra        = (d) => api.post('/compras', d).then(r => r.data)
export const pagarCompra         = (id, amount) => api.post(`/compras/${id}/pagar`, { amount })
export const getTotalPendente    = () => api.get('/compras/total-pendente').then(r => r.data)

// ---- Vendas ----
export const createVenda   = (d) => api.post('/vendas', d).then(r => r.data)
export const getVendas     = (start, end) => api.get('/vendas', { params: { start, end } }).then(r => r.data)
export const cancelarVenda = (id) => api.patch(`/vendas/${id}/cancelar`)

// ---- Encomendas ----
export const getEncomendas       = () => api.get('/encomendas').then(r => r.data)
export const getEncomendasHoje   = () => api.get('/encomendas/hoje').then(r => r.data)
export const createEncomenda     = (d) => api.post('/encomendas', d).then(r => r.data)
export const updateEncomenda     = (id, d) => api.put(`/encomendas/${id}`, d).then(r => r.data)
export const updateStatus        = (id, status) => api.patch(`/encomendas/${id}/status`, { status })
export const registrarSinal      = (id, amount) => api.post(`/encomendas/${id}/sinal`, { amount })
export const cancelarEncomenda   = (id) => api.patch(`/encomendas/${id}/cancelar`)
export const buscarEncomendas    = (q) => api.get(`/encomendas/buscar?q=${q}`).then(r => r.data)

// ---- Clientes ----
export const getClientes        = () => api.get('/clientes').then(r => r.data)
export const createCliente     = (d) => api.post('/clientes', d).then(r => r.data)
export const updateCliente     = (id, d) => api.put(`/clientes/${id}`, d).then(r => r.data)
export const deleteCliente     = (id) => api.delete(`/clientes/${id}`)

// ---- Notificações ----
export const getHistoricoNotificacoes = () => api.get('/notificacoes/historico').then(r => r.data)
export const testarEstoqueBaixo       = () => api.post('/notificacoes/testar/estoque-baixo')
export const testarContasVencidas     = () => api.post('/notificacoes/testar/contas-vencidas')
export const testarResumoDiario       = () => api.post('/notificacoes/testar/resumo-diario')

export default api
