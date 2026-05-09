import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
const NAV = [
  { path:"/", icon:"#", label:"Dashboard" },
  { path:"/financeiro", icon:"$", label:"Financeiro" },
  { path:"/obras", icon:"H", label:"Obras" },
  { path:"/leituras", icon:"B", label:"Leituras" },
  { path:"/clientes", icon:"C", label:"Clientes", disabled:true },
  { path:"/engenharia", icon:"E", label:"Engenharia", disabled:true },
  { path:"/diario", icon:"D", label:"Diario", disabled:true },
  { path:"/radar", icon:"R", label:"Radar", disabled:true },
]
export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const [col, setCol] = useState(false)
  function handleLogout() { logout(); navigate("/login") }
  return (
    <div style={{display:"flex",height:"100vh",background:"#0f1117",fontFamily:"sans-serif",overflow:"hidden"}}>
      <div style={{width:col?"52px":"210px",background:"rgba(255,255,255,0.03)",borderRight:"0.5px solid rgba(255,255,255,0.08)",display:"flex",flexDirection:"column",transition:"width .2s",flexShrink:0,overflow:"hidden"}}>
        <div style={{padding:"18px 14px 14px",borderBottom:"0.5px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12,flexShrink:0}}>T</div>
          {!col&&<span style={{color:"#e8e6e1",fontWeight:500,fontSize:14}}>TutorIA</span>}
        </div>
        <nav style={{flex:1,padding:"6px 0",overflowY:"auto"}}>
          {NAV.map(item=>{
            const active=loc.pathname===item.path
            return <button key={item.path} disabled={item.disabled} onClick={()=>!item.disabled&&navigate(item.path)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:col?"10px 0":"9px 14px",justifyContent:col?"center":"flex-start",background:active?"rgba(99,102,241,0.15)":"transparent",border:"none",borderLeft:active?"2px solid #6366f1":"2px solid transparent",color:item.disabled?"rgba(255,255,255,0.2)":active?"#a5b4fc":"rgba(255,255,255,0.6)",cursor:item.disabled?"default":"pointer",fontSize:13}}>
              <span style={{fontSize:13,width:16,textAlign:"center",fontWeight:600}}>{item.icon}</span>
              {!col&&<span>{item.label}</span>}
              {!col&&item.disabled&&<span style={{fontSize:10,marginLeft:"auto",opacity:.35}}>breve</span>}
            </button>
          })}
        </nav>
        <div style={{padding:"10px 14px",borderTop:"0.5px solid rgba(255,255,255,0.06)"}}>
          {!col&&<div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email}</div>}
          <button onClick={handleLogout} style={{width:"100%",padding:"5px 8px",background:"rgba(255,255,255,0.05)",border:"0.5px solid rgba(255,255,255,0.1)",borderRadius:6,color:"rgba(255,255,255,0.5)",fontSize:12,cursor:"pointer"}}>{col?"x":"Sair"}</button>
        </div>
        <button onClick={()=>setCol(!col)} style={{padding:"7px",background:"transparent",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:13,borderTop:"0.5px solid rgba(255,255,255,0.06)"}}>{col?">":"<"}</button>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{height:50,background:"rgba(255,255,255,0.02)",borderBottom:"0.5px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",padding:"0 18px",justifyContent:"space-between",flexShrink:0}}>
          <h1 style={{margin:0,fontSize:14,fontWeight:500,color:"#e8e6e1"}}>{NAV.find(n=>n.path===loc.pathname)?.label||"TutorIA"}</h1>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Ola, {user?.nome}</span>
          </div>
        </div>
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto",padding:18}}><Outlet /></div>
        </div>
      </div>
    </div>
  )
}