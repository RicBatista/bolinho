import api from '../services/api'
import { onlyDigits, formatCep } from './brFormat'

/**
 * Monta uma linha de endereço a partir do JSON do ViaCEP (via nossa API).
 * O usuário deve completar número e complemento no campo de endereço.
 */
export function montarEnderecoViaCep(d) {
  const cepFmt = formatCep(d.cep || '')
  const cidadeUf = [d.localidade, d.uf].filter(Boolean).join('/')
  const linha1 = [d.logradouro, d.bairro].filter(x => x && String(x).trim()).join(' — ')
  const trechos = [linha1, cidadeUf].filter(Boolean)
  if (onlyDigits(cepFmt).length === 8) trechos.push(`CEP ${cepFmt}`)
  return trechos.join(' — ')
}

/**
 * Consulta CEP no backend (proxy ViaCEP). Retorna { erro, mensagem? } ou { erro: false, endereco, raw }.
 */
export async function consultarCep(cepBruto) {
  const d = onlyDigits(cepBruto)
  if (d.length !== 8) {
    return { erro: true, mensagem: 'Informe o CEP com 8 dígitos.' }
  }
  try {
    const { data } = await api.get(`/cep/${d}`)
    if (data.erro) {
      return { erro: true, mensagem: data.mensagem || 'CEP não encontrado.' }
    }
    return { erro: false, endereco: montarEnderecoViaCep(data), raw: data }
  } catch {
    return { erro: true, mensagem: 'Falha ao consultar o CEP. Tente de novo.' }
  }
}
