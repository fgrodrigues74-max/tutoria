// ============================================================
// TutorIA Web V24 — src/App.tsx
// Roteamento principal com proteção de rotas
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Login from '@/pages/Login'

// Lazy load das páginas (carrega só quando necessário)
import { lazy, Suspense } from 'react'
const Dashboard     = lazy(() => import('@/pages/Dashboard'))
const Financeiro    = lazy(() => import('@/pages/Financeiro'))
const Clientes      = lazy(() => import('@/pages/Clientes'))
const Obras         = lazy(() => import('@/pages/Obras'))
const Biblica       = lazy(() => import('@/pages/Biblica'))
const AdminUsuarios = lazy(() => import('@/pages/admin/Usuarios'))
const SemAcesso     = lazy(() => import('@/pages/SemAcesso'))

function Carregando() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#888' }}>
      Carregando...
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Carregando />}>
          <Routes>
            {/* Pública */}
            <Route path="/login" element={<Login />} />
            <Route path="/sem-acesso" element={<SemAcesso />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protegidas — requer login */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />

            {/* Módulos — requer permissão específica */}
            <Route path="/financeiro/*" element={
              <ProtectedRoute moduloSlug="financeiro-base"><Financeiro /></ProtectedRoute>
            } />
            <Route path="/clientes/*" element={
              <ProtectedRoute moduloSlug="clientes"><Clientes /></ProtectedRoute>
            } />
            <Route path="/obras/*" element={
              <ProtectedRoute moduloSlug="obras"><Obras /></ProtectedRoute>
            } />
            <Route path="/biblica/*" element={
              <ProtectedRoute moduloSlug="biblica"><Biblica /></ProtectedRoute>
            } />

            {/* Admin — requer role admin */}
            <Route path="/admin/usuarios" element={
              <ProtectedRoute apenasAdmin><AdminUsuarios /></ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
