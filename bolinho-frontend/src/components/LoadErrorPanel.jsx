/**
 * Erro ao carregar dados + ação "Tentar de novo" (substitui alert genérico).
 */
export function LoadErrorPanel({ title = 'Não foi possível carregar os dados', message, onRetry, busy }) {
  return (
    <div className="load-error-panel" role="alert">
      <div className="load-error-panel__icon" aria-hidden>!</div>
      <div className="load-error-panel__body">
        <strong className="load-error-panel__title">{title}</strong>
        <p className="load-error-panel__msg">{message}</p>
        {onRetry && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onRetry} disabled={busy}>
            {busy ? 'Carregando…' : 'Tentar de novo'}
          </button>
        )}
      </div>
    </div>
  )
}
