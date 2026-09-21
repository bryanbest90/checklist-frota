import { useEffect, useMemo, useState } from 'react'
import {
  PARTES, VISTAS, NOME_VISTA, PARTES_POR_VISTA, ITENS_OBRIGATORIOS, TOTAL_ITENS,
} from '../lib/partes'
import { buscarMeuVeiculo, enviarChecklist } from '../lib/api'
import DesenhoCaminhao from './DesenhoCaminhao'
import SheetParte from './SheetParte'
import SheetMecanica from './SheetMecanica'

const COM_DESENHO = ['lateral', 'frente', 'traseira', 'cabine']

export default function Checklist({ perfil, avisar }) {
  const [veiculo, setVeiculo] = useState(undefined) // undefined = carregando
  const [vista, setVista] = useState('lateral')
  const [marcacoes, setMarcacoes] = useState({})
  const [detalhes, setDetalhes] = useState({})
  const [mecanicas, setMecanicas] = useState([])
  const [aberta, setAberta] = useState(null)   // id da parte no sheet
  const [sheetMec, setSheetMec] = useState(false)
  const [km, setKm] = useState('')
  const [kmConfirmado, setKmConfirmado] = useState(false)
  const [ultimoLote, setUltimoLote] = useState([])  // o que o "Restantes OK" marcou
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarMeuVeiculo(perfil.id)
      .then((v) => setVeiculo(v))
      .catch((e) => { setVeiculo(null); setErro(e.message) })
  }, [perfil.id])

  // 000000 -> 184.320, enquanto digita
  const soNumero = (v) => String(v).replace(/\D/g, '')
  const formataKm = (v) => soNumero(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const kmNumero = parseInt(soNumero(km), 10) || 0
  const kmPreenchido = kmNumero > 0
  const ultimoKm = veiculo?.km || 0
  const kmMenor = kmPreenchido && kmNumero < ultimoKm
  // Erro mais perigoso que o anterior: um dígito a mais passa despercebido e
  // sobe o odômetro do caminhão para sempre (o banco nunca aceita baixar).
  const kmSalto = kmPreenchido && ultimoKm > 0 && kmNumero - ultimoKm > 2000
  const kmSuspeito = kmMenor || kmSalto

  const contagem = useMemo(() => {
    const vals = Object.values(marcacoes)
    return {
      ok: vals.filter((s) => s === 'ok').length,
      atencao: vals.filter((s) => s === 'atencao').length,
      critico: vals.filter((s) => s === 'critico').length,
      feitos: vals.length,
    }
  }, [marcacoes])

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

  /* ---- mecânica: sem lista, o motorista descreve ---- */
  const pior = (lista) => (lista.some((x) => x.gravidade === 'critico') ? 'critico' : 'atencao')

  function semProblemaMecanico() {
    setMecanicas([])
    setMarcacoes((m) => ({ ...m, mecanica: 'ok' }))
  }

  function registrarMecanica(item) {
    const novos = [...mecanicas, item]
    setMecanicas(novos)
    setMarcacoes((m) => ({ ...m, mecanica: pior(novos) }))
    setSheetMec(false)
    if (item.gravidade === 'critico') avisar('Problema crítico registrado — o caminhão fica impedido.')
  }

  function removerMecanica(i) {
    const novos = mecanicas.filter((_, idx) => idx !== i)
    setMecanicas(novos)
    setMarcacoes((m) => {
      const n = { ...m }
      if (novos.length) n.mecanica = pior(novos)
      else delete n.mecanica
      return n
    })
  }

  function marcarRestantes() {
    const lote = Object.keys(PARTES).filter((k) => !marcacoes[k])
    if (!lote.length) return
    setMarcacoes((m) => {
      const n = { ...m }
      lote.forEach((k) => { n[k] = 'ok' })
      return n
    })
    setUltimoLote(lote)
  }

  // Desfaz só o que aquele toque marcou, e só o que continua como conforme.
  // Se o motorista mexeu em algum item depois, aquele fica como está —
  // desmarcar um problema já descrito jogaria fora texto e foto.
  function desfazerLote() {
    setMarcacoes((m) => {
      const n = { ...m }
      ultimoLote.forEach((k) => { if (n[k] === 'ok') delete n[k] })
      return n
    })
    avisar(`${ultimoLote.length} itens voltaram a ficar sem verificação.`)
    setUltimoLote([])
  }

  async function finalizar() {
    setEnviando(true)
    setErro('')
    try {
      const { fotosFalhadas } = await enviarChecklist({
        veiculo,
        motoristaId: perfil.id,
        km: kmNumero,
        avisoOdometro: kmSuspeito
          ? (kmMenor
              ? `LEITURA MENOR QUE O REGISTRO ANTERIOR: ${formataKm(kmNumero)} KM CONTRA ${formataKm(ultimoKm)} KM. MOTORISTA CONFIRMOU NO PAINEL.`
              : `SALTO DE ${formataKm(kmNumero - ultimoKm)} KM DESDE O ÚLTIMO REGISTRO (${formataKm(ultimoKm)} KM). MOTORISTA CONFIRMOU NO PAINEL.`)
          : null,
        marcacoes,
        detalhes,
        mecanicas,
      })
      const tinhaCritico = contagem.critico > 0
      setMarcacoes({})
      setDetalhes({})
      setMecanicas([])
      setKm('')
      setKmConfirmado(false)
      setUltimoLote([])
      if (fotosFalhadas.length) {
        avisar(`Checklist enviado. Não subiram as fotos de: ${fotosFalhadas.join(', ')}.`)
      } else {
        avisar(tinhaCritico ? `Enviado. ${veiculo.placa} marcado como impedido.` : 'Checklist enviado ao controle.')
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
  const problemas = Object.keys(marcacoes).filter((k) => marcacoes[k] !== 'ok' && k !== 'mecanica')

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

      <div className="odo" data-ok={kmPreenchido ? '1' : '0'}>
        <div className="odo-ic">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.9"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 18a8 8 0 1 1 16 0" />
            <path d="M12 14l4.5-4.5" />
            <circle cx="12" cy="14" r="1.4" />
          </svg>
        </div>
        <div className="odo-in">
          <label htmlFor="km">Odômetro de hoje</label>
          <div className="odo-campo">
            <input
              id="km"
              inputMode="numeric"
              value={km}
              placeholder="000000"
              onChange={(e) => { setKm(formataKm(e.target.value)); setKmConfirmado(false) }}
            />
            <span>km</span>
          </div>
          <p className="odo-dica" data-alerta={kmSuspeito ? '1' : '0'}>
            {kmMenor
              ? `Menor que o último registro (${formataKm(ultimoKm)} km). Confira o painel.`
              : kmSalto
                ? `São ${formataKm(kmNumero - ultimoKm)} km a mais que o último registro (${formataKm(ultimoKm)} km). Confira se não sobrou um dígito.`
                : kmPreenchido
                  ? `Último registro: ${formataKm(ultimoKm)} km`
                  : `Leia o painel e digite. Último registro: ${formataKm(ultimoKm)} km`}
          </p>

          {kmSuspeito && (
            <label className="odo-confirma">
              <input
                type="checkbox"
                checked={kmConfirmado}
                onChange={(e) => setKmConfirmado(e.target.checked)}
              />
              <span>Conferi no painel, a leitura está certa</span>
            </label>
          )}
        </div>
      </div>

      <div className="views" role="tablist" aria-label="Vistas do veículo">
        {VISTAS.map((v) => {
          const faltam = PARTES_POR_VISTA[v].filter((k) => !marcacoes[k]).length
          return (
            <button key={v} role="tab" aria-selected={vista === v} onClick={() => setVista(v)}>
              {NOME_VISTA[v]} <span className="ct" data-done={faltam ? '0' : '1'}>{faltam || '✓'}</span>
            </button>
          )
        })}
      </div>

      <div className="stage">
        {COM_DESENHO.includes(vista) && (
          <DesenhoCaminhao
            vista={vista}
            marcacoes={marcacoes}
            aoTocar={(id) => setAberta(id)}
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

        {vista === 'mecanica' && (
          <div className="mec">
            <p>Motor, freio, direção, embreagem, suspensão — qualquer coisa que o senhor sentiu dirigindo.</p>

            <div className="mec-escolha">
              <button
                aria-pressed={marcacoes.mecanica === 'ok'}
                onClick={semProblemaMecanico}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Sem problema
                <small>o caminhão está bom</small>
              </button>
              <button className="abrir" onClick={() => setSheetMec(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Registrar problema
                <small>descreva o que sentiu</small>
              </button>
            </div>

            {mecanicas.length > 0 && (
              <div className="mec-lista">
                {mecanicas.map((m, i) => (
                  <div className="mec-item" key={i} data-sev={m.gravidade}>
                    <div style={{ flex: 1 }}>
                      <p>{m.descricao}</p>
                      <div className="mt">{m.gravidade === 'critico' ? 'Crítico' : 'Atenção'}{m.foto ? ' · com foto' : ''}</div>
                    </div>
                    <button className="mec-rem" onClick={() => removerMecanica(i)} aria-label="Remover">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {COM_DESENHO.includes(vista) && (
          <>
            <div className="legend">
              <span><i style={{ borderColor: 'var(--toque)', background: 'var(--toque-s)' }} />Toque para verificar</span>
              <span><i style={{ borderColor: 'var(--ok)', background: 'var(--ok-s)' }} />Conforme</span>
              <span><i style={{ borderColor: 'var(--warn)', background: 'var(--warn-s)' }} />Atenção</span>
              <span><i style={{ borderColor: 'var(--crit)', background: 'var(--crit-s)' }} />Crítico</span>
              <span><i style={{ borderColor: 'var(--travado-l)', background: 'var(--travado)', opacity: 'var(--deco-op)' }} />Apagado — é de outra vista</span>
            </div>
            <p className="hint">As peças em azul são as desta vista. As apagadas se marcam na vista delas.</p>
          </>
        )}
        {vista === 'itens' && (
          <p className="hint">Itens que não estão no desenho: toque em cada um para conferir.</p>
        )}
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
        {problemas.length === 0 && mecanicas.length === 0 && (
          <p className="hint" style={{ textAlign: 'left', padding: 0 }}>Nenhum problema registrado até agora.</p>
        )}
        {problemas.map((k) => (
          <div className="finding" key={k} data-sev={marcacoes[k]}>
            <div>
              <b>{PARTES[k].l}</b>
              <p>{detalhes[k]?.obs || 'Sem descrição'}</p>
            </div>
            <span className={`pill ${marcacoes[k] === 'critico' ? 'crit' : 'warn'}`} style={{ marginLeft: 'auto', flex: 'none' }}>
              {marcacoes[k] === 'critico' ? 'Crítico' : 'Atenção'}
            </span>
          </div>
        ))}
        {mecanicas.map((m, i) => (
          <div className="finding" key={`mec-${i}`} data-sev={m.gravidade}>
            <div>
              <b>Mecânica</b>
              <p>{m.descricao}</p>
            </div>
            <span className={`pill ${m.gravidade === 'critico' ? 'crit' : 'warn'}`} style={{ marginLeft: 'auto', flex: 'none' }}>
              {m.gravidade === 'critico' ? 'Crítico' : 'Atenção'}
            </span>
          </div>
        ))}
      </div>

      {erro && <p className="form-err" style={{ marginTop: 14 }}>{erro}</p>}

      <div className="acoes">
        {ultimoLote.length > 0 ? (
          <button className="btn btn-desfazer" onClick={desfazerLote}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h11a5 5 0 0 1 0 10h-3" />
              <path d="M7 4 3 8l4 4" />
            </svg>
            Desfazer {ultimoLote.length}
          </button>
        ) : (
          <button className="btn" onClick={marcarRestantes}>Restantes OK</button>
        )}
        <button className="btn btn-primary" disabled={!completo || !kmPreenchido || (kmSuspeito && !kmConfirmado) || enviando} onClick={finalizar}>
          {enviando
            ? 'Enviando…'
            : !completo
              ? `Faltam ${TOTAL_ITENS - contagem.feitos} itens`
              : !kmPreenchido
                ? 'Informe o odômetro'
                : kmSuspeito && !kmConfirmado
                  ? 'Confirme o odômetro'
                : (contagem.critico ? 'Finalizar e bloquear' : 'Finalizar checklist')}
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

      {sheetMec && (
        <SheetMecanica aoSalvar={registrarMecanica} aoFechar={() => setSheetMec(false)} />
      )}
    </div>
  )
}
