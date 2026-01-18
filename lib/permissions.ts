import { Role } from "@prisma/client";

// Admin roles type - derived from Prisma's Role enum
type AdminRole = Extract<
  Role,
  "ADMIN_GENERAL" | "ADMIN_MODERATE" | "ADMIN_FULL" | "OWNER"
>;

// All dashboard routes as a const tuple for type safety
const DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/events",
  "/dashboard/media",
  "/dashboard/sermons",
  "/dashboard/blogs",
  "/dashboard/users",
  "/dashboard/newsletter",
  "/dashboard/feedback",
  "/dashboard/analytics",
  "/dashboard/settings",
] as const;

type DashboardRoute = (typeof DASHBOARD_ROUTES)[number];

// Role permission groups - each group inherits permissions from lower groups
const PERMISSION_GROUPS = {
  GENERAL: [
    Role.ADMIN_GENERAL,
    Role.ADMIN_MODERATE,
    Role.ADMIN_FULL,
    Role.OWNER,
  ] as const,
  MODERATE: [Role.ADMIN_MODERATE, Role.ADMIN_FULL, Role.OWNER] as const,
  FULL: [Role.ADMIN_FULL, Role.OWNER] as const,
} as const;

// Section permissions - TypeScript will error if you use an invalid route or role
export const SECTION_PERMISSIONS = {
  "/dashboard": PERMISSION_GROUPS.GENERAL, // All admins can access landing page
  "/dashboard/events": PERMISSION_GROUPS.GENERAL,
  "/dashboard/media": PERMISSION_GROUPS.GENERAL,
  "/dashboard/sermons": PERMISSION_GROUPS.MODERATE,
  "/dashboard/blogs": PERMISSION_GROUPS.MODERATE,
  "/dashboard/users": PERMISSION_GROUPS.FULL,
  "/dashboard/newsletter": PERMISSION_GROUPS.FULL,
  "/dashboard/feedback": PERMISSION_GROUPS.FULL,
  "/dashboard/analytics": PERMISSION_GROUPS.FULL,
  "/dashboard/settings": PERMISSION_GROUPS.FULL,
} as const satisfies Record<DashboardRoute, readonly Role[]>;

// Type-safe permission check
export function hasPermission(role: Role, pathname: string): boolean {
  // Find matching route (exact or parent path)
  const matchedRoute = (Object.keys(SECTION_PERMISSIONS) as DashboardRoute[])
    .filter((route) => pathname === route || pathname.startsWith(route + "/"))
    .sort((a, b) => b.length - a.length)[0];

  if (!matchedRoute) return false;

  return (SECTION_PERMISSIONS[matchedRoute] as readonly Role[]).includes(role);
}

// Get all accessible routes for a role (for Sidebar filtering)
export function getAccessibleRoutes(role: Role): DashboardRoute[] {
  return (
    Object.entries(SECTION_PERMISSIONS) as [DashboardRoute, readonly Role[]][]
  )
    .filter(([_, roles]) => roles.includes(role))
    .map(([route]) => route);
}

// Type guard to check if a role is an admin role
export function isAdminRole(role: Role): role is AdminRole {
  return ["ADMIN_GENERAL", "ADMIN_MODERATE", "ADMIN_FULL", "OWNER"].includes(
    role,
  );
}
