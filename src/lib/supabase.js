import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY

// Se faltar configuração, não derrubamos o app com um erro no import —
// isso daria tela branca, sem pista nenhuma de onde está o problema.
// O App checa `configOk` e mostra na tela o que fazer.
export const configOk = Boolean(url && chave)

export const supabase = createClient(
  url || 'https://configure-o-env.supabase.co',
  chave || 'sem-chave'
)
