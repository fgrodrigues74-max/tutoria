// ============================================================
// TutorIA Web V24 — src/pages/Login.tsx
// ============================================================

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as any)?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await login(email, senha)
      navigate(redirectTo, { replace: true })
    } catch (err: any) {
      setErro(err.message || 'Email ou senha incorretos')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Painel esquerdo */}
      <div style={styles.left}>
        <div style={styles.circles}>
          {[300, 200, 120].map((s, i) => (
            <div key={i} style={{ ...styles.circle, width: s, height: s }} />
          ))}
        </div>
        <div style={styles.leftContent}>
          <div style={styles.brand}>
            <h1 style={styles.brandName}>TutorIA</h1>
            <p style={styles.brandTag}>Sistema de Gestão Inteligente · V24</p>
          </div>
          <div style={styles.features}>
            {[
              { icon: '⊞', title: '21 módulos integrados', desc: 'Financeiro, obras, clientes e mais' },
              { icon: '⊛', title: 'Acesso por perfil',     desc: 'Permissões por módulo e usuário' },
              { icon: '⊕', title: 'WhatsApp + Gmail + Trello', desc: 'Integrações externas nativas' },
            ].map((f, i) => (
              <div key={i} style={styles.feature}>
                <div style={styles.featIcon}><span style={{ fontSize: 16 }}>{f.icon}</span></div>
                <div>
                  <div style={styles.featTitle}>{f.title}</div>
                  <div style={styles.featDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.companies}>
          {['Puro Design', 'Digiovanni', 'Villa Cascais'].map(c => (
            <span key={c} style={styles.coTag}>{c}</span>
          ))}
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div style={styles.right}>
        <form style={styles.form} onSubmit={handleSubmit}>
          <h2 style={styles.formTitle}>Bem-vindo de volta</h2>
          <p style={styles.formSub}>Entre com suas credenciais de acesso</p>

          {erro && (
            <div style={styles.erroBox}>
              <span style={{ fontSize: 14 }}>⚠</span> {erro}
            </div>
          )}

          <label style={styles.label}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            style={styles.input}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <label style={styles.label}>Senha</label>
            <a style={styles.forgot} href="#" onClick={e => e.preventDefault()}>Esqueci a senha</a>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              style={{ ...styles.input, paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(v => !v)}
              style={styles.eyeBtn}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarSenha ? '🙈' : '👁'}
            </button>
          </div>

          <button type="submit" disabled={carregando} style={styles.submitBtn}>
            {carregando ? 'Entrando...' : 'Entrar no sistema'}
          </button>

          <div style={styles.divider}>
            <div style={styles.divLine} />
            <span style={styles.divText}>ou acesse via</span>
            <div style={styles.divLine} />
          </div>

          <button type="button" style={styles.waBtn}>
            📱 Acesso via WhatsApp
          </button>

          <div style={styles.note}>
            <span style={{ fontSize: 12 }}>ℹ</span>
            <span style={styles.noteText}>
              O acesso é restrito. Módulos disponíveis dependem do perfil configurado pelo administrador.
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Estilos inline (sem dependência de CSS externo) ──────────
const styles: Record<string, React.CSSProperties> = {
  page:        { display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' },
  left:        { width: '42%', background: '#1E3A5F', display: 'flex', flexDirection: 'column',
                 alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden' },
  circles:     { position: 'absolute', inset: 0, pointerEvents: 'none' },
  circle:      { position: 'absolute', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)',
                 top: -60, left: -60 },
  leftContent: { position: 'relative', zIndex: 1, width: '100%' },
  brand:       { marginBottom: 48 },
  brandName:   { fontSize: 36, fontWeight: 500, color: '#fff', margin: 0 },
  brandTag:    { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  features:    { display: 'flex', flexDirection: 'column', gap: 20 },
  feature:     { display: 'flex', alignItems: 'flex-start', gap: 14 },
  featIcon:    { width: 34, height: 34, borderRadius: 8, background: 'rgba(232,135,42,0.2)',
                 display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featTitle:   { fontSize: 13, fontWeight: 500, color: '#fff' },
  featDesc:    { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  companies:   { position: 'absolute', bottom: 28, display: 'flex', gap: 6 },
  coTag:       { background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)',
                 borderRadius: 20, padding: '4px 10px', fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  right:       { flex: 1, background: '#fff', display: 'flex', alignItems: 'center',
                 justifyContent: 'center', padding: 40 },
  form:        { width: '100%', maxWidth: 340 },
  formTitle:   { fontSize: 22, fontWeight: 500, color: '#111', margin: '0 0 4px' },
  formSub:     { fontSize: 14, color: '#666', margin: '0 0 28px' },
  erroBox:     { background: '#FEF0EF', border: '0.5px solid #F09595', borderRadius: 8,
                 padding: '10px 14px', fontSize: 13, color: '#A32D2D', marginBottom: 16,
                 display: 'flex', alignItems: 'center', gap: 8 },
  label:       { display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 },
  input:       { width: '100%', height: 42, border: '0.5px solid #ddd', borderRadius: 8,
                 padding: '0 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                 fontFamily: 'system-ui, sans-serif' },
  eyeBtn:      { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                 background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4 },
  forgot:      { fontSize: 12, color: '#E8872A', textDecoration: 'none' },
  submitBtn:   { width: '100%', height: 44, background: '#1E3A5F', border: 'none', borderRadius: 8,
                 color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 18,
                 fontFamily: 'system-ui, sans-serif' },
  divider:     { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' },
  divLine:     { flex: 1, height: 0.5, background: '#eee' },
  divText:     { fontSize: 11, color: '#aaa' },
  waBtn:       { width: '100%', height: 42, background: '#f9f9f9', border: '0.5px solid #e5e5e5',
                 borderRadius: 8, color: '#555', fontSize: 13, cursor: 'pointer',
                 fontFamily: 'system-ui, sans-serif' },
  note:        { marginTop: 20, background: '#f9f9f9', border: '0.5px solid #eee', borderRadius: 8,
                 padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' },
  noteText:    { fontSize: 11, color: '#888', lineHeight: 1.5 },
}
