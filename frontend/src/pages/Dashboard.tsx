import { useState, useEffect, useRef } from "react"
const API = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000"
function fmt(n:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n)}
const MODS_DEFAULT = [
  {id:"financeiro",titulo:"Financeiro",icon:"$",cor:"#6366f1",w:2,h:2,x:0,y:0},
  {id:"obras",titulo:"Obras",icon:"H",cor:"#10b981",w:2,h:2,x:2,y:0},
  {id:"leituras",titulo:"Leituras",icon:"B",cor:"#f59e0b",w:2,h:2,x:0,y:2},
  {id:"clientes",titulo:"Clientes",icon:"C",cor:"#8b5cf6",w:2,h:2,x:2,y:2},
]
const CELL=160,GAP=12
export default function Dashboard() {
  const [mods,setMods]=useState(MODS_DEFAULT)
  const [dados,setDados]=useState<any>({})
  const [dragging,setDragging]=useState<string|null>(null)
  const [dragOff,setDragOff]=useState({x:0,y:0})
  const [dragPos,setDragPos]=useState({x:0,y:0})
  const [resizing,setResizing]=useState<string|null>(null)
  const [resStart,setResStart]=useState({x:0,y:0,w:0,h:0})
  const board=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const token=localStorage.getItem("token")
    fetch(`${API}/dashboard/resumo`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(setDados).catch(()=>{})
  },[])
  function startDrag(id:string,e:React.MouseEvent){
    e.preventDefault()
    if(!board.current)return
    const rect=board.current.getBoundingClientRect()
    const mod=mods.find(m=>m.id===id)!
    setDragging(id)
    setDragOff({x:e.clientX-rect.left-mod.x*(CELL+GAP),y:e.clientY-rect.top-mod.y*(CELL+GAP)})
    setDragPos({x:mod.x*(CELL+GAP),y:mod.y*(CELL+GAP)})
  }
  function startResize(id:string,e:React.MouseEvent){
    e.stopPropagation()
    const mod=mods.find(m=>m.id===id)!
    setResizing(id)
    setResStart({x:e.clientX,y:e.clientY,w:mod.w,h:mod.h})
  }
  useEffect(()=>{
    function move(e:MouseEvent){
      if(!board.current)return
      const rect=board.current.getBoundingClientRect()
      if(dragging)setDragPos({x:e.clientX-rect.left-dragOff.x,y:e.clientY-rect.top-dragOff.y})
      if(resizing){
        const dx=e.clientX-resStart.x,dy=e.clientY-resStart.y
        const nw=Math.max(1,Math.min(4,Math.round((resStart.w*(CELL+GAP)+dx)/(CELL+GAP))))
        const nh=Math.max(1,Math.min(4,Math.round((resStart.h*(CELL+GAP)+dy)/(CELL+GAP))))
        setMods(p=>p.map(m=>m.id===resizing?{...m,w:nw,h:nh}:m))
      }
    }
    function up(e:MouseEvent){
      if(dragging&&board.current){
        const rect=board.current.getBoundingClientRect()
        const nx=Math.max(0,Math.round((e.clientX-rect.left-dragOff.x)/(CELL+GAP)))
        const ny=Math.max(0,Math.round((e.clientY-rect.top-dragOff.y)/(CELL+GAP)))
        setMods(p=>p.map(m=>m.id===dragging?{...m,x:nx,y:ny}:m))
      }
      setDragging(null);setResizing(null)
    }
    window.addEventListener("mousemove",move);window.addEventListener("mouseup",up)
    return()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up)}
  },[dragging,resizing,dragOff,resStart])
  const maxY=Math.max(...mods.map(m=>m.y+m.h))
  const maxX=Math.max(...mods.map(m=>m.x+m.w))
  return (
    <div>
      <div style={{marginBottom:14}}>
        <h2 style={{margin:0,fontSize:15,fontWeight:500,color:"#e8e6e1"}}>Dashboard</h2>
        <p style={{margin:"3px 0 0",fontSize:11,color:"rgba(255,255,255,0.35)"}}>Arraste os cards para reposicionar. Arraste o canto inferior direito para redimensionar.</p>
      </div>
      <div ref={board} style={{position:"relative",width:Math.max(maxX*(CELL+GAP),600),height:Math.max(maxY*(CELL+GAP)+20,500)}}>
        {mods.map(mod=>{
          const drag=dragging===mod.id
          return (
            <div key={mod.id}
              onMouseDown={e=>startDrag(mod.id,e)}
              style={{position:"absolute",left:drag?dragPos.x:mod.x*(CELL+GAP),top:drag?dragPos.y:mod.y*(CELL+GAP),width:mod.w*CELL+(mod.w-1)*GAP,height:mod.h*CELL+(mod.h-1)*GAP,background:drag?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.04)",border:`0.5px solid ${drag?mod.cor:"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:"12px 14px",cursor:drag?"grabbing":"grab",transition:drag?"none":"left .15s,top .15s",userSelect:"none",overflow:"hidden",zIndex:drag?100:1,boxShadow:drag?`0 8px 32px rgba(0,0,0,0.4),0 0 0 1px ${mod.cor}40`:""}}
            >
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:`${mod.cor}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:mod.cor}}>{mod.icon}</div>
                  <span style={{fontSize:13,fontWeight:500,color:"#e8e6e1"}}>{mod.titulo}</span>
                </div>
                <div onMouseDown={e=>startResize(mod.id,e)} style={{width:16,height:16,cursor:"se-resize",color:"rgba(255,255,255,0.2)",fontSize:12,display:"flex",alignItems:"flex-end",justifyContent:"flex-end",userSelect:"none"}}>◪</div>
              </div>
              {mod.id==="financeiro"&&(dados.financeiro?(
                <div>
                  <div style={{fontSize:20,fontWeight:600,color:"#e8e6e1",marginBottom:4}}>{fmt(dados.financeiro.saldo)}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:8}}>{dados.financeiro.total_lancamentos} lancamentos</div>
                  {dados.financeiro.ultimos?.slice(0,3).map((l:any,i:number)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:3}}>
                      <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"72%"}}>{l.descricao?.slice(0,28)}</span>
                      <span style={{color:l.valor<0?"#f87171":"#4ade80",flexShrink:0,marginLeft:4}}>{Number(l.valor)>0?"+":""}{Number(l.valor).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              ):<div style={{color:"rgba(255,255,255,0.3)",fontSize:12}}>Carregando...</div>)}
              {mod.id==="obras"&&(dados.obras?(
                <div>
                  <div style={{fontSize:20,fontWeight:600,color:"#e8e6e1",marginBottom:4}}>{dados.obras.total} obras</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:4}}>{fmt(dados.obras.valor_total)}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>carteira total</div>
                </div>
              ):<div style={{color:"rgba(255,255,255,0.3)",fontSize:12}}>Carregando...</div>)}
              {mod.id==="leituras"&&(dados.leituras?(
                <div>
                  <div style={{fontSize:20,fontWeight:600,color:"#e8e6e1",marginBottom:4}}>{dados.leituras.total} leituras</div>
                  {dados.leituras.ultimas?.slice(0,1).map((l:any,i:number)=>(
                    <div key={i} style={{marginTop:6,padding:"6px 8px",background:"rgba(255,255,255,0.04)",borderRadius:6}}>
                      <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",fontWeight:500}}>{l.livro} — {l.referencia}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2,lineHeight:1.4}}>{l.frase_reflexiva?.slice(0,80)}...</div>
                    </div>
                  ))}
                </div>
              ):<div style={{color:"rgba(255,255,255,0.3)",fontSize:12}}>Carregando...</div>)}
              {mod.id==="clientes"&&(
                <div>
                  <div style={{fontSize:20,fontWeight:600,color:"#e8e6e1",marginBottom:4}}>{dados.clientes?.total||19} clientes</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Em desenvolvimento</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}