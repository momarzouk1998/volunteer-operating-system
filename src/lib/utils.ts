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

export function calcAge(dob: string | Date | null | undefined): number | null {
  if (!dob) return null;
  const d = typeof dob === 'string' ? new Date(dob) : dob;
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

export interface TimelineEvent {
  date: string;
  kind: 'attendance' | 'points' | 'evaluation' | 'certificate' | 'training' | 'retention';
  title: string;
  detail?: string;
}

/** يدمج كل أحداث المتطوع في خط زمني موحّد مرتّب تنازلياً بالتاريخ. */
export function buildTimeline(v: any): TimelineEvent[] {
  const ev: TimelineEvent[] = [];

  (v?.attendances || []).forEach((a: any) => {
    ev.push({
      date: a.date,
      kind: 'attendance',
      title: `مشاركة: ${a.activityName}`,
      detail: `${a.hours} ساعة • ${a.approved ? 'معتمد' : 'قيد الاعتماد'}`,
    });
  });
  (v?.pointsLedger || []).forEach((p: any) => {
    ev.push({
      date: p.createdAt,
      kind: 'points',
      title: p.reason || 'حركة نقاط',
      detail: `${p.points >= 0 ? '+' : ''}${p.points} نقطة`,
    });
  });
  (v?.evaluationsReceived || []).forEach((e: any) => {
    ev.push({
      date: e.evaluationDate || e.createdAt,
      kind: 'evaluation',
      title: `تقييم أداء من ${e.evaluatorName || 'المشرف'}`,
      detail: `المعدل ${e.overallScore}/5`,
    });
  });
  (v?.rewards || []).forEach((r: any) => {
    ev.push({
      date: r.issuedAt,
      kind: 'certificate',
      title: `${r.type}`,
      detail: r.reason,
    });
  });
  (v?.trainingAttendances || []).forEach((t: any) => {
    ev.push({
      date: t.course?.date || t.createdAt,
      kind: 'training',
      title: `تدريب: ${t.course?.title || 'دورة'}`,
      detail: t.passed ? 'اجتاز' : 'لم يجتز',
    });
  });
  (v?.retentionRecords || []).forEach((rr: any) => {
    ev.push({
      date: rr.lastContact || rr.createdAt,
      kind: 'retention',
      title: 'متابعة استعادة',
      detail: rr.contactOutcome || rr.status,
    });
  });

  return ev
    .filter((e) => e.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

export interface AchievementBadge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  earned: boolean;
  earnedAt?: string;
  progressText?: string;
}

/** يحسب الأوسمة والشارات المكتسبة للمتطوع بناء على إنجازاته الفعلية */
export function computeVolunteerBadges(v: any): AchievementBadge[] {
  const hours = Number(v?.totalHours || 0);
  const points = Number(v?.totalPoints || 0);
  const convoys = Number(v?.convoysCount || (v?.attendances?.filter((a: any) => a.convoyId)?.length) || 0);
  const certs = Number(v?.rewards?.length || 0);
  const trainings = Number(v?.trainingAttendances?.filter((t: any) => t.passed)?.length || 0);
  const rating = Number(v?.rating || 5);

  return [
    {
      id: 'first_convoy',
      name: 'فارس القوافل الأول',
      desc: 'المشاركة في أول قافلة ميدانية للجمعية',
      icon: '🚚',
      color: 'from-blue-500 to-sky-600',
      earned: convoys >= 1,
      progressText: `${convoys}/1 قافلة`,
    },
    {
      id: 'convoy_veteran',
      name: 'عميد القوافل (10+)',
      desc: 'المشاركة في 10 قوافل ميدانية بنجاح',
      icon: '🏆',
      color: 'from-amber-500 to-yellow-600',
      earned: convoys >= 10,
      progressText: `${convoys}/10 قوافل`,
    },
    {
      id: 'hours_50',
      name: 'وسام 50 ساعة عطاء',
      desc: 'إتمام 50 ساعة عمل تطوعي معتمدة',
      icon: '⏱️',
      color: 'from-emerald-500 to-teal-600',
      earned: hours >= 50,
      progressText: `${hours}/50 ساعة`,
    },
    {
      id: 'hours_100',
      name: 'درع الـ 100 ساعة الذهبي',
      desc: 'إتمام 100 ساعة عمل تطوعي معتمدة',
      icon: '🎖️',
      color: 'from-amber-600 to-orange-600',
      earned: hours >= 100,
      progressText: `${hours}/100 ساعة`,
    },
    {
      id: 'high_rating',
      name: 'شعلة التميز (5 نجوم)',
      desc: 'الحصول على تقييم مشرفين ممتاز 4.8 فأعلى',
      icon: '⭐',
      color: 'from-purple-500 to-indigo-600',
      earned: rating >= 4.8 && points >= 100,
      progressText: `${rating.toFixed(1)} / 5.0`,
    },
    {
      id: 'trainer_pro',
      name: 'خريج أكاديمية القادة',
      desc: 'اجتياز 2 دورات تدريبية متخصصة',
      icon: '🎓',
      color: 'from-sky-500 to-blue-700',
      earned: trainings >= 2,
      progressText: `${trainings}/2 دورات`,
    },
    {
      id: 'certified_honor',
      name: 'حامل أوسمة الشرف',
      desc: 'الحصول على شهادات تقدير وتكريم رسمي',
      icon: '📜',
      color: 'from-rose-500 to-pink-600',
      earned: certs >= 1,
      progressText: `${certs}/1 شهادات`,
    },
    {
      id: 'legend_points',
      name: 'أسطورة التطوع (1000+ نقطة)',
      desc: 'تجاوز رصيد 1000 نقطة تراكمية في المنظومة',
      icon: '👑',
      color: 'from-amber-400 via-amber-500 to-yellow-500',
      earned: points >= 1000,
      progressText: `${points}/1000 نقطة`,
    },
  ];
}

