import { useState, useEffect } from "react"
const API = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000"
export default function Leituras() {
  const [leituras,setLeituras]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    const token=localStorage.getItem("token")
    fetch(`${API}/leituras?limite=50`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{setLeituras(d.leituras||[]);setLoading(false)}).catch(()=>setLoading(false))
  },[])
  if(loading)return <div style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>Carregando...</div>
  return (
    <div>
      <h2 style={{margin:"0 0 4px",fontSize:15,fontWeight:500,color:"#e8e6e1"}}>Leituras Biblicas</h2>
      <p style={{margin:"0 0 16px",fontSize:12,color:"rgba(255,255,255,0.4)"}}>{leituras.length} registros</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {leituras.map((l:any,i:number)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div style={{fontSize:13,fontWeight:500,color:"#e8e6e1"}}>{l.livro} — {l.referencia}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginLeft:10,flexShrink:0}}>{l.data_leitura}</div>
            </div>
            {l.frase_reflexiva&&<div style={{fontSize:12,color:"rgba(255,255,255,0.6)",lineHeight:1.5,borderLeft:"2px solid rgba(99,102,241,0.4)",paddingLeft:10,fontStyle:"italic"}}>"{l.frase_reflexiva}"</div>}
          </div>
        ))}
      </div>
    </div>
  )
}