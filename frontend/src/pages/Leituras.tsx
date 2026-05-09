import { useState, useEffect } from "react"
import { BookOpen, Search, Calendar } from "lucide-react"

const API = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000"

export default function Leituras() {
  const [leituras, setLeituras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    fetch(`${API}/leituras?limite=50`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setLeituras(d.leituras || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ color: "#94a3b8", fontSize: 14 }}>Carregando...</div>
    </div>
  )

  const filtered = leituras.filter(l =>
    l.livro?.toLowerCase().includes(search.toLowerCase()) ||
    l.referencia?.toLowerCase().includes(search.toLowerCase()) ||
    l.frase_reflexiva?.toLowerCase().includes(search.toLowerCase())
  )

  const livros = [...new Set(leituras.map(l => l.livro).filter(Boolean))]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Leituras Bíblicas</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{leituras.length} passagens registradas</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total de Leituras", value: leituras.length, icon: BookOpen, color: "#10b981", bg: "#f0fdf4" },
          { label: "Livros Lidos", value: livros.length, icon: BookOpen, color: "#6366f1", bg: "#eef2ff" },
          { label: "Última Leitura", value: leituras[0]?.data_leitura || "—", icon: Calendar, color: "#f59e0b", bg: "#fffbeb" },
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

      {/* List */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Registros</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", background: "#f8fafc" }}>
            <Search size={13} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar passagem..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#475569", width: 160 }} />
          </div>
        </div>

        <div style={{ padding: "8px 0" }}>
          {filtered.map((l: any, i: number) => (
            <div key={i} style={{ padding: "14px 20px", borderBottom: "1px solid #f8fafc", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <BookOpen size={16} color="#6366f1" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{l.livro}</span>
                    <span style={{ fontSize: 13, color: "#6366f1", fontWeight: 500, marginLeft: 6 }}>{l.referencia}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={11} />
                    {l.data_leitura}
                  </span>
                </div>
                {l.frase_reflexiva && (
                  <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6, borderLeft: "3px solid #e0e7ff", paddingLeft: 12, fontStyle: "italic" }}>
                    "{l.frase_reflexiva}"
                  </p>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Nenhuma leitura encontrada</div>
          )}
        </div>
      </div>
    </div>
  )
}
