import { PARTES } from '../lib/partes'

/*
  Uma peça do desenho.
  Se a vista atual é a dona do item, ela é clicável (class "part") e recebe
  destaque forte. Se a peça só aparece aqui como contexto — o pneu traseiro
  visto de lado, por exemplo — ela vira "deco": desenho apagado, sem toque
  nenhum (o CSS corta com pointer-events), para não dar a impressão de que
  se marca ali. Cada item só é marcável na vista dele.
*/
function Peca({ id, vista, marcacoes, aoTocar, children }) {
  const dona = PARTES[id].v === vista
  const estado = marcacoes[id]
  return (
    <g
      className={dona ? 'part' : 'deco'}
      data-part={id}
      data-st={estado || undefined}
      aria-hidden={dona ? undefined : 'true'}
      onClick={dona ? () => aoTocar(id) : undefined}
    >
      {children}
    </g>
  )
}

function Alerta({ x, y, r = 9 }) {
  return (
    <g className="flag" transform={`translate(${x},${y})`}>
      <circle r={r} />
      <text y={r * 0.4}>!</text>
    </g>
  )
}

export default function DesenhoCaminhao({ vista, marcacoes, aoTocar, placa }) {
  const p = { vista, marcacoes, aoTocar }

  if (vista === 'lateral') {
    return (
      <svg viewBox="0 0 420 210" role="img" aria-label="Vista lateral do caminhão">
        <line className="ground" x1="12" y1="192" x2="408" y2="192" />

        <Peca id="chassi" {...p}>
          <rect className="sk" x="40" y="140" width="358" height="12" rx="3" />
        </Peca>

        <Peca id="carroceria" {...p}>
          <rect className="sk" x="170" y="42" width="228" height="98" rx="4" />
          <path className="det" d="M176 70h216M176 94h216M176 118h216" />
          <Alerta x={284} y={60} />
        </Peca>

        <Peca id="escapamento" {...p}>
          <rect className="sk" x="154" y="30" width="11" height="110" rx="4" />
        </Peca>

        {/* cabine: cabine-avançada, teto arredondado e frente reta */}
        <Peca id="cabine_lataria" {...p}>
          <path className="sk" d="M44 140V64c0-9 6-16 15-16h93v92Z" />
          <Alerta x={60} y={124} r={8} />
        </Peca>

        {/* de lado, o para-brisa é só a faixa da frente — ele se marca na vista frontal */}
        <Peca id="para_brisa" {...p}>
          <path className="gl" d="M52 58l15-2-6 36H52Z" />
        </Peca>

        <Peca id="retrovisores" {...p}>
          <rect className="sk" x="40" y="50" width="7" height="26" rx="3" />
          <path className="det" d="M47 58h8" />
        </Peca>

        <Peca id="porta" {...p}>
          <rect className="sk" x="72" y="56" width="76" height="84" rx="4" />
          <path className="det" d="M128 104h12" />
          <Alerta x={110} y={124} />
        </Peca>

        <Peca id="vidro_lateral" {...p}>
          <rect className="gl" x="80" y="64" width="60" height="36" rx="3" />
          <Alerta x={110} y={82} />
        </Peca>

        {/* degrau atrás da roda dianteira, embaixo da porta */}
        <Peca id="degrau" {...p}>
          <rect className="sk" x="120" y="152" width="32" height="9" rx="2" />
          <path className="det" d="M124 161v6M148 161v6" />
        </Peca>

        <Peca id="tanque" {...p}>
          <rect className="sk" x="168" y="154" width="60" height="26" rx="8" />
        </Peca>

        <Peca id="estepe" {...p}>
          <circle className="tr" cx="254" cy="164" r="17" />
          <circle className="det" cx="254" cy="164" r="7" />
          <path className="det" d="M254 147v-7M254 181v7" />
        </Peca>

        <Peca id="para_choque_diant" {...p}>
          <rect className="sk" x="30" y="136" width="14" height="22" rx="3" />
        </Peca>

        <Peca id="farois" {...p}>
          <rect className="sk" x="45" y="112" width="14" height="13" rx="3" />
        </Peca>

        <Peca id="pneus_diant" {...p}>
          <circle className="tr" cx="92" cy="166" r="26" />
          <circle className="det" cx="92" cy="166" r="11" />
          <Alerta x={92} y={166} />
        </Peca>

        <Peca id="pneus_tras" {...p}>
          <circle className="tr" cx="300" cy="166" r="26" />
          <circle className="det" cx="300" cy="166" r="11" />
          <circle className="tr" cx="354" cy="166" r="26" />
          <circle className="det" cx="354" cy="166" r="11" />
          <Alerta x={327} y={166} />
        </Peca>

        <Peca id="lanterna_tras" {...p}>
          <rect className="sk" x="386" y="114" width="13" height="20" rx="3" />
        </Peca>

        <Peca id="para_choque_tras" {...p}>
          <rect className="sk" x="380" y="152" width="26" height="12" rx="3" />
        </Peca>
      </svg>
    )
  }

  if (vista === 'frente') {
    return (
      <svg viewBox="0 0 300 220" role="img" aria-label="Vista frontal do caminhão">
        <line className="ground" x1="14" y1="204" x2="286" y2="204" />

        {/* de frente vê-se a banda de rodagem, não a roda inteira */}
        <Peca id="pneus_diant" {...p}>
          <rect className="tr" x="42" y="156" width="30" height="48" rx="9" />
          <path className="det" d="M47 168h20M47 180h20M47 192h20" />
          <rect className="tr" x="228" y="156" width="30" height="48" rx="9" />
          <path className="det" d="M233 168h20M233 180h20M233 192h20" />
        </Peca>

        <Peca id="cabine_lataria" {...p}>
          <rect className="sk" x="48" y="26" width="204" height="150" rx="10" />
        </Peca>
        <Peca id="para_brisa" {...p}>
          <rect className="gl" x="62" y="38" width="176" height="52" rx="5" />
          <Alerta x={150} y={64} />
        </Peca>
        <Peca id="limpadores" {...p}>
          <path className="det" d="M76 86l34-26M118 86l34-26" strokeWidth="2.4" />
          <rect className="sk" x="70" y="84" width="96" height="6" rx="3" opacity=".9" />
        </Peca>
        <Peca id="retrovisores" {...p}>
          <rect className="sk" x="26" y="46" width="18" height="36" rx="4" />
          <rect className="sk" x="256" y="46" width="18" height="36" rx="4" />
          <Alerta x={35} y={64} r={8} />
        </Peca>
        <Peca id="grade" {...p}>
          <rect className="sk" x="82" y="102" width="136" height="32" rx="4" />
          <path className="det" d="M104 104v28M126 104v28M148 104v28M170 104v28M192 104v28" />
          <Alerta x={150} y={118} />
        </Peca>
        <Peca id="farois" {...p}>
          <rect className="sk" x="54" y="102" width="24" height="26" rx="4" />
          <rect className="sk" x="222" y="102" width="24" height="26" rx="4" />
          <Alerta x={66} y={115} />
        </Peca>
        <Peca id="para_choque_diant" {...p}>
          <rect className="sk" x="40" y="142" width="220" height="28" rx="5" />
        </Peca>
        <Peca id="placa_diant" {...p}>
          <rect className="sk" x="120" y="146" width="60" height="20" rx="3" />
          <text x="150" y="160.5" textAnchor="middle" className="mono" style={{ fontSize: 11, fill: 'var(--ink2)' }}>
            {placa}
          </text>
        </Peca>
      </svg>
    )
  }

  if (vista === 'traseira') {
    return (
      <svg viewBox="0 0 300 220" role="img" aria-label="Vista traseira do caminhão">
        <line className="ground" x1="14" y1="204" x2="286" y2="204" />

        {/* eixo traseiro: rodagem dupla de cada lado, vista de trás */}
        <Peca id="pneus_tras" {...p}>
          <rect className="tr" x="40" y="158" width="25" height="46" rx="8" />
          <rect className="tr" x="68" y="158" width="25" height="46" rx="8" />
          <rect className="tr" x="207" y="158" width="25" height="46" rx="8" />
          <rect className="tr" x="235" y="158" width="25" height="46" rx="8" />
          <path className="det" d="M44 172h17M72 172h17M211 172h17M239 172h17M44 188h17M72 188h17M211 188h17M239 188h17" />
        </Peca>

        <Peca id="carroceria" {...p}>
          <rect className="sk" x="44" y="18" width="212" height="128" rx="5" />
        </Peca>
        <Peca id="tampa_tras" {...p}>
          <rect className="sk" x="58" y="32" width="184" height="96" rx="4" />
          <path className="det" d="M150 34v92" />
          <circle className="det" cx="140" cy="80" r="4" />
          <circle className="det" cx="160" cy="80" r="4" />
          <Alerta x={150} y={58} />
        </Peca>
        <Peca id="lanterna_tras" {...p}>
          <rect className="sk" x="48" y="150" width="32" height="26" rx="4" />
          <path className="det" d="M52 158h24M52 166h24" />
          <rect className="sk" x="220" y="150" width="32" height="26" rx="4" />
          <path className="det" d="M224 158h24M224 166h24" />
          <Alerta x={64} y={163} />
        </Peca>
        <Peca id="luz_re" {...p}>
          <rect className="sk" x="88" y="154" width="24" height="18" rx="3" />
        </Peca>
        <Peca id="placa_tras" {...p}>
          <rect className="sk" x="120" y="152" width="60" height="20" rx="3" />
          <text x="150" y="166.5" textAnchor="middle" className="mono" style={{ fontSize: 11, fill: 'var(--ink2)' }}>
            {placa}
          </text>
        </Peca>
        <Peca id="protecao_tras" {...p}>
          <rect className="sk" x="36" y="182" width="228" height="10" rx="4" />
          <path className="det" d="M62 182v-8M238 182v-8" />
        </Peca>
        <Peca id="para_choque_tras" {...p}>
          <rect className="sk" x="52" y="140" width="196" height="12" rx="4" />
        </Peca>
      </svg>
    )
  }

  if (vista === 'cabine') {
    return (
      <svg viewBox="0 0 320 200" role="img" aria-label="Interior da cabine">
        <rect x="12" y="10" width="296" height="178" rx="12" fill="none" stroke="var(--line)" strokeWidth="1.6" />
        <Peca id="painel" {...p}>
          <path className="sk" d="M30 84h260v34a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8Z" />
          <circle className="det" cx="86" cy="102" r="11" />
          <circle className="det" cx="120" cy="102" r="8" />
          <path className="det" d="M200 96h70M200 108h50" />
          <Alerta x={240} y={102} />
        </Peca>
        <Peca id="para_brisa" {...p}>
          <path className="gl" d="M30 24h260v54H30Z" />
        </Peca>
        <Peca id="volante" {...p}>
          <circle className="sk" cx="86" cy="150" r="30" />
          <circle className="det" cx="86" cy="150" r="11" />
          <path className="det" d="M75 150h-19M97 150h19M86 161v17" />
          <Alerta x={86} y={150} r={8} />
        </Peca>
        <Peca id="freio_mao" {...p}>
          <rect className="sk" x="150" y="140" width="12" height="42" rx="6" />
        </Peca>
        <Peca id="banco" {...p}>
          <rect className="sk" x="198" y="128" width="72" height="54" rx="8" />
          <path className="det" d="M206 148h56" />
          <Alerta x={234} y={155} />
        </Peca>
        <Peca id="cinto" {...p}>
          <path className="sk" d="M262 126l-52 56 9 8 52-56Z" />
        </Peca>
        <Peca id="buzina" {...p}>
          <rect className="sk" x="72" y="138" width="28" height="22" rx="6" />
        </Peca>
      </svg>
    )
  }

  return null
}
