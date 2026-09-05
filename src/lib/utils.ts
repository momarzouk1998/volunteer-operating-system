import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toISOString().split('T')[0];
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return `${d.toISOString().split('T')[0]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
    case 'نشط':
      return { label: 'نشط', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    case 'INACTIVE':
    case 'غير نشط':
      return { label: 'غير نشط', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
    case 'DISTINGUISHED':
    case 'متميز':
      return { label: 'متميز', bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' };
    case 'DISCONTINUED':
    case 'منقطع':
      return { label: 'منقطع', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
    case 'EXCLUDED':
    case 'مستبعد':
      return { label: 'مستبعد', bg: 'bg-gray-100 text-gray-700 border-gray-300', dot: 'bg-gray-500' };
    default:
      return { label: status || 'جديد', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
  }
}

export function getRankBadge(points: number, level?: string | null) {
  if (points >= 3000 || level?.includes('مدير') || level?.includes('محافظة')) {
    return { title: 'سفير العطاء القيادي', badgeBg: 'bg-amber-500 text-white', icon: 'Crown' };
  }
  if (points >= 1500 || level?.includes('قائد')) {
    return { title: 'قائد ميداني متميز', badgeBg: 'bg-purple-600 text-white', icon: 'ShieldCheck' };
  }
  if (points >= 700 || level?.includes('متميز')) {
    return { title: 'متطوع ماسي مبادر', badgeBg: 'bg-sky-600 text-white', icon: 'Award' };
  }
  if (points >= 300 || level?.includes('ملتزم')) {
    return { title: 'متطوع ذهبي ملتزم', badgeBg: 'bg-emerald-600 text-white', icon: 'Star' };
  }
  return { title: 'عضو واعد', badgeBg: 'bg-blue-600 text-white', icon: 'Heart' };
}
