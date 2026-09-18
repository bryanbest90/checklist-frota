import { useEffect, useMemo, useState } from 'react'
import {
  PARTES, VISTAS, NOME_VISTA, PARTES_POR_VISTA, ITENS_OBRIGATORIOS, TOTAL_ITENS,
} from '../lib/partes'
import { buscarMeuVeiculo, enviarChecklist } from '../lib/api'
import DesenhoCaminhao from './DesenhoCaminhao'
import SheetParte from './SheetParte'

export default function Checklist({ perfil, avisar }) {
  const [veiculo, setVeiculo] = useState(undefined) // undefined = carregando
  const [vista, setVista] = useState('lateral')
  const [marcacoes, setMarcacoes] = useState({})
  const [detalhes, setDetalhes] = useState({})
  const [aberta, setAberta] = useState(null) // id da parte no sheet
  const [km, setKm] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarMeuVeiculo(perfil.id)
      .then((v) => {
        setVeiculo(v)
        if (v) setKm(String(v.km ?? ''))
      })
      .catch((e) => { setVeiculo(null); setErro(e.message) })
  }, [perfil.id])

  const contagem = useMemo(() => {
    const vals = Object.values(marcacoes)
    return {
      ok: vals.filter((s) => s === 'ok').length,
      atencao: vals.filter((s) => s === 'atencao').length,
      critico: vals.filter((s) => s === 'critico').length,
      feitos: vals.length,
    }
  }, [marcacoes])

  function tocarPeca(id, dona) {
    if (!dona) {
      // peça de contexto: manda para a vista onde o item realmente mora
      const destino = PARTES[id].v
      setVista(destino)
      avisar(`${PARTES[id].l}: este item fica na vista ${NOME_VISTA[destino].toLowerCase()}.`)
    }
    setAberta(id)
  }

  function salvarParte(id, gravidade, detalhe) {
    setMarcacoes((m) => ({ ...m, [id]: gravidade }))
    setDetalhes((d) => {
      const novo = { ...d }
      if (gravidade === 'ok') delete novo[id]
      else novo[id] = detalhe
      return novo
    })
    setAberta(null)
    if (gravidade === 'critico') avisar('Item crítico registrado — o caminhão fica impedido.')
  }

  function limparParte(id) {
    setMarcacoes((m) => { const n = { ...m }; delete n[id]; return n })
    setDetalhes((d) => { const n = { ...d }; delete n[id]; return n })
    setAberta(null)
  }

  function marcarRestantes() {
    setMarcacoes((m) => {
      const n = { ...m }
      Object.keys(PARTES).forEach((k) => { if (!n[k]) n[k] = 'ok' })
      return n
    })
  }

  async function finalizar() {
    setEnviando(true)
    setErro('')
    try {
      const { fotosFalhadas } = await enviarChecklist({
        veiculo,
        motoristaId: perfil.id,
        km: parseInt(String(km).replace(/\D/g, ''), 10) || null,
        marcacoes,
        detalhes,
      })
      setMarcacoes({})
      setDetalhes({})
      if (fotosFalhadas.length) {
        avisar(`Checklist enviado. Não subiram as fotos de: ${fotosFalhadas.join(', ')}.`)
      } else {
        avisar(contagem.critico ? `Enviado. ${veiculo.placa} marcado como impedido.` : 'Checklist enviado ao controle.')
      }
    } catch (e) {
      // Nada é limpo quando dá erro: o preenchimento continua na tela.
      setErro(`Não consegui enviar: ${e.message}. Seu preenchimento continua aqui — tente de novo.`)
    } finally {
      setEnviando(false)
    }
  }

  if (veiculo === undefined) return <div className="carregando">Carregando seu caminhão…</div>

  if (!veiculo) {
    return (
      <div className="wrap">
        <div className="card" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 17, marginBottom: 6 }}>Nenhum caminhão vinculado</h2>
          <p style={{ color: 'var(--ink2)', margin: 0 }}>
            Seu usuário não tem veículo atribuído. Peça ao administrador para vincular a placa ao seu nome.
          </p>
          {erro && <p className="form-err" style={{ marginTop: 12 }}>{erro}</p>}
        </div>
      </div>
    )
  }

  const completo = contagem.feitos >= TOTAL_ITENS

  return (
    <div className="wrap campo">
      <div className="truck-head">
        <div>
          <div className="eyebrow" style={{ color: 'rgba(255,255,255,.72)', marginBottom: 4 }}>
            Seu veículo hoje
          </div>
          <span className="plate">{veiculo.placa}</span>
        </div>
        <div className="meta">
          {veiculo.modelo}
          <br />
          {veiculo.tipo} · {veiculo.equipe}
        </div>
      </div>

      <div className="km-row">
        <label htmlFor="km">Odômetro (km)</label>
        <input
          id="km"
          className="mono"
          inputMode="numeric"
          value={km}
          onChange={(e) => setKm(e.target.value)}
        />
      </div>

      <div className="views" role="tablist" aria-label="Vistas do veículo">
        {VISTAS.map((v) => {
          const faltam = PARTES_POR_VISTA[v].filter((k) => !marcacoes[k]).length
          return (
            <button
              key={v}
              role="tab"
              aria-selected={vista === v}
              onClick={() => setVista(v)}
            >
              {NOME_VISTA[v]} <span className="ct" data-done={faltam ? '0' : '1'}>{faltam || '✓'}</span>
            </button>
          )
        })}
      </div>

      <div className="stage">
        {vista !== 'itens' && (
          <DesenhoCaminhao
            vista={vista}
            marcacoes={marcacoes}
            aoTocar={tocarPeca}
            placa={veiculo.placa}
          />
        )}

        {vista === 'itens' && (
          <div>
            <p className="eyebrow" style={{ margin: '2px 0 0' }}>Itens obrigatórios</p>
            <div className="chips">
              {ITENS_OBRIGATORIOS.map((id) => (
                <button key={id} className="chip" data-st={marcacoes[id] || undefined} onClick={() => setAberta(id)}>
                  <span className="dot" />
                  {PARTES[id].l}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="legend">
          <span><i style={{ borderColor: 'var(--line2)', background: 'var(--metal)' }} />Não verificado</span>
          <span><i style={{ borderColor: 'var(--ok)', background: 'var(--ok-s)' }} />Conforme</span>
          <span><i style={{ borderColor: 'var(--warn)', background: 'var(--warn-s)' }} />Atenção</span>
          <span><i style={{ borderColor: 'var(--crit)', background: 'var(--crit-s)' }} />Crítico</span>
          {vista !== 'itens' && (
            <span><i style={{ borderColor: 'var(--line2)', background: 'var(--metal)', opacity: .55 }} />Contexto — o item é de outra vista</span>
          )}
        </div>
        <p className="hint">
          {vista === 'itens'
            ? 'Itens que não estão no desenho: toque em cada um para conferir.'
            : 'Toque na parte do caminhão para registrar a condição.'}
        </p>
      </div>

      <div className="prog">
        <div className="prog-top">
          <span>{contagem.feitos} de {TOTAL_ITENS} itens verificados</span>
          <span className="mono">{Math.round((contagem.feitos / TOTAL_ITENS) * 100)}%</span>
        </div>
        <div className="prog-bar">
          <i style={{ background: 'var(--ok)', width: `${(contagem.ok / TOTAL_ITENS) * 100}%` }} />
          <i style={{ background: 'var(--warn)', width: `${(contagem.atencao / TOTAL_ITENS) * 100}%` }} />
          <i style={{ background: 'var(--crit)', width: `${(contagem.critico / TOTAL_ITENS) * 100}%` }} />
        </div>
      </div>

      <div className="found">
        <h4>Problemas deste checklist</h4>
        {Object.keys(marcacoes).filter((k) => marcacoes[k] !== 'ok').length === 0 && (
          <p className="hint" style={{ textAlign: 'left', padding: 0 }}>Nenhum problema registrado até agora.</p>
        )}
        {Object.keys(marcacoes)
          .filter((k) => marcacoes[k] !== 'ok')
          .map((k) => (
            <div className="finding" key={k} data-sev={marcacoes[k]}>
              <div>
                <b>{PARTES[k].l}</b>
                <p>{detalhes[k]?.obs || 'Sem descrição'}</p>
              </div>
              <span
                className={`pill ${marcacoes[k] === 'critico' ? 'crit' : 'warn'}`}
                style={{ marginLeft: 'auto', flex: 'none' }}
              >
                {marcacoes[k] === 'critico' ? 'Crítico' : 'Atenção'}
              </span>
            </div>
          ))}
      </div>

      {erro && <p className="form-err" style={{ marginTop: 14 }}>{erro}</p>}

      <div className="acoes">
        <button className="btn" onClick={marcarRestantes}>Restantes OK</button>
        <button className="btn btn-primary" disabled={!completo || enviando} onClick={finalizar}>
          {enviando
            ? 'Enviando…'
            : completo
              ? (contagem.critico ? 'Finalizar e bloquear' : 'Finalizar checklist')
              : `Faltam ${TOTAL_ITENS - contagem.feitos} itens`}
        </button>
      </div>

      {aberta && (
        <SheetParte
          parteId={aberta}
          marcacao={marcacoes[aberta]}
          detalhe={detalhes[aberta]}
          aoSalvar={salvarParte}
          aoLimpar={limparParte}
          aoFechar={() => setAberta(null)}
        />
      )}
    </div>
  )
}
