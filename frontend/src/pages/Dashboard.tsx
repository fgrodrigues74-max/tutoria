import { useState, useEffect } from "react"
import { DollarSign, HardHat, BookOpen, Users, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react"

const API = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000"
const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
const fmtShort = (n: number) => n >= 1000 ? `R$${(n / 1000).toFixed(1)}k` : fmt(n)

const CARDS = [
  { id: "saldo", label: "Saldo Total", icon: DollarSign, color: "#f97316", bg: "#fff7ed" },
  { id: "lancamentos", label: "Lançamentos", icon: TrendingUp, color: "#3b82f6", bg: "#eff6ff" },
  { id: "obras", label: "Obras", icon: HardHat, color: "#f59e0b", bg: "#fffbeb" },
  { id: "leituras", label: "Leituras Bíblicas", icon: BookOpen, color: "#10b981", bg: "#f0fdf4" },
]

// SVG Area Chart
function AreaChart({ meses }: { meses: any[] }) {
  const W = 520, H = 160, PAD = { top: 10, right: 10, bottom: 28, left: 48 }
  if (!meses || meses.length === 0) return <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>Sem dados</div>

  const sorted = [...meses].sort((a, b) => a.mes.localeCompare(b.mes)).slice(-8)
  const maxVal = Math.max(...sorted.map(m => Math.max(m.entradas, m.saidas)), 1)

  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom
  const xStep = cW / Math.max(sorted.length - 1, 1)

  const pts = (key: "entradas" | "saidas") =>
    sorted.map((m, i) => ({
      x: PAD.left + i * xStep,
      y: PAD.top + cH - (m[key] / maxVal) * cH,
    }))

  const polyline = (pts: { x: number; y: number }[]) =>
    pts.map(p => `${p.x},${p.y}`).join(" ")

  const area = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return ""
    const base = PAD.top + cH
    return `M${pts[0].x},${base} ` + pts.map(p => `L${p.x},${p.y}`).join(" ") + ` L${pts[pts.length - 1].x},${base} Z`
  }

  const entPts = pts("entradas")
  const saiPts = pts("saidas")

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="gEnt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gSai" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = PAD.top + cH * t
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#94a3b8">
              {fmtShort(maxVal * (1 - t))}
            </text>
          </g>
        )
      })}

      {/* Areas */}
      <path d={area(entPts)} fill="url(#gEnt)" />
      <path d={area(saiPts)} fill="url(#gSai)" />

      {/* Lines */}
      <polyline points={polyline(entPts)} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={polyline(saiPts)} fill="none" stroke="#f43f5e" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {/* X labels */}
      {sorted.map((m, i) => (
        <text key={i} x={PAD.left + i * xStep} y={H - 4} textAnchor="middle" fontSize={9} fill="#94a3b8">
          {m.mes.slice(5)}
        </text>
      ))}

      {/* Dots */}
      {entPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#6366f1" />)}
      {saiPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#f43f5e" />)}
    </svg>
  )
}

