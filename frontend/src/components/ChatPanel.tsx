import { useState, useRef, useEffect } from "react"
const API = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000"
interface Msg { role:"user"|"assistant"; content:string }
export default function ChatPanel({ onClose }: { onClose:()=>void }) {
  const [msgs, setMsgs] = useState<Msg[]>([{role:"assistant",content:"Ola! Sou o Claude. Posso ajudar com financeiro, obras, leituras ou qualquer dado do TutorIA."}])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}) },[msgs])
  async function send() {
    if(!input.trim()||loading) return
    const txt = input.trim(); setInput(""); setMsgs(m=>[...m,{role:"user",content:txt}]); setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API}/chat`,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},body:JSON.stringify({mensagem:txt,historico:msgs.slice(-6)})})
      const data = await res.json()
      setMsgs(m=>[...m,{role:"assistant",content:data.resposta||"Erro na resposta."}])
    } catch { setMsgs(m=>[...m,{role:"assistant",content:"Erro de conexao."}]) }
    setLoading(false)
  }
  return (
    <div style={{width:320,borderLeft:"0.5px solid rgba(255,255,255,0.08)",display:"flex",flexDirection:"column",background:"rgba(255,255,255,0.02)",flexShrink:0}}>
      <div style={{padding:"11px 14px",borderBottom:"0.5px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontSize:13,fontWeight:500,color:"#e8e6e1"}}>Chat Claude</div><div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>TutorIA V24</div></div>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:15}}>x</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:8}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"88%",padding:"7px 10px",borderRadius:10,background:m.role==="user"?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.05)",border:"0.5px solid rgba(255,255,255,0.07)",fontSize:13,color:"#e8e6e1",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{m.content}</div>
          </div>
        ))}
        {loading&&<div style={{color:"rgba(255,255,255,0.35)",fontSize:12,textAlign:"center"}}>digitando...</div>}
        <div ref={endRef}/>
      </div>
      <div style={{padding:"8px 10px",borderTop:"0.5px solid rgba(255,255,255,0.06)",display:"flex",gap:8}}>
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Pergunte algo..." rows={2} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"0.5px solid rgba(255,255,255,0.1)",borderRadius:7,color:"#e8e6e1",fontSize:13,padding:"6px 9px",resize:"none",outline:"none",fontFamily:"sans-serif"}}/>
        <button onClick={send} disabled={loading} style={{padding:"0 12px",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",borderRadius:7,color:"#fff",cursor:"pointer",fontSize:15}}>-></button>
      </div>
    </div>
  )
}