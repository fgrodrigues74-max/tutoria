import { useState, useEffect } from "react"
import { HardHat, MapPin, DollarSign, Search } from "lucide-react"

const API = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000"
const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  "em andamento": { bg: "#eff6ff", color: "#3b82f6", dot: "#3b82f6" },
  "concluida":    { bg: "#f0fdf4", color: "#16a34a", dot: "#16a34a" },
  "prospecto":    { bg: "#fefce8", color: "#ca8a04", dot: "#f59e0b" },
  "pausada":      { bg: "#fef2f2", color: "#dc2626", dot: "#f43f5e" },
  "default":      { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
}

function getStatus(status: string) {
  const key = status?.toLowerCase() || "default"
  return STATUS_STYLE[key] || STATUS_STYLE.default
}

export default function Obras() {
  const [obras, setObras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "table">("table")

  useEffect(() => {
    const token = localStorage.getItem("token")
    fetch(`${API}/obras`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setObras(d.obras || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ color: "#94a3b8", fontSize: 14 }}>Carregando...</div>
    </div>
  )

  const total = obras.reduce((s, o) => s + (o.valor_total || 0), 0)
  const filtered = obras.filter(o => o.nome?.toLowerCase().includes(search.toLowerCase()) || o.cidade?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Obras</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Carteira total: {fmt(total)}</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total de Obras", value: obras.length, icon: HardHat, color: "#f59e0b", bg: "#fffbeb" },
          { label: "Em Andamento", value: obras.filter(o => o.status?.toLowerCase() === "em andamento").length, icon: MapPin, color: "#3b82f6", bg: "#eff6ff" },
          { label: "Valor Total", value: fmt(total), icon: DollarSign, color: "#10b981", bg: "#f0fdf4" },
        ].map(card => (
          <div key={card.label} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <card.icon size={20} color={card.color} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{card.value}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Lista de Obras</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", background: "#f8fafc" }}>
              <Search size={13} color="#94a3b8" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar obra..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#475569", width: 150 }} />
            </div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Obra", "Cidade", "Status", "Valor Total"].map(h => (
                <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o: any, i: number) => {
              const st = getStatus(o.status)
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f8fafc", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "13px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <HardHat size={14} color="#f59e0b" />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{o.nome}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 20px", fontSize: 13, color: "#64748b" }}>{o.cidade || "—"}</td>
                  <td style={{ padding: "13px 20px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, padding: "4px 10px", borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot }} />
                      {o.status || "prospecto"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 20px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{fmt(o.valor_total || 0)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Nenhuma obra encontrada</div>
        )}
      </div>
    </div>
  )
}
