// ============================================================
// TutorIA Web V24 — src/components/ProtectedRoute.tsx
// Protege rotas por autenticação e permissão de módulo
// ============================================================

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  children: React.ReactNode
  moduloSlug?: string          // se informado, verifica permissão
  nivelMinimo?: 'leitura' | 'escrita' | 'admin'
  apenasAdmin?: boolean
}

export function ProtectedRoute({ children, moduloSlug, nivelMinimo = 'leitura', apenasAdmin }: Props) {
  const { usuario, carregando, temPermissao, isAdmin } = useAuth()
  const location = useLocation()

  if (carregando) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (apenasAdmin && !isAdmin()) {
    return <Navigate to="/sem-acesso" replace />
  }

  if (moduloSlug && !temPermissao(moduloSlug, nivelMinimo)) {
    return <Navigate to="/sem-acesso" replace />
  }

  return <>{children}</>
}
