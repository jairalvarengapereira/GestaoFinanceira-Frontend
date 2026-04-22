import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Smartphone } from 'lucide-react'
import api from '../services/api'

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)
  const [emailConfirmacao, setEmailConfirmacao] = useState('')
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('')

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/login', { email, senha })
      const { token, user } = response.data
      
      localStorage.setItem('@SaaS:token', token)
      localStorage.setItem('@SaaS:user', JSON.stringify(user))
      localStorage.setItem('@SaaS:email', email.trim())
      
      onLogin()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao entrar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const loginBiometrico = async () => {
    // Tenta usar biometria real do dispositivo
    try {
      if (navigator.credentials && navigator.credentials.get) {
        // Pede biometria ao dispositivo
        const credencial = await navigator.credentials.get({
          mediation: 'optional',
          publicKey: {
            challenge: new TextEncoder().encode('biometria-login-' + Date.now()),
            rp: { name: 'GestaoFinanceira' },
            userVerification: 'required'
          }
        })
        
        if (credencial) {
          // Biometria aprovada! Usa credenciais salvas
          const credenciaisEmail = localStorage.getItem('@SaaS:email')?.trim()
          const credenciaisSenha = localStorage.getItem('@SaaS:senha')?.trim()
          
          if (credenciaisEmail && credenciaisSenha) {
            await handleSubmitDirect(credenciaisEmail, credenciaisSenha)
            return
          }
        }
      }
    } catch (err: any) {
      console.log('Biometria não disponível:', err.message)
    }
    
    // Se biometria falhar, mostra tela de confirmação com senha
    const credenciaisEmail = localStorage.getItem('@SaaS:email')?.trim()
    if (credenciaisEmail) {
      setEmailConfirmacao(credenciaisEmail)
      setMostrarConfirmacao(true)
    } else {
      setError('Faça login manual primeiro')
    }
  }

  const handleSubmitDirect = async (emailVal: string, senhaVal: string) => {
    setIsLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/login', { email: emailVal, senha: senhaVal })
      const { token, user } = response.data
      localStorage.setItem('@SaaS:token', token)
      localStorage.setItem('@SaaS:user', JSON.stringify(user))
      localStorage.setItem('@SaaS:email', emailVal)
      onLogin()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao entrar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmarBiometria = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmitDirect(emailConfirmacao, senhaConfirmacao)
  }

  if (mostrarConfirmacao) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          <div className="flex flex-col items-center gap-4">
            <img src="/Logo.png?v=3" alt="Logo" className="w-16 h-16 rounded-xl" />
            <h1 className="text-3xl font-bold">Gestão Financeira</h1>
          </div>

          <div className="premium-card text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Smartphone className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Olá, {emailConfirmacao.split('@')[0]}!</h2>
            <p className="text-slate-400 mb-4">Digite sua senha para confirmar</p>
            
            <form onSubmit={handleConfirmarBiometria} className="space-y-4">
              <div className="text-sm text-slate-400">
                E-mail: <span className="text-white">{emailConfirmacao}</span>
              </div>
              <input 
                type="password" 
                value={senhaConfirmacao}
                onChange={(e) => setSenhaConfirmacao(e.target.value)}
                placeholder="Digite sua senha"
                required
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4 text-center"
              />
              <p className="text-xs text-slate-500">
                Use a biometria do seu celular para confirmar
              </p>
              
              <button 
                type="submit"
                disabled={isLoading || !senhaConfirmacao}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar'}
              </button>
            </form>
            
            <button 
              onClick={() => { setMostrarConfirmacao(false); setEmail(''); setSenha(''); setSenhaConfirmacao('') }}
              className="w-full mt-3 py-3 text-slate-400 hover:text-white"
            >
              Não sou eu
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        <div className="flex flex-col items-center gap-4">
          <img src="/Logo.png?v=3" alt="Logo" className="w-16 h-16 rounded-xl" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Gestão Financeira
          </h1>
          <p className="text-slate-400">Entre para gerenciar suas finanças</p>
        </div>

        <div className="premium-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type={mostrarSenha ? "text" : "password"} 
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={loginBiometrico}
              className="w-full btn-primary bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center gap-2 py-3"
            >
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400">Entrar com Biometria</span>
            </button>

            <button 
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-400 text-sm">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-sky-400 hover:text-sky-300 font-semibold underline-offset-4 hover:underline">
              Crie uma agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
