import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { LoadingState } from '../components/ui/States'
import type { AppRole } from '../types/auth'

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode
  roles?: AppRole[]
}) {
  const { user, profile, isLoading, isConfigured } = useAuth()
  const location = useLocation()
  if (isLoading)
    return (
      <div className="min-h-screen p-6">
        <LoadingState />
      </div>
    )
  if (!isConfigured) return <Navigate to="/login" replace />
  if (!user || !profile)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(profile.role))
    return <Navigate to="/clients" replace />
  return <>{children}</>
}
