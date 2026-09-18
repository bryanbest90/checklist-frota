import { supabase } from './supabase'
import { PARTES } from './partes'

export const BUCKET = 'checklist-fotos'

/* ---------------- veículos ---------------- */

// O motorista enxerga só o caminhão dele — mas quem garante isso é o RLS,
// não este filtro. O filtro aqui é para a tela, a regra está no banco.
export async function buscarMeuVeiculo(userId) {
  const { data, error } = await supabase
    .from('veiculos')
    .select('*')
    .eq('motorista_id', userId)
    .eq('ativo', true)
    .order('placa')
    .limit(1)
  if (error) throw error
  return data[0] || null
}

export async function listarVeiculos() {
  const { data, error } = await supabase.from('veiculos').select('*').order('placa')
  if (error) throw error
  return data
}

export async function listarPerfis() {
  const { data, error } = await supabase
    .from('perfis')
    .select('id, nome, papel, equipe')
    .order('nome')
  if (error) throw error
  return data
}

export async function salvarVeiculo(veiculo) {
  const { data, error } = await supabase
    .from('veiculos')
    .upsert(veiculo, { onConflict: 'placa' })
    .select()
    .single()
  if (error) throw error
  return data
}

// Caminhão não se apaga: ele tem checklists e ocorrências penduradas nele,
// que são o histórico. Sai da frota ficando inativo.
export async function alternarAtivo(placa, ativo) {
  const { error } = await supabase.from('veiculos').update({ ativo }).eq('placa', placa)
  if (error) throw error
}

/* ---------------- checklists e ocorrências ---------------- */

export async function listarChecklists(limite = 200) {
  const { data, error } = await supabase
    .from('checklists')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(limite)
  if (error) throw error
  return data
}

export async function listarOcorrencias({ incluirResolvidas = false } = {}) {
  let q = supabase.from('ocorrencias').select('*').order('criado_em', { ascending: false })
  if (!incluirResolvidas) q = q.neq('status', 'resolvida')
  const { data, error } = await q.limit(500)
  if (error) throw error
  return data
}

export async function atualizarOcorrencia(id, patch) {
  const { error } = await supabase.from('ocorrencias').update(patch).eq('id', id)
  if (error) throw error
}

/* ---------------- envio do checklist ---------------- */

// Reduz a foto antes de subir. Uma foto de celular tem 3 a 5 MB;
// depois disso fica em torno de 40 KB, e continua legível para ver a avaria.
export function comprimirFoto(arquivo, maxLado = 1024, qualidade = 0.7) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onerror = () => reject(new Error('Não consegui ler a imagem.'))
    leitor.onload = (ev) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'))
      img.onload = () => {
        const fator = Math.min(maxLado / img.width, maxLado / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * fator)
        canvas.height = Math.round(img.height * fator)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao comprimir.'))),
          'image/jpeg',
          qualidade
        )
      }
      img.src = ev.target.result
    }
    leitor.readAsDataURL(arquivo)
  })
}

export async function enviarChecklist({ veiculo, motoristaId, km, marcacoes, detalhes }) {
  const entradas = Object.entries(marcacoes)
  const problemas = entradas.filter(([, s]) => s !== 'ok')

  const { data: checklist, error } = await supabase
    .from('checklists')
    .insert({
      placa: veiculo.placa,
      motorista_id: motoristaId,
      km: km || null,
      conformes: entradas.filter(([, s]) => s === 'ok').length,
      atencao: problemas.filter(([, s]) => s === 'atencao').length,
      criticos: problemas.filter(([, s]) => s === 'critico').length,
    })
    .select()
    .single()
  if (error) throw error

  const linhas = []
  const fotosFalhadas = []

  for (const [parte, gravidade] of problemas) {
    const d = detalhes[parte] || {}
    let foto_path = null

    if (d.foto) {
      const caminho = `${veiculo.placa}/${checklist.id}/${parte}.jpg`
      const { error: erroFoto } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, d.foto, { contentType: 'image/jpeg', upsert: true })
      // A foto é um reforço da ocorrência, não a ocorrência.
      // Se o upload falhar, o problema ainda tem que chegar ao controle.
      if (erroFoto) fotosFalhadas.push(PARTES[parte].l)
      else foto_path = caminho
    }

    linhas.push({
      checklist_id: checklist.id,
      placa: veiculo.placa,
      parte,
      gravidade,
      observacao: d.obs || null,
      foto_path,
    })
  }

  if (linhas.length) {
    const { error: erroOc } = await supabase.from('ocorrencias').insert(linhas)
    if (erroOc) throw erroOc
  }

  return { checklist, fotosFalhadas }
}

/* ---------------- fotos ---------------- */

// O bucket é privado, então a imagem só abre por link temporário.
export async function urlAssinada(path, segundos = 3600) {
  if (!path) return null
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, segundos)
  if (error) return null
  return data.signedUrl
}
