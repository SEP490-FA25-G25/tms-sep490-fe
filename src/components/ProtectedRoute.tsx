import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useHasAnyRole, useHasAllRoles } from '@/hooks/useRoleBasedAccess'
import type { ReactNode } from 'react'
import type { Role } from '@/hooks/useRoleBasedAccess'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: Role[]
  requireAll?: boolean // If true, user must have ALL specified roles; if false, ANY role is sufficient
  fallbackPath?: string
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requireAll = false,
  fallbackPath = '/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  // Check if user has required roles (if specified)
  const hasAllRequiredRoles = useHasAllRoles(requiredRoles || [])
  const hasAnyRequiredRole = useHasAnyRole(requiredRoles || [])

  const hasRequiredRole = requiredRoles && requiredRoles.length > 0
    ? requireAll
      ? hasAllRequiredRoles
      : hasAnyRequiredRole
    : true

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />
  }

  if (!hasRequiredRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Truy cập bị từ chối</h1>
          <p className="text-gray-600 mb-6">
            Bạn không có quyền truy cập trang này.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Convenience components for common role-based routes
export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['ADMIN']}>
      {children}
    </ProtectedRoute>
  )
}

export function ManagerRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['MANAGER', 'ADMIN']}>
      {children}
    </ProtectedRoute>
  )
}

export function TeacherRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN', 'MANAGER', 'CENTER_HEAD', 'SUBJECT_LEADER']}>
      {children}
    </ProtectedRoute>
  )
}

export function StudentRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['STUDENT']}>
      {children}
    </ProtectedRoute>
  )
}
