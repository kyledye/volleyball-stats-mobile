/**
 * Tests for /lib/permissions
 */

import {
  canManageTeams,
  canEnterStats,
  canViewStats,
  isAdmin,
  isCoachOrAbove,
  isStatisticianOrAbove,
  getRoleLevel,
  hasHigherOrEqualRole,
  UserRole,
} from "../../lib/permissions";

describe("canManageTeams", () => {
  it("returns true for ADMIN role", () => {
    expect(canManageTeams("ADMIN")).toBe(true);
  });

  it("returns true for COACH role", () => {
    expect(canManageTeams("COACH")).toBe(true);
  });

  it("returns false for STATISTICIAN role", () => {
    expect(canManageTeams("STATISTICIAN")).toBe(false);
  });

  it("returns false for VIEWER role", () => {
    expect(canManageTeams("VIEWER")).toBe(false);
  });

  it("returns false for unknown role", () => {
    expect(canManageTeams("UNKNOWN")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(canManageTeams("")).toBe(false);
  });

  it("is case sensitive", () => {
    expect(canManageTeams("admin")).toBe(false);
    expect(canManageTeams("Admin")).toBe(false);
    expect(canManageTeams("coach")).toBe(false);
  });
});

describe("canEnterStats", () => {
  it("returns true for ADMIN role", () => {
    expect(canEnterStats("ADMIN")).toBe(true);
  });

  it("returns true for COACH role", () => {
    expect(canEnterStats("COACH")).toBe(true);
  });

  it("returns true for STATISTICIAN role", () => {
    expect(canEnterStats("STATISTICIAN")).toBe(true);
  });

  it("returns false for VIEWER role", () => {
    expect(canEnterStats("VIEWER")).toBe(false);
  });

  it("returns false for unknown role", () => {
    expect(canEnterStats("UNKNOWN")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(canEnterStats("")).toBe(false);
  });

  it("is case sensitive", () => {
    expect(canEnterStats("admin")).toBe(false);
    expect(canEnterStats("statistician")).toBe(false);
  });
});

describe("canViewStats", () => {
  it("returns true for ADMIN role", () => {
    expect(canViewStats("ADMIN")).toBe(true);
  });

  it("returns true for COACH role", () => {
    expect(canViewStats("COACH")).toBe(true);
  });

  it("returns true for STATISTICIAN role", () => {
    expect(canViewStats("STATISTICIAN")).toBe(true);
  });

  it("returns true for VIEWER role", () => {
    expect(canViewStats("VIEWER")).toBe(true);
  });

  it("returns false for unknown role", () => {
    expect(canViewStats("UNKNOWN")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(canViewStats("")).toBe(false);
  });

  it("is case sensitive", () => {
    expect(canViewStats("admin")).toBe(false);
    expect(canViewStats("viewer")).toBe(false);
  });
});

describe("isAdmin", () => {
  it("returns true for ADMIN role", () => {
    expect(isAdmin("ADMIN")).toBe(true);
  });

  it("returns false for COACH role", () => {
    expect(isAdmin("COACH")).toBe(false);
  });

  it("returns false for STATISTICIAN role", () => {
    expect(isAdmin("STATISTICIAN")).toBe(false);
  });

  it("returns false for VIEWER role", () => {
    expect(isAdmin("VIEWER")).toBe(false);
  });

  it("returns false for lowercase admin", () => {
    expect(isAdmin("admin")).toBe(false);
  });
});

describe("isCoachOrAbove", () => {
  it("returns true for ADMIN role", () => {
    expect(isCoachOrAbove("ADMIN")).toBe(true);
  });

  it("returns true for COACH role", () => {
    expect(isCoachOrAbove("COACH")).toBe(true);
  });

  it("returns false for STATISTICIAN role", () => {
    expect(isCoachOrAbove("STATISTICIAN")).toBe(false);
  });

  it("returns false for VIEWER role", () => {
    expect(isCoachOrAbove("VIEWER")).toBe(false);
  });

  it("returns false for unknown role", () => {
    expect(isCoachOrAbove("UNKNOWN")).toBe(false);
  });
});

describe("isStatisticianOrAbove", () => {
  it("returns true for ADMIN role", () => {
    expect(isStatisticianOrAbove("ADMIN")).toBe(true);
  });

  it("returns true for COACH role", () => {
    expect(isStatisticianOrAbove("COACH")).toBe(true);
  });

  it("returns true for STATISTICIAN role", () => {
    expect(isStatisticianOrAbove("STATISTICIAN")).toBe(true);
  });

  it("returns false for VIEWER role", () => {
    expect(isStatisticianOrAbove("VIEWER")).toBe(false);
  });

  it("returns false for unknown role", () => {
    expect(isStatisticianOrAbove("UNKNOWN")).toBe(false);
  });
});

describe("getRoleLevel", () => {
  it("returns 4 for ADMIN", () => {
    expect(getRoleLevel("ADMIN")).toBe(4);
  });

  it("returns 3 for COACH", () => {
    expect(getRoleLevel("COACH")).toBe(3);
  });

  it("returns 2 for STATISTICIAN", () => {
    expect(getRoleLevel("STATISTICIAN")).toBe(2);
  });

  it("returns 1 for VIEWER", () => {
    expect(getRoleLevel("VIEWER")).toBe(1);
  });

  it("returns 0 for unknown role", () => {
    expect(getRoleLevel("UNKNOWN")).toBe(0);
    expect(getRoleLevel("")).toBe(0);
    expect(getRoleLevel("admin")).toBe(0);
  });

  it("maintains proper ordering", () => {
    const admin = getRoleLevel("ADMIN");
    const coach = getRoleLevel("COACH");
    const statistician = getRoleLevel("STATISTICIAN");
    const viewer = getRoleLevel("VIEWER");

    expect(admin).toBeGreaterThan(coach);
    expect(coach).toBeGreaterThan(statistician);
    expect(statistician).toBeGreaterThan(viewer);
  });
});

describe("hasHigherOrEqualRole", () => {
  it("ADMIN has higher or equal role than all roles", () => {
    expect(hasHigherOrEqualRole("ADMIN", "ADMIN")).toBe(true);
    expect(hasHigherOrEqualRole("ADMIN", "COACH")).toBe(true);
    expect(hasHigherOrEqualRole("ADMIN", "STATISTICIAN")).toBe(true);
    expect(hasHigherOrEqualRole("ADMIN", "VIEWER")).toBe(true);
  });

  it("COACH has higher or equal role than COACH and below", () => {
    expect(hasHigherOrEqualRole("COACH", "ADMIN")).toBe(false);
    expect(hasHigherOrEqualRole("COACH", "COACH")).toBe(true);
    expect(hasHigherOrEqualRole("COACH", "STATISTICIAN")).toBe(true);
    expect(hasHigherOrEqualRole("COACH", "VIEWER")).toBe(true);
  });

  it("STATISTICIAN has higher or equal role than STATISTICIAN and below", () => {
    expect(hasHigherOrEqualRole("STATISTICIAN", "ADMIN")).toBe(false);
    expect(hasHigherOrEqualRole("STATISTICIAN", "COACH")).toBe(false);
    expect(hasHigherOrEqualRole("STATISTICIAN", "STATISTICIAN")).toBe(true);
    expect(hasHigherOrEqualRole("STATISTICIAN", "VIEWER")).toBe(true);
  });

  it("VIEWER only has higher or equal role than VIEWER", () => {
    expect(hasHigherOrEqualRole("VIEWER", "ADMIN")).toBe(false);
    expect(hasHigherOrEqualRole("VIEWER", "COACH")).toBe(false);
    expect(hasHigherOrEqualRole("VIEWER", "STATISTICIAN")).toBe(false);
    expect(hasHigherOrEqualRole("VIEWER", "VIEWER")).toBe(true);
  });

  it("unknown roles are lower than VIEWER", () => {
    expect(hasHigherOrEqualRole("UNKNOWN", "VIEWER")).toBe(false);
    expect(hasHigherOrEqualRole("", "VIEWER")).toBe(false);
    expect(hasHigherOrEqualRole("VIEWER", "UNKNOWN")).toBe(true);
  });
});

describe("UserRole type", () => {
  it("includes all expected roles", () => {
    const roles: UserRole[] = ["ADMIN", "COACH", "STATISTICIAN", "VIEWER"];
    expect(roles).toHaveLength(4);
  });
});

describe("Role hierarchy integration", () => {
  it("ADMIN can do everything", () => {
    expect(canManageTeams("ADMIN")).toBe(true);
    expect(canEnterStats("ADMIN")).toBe(true);
    expect(canViewStats("ADMIN")).toBe(true);
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isCoachOrAbove("ADMIN")).toBe(true);
    expect(isStatisticianOrAbove("ADMIN")).toBe(true);
  });

  it("COACH can manage teams, enter and view stats", () => {
    expect(canManageTeams("COACH")).toBe(true);
    expect(canEnterStats("COACH")).toBe(true);
    expect(canViewStats("COACH")).toBe(true);
    expect(isAdmin("COACH")).toBe(false);
    expect(isCoachOrAbove("COACH")).toBe(true);
    expect(isStatisticianOrAbove("COACH")).toBe(true);
  });

  it("STATISTICIAN can enter and view stats but not manage teams", () => {
    expect(canManageTeams("STATISTICIAN")).toBe(false);
    expect(canEnterStats("STATISTICIAN")).toBe(true);
    expect(canViewStats("STATISTICIAN")).toBe(true);
    expect(isAdmin("STATISTICIAN")).toBe(false);
    expect(isCoachOrAbove("STATISTICIAN")).toBe(false);
    expect(isStatisticianOrAbove("STATISTICIAN")).toBe(true);
  });

  it("VIEWER can only view stats", () => {
    expect(canManageTeams("VIEWER")).toBe(false);
    expect(canEnterStats("VIEWER")).toBe(false);
    expect(canViewStats("VIEWER")).toBe(true);
    expect(isAdmin("VIEWER")).toBe(false);
    expect(isCoachOrAbove("VIEWER")).toBe(false);
    expect(isStatisticianOrAbove("VIEWER")).toBe(false);
  });
});
