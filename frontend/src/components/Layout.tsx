import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import {
  LayoutDashboard, DollarSign, HardHat, BookOpen, Users,
  Wrench, BookMarked, Radio, Bell, Search, LogOut,
  ChevronRight, Menu, X
} from "lucide-react"

const NAV = [
  {
    group: "Principal",
    items: [
      { path: "/", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/financeiro", icon: DollarSign, label: "Financeiro" },
      { path: "/obras", icon: HardHat, label: "Obras" },
      { path: "/leituras", icon: BookOpen, label: "Leituras" },
    ],
  },
  {
    group: "Em Breve",
    items: [
      { path: "/clientes", icon: Users, label: "Clientes", disabled: true },
      { path: "/engenharia", icon: Wrench, label: "Engenharia", disabled: true },
      { path: "/diario", icon: BookMarked, label: "Diário", disabled: true },
      { path: "/radar", icon: Radio, label: "Radar", disabled: true },
    ],
  },
]

const PAGE_LABEL: Record<string, string> = {
  "/": "Dashboard",
  "/financeiro": "Financeiro",
  "/obras": "Obras",
  "/leituras": "Leituras",
}

const S = {
  sidebar: {
    position: "fixed" as const,
    top: 0, left: 0, bottom: 0,
    width: 220,
    background: "#fff",
    borderRight: "1px solid #e8ecf0",
    display: "flex",
    flexDirection: "column" as const,
    zIndex: 100,
    transition: "transform .25s",
  },
  sidebarCollapsed: {
    width: 64,
  },
  logo: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "20px 18px 16px",
    borderBottom: "1px solid #f0f2f5",
  },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: "linear-gradient(135deg,#6366f1,#818cf8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0,
  },
  logoText: { fontSize: 16, fontWeight: 700, color: "#1e293b", letterSpacing: -0.3 },
  nav: { flex: 1, overflowY: "auto" as const, padding: "10px 0" },
  groupLabel: {
    fontSize: 10, fontWeight: 600, color: "#94a3b8",
    letterSpacing: 1, padding: "12px 18px 4px",
    textTransform: "uppercase" as const,
  },
  navItem: (active: boolean, disabled: boolean, collapsed: boolean) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: collapsed ? "10px 0" : "9px 18px",
    justifyContent: collapsed ? "center" : "flex-start",
    background: active ? "#eef2ff" : "transparent",
    border: "none",
    borderLeft: active ? "3px solid #6366f1" : "3px solid transparent",
    borderRight: "none", borderTop: "none", borderBottom: "none",
    color: disabled ? "#cbd5e1" : active ? "#6366f1" : "#475569",
    cursor: disabled ? "default" : "pointer",
    width: "100%", fontSize: 13, fontWeight: active ? 600 : 400,
    transition: "all .15s",
  }),
  badge: {
    marginLeft: "auto", fontSize: 10, padding: "1px 6px",
    background: "#f1f5f9", borderRadius: 10, color: "#94a3b8",
  },
  header: {
    position: "fixed" as const,
    top: 0, right: 0, left: 220,
    height: 60,
    background: "#fff",
    borderBottom: "1px solid #e8ecf0",
    display: "flex", alignItems: "center",
    padding: "0 24px",
    justifyContent: "space-between",
    zIndex: 90,
    transition: "left .25s",
  },
  breadcrumb: { display: "flex", alignItems: "center", gap: 6, fontSize: 13 },
  search: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#f8fafc", border: "1px solid #e8ecf0",
    borderRadius: 8, padding: "6px 12px",
  },
  searchInput: {
    border: "none", background: "transparent", outline: "none",
    fontSize: 13, color: "#475569", width: 180,
  },
  headerRight: { display: "flex", alignItems: "center", gap: 16 },
  bell: {
    position: "relative" as const,
    width: 36, height: 36, borderRadius: 8,
    background: "#f8fafc", border: "1px solid #e8ecf0",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
  },
  avatar: {
    width: 34, height: 34, borderRadius: 8,
    background: "linear-gradient(135deg,#6366f1,#818cf8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  content: {
    marginLeft: 220, marginTop: 60,
    padding: 24, minHeight: "calc(100vh - 60px)",
    background: "#f0f4f8",
    transition: "margin-left .25s",
  },
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const [col, setCol] = useState(false)
  const [search, setSearch] = useState("")

  function handleLogout() { logout(); navigate("/login") }
  const label = PAGE_LABEL[loc.pathname] || "TutorIA"
  const initials = user?.nome?.split(" ").map((n: string) => n[0]).slice(0, 2).join("") || "U"

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: "100vh", background: "#f0f4f8" }}>
      {/* SIDEBAR */}
      <aside style={{ ...S.sidebar, width: col ? 64 : 220 }}>
        <div style={S.logo}>
          <div style={S.logoIcon}>T</div>
          {!col && <span style={S.logoText}>TutorIA</span>}
          {!col && (
            <button onClick={() => setCol(true)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
              <Menu size={16} />
            </button>
          )}
        </div>

        {col && (
          <button onClick={() => setCol(false)} style={{ margin: "12px auto 4px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X size={16} />
          </button>
        )}

        <nav style={S.nav}>
          {NAV.map(group => (
            <div key={group.group}>
              {!col && <div style={S.groupLabel}>{group.group}</div>}
              {group.items.map(item => {
                const active = loc.pathname === item.path
                const disabled = (item as any).disabled || false
                return (
                  <button
                    key={item.path}
                    disabled={disabled}
                    onClick={() => !disabled && navigate(item.path)}
                    style={S.navItem(active, disabled, col)}
                    title={col ? item.label : undefined}
                  >
                    <item.icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                    {!col && <span>{item.label}</span>}
                    {!col && disabled && <span style={S.badge}>breve</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: col ? "14px 0" : "14px 18px", justifyContent: col ? "center" : "flex-start", background: "none", border: "none", borderTop: "1px solid #f0f2f5", color: "#94a3b8", cursor: "pointer", fontSize: 13, width: "100%" }}
        >
          <LogOut size={15} />
          {!col && <span>Sair</span>}
        </button>
      </aside>

      {/* HEADER */}
      <header style={{ ...S.header, left: col ? 64 : 220 }}>
        <div style={S.breadcrumb}>
          <span style={{ color: "#94a3b8" }}>Home</span>
          <ChevronRight size={14} color="#cbd5e1" />
          <span style={{ color: "#1e293b", fontWeight: 500 }}>{label}</span>
        </div>

        <div style={S.headerRight}>
          <div style={S.search}>
            <Search size={14} color="#94a3b8" />
            <input
              style={S.searchInput}
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={S.bell}>
            <Bell size={16} color="#64748b" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={S.avatar}>{initials}</div>
            {!col && <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", lineHeight: 1.2 }}>{user?.nome?.split(" ")[0]}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{user?.role || "admin"}</div>
            </div>}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main style={{ ...S.content, marginLeft: col ? 64 : 220 }}>
        <Outlet />
      </main>
    </div>
  )
}
