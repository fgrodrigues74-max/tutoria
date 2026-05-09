import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Lock, Mail, Eye, EyeOff } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true)
    try {
      await login(email, password)
      setTimeout(() => { window.location.href = "/" }, 300)
    } catch { setError("Email ou senha incorretos") }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "relative", textAlign: "center", color: "#fff" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", backdropFilter: "blur(10px)" }}>
            <span style={{ fontSize: 28, fontWeight: 800 }}>T</span>
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>TutorIA</h1>
          <p style={{ margin: 0, fontSize: 15, opacity: 0.8 }}>Sistema de Gestão</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.6 }}>Fabiano Rodrigues</p>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
            {["Gestão Financeira", "Controle de Obras", "Leituras Bíblicas"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, opacity: 0.85 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 480, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", padding: 48 }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: "#1e293b" }}>Bem-vindo de volta</h2>
          <p style={{ margin: "0 0 32px", fontSize: 14, color: "#64748b" }}>Entre com suas credenciais para acessar</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Email</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", background: "#f8fafc", transition: "border-color .15s" }}>
                <Mail size={15} color="#94a3b8" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#1e293b" }} />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Senha</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", background: "#f8fafc" }}>
                <Lock size={15} color="#94a3b8" />
                <input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#1e293b" }} />
                <button type="button" onClick={() => setShow(!show)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: loading ? "#a5b4fc" : "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.4)", transition: "opacity .2s" }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
