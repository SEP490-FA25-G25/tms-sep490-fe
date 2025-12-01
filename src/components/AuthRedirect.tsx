import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { getDefaultRouteForUser } from '@/utils/role-routes'

export function AuthRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated && user?.roles) {
    const defaultRoute = getDefaultRouteForUser(user.roles)
    return <Navigate to={defaultRoute} replace />
  }

  return <Navigate to="/login" replace />
}
