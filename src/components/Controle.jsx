import { useEffect, useMemo, useState } from 'react'
import { PARTES } from '../lib/partes'
import { listarVeiculos, listarOcorrencias, listarChecklists, listarPerfis } from '../lib/api'
import FichaVeiculo from './FichaVeiculo'
import FormVeiculo from './FormVeiculo'

const hojeISO = () => new Date().toISOString().slice(0, 10)

export function statusDoVeiculo(placa, ocorrencias) {
  const abertas = ocorrencias.filter((o) => o.placa === placa && o.status !== 'resolvida')
  if (abertas.some((o) => o.gravidade === 'critico')) return 'critico'
  if (abertas.length) return 'atencao'
  return 'ok'
}

export function Pill({ status }) {
  if (status === 'critico') return <span className="pill crit"><span className="dot" />Impedido</span>
  if (status === 'atencao') return <span className="pill warn"><span className="dot" />Em atenção</span>
  return <span className="pill ok"><span className="dot" />Liberado</span>
}

export function quando(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const hora = d.toTimeString().slice(0, 5)
  return d.toISOString().slice(0, 10) === hojeISO()
    ? `hoje ${hora}`
    : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${hora}`
}

export const nKm = (n) => String(n ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export default function Controle({ avisar }) {
  const [veiculos, setVeiculos] = useState([])
  const [ocorrencias, setOcorrencias] = useState([])
  const [checklists, setChecklists] = useState([])
  const [perfis, setPerfis] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('')
  const [ficha, setFicha] = useState(null)   // placa
  const [form, setForm] = useState(null)     // veículo ou {} para novo

  async function recarregar() {
    try {
      setErro('')
      const [v, o, c, p] = await Promise.all([
        listarVeiculos(), listarOcorrencias(), listarChecklists(), listarPerfis(),
      ])
      setVeiculos(v); setOcorrencias(o); setChecklists(c); setPerfis(p)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { recarregar() }, [])

  const ativos = veiculos.filter((v) => v.ativo)
  const nomePorId = useMemo(
    () => Object.fromEntries(perfis.map((p) => [p.id, p.nome])),
    [perfis]
  )

  const comChecklistHoje = useMemo(() => {
    const hoje = hojeISO()
    const placas = new Set(checklists.filter((c) => c.criado_em.slice(0, 10) === hoje).map((c) => c.placa))
    return placas
  }, [checklists])

  const impedidos = ativos.filter((v) => statusDoVeiculo(v.placa, ocorrencias) === 'critico')
  const emAtencao = ativos.filter((v) => statusDoVeiculo(v.placa, ocorrencias) === 'atencao')
  const abertas = ocorrencias.filter((o) => o.status === 'aberta')

  const lista = veiculos.filter((v) => {
    const st = statusDoVeiculo(v.placa, ocorrencias)
    if (filtro === 'sem' && comChecklistHoje.has(v.placa)) return false
    if (filtro === 'inativo' && v.ativo) return false
    if (['critico', 'atencao', 'ok'].includes(filtro) && (st !== filtro || !v.ativo)) return false
    if (!busca) return true
    const alvo = `${v.placa} ${v.modelo} ${v.tipo} ${v.equipe} ${nomePorId[v.motorista_id] || ''}`.toLowerCase()
    return alvo.includes(busca.toLowerCase())
  })

  const porParte = useMemo(() => {
    const cnt = {}
    ocorrencias.forEach((o) => { cnt[o.parte] = (cnt[o.parte] || 0) + 1 })
    return Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [ocorrencias])
  const maiorParte = porParte[0]?.[1] || 1

  if (carregando) return <div className="carregando">Carregando a frota…</div>

  return (
    <div className="wrap">
      <div className="head-row">
        <div>
          <p className="eyebrow">Controle da frota</p>
          <h1>Situação dos caminhões</h1>
          <p>
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <button className="btn btn-sm" onClick={recarregar}>Atualizar</button>
          <button className="btn btn-sm btn-primary" onClick={() => setForm({})}>Cadastrar caminhão</button>
        </div>
      </div>

      {erro && <p className="form-err">{erro}</p>}

      <div className="kpis">
        <div className="kpi">
          <div className="v">{ativos.length}</div>
          <div className="k">Caminhões ativos</div>
          <div className="s">{veiculos.length - ativos.length} inativos</div>
        </div>
        <div className="kpi">
          <div className="v">{comChecklistHoje.size}/{ativos.length}</div>
          <div className="k">Checklists de hoje</div>
          <div className="s">
            {ativos.length - comChecklistHoje.size === 0
              ? 'Frota completa'
              : `${ativos.length - comChecklistHoje.size} sem registro`}
          </div>
        </div>
        <div className={`kpi${impedidos.length ? ' alarm' : ''}`}>
          <div className="v">{impedidos.length}</div>
          <div className="k">Impedidos de rodar</div>
          <div className="s">{impedidos.length ? impedidos.map((v) => v.placa).join(', ') : 'Nenhum'}</div>
        </div>
        <div className="kpi">
          <div className="v">{abertas.length}</div>
          <div className="k">Ocorrências abertas</div>
          <div className="s">{emAtencao.length} veículos em atenção</div>
        </div>
      </div>

      <div className="panel">
        <div>
          <div className="toolbar">
            <input
              type="search"
              placeholder="Buscar por placa, modelo, motorista ou equipe"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="critico">Impedidos</option>
              <option value="atencao">Em atenção</option>
              <option value="ok">Liberados</option>
              <option value="sem">Sem checklist hoje</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          <div className="fleet">
            {lista.length === 0 && <p className="empty">Nenhum caminhão com esse filtro.</p>}
            {lista.map((v) => {
              const st = statusDoVeiculo(v.placa, ocorrencias)
              const abertasDoVeiculo = ocorrencias.filter((o) => o.placa === v.placa && o.status !== 'resolvida')
              return (
                <button
                  key={v.placa}
                  className="tcard"
                  data-st={v.ativo ? st : undefined}
                  onClick={() => setFicha(v.placa)}
                >
                  <div className="tcard-in">
                    <div className="tcard-top">
                      <span className="plate-sm">{v.placa}</span>
                      {v.ativo ? <Pill status={st} /> : <span className="pill mute">Inativo</span>}
                    </div>
                    <div className="mdl">
                      <b>{v.modelo}</b>
                      <br />
                      {v.tipo} · {v.equipe}
                      <br />
                      {nomePorId[v.motorista_id] || 'sem motorista'}
                    </div>
                    <div className="tcard-foot">
                      <span>{comChecklistHoje.has(v.placa) ? 'Checklist hoje' : 'Sem checklist hoje'}</span>
                      <span>{abertasDoVeiculo.length ? `${abertasDoVeiculo.length} em aberto` : `${nKm(v.km)} km`}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="side">
          <div className="side-card">
            <h3>Ocorrências por parte</h3>
            <p className="sub">Onde a frota mais dá problema</p>
            <div className="bars">
              {porParte.length === 0 && <p className="empty">Nenhuma ocorrência registrada.</p>}
              {porParte.map(([parte, n]) => (
                <div className="bar-row" key={parte}>
                  <span className="lb">{PARTES[parte]?.l || parte}</span>
                  <span className="vl">{n}</span>
                  <div className="tk">
                    <i style={{ width: `${Math.max(8, (n / maiorParte) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="side-card">
            <h3>Últimos registros</h3>
            <p className="sub">Chegando do campo</p>
            {ocorrencias.length === 0 && <p className="empty">Sem ocorrências.</p>}
            {ocorrencias.slice(0, 5).map((o) => (
              <div className="occ" key={o.id} data-sev={o.gravidade}>
                <div className="sv" />
                <div>
                  <b>{PARTES[o.parte]?.l || o.parte}</b>
                  <p>{o.observacao || 'Sem descrição'}</p>
                  <div className="mt">
                    <span>{o.placa}</span>
                    <span>{quando(o.criado_em)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {ficha && (
        <FichaVeiculo
          veiculo={veiculos.find((v) => v.placa === ficha)}
          ocorrencias={ocorrencias.filter((o) => o.placa === ficha)}
          checklists={checklists.filter((c) => c.placa === ficha)}
          nomePorId={nomePorId}
          aoEditar={(v) => { setFicha(null); setForm(v) }}
          aoMudar={async () => { await recarregar() }}
          aoFechar={() => setFicha(null)}
          avisar={avisar}
        />
      )}

      {form && (
        <FormVeiculo
          veiculo={form}
          motoristas={perfis.filter((p) => p.papel === 'motorista')}
          aoFechar={() => setForm(null)}
          aoSalvar={async () => { setForm(null); await recarregar() }}
          avisar={avisar}
        />
      )}
    </div>
  )
}
