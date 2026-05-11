'use client'
import { useState, useMemo } from 'react'
import Btn from '@/components/Btn'
import { createClient } from '@/lib/supabase'

// ─── Constantes de negócio ───────────────────────────────────────────────────
const COST_ITEMS_DEFAULT = [
  { key:'rt',          label:'RT',                defaultPct:5,   maxPct:10,  color:'#4a90c4' },
  { key:'montagem',    label:'Montagem',           defaultPct:7,   maxPct:7,   color:'#2e9e5a' },
  { key:'comissaoInd', label:'Comissão Indicação', defaultPct:1,   maxPct:2,   color:'#c07820' },
  { key:'comissaoVend',label:'Comissão de Vendas', defaultPct:2,   maxPct:2,   color:'#7040a0' },
  { key:'projetistas', label:'Projetistas',        defaultPct:1.5, maxPct:1.5, color:'#2878b0' },
  { key:'despesasLoja',label:'Despesas Loja',      defaultPct:3,   maxPct:5,   color:'#a08010' },
  { key:'impostos',    label:'Impostos',           defaultPct:4,   maxPct:12,  color:'#389040' },
  { key:'frete',       label:'Frete',              defaultPct:1,   maxPct:3,   color:'#b03060' },
  { key:'fabricacaoEx',label:'Fabricação Extra',   defaultPct:3,   maxPct:10,  color:'#208880' },
  { key:'diversos',    label:'Adm e Marketing',    defaultPct:1,   maxPct:3,   color:'#888888' },
]
const OUTROS_PAD  = COST_ITEMS_DEFAULT.reduce((s,i) => s + i.defaultPct, 0) // 28.5
const LUCRO_IDEAL = 30
const FABRICA_PAD = 100 - OUTROS_PAD - LUCRO_IDEAL  // 41.5
const MULT_PADRAO = parseFloat((100 / FABRICA_PAD).toFixed(4)) // ~2.4096
const TAXAS_CARTAO: Record<number, number> = {
  0:0.99, 1:2.99, 2:3.83, 3:4.48, 4:5.12,
  5:6.39, 6:6.39, 7:7.21, 8:7.83, 9:8.44, 10:9.05, 11:9.65, 12:10.25,
}

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface CustoItem { key:string; label:string; pct:number; maxPct:number; color:string }
interface Parcela   { id:string; descricao:string; valor:string }
interface OrcFormData {
  cliente_id: string
  observacoes: string
  status: 'rascunho'|'aguardando'|'aprovado'|'reprovado'
}

interface Props {
  editando?: any
  clientes: { id:string; nome:string }[]
  onClose: () => void
  onSalvo: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (v:number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 })
const parseCF = (s:string) =>
  parseFloat(s.replace(/\./g,'').replace(',','.')) || 0

const PRIMARY = '#e85020'