// SVG Bar Chart
function BarChart({ meses }: { meses: any[] }) {
  if (!meses || meses.length === 0) return null
  const last4 = [...meses].sort((a, b) => a.mes.localeCompare(b.mes)).slice(-4)
  const maxVal = Math.max(...last4.map(m => Math.max(m.entradas, m.saidas)), 1)
  const W = 180, H = 140, barW = 16, gap = 8
  const groupW = barW * 2 + gap
  const totalW = last4.length * (groupW + 12)
  const scaleH = (v: number) => (v / maxVal) * (H - 30)

  return (
    <svg width="100%" viewBox={`0 0 ${Math.max(W, totalW + 20)} ${H}`}>
      {last4.map((m, i) => {
        const x = 10 + i * (groupW + 12)
        const hEnt = scaleH(m.entradas)
        const hSai = scaleH(m.saidas)
        return (
          <g key={i}>
            <rect x={x} y={H - 24 - hEnt} width={barW} height={hEnt} rx={3} fill="#6366f1" opacity={0.85} />
            <rect x={x + barW + gap} y={H - 24 - hSai} width={barW} height={hSai} rx={3} fill="#f43f5e" opacity={0.7} />
            <text x={x + barW} y={H - 6} textAnchor="middle" fontSize={8} fill="#94a3b8">{m.mes.slice(5)}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function Dashboard() {
  const [dados, setDados] = useState<any>({})
  const [meses, setMeses] = useState<any[]>([])
  const [periodo, setPeriodo] = useState("8m")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`${API}/dashboard/resumo`, { headers: h }).then(r => r.json()),
      fetch(`${API}/financeiro/resumo-mensal`, { headers: h }).then(r => r.json()),
    ]).then(([d, m]) => {
      setDados(d)
      setMeses(m.meses || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const stats = [
    { ...CARDS[0], value: fmt(dados.financeiro?.saldo || 0), sub: `${dados.financeiro?.total_lancamentos || 0} lançamentos` },
    { ...CARDS[1], value: String(dados.financeiro?.total_lancamentos || 0), sub: "registros no total" },
    { ...CARDS[2], value: `${dados.obras?.total || 0} obras`, sub: fmt(dados.obras?.valor_total || 0) },
    { ...CARDS[3], value: `${dados.leituras?.total || 0}`, sub: "passagens registradas" },
  ]

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ color: "#94a3b8", fontSize: 14 }}>Carregando...</div>
    </div>
  )

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Analytics</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Visão geral do sistema TutorIA</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {stats.map(card => (
          <div key={card.id} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <card.icon size={22} color={card.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: card.color, lineHeight: 1.2 }}>{card.value}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{card.label}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 16, marginBottom: 20 }}>
        {/* Area Chart */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Fluxo Financeiro</div>
              <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#475569" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: "#6366f1" }} />
                  Entradas
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#475569" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: "#f43f5e" }} />
                  Saídas
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {["3m", "6m", "8m"].map(p => (
                <button key={p} onClick={() => setPeriodo(p)} style={{ padding: "4px 10px", fontSize: 11, borderRadius: 6, border: "1px solid", borderColor: periodo === p ? "#6366f1" : "#e2e8f0", background: periodo === p ? "#eef2ff" : "#fff", color: periodo === p ? "#6366f1" : "#94a3b8", cursor: "pointer", fontWeight: periodo === p ? 600 : 400 }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <AreaChart meses={meses.slice(0, periodo === "3m" ? 3 : periodo === "6m" ? 6 : 8)} />
        </div>

        {/* Bar Chart */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>Últimos Meses</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>
            {meses[0] ? `${fmtShort(meses[0].entradas - meses[0].saidas)} resultado` : ""}
          </div>
          <BarChart meses={meses} />
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#6366f1" }} /> Entradas
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#f43f5e" }} /> Saídas
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Últimos Lançamentos</div>
          <button style={{ fontSize: 12, color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>Ver todos →</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Descrição", "Data", "Categoria", "Valor"].map(h => (
                <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(dados.financeiro?.ultimos || []).map((l: any, i: number) => (
              <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={{ padding: "12px 20px", fontSize: 13, color: "#1e293b", fontWeight: 500, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.descricao}</td>
                <td style={{ padding: "12px 20px", fontSize: 12, color: "#64748b" }}>{l.data_competencia}</td>
                <td style={{ padding: "12px 20px" }}>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#f1f5f9", color: "#475569", fontWeight: 500 }}>{l.categoria || "—"}</span>
                </td>
                <td style={{ padding: "12px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {l.valor >= 0
                      ? <ArrowUpRight size={14} color="#10b981" />
                      : <TrendingDown size={14} color="#f43f5e" />}
                    <span style={{ fontSize: 13, fontWeight: 600, color: l.valor >= 0 ? "#10b981" : "#f43f5e" }}>{fmt(l.valor)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
