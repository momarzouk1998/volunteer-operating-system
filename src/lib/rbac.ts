// ============================================================================
//  RBAC — تعريف الأدوار والصلاحيات (مشترك بين الـ middleware والـ API والواجهة)
// ============================================================================

export type Role =
  | 'SUPER_ADMIN'
  | 'VOLUNTEER_MANAGER'
  | 'GOVERNORATE_LEAD'
  | 'TEAM_LEADER'
  | 'VOLUNTEER';

export const ALL_ADMIN_ROLES: Role[] = [
  'SUPER_ADMIN',
  'VOLUNTEER_MANAGER',
  'GOVERNORATE_LEAD',
  'TEAM_LEADER',
];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'المدير العام',
  VOLUNTEER_MANAGER: 'مدير إدارة المتطوعين',
  GOVERNORATE_LEAD: 'مسؤول المحافظة',
  TEAM_LEADER: 'قائد فريق / قافلة',
  VOLUNTEER: 'متطوع',
};

export function isAdminRole(role?: string | null): boolean {
  return !!role && role !== 'VOLUNTEER';
}

// المحافظة تقيّد بياناتها فقط لهذين الدورين
export function isScopedRole(role?: string | null): boolean {
  return role === 'GOVERNORATE_LEAD' || role === 'TEAM_LEADER';
}

// ----------------------------------------------------------------------------
//  صلاحيات صفحات لوحة الإدارة (تُفحص في src/middleware.ts)
//  المفتاح = بادئة المسار، القيمة = الأدوار المسموح لها
// ----------------------------------------------------------------------------
export const PAGE_ACCESS: { prefix: string; roles: Role[] }[] = [
  { prefix: '/volunteers', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER'] },
  { prefix: '/applications', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER'] },
  { prefix: '/attendance', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER'] },
  { prefix: '/convoys', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER'] },
  { prefix: '/retention', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD'] },
  { prefix: '/training', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER'] },
  { prefix: '/certificates', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER'] },
  { prefix: '/reports', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD'] },
  { prefix: '/audit-logs', roles: ['SUPER_ADMIN'] },
  { prefix: '/settings', roles: ['SUPER_ADMIN'] },
  { prefix: '/permissions', roles: ['SUPER_ADMIN'] },
];

// مصفوفة الصلاحيات المعروضة في صفحة الصلاحيات (مرجعية للعرض فقط)
export const PERMISSION_MATRIX: { feature: string; roles: Role[] }[] = [
  { feature: 'لوحة المؤشرات والتقارير', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER'] },
  { feature: 'عرض سجلات المتطوعين', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER'] },
  { feature: 'تعديل بيانات متطوع', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD'] },
  { feature: 'استبعاد / حذف متطوع', roles: ['SUPER_ADMIN'] },
  { feature: 'مراجعة واعتماد طلبات التطوع', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER'] },
  { feature: 'إنشاء وتعديل القوافل', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER'] },
  { feature: 'اعتماد الحضور والساعات', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER'] },
  { feature: 'تقييم أداء المتطوعين', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER'] },
  { feature: 'إصدار / سحب الشهادات', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER'] },
  { feature: 'مركز استعادة المتطوعين', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD'] },
  { feature: 'إدارة التدريب والتأهيل', roles: ['SUPER_ADMIN', 'VOLUNTEER_MANAGER'] },
  { feature: 'سجل الرقابة والتدقيق', roles: ['SUPER_ADMIN'] },
  { feature: 'إعدادات المنظومة وقواعد النقاط', roles: ['SUPER_ADMIN'] },
  { feature: 'إدارة الأدوار والصلاحيات', roles: ['SUPER_ADMIN'] },
  { feature: 'إدارة المحافظات والفرق والقوائم', roles: ['SUPER_ADMIN'] },
];

// صفحات متاحة لأي مستخدم مسجّل (متطوع أو إداري)
export const SHARED_PATHS = ['/profile', '/leaderboard', '/events', '/notifications'];

// صفحات عامة بلا تسجيل دخول
export const PUBLIC_PATHS = ['/login', '/apply'];

export function pageRolesFor(pathname: string): Role[] | null {
  // الجذر "/" = لوحة مؤشرات الإدارة
  if (pathname === '/') return ALL_ADMIN_ROLES;
  for (const rule of PAGE_ACCESS) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + '/')) {
      return rule.roles;
    }
  }
  return null; // غير مقيّدة (مشتركة)
}

// أول صفحة مناسبة لكل دور بعد تسجيل الدخول
export function landingPathFor(role?: string | null): string {
  if (!role || role === 'VOLUNTEER') return '/profile';
  return '/';
}
