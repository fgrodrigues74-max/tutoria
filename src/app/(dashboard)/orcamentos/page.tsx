'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import Btn from '@/components/Btn'
import OrcamentoCalculador from '@/components/OrcamentoCalculador'
import { createClient } from '@/lib/supabase'

interface Orcamento {
  id: string
  numero: string
  cliente_id: string
  clientes?: { nome: string }
  valor_total: number
  preco_final: number
  lucro_real_pct: number
  desconto_pct: number
  status: 'rascunho' | 'aguardando' | 'aprovado' | 'reprovado'
  observacoes?: string
  created_at: string
}

const statusBadge = (s: string) => {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    rascunho:   { label: 'Rascunho',   bg: '#f4f4f2', color: '#888' },
    aguardando: { label: 'Aguardando', bg: '#fef3c7', color: '#92400e' },
    aprovado:   { label: 'Aprovado',   bg: '#dcfce7', color: '#166534' },
    reprovado:  { label: 'Reprovado',  bg: '#fee2e2', color: '#991b1b' },
  }
  const st = map[s] || { label: s, bg: '#f4f4f2', color: '#888' }
  return (
    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase',
      background: st.bg, color: st.color, borderRadius:20, padding:'3px 10px' }}>
      {st.label}
    </span>
  )
}

const lucroColor = (pct: number) =>
  pct >= 25 ? '#1e8c50' : pct >= 15 ? '#c07820' : pct >= 5 ? '#b05a10' : '#b82020'

