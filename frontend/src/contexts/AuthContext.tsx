import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { api } from '../api/client'

export interface User {
  id: string
  email: string
  name: string
  role: string
  avatar: string
  tier: 'admin' | 'tier1' | 'tier2' | 'hunter' | 'forensic'
  team: string
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'tc_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return { user: stored ? JSON.parse(stored) : null, loading: false, error: null }
    } catch {
      return { user: null, loading: false, error: null }
    }
  })

  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await api.login(email, password)
      const user = res.data as User
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      setState({ user, loading: false, error: null })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Login failed'
      setState(s => ({ ...s, loading: false, error: msg }))
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState({ user: null, loading: false, error: null })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
