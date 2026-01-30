export const ROLES = {
  MINION: "Minion",
  TUTOR: "Tutor",
  HEAD_TUTOR: "Head Tutor",
  SENIOR_TUTOR: "Senior Tutor",
  ADMIN: "Admin",
};

const ROLE_LEVELS = {
  [ROLES.MINION]: 1,
  [ROLES.TUTOR]: 2,
  [ROLES.HEAD_TUTOR]: 3,
  [ROLES.SENIOR_TUTOR]: 4,
  [ROLES.ADMIN]: 5,
};

export const getRoleLevel = (role) => {
  if (!role) return 0;
  return ROLE_LEVELS[role] || 0;
};

export const hasMinimumRole = (userRole, minimumRole) => {
  return getRoleLevel(userRole) >= getRoleLevel(minimumRole);
};

export const isHeadTutorOrAbove = (role) => {
  return hasMinimumRole(role, ROLES.HEAD_TUTOR);
};

export const isSeniorTutorOrAbove = (role) => {
  return hasMinimumRole(role, ROLES.SENIOR_TUTOR);
};

export const isAdmin = (role) => {
  return role === ROLES.ADMIN;
};

export const PERMISSIONS = {
  VIEW_STATS_CARDS: ROLES.HEAD_TUTOR,

  VIEW_BANKING_TAX: ROLES.HEAD_TUTOR,
  VIEW_BLOCKED_STUDENTS: ROLES.SENIOR_TUTOR,

  ACCESS_INVOICES: ROLES.HEAD_TUTOR,
  ACCESS_PAYROLL: ROLES.HEAD_TUTOR,

  ACCESS_INTEGRATIONS: ROLES.HEAD_TUTOR,
  EDIT_PERMISSIONS: ROLES.ADMIN,

  EDIT_SUBJECTS: ROLES.ADMIN,
  EDIT_LOCATIONS: ROLES.ADMIN,
};

export const hasPermission = (userRole, permission) => {
  const requiredRole = PERMISSIONS[permission];
  if (!requiredRole) return true;
  return hasMinimumRole(userRole, requiredRole);
};

export const canViewBankingTax = (userRole, currentUserId, profileTutorId) => {
  if (currentUserId === profileTutorId) return true;
  return isHeadTutorOrAbove(userRole);
};

export const canViewBlockedStudents = (userRole) => {
  return isSeniorTutorOrAbove(userRole);
};

export const canEditSubjects = (userRole) => {
  return isAdmin(userRole);
};

export const canEditLocations = (userRole) => {
  return isAdmin(userRole);
};

export const canEditPermissions = (userRole) => {
  return isAdmin(userRole);
};

export default {
  ROLES,
  PERMISSIONS,
  getRoleLevel,
  hasMinimumRole,
  hasPermission,
  isHeadTutorOrAbove,
  isSeniorTutorOrAbove,
  isAdmin,
  canViewBankingTax,
  canViewBlockedStudents,
  canEditSubjects,
  canEditLocations,
  canEditPermissions,
};
