/** Apenas dígitos (para máscaras e comparação). */
export function onlyDigits(s) {
  return String(s ?? '').replace(/\D/g, '')
}

/** CEP brasileiro: 00000-000 */
export function formatCep(input) {
  const d = onlyDigits(input).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

/**
 * Telefone BR: (DD) NNNNN-NNNN ou (DD) NNNN-NNNN
 * Limita a 11 dígitos (DDD + celular).
 */
export function formatPhoneBR(input) {
  const d = onlyDigits(input).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** CPF: 000.000.000-00 */
export function formatCpf(input) {
  const d = onlyDigits(input).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Exibe telefone já salvo (com ou sem máscara). */
export function displayPhone(value) {
  const d = onlyDigits(value)
  if (!d) return value || ''
  return formatPhoneBR(d)
}

/** Exibe CPF já salvo (com ou sem máscara). */
export function displayCpf(value) {
  const d = onlyDigits(value)
  if (!d) return value || ''
  return formatCpf(d)
}
