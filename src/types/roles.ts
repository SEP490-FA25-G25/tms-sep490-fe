/**
 * Role definitions for the TMS system
 * This file is the single source of truth for role constants
 * All other modules should import from here
 */

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

// Role priority - higher number = higher priority
export const ROLE_PRIORITIES: Record<Role, number> = {
  [ROLES.ADMIN]: 8,
  [ROLES.MANAGER]: 7,
  [ROLES.CENTER_HEAD]: 6,
  [ROLES.SUBJECT_LEADER]: 5,
  [ROLES.ACADEMIC_AFFAIR]: 4,
  [ROLES.QA]: 3,
  [ROLES.TEACHER]: 2,
  [ROLES.STUDENT]: 1,
}

/**
 * Helper function to get role priority
 */
export function getRolePriority(role: Role): number {
  return ROLE_PRIORITIES[role] || 0
}
