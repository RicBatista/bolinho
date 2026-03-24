/** Opções de tipo de residência (valores gravados na API). */
export const TIPOS_RESIDENCIA = [
  { value: '', label: '— Selecione —' },
  { value: 'CASA', label: 'Casa' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'COBERTURA', label: 'Cobertura' },
  { value: 'COMERCIAL', label: 'Sala / ponto comercial' },
  { value: 'OUTRO', label: 'Outro' },
]

export function labelTipoResidencia(valor) {
  if (!valor) return ''
  return TIPOS_RESIDENCIA.find(t => t.value === valor)?.label || valor
}

/**
 * Texto único para exibir em cards (cliente ou encomenda).
 * address = logradouro / bairro / cidade (ex.: ViaCEP); número e complemento à parte.
 */
export function montarEnderecoCompleto({
  address,
  addressNumber,
  addressComplement,
  residenceType,
}) {
  const partes = []
  if (address?.trim()) partes.push(address.trim())
  const numCompl = [addressNumber, addressComplement].filter(x => x && String(x).trim()).join(', ')
  if (numCompl) partes.push(numCompl)
  const tipo = labelTipoResidencia(residenceType)
  if (residenceType && tipo) partes.push(`(${tipo})`)
  return partes.join(' — ') || ''
}

/** Encomenda: campos customer*. */
export function montarEnderecoPedido(o) {
  return montarEnderecoCompleto({
    address: o.customerAddress,
    addressNumber: o.customerAddressNumber,
    addressComplement: o.customerAddressComplement,
    residenceType: o.customerResidenceType,
  })
}
