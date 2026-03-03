// Role-based permission utilities

export type UserRole = "ADMIN" | "COACH" | "STATISTICIAN" | "VIEWER";

/**
 * Check if a role can manage teams (create, edit, delete)
 */
export function canManageTeams(role: string): boolean {
  return ["ADMIN", "COACH"].includes(role);
}

/**
 * Check if a role can enter/record stats
 */
export function canEnterStats(role: string): boolean {
  return ["ADMIN", "COACH", "STATISTICIAN"].includes(role);
}

/**
 * Check if a role can view stats
 */
export function canViewStats(role: string): boolean {
  return ["ADMIN", "COACH", "STATISTICIAN", "VIEWER"].includes(role);
}

/**
 * Check if a role is admin
 */
export function isAdmin(role: string): boolean {
  return role === "ADMIN";
}

/**
 * Check if a role is coach or above (ADMIN, COACH)
 */
export function isCoachOrAbove(role: string): boolean {
  return ["ADMIN", "COACH"].includes(role);
}

/**
 * Check if a role is statistician or above (ADMIN, COACH, STATISTICIAN)
 */
export function isStatisticianOrAbove(role: string): boolean {
  return ["ADMIN", "COACH", "STATISTICIAN"].includes(role);
}

/**
 * Get the role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: string): number {
  switch (role) {
    case "ADMIN":
      return 4;
    case "COACH":
      return 3;
    case "STATISTICIAN":
      return 2;
    case "VIEWER":
      return 1;
    default:
      return 0;
  }
}

/**
 * Check if roleA has higher or equal permissions than roleB
 */
export function hasHigherOrEqualRole(roleA: string, roleB: string): boolean {
  return getRoleLevel(roleA) >= getRoleLevel(roleB);
}
