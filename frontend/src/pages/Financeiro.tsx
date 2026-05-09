import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"

const API = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000"
const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)

const NATUREZA_COLOR: Record<string, { bg: string; color: string }> = {
  receita: { bg: "#f0fdf4", color: "#16a34a" },
  despesa: { bg: "#fef2f2", color: "#dc2626" },
  default: { bg: "#f1f5f9", color: "#475569" },
}

export default function Financeiro() {
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"todos" | "receitas" | "despesas">("todos")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`${API}/financeiro/lancamentos?limite=50`, { headers: h }).then(r => r.json()),
      fetch(`${API}/financeiro/resumo-mensal`, { headers: h }).then(r => r.json()),
    ]).then(([l, m]) => {
      setDados({ lancamentos: l.lancamentos || [], meses: m.meses || [] })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ color: "#94a3b8", fontSize: 14 }}>Carregando...</div>
    </div>
  )

  const mes = dados?.meses?.[0]
  const saldo = (mes?.entradas || 0) - (mes?.saidas || 0)
  const lancamentos = (dados?.lancamentos || []).filter((l: any) =>
    tab === "todos" ? true : tab === "receitas" ? l.valor >= 0 : l.valor < 0
  )

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Financeiro</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Controle de lançamentos e resumo mensal</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Entradas", value: fmt(mes?.entradas || 0), icon: TrendingUp, color: "#10b981", bg: "#f0fdf4" },
          { label: "Saídas", value: fmt(mes?.saidas || 0), icon: TrendingDown, color: "#f43f5e", bg: "#fef2f2" },
          { label: "Resultado", value: fmt(saldo), icon: Calendar, color: saldo >= 0 ? "#6366f1" : "#f43f5e", bg: saldo >= 0 ? "#eef2ff" : "#fef2f2" },
        ].map(card => (
          <div key={card.label} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <card.icon size={20} color={card.color} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{card.label} · {mes?.mes || "—"}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly summary mini-cards */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {dados?.meses?.slice(0, 6).map((m: any) => (
          <div key={m.mes} style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", minWidth: 140, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>{m.mes}</div>
            <div style={{ fontSize: 12, color: "#10b981", marginBottom: 3 }}>↑ {fmt(m.entradas)}</div>
            <div style={{ fontSize: 12, color: "#f43f5e" }}>↓ {fmt(m.saidas)}</div>
          </div>
        ))}
      </div>

      {/* Transactions table */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Lançamentos</div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["todos", "receitas", "despesas"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "5px 12px", fontSize: 12, borderRadius: 6, border: "1px solid", borderColor: tab === t ? "#6366f1" : "#e2e8f0", background: tab === t ? "#eef2ff" : "#fff", color: tab === t ? "#6366f1" : "#64748b", cursor: "pointer", fontWeight: tab === t ? 600 : 400, textTransform: "capitalize" }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Descrição", "Data", "Categoria", "Tipo", "Valor"].map(h => (
                <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l: any, i: number) => {
              const nat = NATUREZA_COLOR[l.natureza?.toLowerCase()] || NATUREZA_COLOR.default
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "11px 20px", fontSize: 13, color: "#1e293b", fontWeight: 500, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.descricao}</td>
                  <td style={{ padding: "11px 20px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{l.data_competencia}</td>
                  <td style={{ padding: "11px 20px" }}>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#f1f5f9", color: "#475569", fontWeight: 500 }}>{l.categoria || "—"}</span>
                  </td>
                  <td style={{ padding: "11px 20px" }}>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: nat.bg, color: nat.color, fontWeight: 600 }}>{l.natureza || "—"}</span>
                  </td>
                  <td style={{ padding: "11px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {l.valor >= 0 ? <TrendingUp size={13} color="#10b981" /> : <TrendingDown size={13} color="#f43f5e" />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: l.valor >= 0 ? "#10b981" : "#f43f5e" }}>{fmt(l.valor)}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {lancamentos.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Nenhum lançamento encontrado</div>
        )}
      </div>
    </div>
  )
}
