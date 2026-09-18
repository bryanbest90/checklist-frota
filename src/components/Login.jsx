import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setErro('')
    setEntrando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })

    // Em caso de erro o Supabase devolve sempre a mesma mensagem, de propósito:
    // dizer "este e-mail não existe" entregaria quais contas existem.
    if (error) {
      setErro(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : error.message
      )
      setEntrando(false)
    }
    // Se deu certo, não precisa fazer nada aqui: o App está ouvindo a sessão.
  }

  return (
    <div className="login-wrap">
      <form className="login card" onSubmit={entrar}>
        <div className="login-marca">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2 16V9h11v7M13 11h4.2l2.8 3.2V16" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx="7" cy="17.4" r="1.9" stroke="#fff" strokeWidth="1.7" />
              <circle cx="17" cy="17.4" r="1.9" stroke="#fff" strokeWidth="1.7" />
            </svg>
          </div>
          <div>
            <h1>Checklist da Frota</h1>
            <p>Consórcio Global Interlagos</p>
          </div>
        </div>

        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        {erro && <p className="form-err">{erro}</p>}

        <button className="btn btn-primary" type="submit" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
