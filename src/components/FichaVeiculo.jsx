import { useEffect, useState } from 'react'
import { rotuloParte } from '../lib/partes'
import { atualizarOcorrencia, urlAssinada } from '../lib/api'
import { Pill, quando, nKm, statusDoVeiculo } from './Controle'
import VisorFoto from './VisorFoto'

const data = (d) => (d ? d.split('-').reverse().join('/') : '—')

function Foto({ path, legenda, aoAmpliar }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let vivo = true
    urlAssinada(path).then((u) => vivo && setUrl(u))
    return () => { vivo = false }
  }, [path])
  if (!url) return null
  return (
    <button
      type="button"
      className="th-btn"
      title="Ampliar foto"
      onClick={() => aoAmpliar(url, legenda)}
    >
      <img className="th" src={url} alt={legenda} />
    </button>
  )
}

export default function FichaVeiculo({
  veiculo, ocorrencias, checklists, nomePorId, aoEditar, aoMudar, aoFechar, avisar,
}) {
  const [ocupado, setOcupado] = useState(null)
  const [visor, setVisor] = useState(null)
  const abertas = ocorrencias.filter((o) => o.status !== 'resolvida')

  async function mudarStatus(o, status) {
    setOcupado(o.id)
    try {
      await atualizarOcorrencia(o.id, {
        status,
        resolvido_em: status === 'resolvida' ? new Date().toISOString() : null,
      })
      avisar(status === 'resolvida' ? 'Ocorrência resolvida.' : 'Enviada para manutenção.')
      await aoMudar()
    } catch (e) {
      avisar(`Não consegui atualizar: ${e.message}`)
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div className="modal-wrap" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="tituloFicha">
        <div className="modal-h">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="plate-sm">{veiculo.placa}</span>
            <div>
              <h3 id="tituloFicha" style={{ fontSize: 15 }}>{veiculo.modelo}</h3>
              <p style={{ margin: '1px 0 0', fontSize: 12, color: 'var(--ink3)' }}>
                {veiculo.tipo} · {veiculo.equipe} · {nomePorId[veiculo.motorista_id] || 'sem motorista'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {veiculo.ativo
              ? <Pill status={statusDoVeiculo(veiculo.placa, ocorrencias)} />
              : <span className="pill mute">Inativo</span>}
            <button className="icon-btn" onClick={aoFechar} aria-label="Fechar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="modal-b">
          <dl className="specs">
            {[
              ['Ano', veiculo.ano || '—'],
              ['Odômetro', `${nKm(veiculo.km)} km`],
              ['Chassi', veiculo.chassi || '—'],
              ['Licenciamento', data(veiculo.licenciamento)],
              ['Próxima revisão', data(veiculo.proxima_revisao)],
              ['Equipe', veiculo.equipe || '—'],
            ].map(([k, v]) => (
              <div className="spec" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <h4 className="sec-t">Ocorrências em aberto ({abertas.length})</h4>
          {abertas.length === 0 && <p className="empty">Nada pendente neste veículo.</p>}
          {abertas.map((o) => (
            <div className="occ" key={o.id} data-sev={o.gravidade}>
              <div className="sv" />
              <div style={{ flex: 1 }}>
                <b>{rotuloParte(o.parte)}</b>
                <p>{o.observacao || 'Sem descrição'}</p>
                <div className="mt">
                  <span>{quando(o.criado_em)}</span>
                  <span>{o.status === 'manutencao' ? 'Em manutenção' : 'Aberta'}</span>
                </div>
              </div>
              {o.foto_path && (
                <Foto
                  path={o.foto_path}
                  legenda={`${rotuloParte(o.parte)} · ${veiculo.placa} · ${quando(o.criado_em)}`}
                  aoAmpliar={(url, legenda) => setVisor({ url, legenda })}
                />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 'none' }}>
                {o.status === 'aberta' && (
                  <button className="btn btn-sm" disabled={ocupado === o.id} onClick={() => mudarStatus(o, 'manutencao')}>
                    Enviar p/ manutenção
                  </button>
                )}
                <button className="btn btn-sm" disabled={ocupado === o.id} onClick={() => mudarStatus(o, 'resolvida')}>
                  Resolver
                </button>
              </div>
            </div>
          ))}

          <h4 className="sec-t">Histórico de checklists</h4>
          <div className="scroll-x">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Quando</th><th>Motorista</th><th>Odômetro</th>
                  <th>Conformes</th><th>Atenção</th><th>Crítico</th>
                </tr>
              </thead>
              <tbody>
                {checklists.length === 0 && (
                  <tr><td colSpan="6">Sem checklists registrados.</td></tr>
                )}
                {checklists.slice(0, 10).map((c) => (
                  <tr key={c.id}>
                    <td>{quando(c.criado_em)}</td>
                    <td>{nomePorId[c.motorista_id] || '—'}</td>
                    <td className="mono">{nKm(c.km)}</td>
                    <td className="mono">{c.conformes}</td>
                    <td className="mono">{c.atencao}</td>
                    <td className="mono">{c.criticos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-foot">
            <button className="btn" onClick={() => aoEditar(veiculo)}>Editar cadastro</button>
          </div>
        </div>
      </div>

      {visor && (
        <VisorFoto url={visor.url} legenda={visor.legenda} aoFechar={() => setVisor(null)} />
      )}
    </div>
  )
}
