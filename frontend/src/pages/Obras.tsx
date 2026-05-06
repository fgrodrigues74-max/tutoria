import { useState, useEffect } from "react"
const API = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000"
function fmt(n:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n)}
export default function Obras() {
  const [obras,setObras]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    const token=localStorage.getItem("token")
    fetch(`${API}/obras`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{setObras(d.obras||[]);setLoading(false)}).catch(()=>setLoading(false))
  },[])
  if(loading)return <div style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>Carregando...</div>
  const total=obras.reduce((s,o)=>s+(o.valor_total||0),0)
  return (
    <div>
      <h2 style={{margin:"0 0 4px",fontSize:15,fontWeight:500,color:"#e8e6e1"}}>Obras</h2>
      <p style={{margin:"0 0 16px",fontSize:12,color:"rgba(255,255,255,0.4)"}}>Carteira: {fmt(total)}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
        {obras.map((o:any,i:number)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:13,fontWeight:500,color:"#e8e6e1",marginBottom:4}}>{o.nome}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginBottom:8}}>{o.cidade||"—"}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,padding:"2px 8px",background:"rgba(99,102,241,0.15)",borderRadius:4,color:"#a5b4fc"}}>{o.status||"prospecto"}</span>
              <span style={{fontSize:13,fontWeight:500,color:"#e8e6e1"}}>{fmt(o.valor_total||0)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}