import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Fingerprint, Smartphone } from 'lucide-react'
import api from '../services/api'

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/login', { email, senha })
      const { token, user } = response.data
      
      localStorage.setItem('@SaaS:token', token)
      localStorage.setItem('@SaaS:user', JSON.stringify(user))
      localStorage.setItem('@SaaS:email', email)
      localStorage.setItem('@SaaS:senha', senha)
      
      onLogin()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao entrar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const loginBiometrico = async () => {
    if (!('BiometricType' in navigator)) {
      setError('Navegador não suporta biometria')
      return
    }
    
    try {
      const credenciaisEmail = localStorage.getItem('@SaaS:email')
      const credenciaisSenha = localStorage.getItem('@SaaS:senha')
      
      if (!credenciaisEmail || !credenciaisSenha) {
        setError('Faça login manual primeiro para salvar credenciais')
        return
      }
      
      setEmail(credenciaisEmail)
      setSenha(credenciaisSenha)
      await handleSubmit()
    } catch (err) {
      setError('Erro na biometria. Use login manual.')
    }
  }

  const loginFaceID = async () => {
    if (!window.FaceID) {
      setError('FaceID não disponível neste dispositivo')
      return
    }
    
    const credenciaisEmail = localStorage.getItem('@SaaS:email')
    const credenciaisSenha = localStorage.getItem('@SaaS:senha')
    
    if (!credenciaisEmail || !credenciaisSenha) {
      setError('Faça login manual primeiro para salvar credenciais')
      return
    }
    
    setEmail(credenciaisEmail)
    setSenha(credenciaisSenha)
    await handleSubmit()
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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={loginBiometrico}
                className="flex-1 btn-primary bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center gap-2 py-3"
              >
                <Fingerprint className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400">Biometria</span>
              </button>
            </div>

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
