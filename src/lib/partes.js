// Catálogo dos itens do checklist.
// Cada item mora em UMA vista só — é o campo `v` que decide.
// Onde a peça aparece desenhada em outra vista, ela vira contexto (não marca nada).

export const PARTES = {
  cabine_lataria: { l: 'Lataria da cabine', v: 'lateral' },
  vidro_lateral: { l: 'Vidros laterais', v: 'lateral' },
  porta: { l: 'Porta e maçaneta', v: 'lateral' },
  degrau: { l: 'Degrau de acesso', v: 'lateral' },
  tanque: { l: 'Tanque de combustível', v: 'lateral' },
  escapamento: { l: 'Escapamento', v: 'lateral' },
  carroceria: { l: 'Carroceria / caçamba', v: 'lateral' },
  chassi: { l: 'Chassi e molas', v: 'lateral' },
  pneus_diant: { l: 'Pneus dianteiros', v: 'lateral' },
  pneus_tras: { l: 'Pneus traseiros', v: 'lateral' },

  para_choque_diant: { l: 'Para-choque dianteiro', v: 'frente' },
  para_brisa: { l: 'Para-brisa', v: 'frente' },
  retrovisores: { l: 'Retrovisores', v: 'frente' },
  farois: { l: 'Faróis', v: 'frente' },
  grade: { l: 'Grade e capô', v: 'frente' },
  limpadores: { l: 'Limpadores e esguicho', v: 'frente' },
  placa_diant: { l: 'Placa dianteira', v: 'frente' },

  tampa_tras: { l: 'Tampa / portinhola traseira', v: 'traseira' },
  lanterna_tras: { l: 'Lanternas traseiras', v: 'traseira' },
  luz_re: { l: 'Luz de ré e sinalização', v: 'traseira' },
  placa_tras: { l: 'Placa traseira', v: 'traseira' },
  protecao_tras: { l: 'Proteção traseira (para-ciclista)', v: 'traseira' },
  para_choque_tras: { l: 'Para-choque traseiro', v: 'traseira' },

  volante: { l: 'Volante e direção', v: 'cabine' },
  painel: { l: 'Painel e instrumentos', v: 'cabine' },
  banco: { l: 'Banco do motorista', v: 'cabine' },
  cinto: { l: 'Cinto de segurança', v: 'cabine' },
  freio_mao: { l: 'Freio de estacionamento', v: 'cabine' },
  buzina: { l: 'Buzina', v: 'cabine' },

  // Mecânica não tem lista: o motorista descreve o que sentiu.
  // Uma linha por problema, todas gravadas com parte = 'mecanica'.
  mecanica: { l: 'Mecânica', v: 'mecanica' },

  extintor: { l: 'Extintor', v: 'itens' },
  triangulo: { l: 'Triângulo', v: 'itens' },
  macaco: { l: 'Macaco e chave de roda', v: 'itens' },
  estepe: { l: 'Estepe', v: 'itens' },
  documentos: { l: 'CRLV e documentação', v: 'itens' },
  niveis: { l: 'Níveis (óleo, água, arla)', v: 'itens' },
  luzes: { l: 'Luzes, setas e freio', v: 'itens' },
}

export const VISTAS = ['lateral', 'frente', 'traseira', 'cabine', 'mecanica', 'itens']

export const NOME_VISTA = {
  lateral: 'Lateral',
  frente: 'Frente',
  traseira: 'Traseira',
  cabine: 'Cabine',
  mecanica: 'Mecânica',
  itens: 'Itens',
}

export const NOME_VISTA_LONGO = {
  lateral: 'Vista lateral',
  frente: 'Vista frontal',
  traseira: 'Vista traseira',
  cabine: 'Cabine',
  mecanica: 'Mecânica',
  itens: 'Itens obrigatórios',
}

export const PARTES_POR_VISTA = VISTAS.reduce((acc, v) => {
  acc[v] = Object.keys(PARTES).filter((k) => PARTES[k].v === v)
  return acc
}, {})

export const ITENS_OBRIGATORIOS = PARTES_POR_VISTA.itens
export const TOTAL_ITENS = Object.keys(PARTES).length

// Rótulos para exibição no controle. Inclui registros que não são itens do
// checklist — o aviso de odômetro, por exemplo — e por isso ficam fora de PARTES.
const EXTRAS = { odometro: 'Odômetro' }

export function rotuloParte(id) {
  return PARTES[id]?.l || EXTRAS[id] || id
}
