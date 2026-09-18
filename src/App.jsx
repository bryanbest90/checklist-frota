import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, configOk } from './lib/supabase'
import Login from './components/Login'
import Checklist from './components/Checklist'
import Controle from './components/Controle'

export default function App() {
  // undefined = ainda verificando; null = deslogado; objeto = logado
  const [sessao, setSessao] = useState(undefined)
  const [perfil, setPerfil] = useState(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const timer = useRef(null)

  const avisar = useCallback((texto) => {
    setAviso(texto)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAviso(''), 3500)
  }, [])

  // 1. Sessão salva + escuta de login/logout.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data: assinatura } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s))
    return () => assinatura.subscription.unsubscribe()
  }, [])

  // 2. Com sessão, busca o perfil — é ele que diz se é adm ou motorista.
  useEffect(() => {
    if (!sessao) { setPerfil(null); return }
    let ativo = true

    supabase
      .from('perfis')
      .select('id, nome, papel, equipe')
      .eq('id', sessao.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!ativo) return
        if (error) setErro(error.message)
        else if (!data) setErro('Este usuário não tem perfil cadastrado. Avise o administrador.')
        else { setPerfil(data); setErro('') }
      })

    return () => { ativo = false }
  }, [sessao])

  function alternarTema() {
    const raiz = document.documentElement
    const atual =
      raiz.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    raiz.setAttribute('data-theme', atual === 'dark' ? 'light' : 'dark')
  }

  if (!configOk) {
    return (
      <div className="wrap" style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 17, marginBottom: 8 }}>Falta configurar o acesso ao banco</h2>
          <p style={{ color: 'var(--ink2)', marginTop: 0 }}>
            Crie um arquivo <code>.env.local</code> na raiz do projeto, ao lado do{' '}
            <code>package.json</code>, com estas duas linhas:
          </p>
          <pre className="bloco-codigo">
VITE_SUPABASE_URL=https://seu-projeto.supabase.co{'\n'}VITE_SUPABASE_ANON_KEY=sua-chave-anon
          </pre>
          <p style={{ color: 'var(--ink2)' }}>
            Os valores estão no painel do Supabase, em Project Settings → API.
            Depois de criar o arquivo, <b>pare e rode o servidor de novo</b> — o Vite só lê
            as variáveis quando inicia.
          </p>
        </div>
      </div>
    )
  }

  if (sessao === undefined) return <div className="carregando">Carregando…</div>
  if (!sessao) return <Login />

  return (
    <>
      <div className="topbar">
        <div className="topbar-in">
          <div className="brand">
            <div className="brand-mark">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M2 16V9h11v7M13 11h4.2l2.8 3.2V16" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
                <circle cx="7" cy="17.4" r="1.9" stroke="#fff" strokeWidth="1.7" />
                <circle cx="17" cy="17.4" r="1.9" stroke="#fff" strokeWidth="1.7" />
              </svg>
            </div>
            <div className="brand-txt">
              <strong>Checklist da Frota</strong>
              <span>{perfil ? perfil.nome : sessao.user.email}</span>
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 9, alignItems: 'center' }}>
            <button className="icon-btn" onClick={alternarTema} title="Alternar tema" aria-label="Alternar tema">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 13.2A8.2 8.2 0 1 1 10.8 4a6.6 6.6 0 0 0 9.2 9.2Z" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="btn btn-sm" onClick={() => supabase.auth.signOut()}>Sair</button>
          </div>
        </div>
      </div>

      {erro && <div className="wrap"><p className="form-err">{erro}</p></div>}

      {perfil && (perfil.papel === 'adm'
        ? <Controle avisar={avisar} />
        : <Checklist perfil={perfil} avisar={avisar} />)}

      {aviso && <div className="toast">{aviso}</div>}
    </>
  )
}
