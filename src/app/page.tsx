import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  Users,
  UserCheck,
  Award,
  Clock,
  Trophy,
  UserPlus,
  Truck,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const revalidate = 0;

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }
  if (currentUser.role === 'VOLUNTEER') {
    redirect('/profile');
  }

  // 1. الإحصائيات العامة
  const totalVolunteers = await prisma.user.count({
    where: { role: { not: 'SUPER_ADMIN' } },
  });

  const activeVolunteers = await prisma.user.count({
    where: { status: 'ACTIVE' },
  });

  const distinguishedVolunteers = await prisma.user.count({
    where: {
      OR: [
        { level: { contains: 'قائد' } },
        { level: { contains: 'متميز' } },
        { status: 'DISTINGUISHED' },
      ],
    },
  });

  const pendingApps = await prisma.application.count({
    where: { status: { in: ['NEW', 'UNDER_REVIEW', 'INTERVIEW'] } },
  });

  const aggregates = await prisma.user.aggregate({
    _sum: {
      totalHours: true,
      totalPoints: true,
    },
  });

  // 2. أفضل المتطوعين (Top Honor Roll)
  const topVolunteers = await prisma.user.findMany({
    where: { role: { not: 'SUPER_ADMIN' } },
    orderBy: [
      { totalPoints: 'desc' },
      { totalHours: 'desc' },
      { rating: 'desc' },
    ],
    take: 5,
  });

  // 3. القوافل القادمة
  const upcomingConvoys = await prisma.convoy.findMany({
    where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } },
    orderBy: { startDate: 'asc' },
    take: 3,
  });

  // 4. المحافظات الأنشط
  const governorates = await prisma.governorate.findMany({
    take: 6,
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-navy-royal to-navy-deep p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 left-0 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sky-200 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-gold-recognition" />
              <span>الإصدار المؤسسي الموحد 2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              أهلاً بك، {currentUser.name} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
              لوحة التحكم المركزية لمنظومة تشغيل وإدارة المتطوعين، متابعة القوافل الميدانية، واعتماد ساعات العطاء.
            </p>
          </div>

          {/* Quick Action Group */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
            <Link
              href="/volunteers?action=new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-primary font-bold text-xs shadow-md hover:bg-slate-100 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة متطوع</span>
            </Link>
            <Link
              href="/convoys?action=new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all"
            >
              <Truck className="w-4 h-4" />
              <span>إنشاء قافلة</span>
            </Link>
            <Link
              href="/attendance"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 backdrop-blur-sm transition-all"
            >
              <Clock className="w-4 h-4" />
              <span>تسجيل حضور</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Volunteers */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">إجمالي المتطوعين</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{totalVolunteers}</span>
          <span className="text-[11px] text-slate-400 mt-1">مسجلون رسمياً بالمنظومة</span>
        </div>

        {/* Active Volunteers */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">المتطوعون النشطون</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-emerald-600">{activeVolunteers}</span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1">خلال آخر 60 يوماً</span>
        </div>

        {/* Distinguished Leaders */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">الكوادر والقيادات</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-purple-700">{distinguishedVolunteers}</span>
          <span className="text-[11px] text-purple-600 font-semibold mt-1">قادة قوافل وفرق</span>
        </div>

        {/* Total Hours */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">ساعات التطوع</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-900">
            {aggregates._sum.totalHours || 0} <span className="text-xs font-medium text-slate-500">س</span>
          </span>
          <span className="text-[11px] text-slate-400 mt-1">ميداني ومكتبي معتمد</span>
        </div>

        {/* Total Points */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">نقاط العطاء</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-amber-600">
            {(aggregates._sum.totalPoints || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-amber-700 font-semibold mt-1">Gamification Ledger</span>
        </div>

        {/* Pending Applications */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">طلبات جديدة</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-rose-600">{pendingApps}</span>
          <span className="text-[11px] text-rose-700 font-semibold mt-1">بانتظار الفرز والمقابلة</span>
        </div>
      </div>

      {/* Two Column Layout: Convoys & Top Volunteers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Convoys & Field Operations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">القوافل والمهام الميدانية القادمة</h2>
                  <p className="text-xs text-slate-500">متابعة الجاهزية والاحتياج العددي للفرق</p>
                </div>
              </div>
              <Link
                href="/convoys"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>عرض كل القوافل</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingConvoys.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  لا توجد قوافل قادمة حالياً. اضغط على "إنشاء قافلة" لجدولة مهمة جديدة.
                </div>
              ) : (
                upcomingConvoys.map((convoy) => {
                  const dateStr = new Date(convoy.startDate).toLocaleDateString('ar-EG', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  });
                  const shortage = convoy.requiredCount - convoy.confirmedCount;

                  return (
                    <div
                      key={convoy.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                          <Calendar className="w-4 h-4 text-sky-200" />
                          <span className="text-[10px] font-bold mt-0.5">{dateStr}</span>
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {convoy.title}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                              {convoy.type}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {convoy.governorate} - {convoy.location}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span>المشرف: <strong className="text-slate-700">{convoy.supervisor}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                        <div className="text-right sm:text-left">
                          <span className="text-xs text-slate-500 block">الجاهزية</span>
                          <span className="text-xs font-bold text-slate-800">
                            {convoy.confirmedCount} / {convoy.requiredCount} متطوع
                          </span>
                        </div>
                        {shortage > 0 ? (
                          <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-1 border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            عجز {shortage}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            مكتمل
                          </span>
                        )}
                        <Link
                          href={`/convoys/${convoy.id}`}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 shadow-xs transition-colors"
                        >
                          التفاصيل
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Governorates Summary */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-900">🗺️ المحافظات المستهدفة والأكثر نشاطاً</h2>
              <Link href="/reports" className="text-xs font-bold text-primary hover:underline">
                تقرير شامل
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {governorates.map((g) => (
                <div key={g.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center hover:bg-white hover:border-slate-200 transition-colors">
                  <span className="text-xs font-bold text-slate-800 block truncate">{g.name}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">مستهدف {g.targetHours} س</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Top Volunteers Leaderboard */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">لوحة الشرف (Top 5)</h2>
                  <p className="text-xs text-slate-500">أعلى المتطوعين تفاعلاً ونقاطاً</p>
                </div>
              </div>
              <Link href="/leaderboard" className="text-xs font-bold text-primary hover:underline">
                الكل
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {topVolunteers.map((vol, index) => {
                const rankColors = [
                  'bg-amber-400 text-white shadow-amber-300/50',
                  'bg-slate-300 text-slate-800 shadow-slate-200',
                  'bg-amber-700 text-white shadow-amber-600/30',
                  'bg-slate-100 text-slate-700',
                  'bg-slate-100 text-slate-700',
                ];

                return (
                  <Link
                    key={vol.id}
                    href={`/volunteers/${vol.id}`}
                    className="py-3 px-2 rounded-2xl hover:bg-slate-50 flex items-center justify-between gap-2.5 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0',
                          rankColors[index] || 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                          {vol.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {vol.volunteerCode} • {vol.governorate}
                        </span>
                      </div>
                    </div>

                    <div className="text-left flex-shrink-0">
                      <span className="text-xs font-extrabold text-amber-600 block">
                        {vol.totalPoints.toLocaleString()} ن
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {vol.totalHours} ساعة
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
