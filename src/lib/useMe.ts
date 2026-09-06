'use client';

import { useEffect, useState } from 'react';

export interface Me {
  id: string;
  name: string;
  role: string;
  governorate?: string | null;
  volunteerCode?: string | null;
}

/** يجلب المستخدم الحالي (الدور خصوصاً) لإخفاء/إظهار عناصر الواجهة حسب الصلاحية. */
export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.success) setMe(d.volunteer as Me);
      })
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const role = me?.role || '';
  return {
    me,
    loaded,
    role,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isManager: role === 'SUPER_ADMIN' || role === 'VOLUNTEER_MANAGER',
    canManageVolunteers: role === 'SUPER_ADMIN' || role === 'VOLUNTEER_MANAGER' || role === 'GOVERNORATE_LEAD',
  };
}
