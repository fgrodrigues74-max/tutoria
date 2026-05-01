// ============================================================
// TutorIA Web V24 — src/contexts/AuthContext.tsx
// Contexto global de autenticação
// ============================================================

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// ── Tipos ────────────────────────────────────────────────────
export interface Permissao {
  modulo_slug: string
  nivel: 'leitura' | 'escrita' | 'admin'
}

export interface Usuario {
  id: string
  nome: string
  email: string
  telefone?: string
  role: 'admin' | 'gestor' | 'operador' | 'visualizador'
  ativo: boolean
  permissoes: Permissao[]
}

interface AuthState {
  usuario: Usuario | null
  token: string | null
  carregando: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  temPermissao: (slug: string, nivel?: Permissao['nivel']) => boolean
  isAdmin: () => boolean
}

// ── Contexto ─────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null)

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    usuario: null,
    token: null,
    carregando: true,
  })

  // Recuperar sessão salva ao montar
  useEffect(() => {
    const token = localStorage.getItem('tutor_token')
    const refresh = localStorage.getItem('tutor_refresh')
    if (token) {
      fetchMe(token).catch(() => {
        // Token expirou — tentar renovar
        if (refresh) renovarToken(refresh)
        else limparSessao()
      })
    } else {
      setState(s => ({ ...s, carregando: false }))
    }
  }, [])

  async function fetchMe(token: string) {
    const res = await fetch(`${API}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('Token inválido')
    const usuario: Usuario = await res.json()
    setState({ usuario, token, carregando: false })
  }

  async function renovarToken(refresh: string) {
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh })
      })
      if (!res.ok) throw new Error()
      const { access_token, refresh_token } = await res.json()
      localStorage.setItem('tutor_token', access_token)
      localStorage.setItem('tutor_refresh', refresh_token)
      await fetchMe(access_token)
    } catch {
      limparSessao()
    }
  }

  function limparSessao() {
    localStorage.removeItem('tutor_token')
    localStorage.removeItem('tutor_refresh')
    setState({ usuario: null, token: null, carregando: false })
  }

  // ── Ações públicas ────────────────────────────────────────
  async function login(email: string, senha: string) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: senha })
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Erro no login')
    }
    const { access_token, refresh_token, usuario } = await res.json()
    localStorage.setItem('tutor_token', access_token)
    localStorage.setItem('tutor_refresh', refresh_token)
    setState({ usuario, token: access_token, carregando: false })
  }

  async function logout() {
    if (state.token) {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.token}` }
      }).catch(() => {})
    }
    limparSessao()
  }

  function temPermissao(slug: string, nivel: Permissao['nivel'] = 'leitura') {
    if (!state.usuario) return false
    if (state.usuario.role === 'admin') return true
    const perm = state.usuario.permissoes.find(p => p.modulo_slug === slug)
    if (!perm) return false
    const niveis = { leitura: 0, escrita: 1, admin: 2 }
    return niveis[perm.nivel] >= niveis[nivel]
  }

  function isAdmin() {
    return state.usuario?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, temPermissao, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
