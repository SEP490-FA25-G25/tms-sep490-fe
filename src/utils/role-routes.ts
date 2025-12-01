import { ROLES } from '@/hooks/useRoleBasedAccess';

/**
 * Default route for each role - first page on sidebar
 */
const roleDefaultRoutes: Record<string, string> = {
  [ROLES.ADMIN]: '/admin/users',
  [ROLES.MANAGER]: '/curriculum',
  [ROLES.CENTER_HEAD]: '/center-head/approvals',
  [ROLES.SUBJECT_LEADER]: '/curriculum',
  [ROLES.TEACHER]: '/teacher/classes',
  [ROLES.STUDENT]: '/student/schedule',
  [ROLES.QA]: '/qa/dashboard',
  [ROLES.ACADEMIC_AFFAIR]: '/academic/classes',
};

/**
 * Role priority - higher number = higher priority
 */
const rolePriorities: Record<string, number> = {
  [ROLES.ADMIN]: 8,
  [ROLES.MANAGER]: 7,
  [ROLES.CENTER_HEAD]: 6,
  [ROLES.SUBJECT_LEADER]: 5,
  [ROLES.ACADEMIC_AFFAIR]: 4,
  [ROLES.QA]: 3,
  [ROLES.TEACHER]: 2,
  [ROLES.STUDENT]: 1,
};

/**
 * Get the highest priority role from a list of roles
 */
export function getHighestPriorityRole(roles: string[]): string | null {
  if (!roles || roles.length === 0) return null;
  
  return roles.reduce((highest, current) =>
    (rolePriorities[current] ?? 0) > (rolePriorities[highest] ?? 0) ? current : highest
  );
}

/**
 * Get default route for a user based on their roles
 */
export function getDefaultRouteForUser(roles: string[]): string {
  const highestRole = getHighestPriorityRole(roles);
  if (!highestRole) return '/login';
  
  return roleDefaultRoutes[highestRole] ?? '/login';
}

/**
 * Get default route for a specific role
 */
export function getDefaultRouteForRole(role: string): string {
  return roleDefaultRoutes[role] ?? '/login';
}

