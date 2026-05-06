import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import axios from "axios"
const API = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000"
interface User { id: string; nome: string; email: string; role: string }
interface AuthCtx { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => void }
const AuthContext = createContext<AuthCtx>({} as AuthCtx)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      axios.get(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { setUser(r.data); setLoading(false) })
        .catch(() => { localStorage.removeItem("token"); setLoading(false) })
    } else { setLoading(false) }
  }, [])
  async function login(email: string, password: string) {
    const r = await axios.post(`${API}/auth/login`, { email, password })
    localStorage.setItem("token", r.data.access_token)
    setUser(r.data.usuario || r.data.user || r.data)
  }
  function logout() { localStorage.removeItem("token"); setUser(null) }
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)