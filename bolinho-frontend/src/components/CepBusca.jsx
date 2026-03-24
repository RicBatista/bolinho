import { useState } from 'react'
import { formatCep } from '../utils/brFormat'
import { consultarCep } from '../utils/cep'

/**
 * Campo CEP + botão que preenche o endereço (ViaCEP, via API).
 */
export default function CepBusca({ cep, onCepChange, enderecoAtual, onEndereco }) {
  const [carregando, setCarregando] = useState(false)

  const buscar = async () => {
    if (enderecoAtual?.trim() && !window.confirm('Substituir o endereço atual pelo resultado do CEP?')) {
      return
    }
    setCarregando(true)
    try {
      const r = await consultarCep(cep)
      if (r.erro) {
        window.alert(r.mensagem)
        return
      }
      onEndereco(r.endereco)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="form-group">
      <label className="form-label">CEP</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ maxWidth: 160 }}
          placeholder="00000-000"
          inputMode="numeric"
          autoComplete="postal-code"
          value={cep}
          onChange={e => onCepChange(formatCep(e.target.value))}
        />
        <button type="button" className="btn btn-ghost btn-sm" disabled={carregando} onClick={buscar}>
          {carregando ? 'Buscando…' : 'Buscar endereço'}
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--navy-muted)', marginTop: 6 }}>
        Dados dos Correios via ViaCEP (consulta gratuita). Depois inclua número e complemento no endereço.
      </div>
    </div>
  )
}
