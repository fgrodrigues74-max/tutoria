import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f1117 0%,#1a1d2e 50%,#0f1117 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem",fontFamily:"sans-serif"}}>
      <div style={{width:"100%",maxWidth:"400px"}}>
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:"56px",height:"56px",borderRadius:"16px",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",marginBottom:"1rem"}}>
            <span style={{color:"white",fontSize:"24px",fontWeight:700}}>T</span>
          </div>
          <h1 style={{fontFamily:"serif",fontSize:"2rem",fontWeight:400,color:"#e8e6e1",margin:0}}>TutorIA</h1>
          <p style={{color:"#6b7280",fontSize:"14px",marginTop:"6px"}}>Sistema de Gestao - Fabiano Rodrigues</p>
        </div>
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"20px",padding:"2rem"}}>
          <h2 style={{fontSize:"18px",fontWeight:500,color:"#e8e6e1",marginBottom:"1.5rem",marginTop:0}}>Entrar na conta</h2>
          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:"1rem"}}>
              <label style={{display:"block",fontSize:"13px",color:"#9ca3af",marginBottom:"6px"}}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"#e8e6e1",fontSize:"14px",outline:"none",boxSizing:"border-box"}} />
            </div>
            <div style={{marginBottom:"1.5rem"}}>
              <label style={{display:"block",fontSize:"13px",color:"#9ca3af",marginBottom:"6px"}}>Senha</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={{width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"#e8e6e1",fontSize:"14px",outline:"none",boxSizing:"border-box"}} />
            </div>
            {error && <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"8px",padding:"10px",color:"#f87171",fontSize:"13px",marginBottom:"1rem"}}>{error}</div>}
            <button type="submit" disabled={loading} style={{width:"100%",padding:"11px",background:loading?"rgba(99,102,241,0.5)":"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",borderRadius:"10px",color:"white",fontSize:"14px",fontWeight:500,cursor:loading?"not-allowed":"pointer"}}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}