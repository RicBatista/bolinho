/**
 * Mensagem legível a partir de erro Axios / rede.
 */
export function getApiErrorMessage(err, fallback = 'Erro ao comunicar com o servidor.') {
  if (!err) return fallback
  const status = err.response?.status
  if (status === 403) {
    return 'Sem permissão para esta ação. Confirme seu perfil (DONO/GESTOR) ou peça acesso ao administrador.'
  }
  if (status === 404) {
    return 'Recurso não encontrado na API. Verifique se o backend está atualizado.'
  }
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return 'Sem conexão com a API. Verifique a internet, CORS no servidor e a variável VITE_API_URL no build do frontend.'
  }
  const d = err.response?.data
  if (typeof d === 'string' && d.trim()) return d
  if (d && typeof d === 'object') {
    if (typeof d.message === 'string' && d.message.trim()) return d.message
    if (typeof d.error === 'string' && d.error.trim()) return d.error
  }
  if (status) return `${fallback} (HTTP ${status})`
  return fallback
}
