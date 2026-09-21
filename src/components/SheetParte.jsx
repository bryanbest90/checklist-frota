import { useEffect, useState } from 'react'
import { PARTES, NOME_VISTA_LONGO } from '../lib/partes'
import { comprimirFoto } from '../lib/api'

const GRAVIDADES = [
  { v: 'ok', t: 'Conforme', s: 'sem problema' },
  { v: 'atencao', t: 'Atenção', s: 'pode rodar' },
  { v: 'critico', t: 'Crítico', s: 'impede a saída' },
]

export default function SheetParte({ parteId, marcacao, detalhe, aoSalvar, aoLimpar, aoFechar }) {
  const [gravidade, setGravidade] = useState(marcacao || null)
  const [obs, setObs] = useState(detalhe?.obs || '')
  const [foto, setFoto] = useState(detalhe?.foto || null)
  const [previa, setPrevia] = useState(null)
  const [erro, setErro] = useState('')

  // Gera a prévia da foto e devolve a memória quando a peça sai da tela.
  useEffect(() => {
    if (!foto) { setPrevia(null); return }
    const url = URL.createObjectURL(foto)
    setPrevia(url)
    return () => URL.revokeObjectURL(url)
  }, [foto])

  const parte = PARTES[parteId]
  const problema = gravidade === 'atencao' || gravidade === 'critico'

  async function escolherFoto(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    try {
      setErro('')
      setFoto(await comprimirFoto(arquivo))
    } catch (err) {
      setErro(err.message)
    }
  }

  function salvar() {
    if (!gravidade) { setErro('Escolha a condição do item.'); return }
    aoSalvar(parteId, gravidade, { obs: obs.trim(), foto })
  }

  return (
    <div className="sheet-wrap" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="tituloParte">
        <div className="sheet-h">
          <div>
            <h3 id="tituloParte">{parte.l}</h3>
            <p>{NOME_VISTA_LONGO[parte.v]}</p>
          </div>
          <button className="icon-btn" onClick={aoFechar} aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="sev">
          {GRAVIDADES.map((g) => (
            <button
              key={g.v}
              data-v={g.v}
              aria-pressed={gravidade === g.v}
              onClick={() => { setGravidade(g.v); setErro('') }}
            >
              {g.t}
              <small>{g.s}</small>
            </button>
          ))}
        </div>

        {problema && (
          <>
            <textarea
              id="obsParte"
              value={obs}
              onChange={(e) => setObs(e.target.value.toUpperCase())}
              placeholder="Descreva o problema: o que é e onde está."
            />
            <div className="photo-row">
              <label className="btn btn-sm" htmlFor="fotoParte">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" strokeLinejoin="round" />
                  <circle cx="12" cy="12.5" r="3.4" />
                </svg>
                Foto
              </label>
              <input
                id="fotoParte"
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={escolherFoto}
              />
              {previa && <img src={previa} alt="Foto do problema" />}
              <span style={{ fontSize: 12, color: 'var(--ink3)' }}>
                {foto ? `${Math.round(foto.size / 1024)} KB` : 'A foto vai junto para o controle.'}
              </span>
            </div>
          </>
        )}

        {gravidade === 'critico' && (
          <div className="crit-note">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9"
                 style={{ flex: 'none', marginTop: 1 }}>
              <path d="M12 8v5M12 16.5v.5M10.3 4.2 2.8 17.6A1.4 1.4 0 0 0 4 19.7h16a1.4 1.4 0 0 0 1.2-2.1L13.7 4.2a1.4 1.4 0 0 0-2.4 0Z" strokeLinejoin="round" />
            </svg>
            <span>Item crítico bloqueia a saída do veículo e alerta o controle na hora.</span>
          </div>
        )}

        {erro && <p className="form-err" style={{ marginTop: 10 }}>{erro}</p>}

        <div className="sheet-foot">
          <button className="btn" onClick={() => aoLimpar(parteId)}>Limpar</button>
          <button className="btn btn-primary" onClick={salvar}>Salvar</button>
        </div>
      </div>
    </div>
  )
}
