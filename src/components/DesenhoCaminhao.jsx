import { PARTES } from '../lib/partes'

/*
  Uma peça do desenho.
  Se a vista atual é a dona do item, ela é clicável de verdade (class "part").
  Se a peça só aparece aqui como contexto — o pneu traseiro visto de lado, por
  exemplo — ela vira "deco": fica esmaecida, não marca nada, e o toque leva o
  motorista para a vista onde o item mora. Assim nenhum item é marcável em
  dois lugares.
*/
function Peca({ id, vista, marcacoes, aoTocar, children }) {
  const dona = PARTES[id].v === vista
  const estado = marcacoes[id]
  return (
    <g
      className={dona ? 'part' : 'deco'}
      data-part={id}
      data-st={estado || undefined}
      onClick={() => aoTocar(id, dona)}
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
        <line className="ground" x1="12" y1="190" x2="408" y2="190" />
        <Peca id="chassi" {...p}>
          <rect className="sk" x="40" y="138" width="358" height="13" rx="3" />
        </Peca>
        <Peca id="carroceria" {...p}>
          <rect className="sk" x="158" y="44" width="240" height="96" rx="4" />
          <path className="det" d="M164 72h228M164 96h228M164 120h228" />
          <Alerta x={278} y={60} />
        </Peca>
        <Peca id="escapamento" {...p}>
          <rect className="sk" x="140" y="28" width="11" height="112" rx="4" />
        </Peca>
        <Peca id="cabine_lataria" {...p}>
          <path className="sk" d="M44 142V84l19-32h74v90Z" />
          <Alerta x={92} y={112} />
        </Peca>
        <Peca id="para_brisa" {...p}>
          <path className="gl" d="M68 58h66v24H54Z" />
        </Peca>
        <Peca id="retrovisores" {...p}>
          <rect className="sk" x="52" y="54" width="7" height="24" rx="3" />
          <path className="det" d="M59 62h7" />
        </Peca>
        <Peca id="porta" {...p}>
          <rect className="sk" x="80" y="88" width="54" height="50" rx="3" />
          <path className="det" d="M116 112h11" />
          <Alerta x={107} y={128} />
        </Peca>
        <Peca id="vidro_lateral" {...p}>
          <rect className="gl" x="86" y="93" width="42" height="21" rx="2" />
          <Alerta x={107} y={103} r={8} />
        </Peca>
        <Peca id="degrau" {...p}>
          <rect className="sk" x="86" y="150" width="40" height="9" rx="2" />
        </Peca>
        <Peca id="tanque" {...p}>
          <rect className="sk" x="152" y="150" width="62" height="26" rx="8" />
        </Peca>
        <Peca id="para_choque_diant" {...p}>
          <rect className="sk" x="30" y="136" width="15" height="22" rx="3" />
        </Peca>
        <Peca id="farois" {...p}>
          <rect className="sk" x="45" y="116" width="15" height="13" rx="3" />
        </Peca>
        <Peca id="pneus_diant" {...p}>
          <circle className="tr" cx="98" cy="166" r="24" />
          <circle className="det" cx="98" cy="166" r="10" />
          <Alerta x={98} y={166} />
        </Peca>
        <Peca id="pneus_tras" {...p}>
          <circle className="tr" cx="296" cy="166" r="24" />
          <circle className="det" cx="296" cy="166" r="10" />
          <circle className="tr" cx="350" cy="166" r="24" />
          <circle className="det" cx="350" cy="166" r="10" />
          <Alerta x={323} y={166} />
        </Peca>
        <Peca id="lanterna_tras" {...p}>
          <rect className="sk" x="386" y="116" width="13" height="20" rx="3" />
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
          <text
            x="150"
            y="160.5"
            textAnchor="middle"
            className="mono"
            style={{ fontSize: 11, fill: 'var(--ink2)' }}
          >
            {placa}
          </text>
        </Peca>
        <Peca id="pneus_diant" {...p}>
          <circle className="tr" cx="60" cy="186" r="18" />
          <circle className="tr" cx="240" cy="186" r="18" />
          <Alerta x={60} y={186} r={8} />
        </Peca>
      </svg>
    )
  }

  if (vista === 'traseira') {
    return (
      <svg viewBox="0 0 300 220" role="img" aria-label="Vista traseira do caminhão">
        <line className="ground" x1="14" y1="204" x2="286" y2="204" />
        <Peca id="pneus_tras" {...p}>
          <circle className="tr" cx="74" cy="184" r="19" />
          <circle className="det" cx="74" cy="184" r="8" />
          <circle className="tr" cx="226" cy="184" r="19" />
          <circle className="det" cx="226" cy="184" r="8" />
          <Alerta x={74} y={184} />
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
          <text
            x="150"
            y="166.5"
            textAnchor="middle"
            className="mono"
            style={{ fontSize: 11, fill: 'var(--ink2)' }}
          >
            {placa}
          </text>
        </Peca>
        <Peca id="protecao_tras" {...p}>
          <rect className="sk" x="40" y="182" width="220" height="10" rx="4" />
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