export default function OrcamentoCalculador({ editando, clientes, onClose, onSalvo }: Props) {
  const supabase = createClient()

  // ── Form base ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<OrcFormData>({
    cliente_id:  editando?.cliente_id  || '',
    observacoes: editando?.observacoes || '',
    status:      editando?.status      || 'rascunho',
  })

  // ── Calculadora ────────────────────────────────────────────────────────────
  const [cfRaw, setCfRaw]       = useState(editando?.custo_fabrica ? fmt(editando.custo_fabrica) : '')
  const [mult,  setMult]        = useState<number>(editando?.multiplicador  || MULT_PADRAO)
  const [multLocked, setMultLocked] = useState(false)
  const [descPct, setDescPct]   = useState<number>(editando?.desconto_pct  || 0)
  const [descLocked, setDescLocked] = useState(false)

  const [custos, setCustos] = useState<CustoItem[]>(() => {
    if (editando?.custos_config?.length) {
      return editando.custos_config.map((c: any) => ({
        ...COST_ITEMS_DEFAULT.find(d => d.key === c.key)!,
        pct: c.pct,
      }))
    }
    return COST_ITEMS_DEFAULT.map(c => ({ ...c }))
  })
  const [custosAbertos, setCustosAbertos] = useState(false)

  // Formas de pagamento
  const [pagTab, setPagTab] = useState<'parcelas'|'cartao'|'boleto'>('parcelas')
  const [parcelas, setParcelas] = useState<Parcela[]>(() =>
    editando?.pagamento_config?.parcelas || []
  )
  const [cartaoPct,    setCartaoPct]    = useState<number>(editando?.pagamento_config?.cartaoPct    || 0)
  const [cartaoN,      setCartaoN]      = useState<number>(editando?.pagamento_config?.cartaoN      || 1)
  const [cartaoLocked, setCartaoLocked] = useState(false)
  const [boletoPct,    setBoletoPct]    = useState<number>(editando?.pagamento_config?.boletoPct    || 0)
  const [boletoN,      setBoletoN]      = useState<number>(editando?.pagamento_config?.boletoN      || 1)
  const [boletoLocked, setBoletoLocked] = useState(false)

  const [saving, setSaving] = useState(false)

  // ── Cálculos derivados ─────────────────────────────────────────────────────
  const cf          = parseCF(cfRaw)
  const precoVenda  = cf * mult
  const outrosPct   = custos.reduce((s,c) => s + c.pct, 0)
  const fabricaPct  = mult > 0 ? 100 / mult : 0
  const lucroPct    = 100 - fabricaPct - outrosPct
  const descValor   = precoVenda * descPct / 100
  const precoFinal  = precoVenda - descValor

  const taxaCartaoBase  = TAXAS_CARTAO[cartaoN] || 0
  const taxaCartaoValor = precoFinal * (cartaoPct / 100) * (taxaCartaoBase / 100)

  const lucroNominal = precoVenda * lucroPct / 100
  const lucroReal    = lucroNominal - descValor - taxaCartaoValor
  const lucroRealPct = precoVenda > 0 ? (lucroReal / precoVenda) * 100 : 0

  // Validação parcelas
  const totalParcelas  = parcelas.reduce((s,p) => s + (parseFloat(p.valor.replace(',','.')) || 0), 0)
  const totalCartao    = precoFinal * cartaoPct / 100
  const totalBoleto    = precoFinal * boletoPct / 100
  const totalAlocado   = totalParcelas + totalCartao + totalBoleto
  const restante       = precoFinal - totalAlocado

  // Simulador de cenários
  const cenarios = useMemo(() => {
    if (cf <= 0) return null
    const sim = (descP:number, multV:number) => {
      const pv = cf * multV
      const pf = pv * (1 - descP / 100)
      const ln = pv * lucroPct / 100
      const lr = ln - pv * descP / 100
      return { preco: pf, lucro: pv > 0 ? (lr / pv) * 100 : 0 }
    }
    return {
      conservador: sim(0,   mult * 1.05),
      ideal:       sim(descPct, mult),
      agressivo:   sim(15,  mult * 0.95),
    }
  }, [cf, mult, descPct, lucroPct])

  // Cor do lucro
  const lucroColor = lucroRealPct >= 25 ? '#1e8c50'
    : lucroRealPct >= 15 ? '#c07820'
    : lucroRealPct >= 5  ? '#b05a10'
    : '#b82020'

  // ── Handlers ───────────────────────────────────────────────────────────────
  function formatCF(raw:string) {
    const digits = raw.replace(/\D/g,'')
    if (!digits) return ''
    const num = parseInt(digits, 10) / 100
    return num.toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 })
  }

  function addParcela() {
    setParcelas(p => [...p, { id: Date.now().toString(), descricao:'', valor:'' }])
  }
  function removeParcela(id:string) {
    setParcelas(p => p.filter(x => x.id !== id))
  }
  function updateParcela(id:string, field:'descricao'|'valor', val:string) {
    setParcelas(p => p.map(x => x.id === id ? { ...x, [field]: val } : x))
  }

  function setCustoPct(key:string, pct:number) {
    setCustos(c => c.map(x => x.key === key ? { ...x, pct } : x))
  }

  function aplicarCenario(c: { preco:number; lucro:number }) {
    if (cf <= 0) return
    const newMult = c.preco / cf / (1 - descPct / 100)
    setMult(parseFloat(newMult.toFixed(4)))
  }

  // ── Salvar ─────────────────────────────────────────────────────────────────
  async function salvar() {
    if (cf <= 0) return
    setSaving(true)
    const payload = {
      cliente_id:      form.cliente_id || null,
      observacoes:     form.observacoes || null,
      status:          form.status,
      valor_total:     precoFinal,
      margem_lucro:    lucroRealPct,
      custo_fabrica:   cf,
      multiplicador:   mult,
      desconto_pct:    descPct,
      preco_venda:     precoVenda,
      preco_final:     precoFinal,
      lucro_real_pct:  lucroRealPct,
      custos_config:   custos.map(c => ({ key:c.key, pct:c.pct })),
      pagamento_config: {
        parcelas,
        cartaoPct,   cartaoN,
        boletoPct,   boletoN,
      },
    }
    if (editando) {
      await supabase.from('orcamentos').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('orcamentos').insert([{ ...payload, numero:'' }])
    }
    setSaving(false)
    onSalvo()
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(26,26,20,.5)', zIndex:1000,
      display:'flex', alignItems:'stretch', justifyContent:'center', backdropFilter:'blur(3px)' }}>
      <div style={{ background:'#f0ebe0', width:'100%', maxWidth:1180, display:'flex',
        flexDirection:'column', overflow:'hidden', margin:'0 auto' }}>

        {/* ── Header ── */}
        <div style={{ background:'#fff', borderBottom:'1px solid #e8e3d8', padding:'16px 28px',
          display:'flex', alignItems:'center', gap:16, flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase',
              color:PRIMARY, marginBottom:4 }}>MÓDULOS · 02 · ORÇAMENTOS</div>
            <div style={{ fontSize:20, fontWeight:700, color:'#1a1a14' }}>
              {editando ? `Editar ${editando.numero}` : 'Novo Orçamento'}
            </div>
          </div>
          <select className="inp" style={{ width:180 }} value={form.status}
            onChange={e => setForm({...form, status: e.target.value as any})}>
            <option value="rascunho">Rascunho</option>
            <option value="aguardando">Aguardando</option>
            <option value="aprovado">Aprovado</option>
            <option value="reprovado">Reprovado</option>
          </select>
          <Btn onClick={salvar} disabled={cf <= 0 || saving}>
            {saving ? 'Salvando...' : editando ? 'Atualizar' : 'Salvar Orçamento'}
          </Btn>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer',
            fontSize:20, color:'#bbb', padding:'0 4px', lineHeight:1 }}>✕</button>
        </div>

        {/* ── Corpo: dois painéis ── */}
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 380px', overflow:'hidden' }}>

          {/* ─── PAINEL ESQUERDO: Inputs ─── */}
          <div style={{ overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:18 }}>

            {/* Cliente + Observações */}
            <div style={{ background:'#fff', border:'1px solid #e8e3d8', borderRadius:12, padding:'18px 20px',
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={lbl}>Cliente</label>
                <select className="inp" value={form.cliente_id}
                  onChange={e => setForm({...form, cliente_id:e.target.value})}>
                  <option value="">— Sem cliente —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={lbl}>Observações</label>
                <input className="inp" placeholder="Notas do orçamento..." value={form.observacoes}
                  onChange={e => setForm({...form, observacoes:e.target.value})} />
              </div>
            </div>

            {/* Custo de Fábrica */}
            <div style={{ background:'#fff', border:'1px solid #e8e3d8', borderRadius:12, padding:'18px 20px' }}>
              <label style={lbl}>Custo de Fábrica</label>
              <div style={{ display:'flex', alignItems:'baseline', gap:8,
                borderBottom:'2.5px solid #1a1a14', paddingBottom:8, marginTop:6 }}>
                <span style={{ fontSize:22, color:'#bbb', fontWeight:300 }}>R$</span>
                <input type="text" inputMode="numeric" placeholder="0,00"
                  value={cfRaw} onChange={e => setCfRaw(formatCF(e.target.value))}
                  style={{ border:'none', outline:'none', background:'transparent',
                    fontFamily:"'DM Sans',sans-serif", fontSize:40, fontWeight:700,
                    color:'#111', width:'100%', letterSpacing:'-.02em' }} />
              </div>
              {cf > 0 && (
                <div style={{ fontSize:12, color:'#aaa', marginTop:6 }}>
                  Fábrica = {(100/mult).toFixed(1)}% do preço de venda
                </div>
              )}
            </div>

            {/* Multiplicador + Desconto */}
            <div style={{ background:'#fff', border:'1px solid #e8e3d8', borderRadius:12, padding:'18px 20px',
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
              {/* Multiplicador */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <label style={lbl}>Multiplicador de Venda</label>
                  <button onClick={() => setMultLocked(l => !l)}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, opacity:multLocked?1:.4 }}>
                    {multLocked ? '🔒' : '🔓'}
                  </button>
                  <span style={{ fontSize:18, fontWeight:700, color:'#b89030', minWidth:48, textAlign:'right' }}>
                    ×{mult.toFixed(2)}
                  </span>
                </div>
                <input type="range" min="1" max="8" step="0.01" value={mult}
                  disabled={multLocked}
                  onChange={e => setMult(parseFloat(e.target.value))}
                  style={{ width:'100%', accentColor:'#b89030' }} />
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
                  <span style={{ fontSize:10, color:'#ccc' }}>×1,0</span>
                  <span style={{ fontSize:10, color:'#aaa' }}>padrão ×{MULT_PADRAO.toFixed(2)}</span>
                  <span style={{ fontSize:10, color:'#ccc' }}>×8,0</span>
                </div>
              </div>
              {/* Desconto */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <label style={lbl}>Desconto</label>
                  <button onClick={() => setDescLocked(l => !l)}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, opacity:descLocked?1:.4 }}>
                    {descLocked ? '🔒' : '🔓'}
                  </button>
                  <span style={{ fontSize:18, fontWeight:700, color:'#e07030', minWidth:48, textAlign:'right' }}>
                    {descPct.toFixed(1)}%
                  </span>
                </div>
                <input type="range" min="0" max="30" step="0.5" value={descPct}
                  disabled={descLocked}
                  onChange={e => setDescPct(parseFloat(e.target.value))}
                  style={{ width:'100%', accentColor:'#e07030' }} />
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
                  <span style={{ fontSize:10, color:'#ccc' }}>0%</span>
                  <span style={{ fontSize:10, color:'#ccc' }}>30% máx</span>
                </div>
                {descPct > 0 && precoVenda > 0 && (
                  <div style={{ fontSize:12, fontWeight:600, color:'#e07030', marginTop:4 }}>
                    −R$ {fmt(descValor)}
                  </div>
                )}
              </div>
            </div>

            {/* Custos configuráveis */}
            <div style={{ background:'#fff', border:'1px solid #e8e3d8', borderRadius:12, overflow:'hidden' }}>
              <button onClick={() => setCustosAbertos(o => !o)}
                style={{ width:'100%', padding:'16px 20px', display:'flex', alignItems:'center',
                  justifyContent:'space-between', background:'none', border:'none', cursor:'pointer',
                  fontFamily:"'DM Sans',sans-serif" }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#333' }}>Distribuição de Custos</span>
                  <span style={{ fontSize:11, color:'#aaa' }}>
                    {outrosPct.toFixed(1)}% custos · {lucroPct.toFixed(1)}% lucro
                  </span>
                </div>
                <span style={{ color:'#bbb', fontSize:12 }}>{custosAbertos ? '▲' : '▼'}</span>
              </button>
              {custosAbertos && (
                <div style={{ padding:'0 20px 18px', borderTop:'1px solid #f0ebe8' }}>
                  {custos.map(c => (
                    <div key={c.key} style={{ paddingTop:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:c.color, flexShrink:0 }} />
                        <span style={{ fontSize:12, color:'#555', flex:1 }}>{c.label}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:c.color, minWidth:40, textAlign:'right' }}>
                          {c.pct.toFixed(1)}%
                        </span>
                        {precoVenda > 0 && (
                          <span style={{ fontSize:11, color:'#aaa', minWidth:80, textAlign:'right' }}>
                            R$ {fmt(precoVenda * c.pct / 100)}
                          </span>
                        )}
                      </div>
                      <input type="range" min="0" max={c.maxPct} step="0.1" value={c.pct}
                        onChange={e => setCustoPct(c.key, parseFloat(e.target.value))}
                        style={{ width:'100%', accentColor:c.color, height:4 }} />
                    </div>
                  ))}
                  <button onClick={() => setCustos(COST_ITEMS_DEFAULT.map(c => ({...c})))}
                    style={{ marginTop:14, fontSize:11, color:PRIMARY, background:'none',
                      border:`1px solid ${PRIMARY}`, borderRadius:6, padding:'4px 10px', cursor:'pointer',
                      fontFamily:"'DM Sans',sans-serif" }}>
                    ↺ Restaurar padrões
                  </button>
                </div>
              )}
            </div>

            {/* Formas de Pagamento */}
            <div style={{ background:'#fff', border:'1px solid #e8e3d8', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid #f0ebe8' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#333' }}>Formas de Pagamento</span>
                {precoFinal > 0 && (
                  <span style={{ fontSize:12, color:'#aaa', marginLeft:8 }}>
                    sobre R$ {fmt(precoFinal)}
                  </span>
                )}
              </div>

              {/* Tabs */}
              <div style={{ display:'flex', borderBottom:'1px solid #f0ebe8' }}>
                {(['parcelas','cartao','boleto'] as const).map(t => (
                  <button key={t} onClick={() => setPagTab(t)}
                    style={{ flex:1, padding:'10px 0', border:'none', cursor:'pointer', background:'none',
                      fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                      color: pagTab===t ? PRIMARY : '#aaa',
                      borderBottom: pagTab===t ? `2px solid ${PRIMARY}` : '2px solid transparent' }}>
                    {t==='parcelas' ? '📅 Parcelas' : t==='cartao' ? '💳 Cartão' : '📄 Boleto'}
                  </button>
                ))}
              </div>

              <div style={{ padding:'14px 20px' }}>
                {/* ── Parcelas personalizadas ── */}
                {pagTab === 'parcelas' && (
                  <div>
                    {parcelas.map((p,i) => (
                      <div key={p.id} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                        <span style={{ fontSize:11, color:'#aaa', width:20, flexShrink:0 }}>{i+1}×</span>
                        <input className="inp" placeholder="Descrição (ex: Entrada)" style={{ flex:2 }}
                          value={p.descricao} onChange={e => updateParcela(p.id,'descricao',e.target.value)} />
                        <input className="inp" placeholder="R$ valor" style={{ flex:1 }} inputMode="numeric"
                          value={p.valor} onChange={e => updateParcela(p.id,'valor',formatCF(e.target.value))} />
                        <button onClick={() => removeParcela(p.id)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#ccc', fontSize:16 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={addParcela}
                      style={{ display:'flex', alignItems:'center', gap:6, background:'#f4f4f2',
                        border:'1px solid #e0dbd4', borderRadius:20, padding:'6px 14px',
                        fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:'#555', cursor:'pointer' }}>
                      + Adicionar parcela
                    </button>
                    {parcelas.length > 0 && precoFinal > 0 && (
                      <div style={{ marginTop:10, fontSize:12, color: Math.abs(restante) < 0.01 ? '#1e8c50' : '#c07820' }}>
                        Total alocado: R$ {fmt(totalParcelas)} | Restante: R$ {fmt(restante)}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Cartão ── */}
                {pagTab === 'cartao' && (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <label style={lbl}>% do valor no cartão</label>
                      <button onClick={() => setCartaoLocked(l => !l)}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, opacity:cartaoLocked?1:.4 }}>
                        {cartaoLocked ? '🔒' : '🔓'}
                      </button>
                      <span style={{ fontSize:15, fontWeight:700, color:'#c83030' }}>{cartaoPct}%</span>
                    </div>
                    <input type="range" min="0" max="100" step="1" value={cartaoPct}
                      disabled={cartaoLocked}
                      onChange={e => setCartaoPct(parseInt(e.target.value))}
                      style={{ width:'100%', accentColor:'#c83030', marginBottom:12 }} />
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                        <button key={n} onClick={() => setCartaoN(n)}
                          style={{ padding:'5px 10px', borderRadius:8, border:'1.5px solid',
                            borderColor: cartaoN===n ? '#c83030' : '#e0dbd4',
                            background: cartaoN===n ? '#c83030' : '#fff',
                            color: cartaoN===n ? '#fff' : '#555',
                            fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          {n}×
                        </button>
                      ))}
                    </div>
                    {cartaoPct > 0 && precoFinal > 0 && (
                      <div style={{ marginTop:10, fontSize:12, color:'#c83030', fontWeight:600 }}>
                        R$ {fmt(totalCartao)} em {cartaoN}× · Taxa {TAXAS_CARTAO[cartaoN]}% = −R$ {fmt(taxaCartaoValor)}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Boleto ── */}
                {pagTab === 'boleto' && (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <label style={lbl}>% do valor no boleto</label>
                      <button onClick={() => setBoletoLocked(l => !l)}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, opacity:boletoLocked?1:.4 }}>
                        {boletoLocked ? '🔒' : '🔓'}
                      </button>
                      <span style={{ fontSize:15, fontWeight:700, color:'#388080' }}>{boletoPct}%</span>
                    </div>
                    <input type="range" min="0" max="100" step="1" value={boletoPct}
                      disabled={boletoLocked}
                      onChange={e => setBoletoPct(parseInt(e.target.value))}
                      style={{ width:'100%', accentColor:'#388080', marginBottom:12 }} />
                    <label style={lbl}>Parcelas do boleto</label>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
                      {[1,2,3,4,5,6].map(n => (
                        <button key={n} onClick={() => setBoletoN(n)}
                          style={{ padding:'5px 10px', borderRadius:8, border:'1.5px solid',
                            borderColor: boletoN===n ? '#388080' : '#e0dbd4',
                            background: boletoN===n ? '#388080' : '#fff',
                            color: boletoN===n ? '#fff' : '#555',
                            fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          {n}×
                        </button>
                      ))}
                    </div>
                    {boletoPct > 0 && precoFinal > 0 && (
                      <div style={{ marginTop:10, fontSize:12, color:'#388080', fontWeight:600 }}>
                        R$ {fmt(totalBoleto)} em {boletoN}× · R$ {fmt(totalBoleto / boletoN)}/parcela
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── PAINEL DIREITO: Resultados ─── */}
          <div style={{ background:'#fff', borderLeft:'1px solid #e8e3d8', overflowY:'auto',
            padding:'24px 20px', display:'flex', flexDirection:'column', gap:14 }}>

            {cf <= 0 ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                flexDirection:'column', gap:8, color:'#ccc' }}>
                <div style={{ fontSize:32 }}>💰</div>
                <div style={{ fontSize:13 }}>Informe o custo de fábrica</div>
              </div>
            ) : (<>

              {/* Preço de Venda */}
              <div style={{ background:'#f8fdf9', border:'1.5px solid #d4eddd', borderRadius:12, padding:'16px 18px' }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#aaa', marginBottom:4 }}>
                  ① Preço de Venda
                </div>
                <div style={{ fontSize:34, fontWeight:800, color:'#111', lineHeight:1 }}>
                  R$ {fmt(precoVenda)}
                </div>
                <div style={{ fontSize:11, color:'#aaa', marginTop:4 }}>
                  R$ {fmt(cf)} × {mult.toFixed(2)} = R$ {fmt(precoVenda)}
                </div>
              </div>

              {/* Distribuição visual */}
              <div style={{ border:'1px solid #e8e3d8', borderRadius:12, padding:'14px 16px' }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#aaa', marginBottom:10 }}>
                  Distribuição
                </div>
                <ItemDist label="🏭 Fábrica" pct={fabricaPct} valor={cf} color="#8e9080" />
                {custos.map(c => (
                  <ItemDist key={c.key} label={c.label} pct={c.pct}
                    valor={precoVenda * c.pct / 100} color={c.color} />
                ))}
                <div style={{ borderTop:'1px solid #f0ebe8', marginTop:8, paddingTop:8 }}>
                  <ItemDist label="Lucro" pct={lucroPct}
                    valor={precoVenda * lucroPct / 100} color={lucroPct >= 20 ? '#1e8c50' : lucroPct >= 10 ? '#c07820' : '#b82020'} />
                </div>
              </div>

              {/* Lucro barra */}
              <div style={{ border:'1px solid #e8e3d8', borderRadius:12, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#aaa' }}>
                    Lucro Nominal
                  </span>
                  <span style={{ fontSize:28, fontWeight:800, color:lucroColor }}>
                    {lucroPct.toFixed(1)}%
                  </span>
                </div>
                <div style={{ background:'#efefef', borderRadius:4, height:8, overflow:'hidden', marginBottom:6 }}>
                  <div style={{ height:8, borderRadius:4, background:lucroColor,
                    width:`${Math.max(0,Math.min(100,lucroPct))}%`, transition:'width .4s' }} />
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:lucroColor }}>
                  R$ {fmt(precoVenda * lucroPct / 100)}
                </div>
              </div>

              {/* Simulador de cenários */}
              {cenarios && (
                <div style={{ border:'1px solid #e8e3d8', borderRadius:12, padding:'14px 16px' }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#aaa', marginBottom:10 }}>
                    Simulador de Cenários
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                    {([
                      { key:'conservador', label:'Conservador', data:cenarios.conservador, border:'#e8e3d8', bg:'#fff' },
                      { key:'ideal',       label:'✓ Ideal',     data:cenarios.ideal,       border:'#8e9080', bg:'#f9faf8' },
                      { key:'agressivo',   label:'Agressivo',   data:cenarios.agressivo,   border:'#e8e3d8', bg:'#fff' },
                    ] as const).map(({ key, label, data, border, bg }) => (
                      <button key={key} onClick={() => aplicarCenario(data)}
                        style={{ border:`1.5px solid ${border}`, borderRadius:10, padding:'10px 8px',
                          textAlign:'center', background:bg, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                        <div style={{ fontSize:9, letterSpacing:'.1em', textTransform:'uppercase',
                          color:key==='ideal' ? '#8e9080' : '#aaa', marginBottom:4, fontWeight:700 }}>
                          {label}
                        </div>
                        <div style={{ fontSize:12, fontWeight:700, color:'#111' }}>
                          R$ {fmt(data.preco)}
                        </div>
                        <div style={{ fontSize:10, color:'#555', marginTop:2 }}>
                          Lucro {data.lucro.toFixed(0)}%
                        </div>
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize:10, color:'#ccc', textAlign:'center', marginTop:6 }}>
                    Clique num cenário para aplicar
                  </div>
                </div>
              )}

              {/* Resultado final */}
              <div style={{ border:'1.5px solid #e0dbd4', borderRadius:12, overflow:'hidden' }}>
                <div style={{ background:'#f7f7f7', padding:'10px 16px', borderBottom:'1px solid #ebebeb' }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#1a1a14' }}>Resultado</span>
                </div>
                <div style={{ padding:'0 16px 8px' }}>
                  <ResultRow label="① Preço de Venda" valor={fmt(precoVenda)} color="#111" />
                  {descPct > 0 && (
                    <ResultRow label={`Desconto (${descPct.toFixed(1)}%)`} valor={`−R$ ${fmt(descValor)}`} color="#e07030" />
                  )}
                  <ResultRow label="② Preço Final" valor={`R$ ${fmt(precoFinal)}`} color="#1e8c50" big />
                  {cartaoPct > 0 && taxaCartaoValor > 0 && (
                    <ResultRow label={`Taxa Cartão (${TAXAS_CARTAO[cartaoN]}% sobre ${cartaoPct}%)`}
                      valor={`−R$ ${fmt(taxaCartaoValor)}`} color="#c83030" />
                  )}
                  <div style={{ borderTop:'2px solid #f0ebe8', marginTop:8, paddingTop:10, paddingBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                      <span style={{ fontSize:15, fontWeight:700, color: lucroColor }}>Lucro Real</span>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:17, fontWeight:800, color: lucroColor }}>
                          {lucroRealPct.toFixed(1)}%
                        </div>
                        <div style={{ fontSize:14, fontWeight:700, color: lucroColor }}>
                          R$ {fmt(lucroReal)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function ItemDist({ label, pct, valor, color }: { label:string; pct:number; valor:number; color:string }) {
  return (
    <div style={{ marginBottom:7 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
        <span style={{ fontSize:11, color:'#555' }}>{label}</span>
        <div style={{ display:'flex', gap:10 }}>
          <span style={{ fontSize:11, color:'#bbb', minWidth:36, textAlign:'right' }}>{pct.toFixed(1)}%</span>
          <span style={{ fontSize:11, fontWeight:600, color:'#444', minWidth:80, textAlign:'right' }}>
            R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 })}
          </span>
        </div>
      </div>
      <div style={{ background:'#f0f0f0', borderRadius:3, height:4, overflow:'hidden' }}>
        <div style={{ height:4, borderRadius:3, background:color,
          width:`${Math.max(0, Math.min(100, pct))}%`, transition:'width .3s' }} />
      </div>
    </div>
  )
}

function ResultRow({ label, valor, color, big=false }: { label:string; valor:string; color:string; big?:boolean }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'9px 0', borderBottom:'1px solid #f5f5f5' }}>
      <span style={{ fontSize:big?13:12, fontWeight:big?700:500, color }}>{label}</span>
      <span style={{ fontSize:big?15:13, fontWeight:700, color }}>{valor}</span>
    </div>
  )
}

const lbl: React.CSSProperties = {
  fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#aaa'
}
