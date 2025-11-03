import { useSelector } from 'react-redux'
import { selectUserRoles, selectHasRole, selectHasAnyRole, selectHasAllRoles } from '@/store'
import type { RootState } from '@/store'

// Available roles in the system
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CENTER_HEAD: 'CENTER_HEAD',
  SUBJECT_LEADER: 'SUBJECT_LEADER',
  ACADEMIC_AFFAIR: 'ACADEMIC_AFFAIR',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  QA: 'QA',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

// Role-based routing configuration
export const ROLE_BASED_ROUTES = {
  [ROLES.ADMIN]: ['/admin', '/users', '/centers'],
  [ROLES.MANAGER]: ['/manager', '/courses/approve'],
  [ROLES.CENTER_HEAD]: ['/center', '/classes/approve'],
  [ROLES.SUBJECT_LEADER]: ['/subject', '/courses/manage'],
  [ROLES.ACADEMIC_AFFAIR]: ['/academic', '/students'],
  [ROLES.TEACHER]: ['/teacher', '/my-classes', '/assignments'],
  [ROLES.STUDENT]: ['/student', '/my-courses', '/grades'],
  [ROLES.QA]: ['/qa', '/reports', '/audits'],
} as const

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

// Helper function to check if a role has higher priority
export function getRolePriority(role: Role): number {
  const roleHierarchy = {
    [ROLES.ADMIN]: 8,
    [ROLES.MANAGER]: 7,
    [ROLES.CENTER_HEAD]: 6,
    [ROLES.SUBJECT_LEADER]: 5,
    [ROLES.ACADEMIC_AFFAIR]: 4,
    [ROLES.QA]: 3,
    [ROLES.TEACHER]: 2,
    [ROLES.STUDENT]: 1,
  }
  return roleHierarchy[role] || 0
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