const fmt = (v: number) =>
  v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [clientes, setClientes]     = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [calculadorAberto, setCalculadorAberto] = useState(false)
  const [editando, setEditando]     = useState<Orcamento | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: orcs }, { data: cls }] = await Promise.all([
      supabase
        .from('orcamentos')
        .select('*, clientes(nome)')
        .order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, nome').order('nome'),
    ])
    setOrcamentos(orcs || [])
    setClientes(cls || [])
    setLoading(false)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este orçamento?')) return
    await supabase.from('orcamentos').delete().eq('id', id)
    fetchAll()
  }

  const filtered = orcamentos.filter(o => {
    const nome = (o.clientes as any)?.nome?.toLowerCase() || ''
    const num  = o.numero?.toLowerCase() || ''
    const q    = search.toLowerCase()
    const matchSearch = nome.includes(q) || num.includes(q)
    const matchStatus = filtroStatus === 'todos' || o.status === filtroStatus
    return matchSearch && matchStatus
  })

  // KPIs rápidos
  const aprovados   = orcamentos.filter(o => o.status === 'aprovado')
  const totalAprov  = aprovados.reduce((s, o) => s + (o.preco_final || o.valor_total || 0), 0)
  const lucroMedio  = aprovados.length
    ? aprovados.reduce((s, o) => s + (o.lucro_real_pct || 0), 0) / aprovados.length
    : 0

  return (
    <>
      <PageHeader
        breadcrumb="MÓDULOS · 02"
        title="Orçamentos"
        subtitle="Calcular, criar e gerenciar propostas comerciais"
        actions={
          <Btn onClick={() => { setEditando(null); setCalculadorAberto(true) }}>
            + Novo Orçamento
          </Btn>
        }
      />

      <div style={{ padding: '28px 36px' }}>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
          {[
            { label:'Total de Orçamentos', val: orcamentos.length, fmt: (v: number) => v.toString() },
            { label:'Aprovados',           val: aprovados.length,  fmt: (v: number) => v.toString() },
            { label:'Volume Aprovado',     val: totalAprov,        fmt: (v: number) => `R$ ${fmt(v)}` },
            { label:'Lucro Médio (aprov.)',val: lucroMedio,        fmt: (v: number) => `${v.toFixed(1)}%` },
          ].map(({ label, val, fmt: f }) => (
            <div key={label} style={{ background:'#fff', border:'1px solid #e8e3d8', borderRadius:10, padding:'16px 18px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#aaa', marginBottom:6 }}>
                {label}
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:'#1a1a14' }}>{f(val)}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200, display:'flex', alignItems:'center', gap:8,
            background:'#fff', border:'1px solid #e0dbd4', borderRadius:8, padding:'9px 13px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input style={{ border:'none', outline:'none', fontFamily:"'DM Sans',sans-serif", fontSize:13,
              background:'transparent', flex:1, color:'#1a1a14' }}
              placeholder="Buscar por cliente ou número..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            style={{ border:'1px solid #e0dbd4', borderRadius:8, padding:'9px 13px', fontSize:13,
              fontFamily:"'DM Sans',sans-serif", background:'#fff', color:'#333', outline:'none' }}>
            <option value="todos">Todos os status</option>
            <option value="rascunho">Rascunho</option>
            <option value="aguardando">Aguardando</option>
            <option value="aprovado">Aprovado</option>
            <option value="reprovado">Reprovado</option>
          </select>
        </div>

        {/* Tabela */}
        <div style={{ background:'#fff', border:'1px solid #e8e3d8', borderRadius:10, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Nº','Cliente','Preço Final','Lucro Real','Desconto','Status',''].map(h => (
                  <th key={h} style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
                    color:'#bbb', padding:'12px 18px', textAlign:'left', borderBottom:'1px solid #f0ebe8',
                    background:'#fdfaf8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:'#aaa' }}>Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding:40, textAlign:'center' }}>
                    <div style={{ fontSize:32, marginBottom:10, opacity:.2 }}>📋</div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#bbb' }}>Nenhum orçamento encontrado</div>
                    <div style={{ fontSize:12, color:'#ccc', marginTop:4 }}>
                      Clique em "+ Novo Orçamento" para começar
                    </div>
                  </td>
                </tr>
              ) : filtered.map(o => {
                const pf  = o.preco_final || o.valor_total || 0
                const lp  = o.lucro_real_pct || 0
                const dp  = o.desconto_pct   || 0
                const cli = (o.clientes as any)?.nome
                return (
                  <tr key={o.id} style={{ borderBottom:'1px solid #f8f4f0' }}>
                    <td style={{ padding:'13px 18px' }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'#e85020', fontFamily:'monospace' }}>
                        {o.numero || '—'}
                      </span>
                    </td>
                    <td style={{ padding:'13px 18px' }}>
                      <div style={{ fontWeight:600, color:'#1a1a14', fontSize:13 }}>
                        {cli || <span style={{ color:'#ccc', fontWeight:400 }}>Sem cliente</span>}
                      </div>
                      {o.observacoes && (
                        <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{o.observacoes}</div>
                      )}
                    </td>
                    <td style={{ padding:'13px 18px' }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'#1a1a14' }}>
                        R$ {fmt(pf)}
                      </span>
                    </td>
                    <td style={{ padding:'13px 18px' }}>
                      <span style={{ fontSize:13, fontWeight:700, color: lucroColor(lp) }}>
                        {lp.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding:'13px 18px' }}>
                      {dp > 0
                        ? <span style={{ fontSize:12, color:'#e07030', fontWeight:600 }}>{dp.toFixed(1)}%</span>
                        : <span style={{ fontSize:12, color:'#ccc' }}>—</span>
                      }
                    </td>
                    <td style={{ padding:'13px 18px' }}>{statusBadge(o.status)}</td>
                    <td style={{ padding:'13px 18px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <Btn variant="outline" size="sm"
                          onClick={() => { setEditando(o); setCalculadorAberto(true) }}>
                          Editar
                        </Btn>
                        <button onClick={() => excluir(o.id)}
                          style={{ background:'none', border:'1px solid #f0dbd4', borderRadius:6,
                            padding:'5px 10px', fontSize:11, color:'#e07070', cursor:'pointer',
                            fontFamily:"'DM Sans',sans-serif" }}>
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div style={{ fontSize:11, color:'#aaa', marginTop:10, textAlign:'right' }}>
            {filtered.length} orçamento{filtered.length !== 1 ? 's' : ''} exibido{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Calculador modal */}
      {calculadorAberto && (
        <OrcamentoCalculador
          editando={editando}
          clientes={clientes}
          onClose={() => { setCalculadorAberto(false); setEditando(null) }}
          onSalvo={() => { setCalculadorAberto(false); setEditando(null); fetchAll() }}
        />
      )}
    </>
  )
}
