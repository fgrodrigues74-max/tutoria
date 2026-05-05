import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  function handleLogout() { logout(); navigate("/login") }
  return (
    <div style={{minHeight:"100vh",background:"#0f1117",padding:"2rem",fontFamily:"sans-serif",color:"#e8e6e1"}}>
      <div style={{maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"2rem",paddingBottom:"1rem",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div>
            <h1 style={{fontFamily:"serif",fontSize:"1.8rem",fontWeight:400,color:"#e8e6e1",margin:0}}>TutorIA</h1>
            <p style={{color:"#6b7280",fontSize:"13px",marginTop:"4px",marginBottom:0}}>Ola, {user?.nome}</p>
          </div>
          <button onClick={handleLogout} style={{padding:"8px 16px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",color:"#9ca3af",fontSize:"13px",cursor:"pointer"}}>Sair</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"1rem"}}>
          {[{label:"Lancamentos",value:"2.638",sub:"financeiro"},{label:"Obras",value:"19",sub:"em prospecto"},{label:"Leituras",value:"169",sub:"biblicas"},{label:"Modulos",value:"21",sub:"8 completos"}].map(c=>(
            <div key={c.label} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px",padding:"1.5rem"}}>
              <p style={{fontSize:"12px",color:"#6b7280",textTransform:"uppercase",margin:0}}>{c.label}</p>
              <p style={{fontSize:"2rem",fontWeight:600,color:"#e8e6e1",margin:"6px 0 2px"}}>{c.value}</p>
              <p style={{fontSize:"12px",color:"#4b5563",margin:0}}>{c.sub}</p>
            </div>
          ))}
        </div>
        <div style={{marginTop:"2rem",background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"12px",padding:"1rem",fontSize:"13px",color:"#a5b4fc"}}>Backend conectado · Supabase ok · V24</div>
      </div>
    </div>
  )
}