import { useEffect, useState } from 'react'
import { comprimirFoto } from '../lib/api'

// Registro de um problema mecânico. Aqui não existe lista de peças:
// o motorista descreve o que sentiu, com as palavras dele.
export default function SheetMecanica({ aoSalvar, aoFechar }) {
  const [gravidade, setGravidade] = useState(null)
  const [descricao, setDescricao] = useState('')
  const [foto, setFoto] = useState(null)
  const [previa, setPrevia] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!foto) { setPrevia(null); return }
    const url = URL.createObjectURL(foto)
    setPrevia(url)
    return () => URL.revokeObjectURL(url)
  }, [foto])

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
    if (!descricao.trim()) { setErro('Descreva o que está acontecendo.'); return }
    if (!gravidade) { setErro('Escolha a gravidade.'); return }
    aoSalvar({ descricao: descricao.trim(), gravidade, foto })
  }

  return (
    <div className="sheet-wrap" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="tituloMec">
        <div className="sheet-h">
          <div>
            <h3 id="tituloMec">Problema mecânico</h3>
            <p>Motor, freio, direção, embreagem, barulho, fumaça…</p>
          </div>
          <button className="icon-btn" onClick={aoFechar} aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <textarea
          id="descMecanica"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value.toUpperCase())}
          placeholder="O que o senhor sentiu? Ex.: freio baixando até o fundo, barulho no motor ao acelerar, direção puxando para a direita."
          style={{ marginTop: 0, minHeight: 96 }}
        />

        <div className="sev" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
          <button data-v="atencao" aria-pressed={gravidade === 'atencao'} onClick={() => { setGravidade('atencao'); setErro('') }}>
            Atenção<small>dá para rodar</small>
          </button>
          <button data-v="critico" aria-pressed={gravidade === 'critico'} onClick={() => { setGravidade('critico'); setErro('') }}>
            Crítico<small>não deve sair</small>
          </button>
        </div>

        <div className="photo-row">
          <label className="btn btn-sm" htmlFor="fotoMecanica">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" strokeLinejoin="round" />
              <circle cx="12" cy="12.5" r="3.4" />
            </svg>
            Foto
          </label>
          <input id="fotoMecanica" type="file" accept="image/*" capture="environment" hidden onChange={escolherFoto} />
          {previa && <img src={previa} alt="Foto do problema" />}
          <span style={{ fontSize: 12, color: 'var(--ink3)' }}>
            {foto ? `${Math.round(foto.size / 1024)} KB` : 'Opcional — vazamento, peça quebrada.'}
          </span>
        </div>

        {gravidade === 'critico' && (
          <div className="crit-note">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" style={{ flex: 'none', marginTop: 1 }}>
              <path d="M12 8v5M12 16.5v.5M10.3 4.2 2.8 17.6A1.4 1.4 0 0 0 4 19.7h16a1.4 1.4 0 0 0 1.2-2.1L13.7 4.2a1.4 1.4 0 0 0-2.4 0Z" strokeLinejoin="round" />
            </svg>
            <span>Item crítico bloqueia a saída do veículo e alerta o controle na hora.</span>
          </div>
        )}

        {erro && <p className="form-err" style={{ marginTop: 10 }}>{erro}</p>}

        <div className="sheet-foot">
          <button className="btn" onClick={aoFechar}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar}>Registrar</button>
        </div>
      </div>
    </div>
  )
}
