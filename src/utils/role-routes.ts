import { ROLES, ROLE_PRIORITIES } from '@/types/roles';
import type { Role } from '@/types/roles';

/**
 * Default route for each role - first page on sidebar
 */
const roleDefaultRoutes: Record<string, string> = {
  [ROLES.ADMIN]: '/admin/dashboard-stats',
  [ROLES.MANAGER]: '/curriculum',
  [ROLES.CENTER_HEAD]: '/center-head/approvals',
  [ROLES.SUBJECT_LEADER]: '/curriculum',
  [ROLES.TEACHER]: '/teacher/classes',
  [ROLES.STUDENT]: '/student/schedule',
  [ROLES.QA]: '/qa/classes',
  [ROLES.ACADEMIC_AFFAIR]: '/academic/classes',
};

/**
 * Get the highest priority role from a list of roles
 */
export function getHighestPriorityRole(roles: string[]): string | null {
  if (!roles || roles.length === 0) return null;

  return roles.reduce((highest, current) =>
    (ROLE_PRIORITIES[current as Role] ?? 0) > (ROLE_PRIORITIES[highest as Role] ?? 0) ? current : highest
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

