import { useEffect } from 'react'

// Visor de foto em tela cheia. Fica acima da ficha do veículo (z-index maior),
// fecha no Esc, no clique fora e no botão.
export default function VisorFoto({ url, legenda, aoFechar }) {
  useEffect(() => {
    const noTeclado = (e) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', noTeclado)
    return () => window.removeEventListener('keydown', noTeclado)
  }, [aoFechar])

  return (
    <div className="visor" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="visor-topo">
        <span>{legenda}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="btn btn-sm" href={url} target="_blank" rel="noreferrer">
            Abrir original
          </a>
          <button className="icon-btn" onClick={aoFechar} aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
      <img src={url} alt={legenda} />
    </div>
  )
}
