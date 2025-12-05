import { useSelector } from 'react-redux'
import { selectUserRoles, selectHasRole, selectHasAnyRole, selectHasAllRoles } from '@/store'
import type { RootState } from '@/store'
import { ROLES, ROLE_BASED_ROUTES, getRolePriority, ROLE_PRIORITIES } from '@/types/roles'
import type { Role } from '@/types/roles'

// Re-export for backward compatibility
export { ROLES, ROLE_BASED_ROUTES, getRolePriority, ROLE_PRIORITIES }
export type { Role }

// Custom hooks for role-based access control
export function useRoles() {
  return useSelector(selectUserRoles)
}

export function useHasRole(requiredRole: Role) {
  return useSelector((state: RootState) => selectHasRole(state, requiredRole))
}

export function useHasAnyRole(requiredRoles: Role[]) {
  return useSelector((state: RootState) => selectHasAnyRole(state, requiredRoles))
}

export function useHasAllRoles(requiredRoles: Role[]) {
  return useSelector((state: RootState) => selectHasAllRoles(state, requiredRoles))
}

// Utility hooks for specific roles
export function useIsAdmin() {
  return useHasRole(ROLES.ADMIN)
}

export function useIsManager() {
  return useHasRole(ROLES.MANAGER)
}

export function useIsTeacher() {
  return useHasRole(ROLES.TEACHER)
}

export function useIsStudent() {
  return useHasRole(ROLES.STUDENT)
}

export function useIsCenterHead() {
  return useHasRole(ROLES.CENTER_HEAD)
}

export function useIsSubjectLeader() {
  return useHasRole(ROLES.SUBJECT_LEADER)
}

export function useIsAcademicAffair() {
  return useHasRole(ROLES.ACADEMIC_AFFAIR)
}

export function useIsQA() {
  return useHasRole(ROLES.QA)
}

// Hook to check if user can access specific routes
export function useCanAccessRoute(route: string) {
  const userRoles = useRoles()

  return Object.entries(ROLE_BASED_ROUTES).some(([role, routes]) => {
    return userRoles.includes(role as Role) &&
           routes.some(r => route.startsWith(r))
  })
}

// Hook to get accessible routes for current user
export function useAccessibleRoutes() {
  const userRoles = useRoles()
  const accessibleRoutes: string[] = []

  Object.entries(ROLE_BASED_ROUTES).forEach(([role, routes]) => {
    if (userRoles.includes(role as Role)) {
      accessibleRoutes.push(...routes)
    }
  })

  // Remove duplicates and return
  return [...new Set(accessibleRoutes)]
}

// Hook to get the highest priority role of current user
export function useHighestRole(): Role | null {
  const userRoles = useRoles()

  if (userRoles.length === 0) return null

  const result = userRoles.reduce((highest: string | null, current: string) =>
    !highest || getRolePriority(current as Role) > getRolePriority(highest as Role) ? current : highest
  )

  return result as Role | null
}