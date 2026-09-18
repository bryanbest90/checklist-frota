import { useState } from 'react'
import { salvarVeiculo, alternarAtivo } from '../lib/api'

const TIPOS = ['Caçamba', 'Carroceria', 'Munck', 'Caminhonete', 'Comboio', 'Outro']

export default function FormVeiculo({ veiculo, motoristas, aoFechar, aoSalvar, avisar }) {
  const novo = !veiculo.placa
  const [f, setF] = useState({
    placa: veiculo.placa || '',
    modelo: veiculo.modelo || '',
    tipo: veiculo.tipo || TIPOS[0],
    ano: veiculo.ano || new Date().getFullYear(),
    chassi: veiculo.chassi || '',
    equipe: veiculo.equipe || '',
    motorista_id: veiculo.motorista_id || '',
    km: veiculo.km ?? 0,
    licenciamento: veiculo.licenciamento || '',
    proxima_revisao: veiculo.proxima_revisao || '',
  })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [armado, setArmado] = useState(false)

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function salvar() {
    if (!f.placa.trim() || !f.modelo.trim()) {
      setErro('Placa e modelo são obrigatórios.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      await salvarVeiculo({
        ...f,
        placa: f.placa.trim().toUpperCase(),
        modelo: f.modelo.trim(),
        ano: parseInt(f.ano, 10) || null,
        km: parseInt(f.km, 10) || 0,
        motorista_id: f.motorista_id || null,
        licenciamento: f.licenciamento || null,
        proxima_revisao: f.proxima_revisao || null,
        ativo: veiculo.ativo ?? true,
      })
      avisar(novo ? `Caminhão ${f.placa.toUpperCase()} cadastrado.` : 'Cadastro atualizado.')
      await aoSalvar()
    } catch (e) {
      setErro(
        e.code === '23505'
          ? `Já existe um caminhão com a placa ${f.placa.toUpperCase()}.`
          : e.message
      )
      setSalvando(false)
    }
  }

  async function desativar() {
    if (!armado) { setArmado(true); return }
    setSalvando(true)
    try {
      await alternarAtivo(veiculo.placa, !veiculo.ativo)
      avisar(veiculo.ativo ? `${veiculo.placa} saiu da frota ativa.` : `${veiculo.placa} voltou para a frota.`)
      await aoSalvar()
    } catch (e) {
      setErro(e.message)
      setSalvando(false)
    }
  }

  return (
    <div className="modal-wrap" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="tituloForm">
        <div className="modal-h">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="plate-sm">{novo ? 'NOVO' : veiculo.placa}</span>
            <div>
              <h3 id="tituloForm" style={{ fontSize: 15 }}>
                {novo ? 'Cadastrar caminhão' : 'Editar cadastro'}
              </h3>
              <p style={{ margin: '1px 0 0', fontSize: 12, color: 'var(--ink3)' }}>
                {novo
                  ? 'Entra na frota e fica disponível para o motorista escolhido'
                  : 'A placa não muda: ela é a chave que liga checklists e ocorrências'}
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={aoFechar} aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="modal-b">
          <div className="form">
            <div className="field">
              <label htmlFor="placa">Placa *</label>
              <input
                id="placa"
                className="mono"
                value={f.placa}
                disabled={!novo}
                placeholder="ABC1D23"
                onChange={(e) => setF({ ...f, placa: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="field">
              <label htmlFor="modelo">Modelo *</label>
              <input id="modelo" value={f.modelo} placeholder="VW Constellation 17-230" onChange={set('modelo')} />
            </div>
            <div className="field">
              <label htmlFor="tipo">Tipo</label>
              <select id="tipo" value={f.tipo} onChange={set('tipo')}>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ano">Ano</label>
              <input id="ano" type="number" value={f.ano} onChange={set('ano')} />
            </div>
            <div className="field">
              <label htmlFor="chassi">Final do chassi</label>
              <input id="chassi" value={f.chassi} placeholder="…9K2841" onChange={set('chassi')} />
            </div>
            <div className="field">
              <label htmlFor="equipe">Equipe</label>
              <input id="equipe" value={f.equipe} placeholder="Equipe 04" onChange={set('equipe')} />
            </div>
            <div className="field">
              <label htmlFor="motorista">Motorista</label>
              <select id="motorista" value={f.motorista_id} onChange={set('motorista_id')}>
                <option value="">— sem motorista —</option>
                {motoristas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="km">Odômetro (km)</label>
              <input id="km" type="number" value={f.km} onChange={set('km')} />
            </div>
            <div className="field">
              <label htmlFor="licenc">Licenciamento até</label>
              <input id="licenc" type="date" value={f.licenciamento} onChange={set('licenciamento')} />
            </div>
            <div className="field">
              <label htmlFor="revisao">Próxima revisão</label>
              <input id="revisao" type="date" value={f.proxima_revisao} onChange={set('proxima_revisao')} />
            </div>
          </div>

          {erro && <p className="form-err">{erro}</p>}

          <div className="form-foot">
            {!novo && (
              <button className="btn btn-danger" onClick={desativar} disabled={salvando}>
                {armado
                  ? 'Confirmar'
                  : veiculo.ativo ? 'Tirar da frota' : 'Devolver à frota'}
              </button>
            )}
            <button className="btn" onClick={aoFechar}>Cancelar</button>
            <button className="btn btn-primary" onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando…' : novo ? 'Cadastrar' : 'Salvar alterações'}
            </button>
          </div>

          <p className="note">
            Caminhão não se apaga: os checklists e as ocorrências dele são o histórico da frota.
            Quando um veículo sai de circulação, ele fica inativo — some das contagens e do app do
            motorista, mas o passado continua consultável.
          </p>
        </div>
      </div>
    </div>
  )
}
