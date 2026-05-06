import { useState, useEffect } from "react"
const API = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000"
function fmt(n:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n)}
export default function Financeiro() {
  const [dados,setDados]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    const token=localStorage.getItem("token")
    Promise.all([
      fetch(`${API}/financeiro/lancamentos?limite=20`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()),
      fetch(`${API}/financeiro/resumo-mensal`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()),
    ]).then(([l,m])=>{setDados({lancamentos:l.lancamentos,meses:m.meses});setLoading(false)}).catch(()=>setLoading(false))
  },[])
  if(loading)return <div style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>Carregando...</div>
  return (
    <div>
      <h2 style={{margin:"0 0 16px",fontSize:15,fontWeight:500,color:"#e8e6e1"}}>Financeiro</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10,marginBottom:20}}>
        {dados?.meses?.slice(0,4).map((m:any)=>(
          <div key={m.mes} style={{background:"rgba(255,255,255,0.04)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:6}}>{m.mes}</div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
              <span style={{color:"#4ade80"}}>+{fmt(m.entradas)}</span>
              <span style={{color:"#f87171"}}>-{fmt(m.saidas)}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{background:"rgba(255,255,255,0.03)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:10,overflow:"hidden"}}>
        <div style={{padding:"10px 14px",borderBottom:"0.5px solid rgba(255,255,255,0.06)",fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.6)"}}>Ultimos lancamentos</div>
        {dados?.lancamentos?.map((l:any,i:number)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",borderBottom:"0.5px solid rgba(255,255,255,0.04)"}}>
            <div style={{overflow:"hidden"}}>
              <div style={{fontSize:13,color:"#e8e6e1",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:320}}>{l.descricao}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:1}}>{l.data_competencia} • {l.categoria}</div>
            </div>
            <div style={{fontSize:13,fontWeight:500,color:l.valor<0?"#f87171":"#4ade80",marginLeft:12,flexShrink:0}}>{fmt(l.valor)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}