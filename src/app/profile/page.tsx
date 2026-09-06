'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  User, KeyRound, CheckCircle, Phone, IdCard, MapPin, Clock, Trophy,
  Star, Award, GraduationCap, Printer, TrendingUp, Sparkles, ShieldCheck,
} from 'lucide-react';
import { getStatusBadge, getRankBadge, formatDate, calcAge, buildTimeline } from '@/lib/utils';

const RANKS = [
  { min: 0, title: 'عضو واعد' },
  { min: 300, title: 'متطوع ذهبي ملتزم' },
  { min: 700, title: 'متطوع ماسي مبادر' },
  { min: 1500, title: 'قائد ميداني متميز' },
  { min: 3000, title: 'سفير العطاء القيادي' },
];

type TabKey = 'overview' | 'timeline' | 'attendance' | 'points' | 'evaluations' | 'certificates' | 'training' | 'security';

const TIMELINE_STYLE: Record<string, string> = {
  attendance: 'bg-primary',
  points: 'bg-amber-500',
  evaluation: 'bg-purple-500',
  certificate: 'bg-amber-600',
  training: 'bg-emerald-500',
  retention: 'bg-rose-500',
};

export default function ProfilePage() {
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [tab, setTab] = useState<TabKey>('overview');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/me');
        const json = await res.json();
        if (json.success) {
          setData(json.volunteer);
          setStats(json.stats);
          const code = json.volunteer.volunteerCode || json.volunteer.id;
          const url = `${window.location.origin}/verify/${code}`;
          const qr = await QRCode.toDataURL(url, {
            width: 200,
            margin: 1,
            color: { dark: '#00469b', light: '#ffffff' },
          });
          setQrDataUrl(qr);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'security') setTab('security');
      if (hash === 'pass') setTab('overview');
    }
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassMsg('');
    if (newPassword !== confirmPassword) {
      setPassError('كلمة المرور الجديدة غير متطابقة مع التأكيد');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام');
      return;
    }
    setPassLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل تغيير كلمة المرور');
      setPassMsg('تم تحديث كلمة المرور بنجاح!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-xs">جاري تحميل ملفك الشخصي...</div>;
  }

  if (!data) {
    return <div className="p-12 text-center text-slate-400 text-xs">تعذّر تحميل بياناتك، حاول تسجيل الدخول مجدداً.</div>;
  }

  const v = data;
  const badge = getStatusBadge(v.status);
  const rank = getRankBadge(v.totalPoints, v.level);
  const points = v.totalPoints || 0;

  // تقدّم المتطوع نحو الرتبة التالية
  const currentRankIdx = RANKS.reduce((acc, r, i) => (points >= r.min ? i : acc), 0);
  const nextRank = RANKS[currentRankIdx + 1];
  const rankStart = RANKS[currentRankIdx].min;
  const progressPct = nextRank
    ? Math.min(100, Math.round(((points - rankStart) / (nextRank.min - rankStart)) * 100))
    : 100;

  const timeline = buildTimeline(v);
  const age = calcAge(v.dob);

  const tabs: { key: TabKey; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: 'نظرة عامة', icon: IdCard },
    { key: 'timeline', label: 'الخط الزمني', icon: TrendingUp, count: timeline.length },
    { key: 'attendance', label: 'الحضور والمشاركات', icon: Clock, count: v.attendances?.length || 0 },
    { key: 'points', label: 'سجل النقاط', icon: Trophy, count: v.pointsLedger?.length || 0 },
    { key: 'evaluations', label: 'التقييمات', icon: Star, count: v.evaluationsReceived?.length || 0 },
    { key: 'certificates', label: 'الشهادات', icon: Award, count: v.rewards?.length || 0 },
    { key: 'training', label: 'التدريب', icon: GraduationCap, count: v.trainingAttendances?.length || 0 },
    { key: 'security', label: 'الأمان', icon: KeyRound },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          <span>ملفي الشخصي وهويتي التطوعية</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          تابع تطوّرك، ساعاتك، نقاطك، مشاركاتك وشهاداتك في مكان واحد
        </p>
      </div>

      {/* Identity summary card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-primary to-sky-500 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-md border-2 border-white flex-shrink-0">
              {v.name?.slice(0, 2)}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 truncate">{v.name}</h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                كود العضوية: <strong className="text-primary font-mono">{v.volunteerCode || 'قيد الإصدار'}</strong>
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${rank.badgeBg}`}>👑 {rank.title}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">{v.level || 'متطوع جديد'}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{v.teamName || 'بدون فريق'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <div className="px-1.5">
              <span className="text-[10px] text-slate-400 block font-semibold">ساعات</span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900">{v.totalHours ?? 0}</span>
            </div>
            <div className="px-1.5 border-r border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold">نقاط</span>
              <span className="text-sm sm:text-base font-extrabold text-amber-600">{points.toLocaleString()}</span>
            </div>
            <div className="px-1.5 border-r border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold">قوافل</span>
              <span className="text-sm sm:text-base font-extrabold text-primary">{v.convoysCount ?? 0}</span>
            </div>
            <div className="px-1.5 border-r border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold">تقييم</span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-600">★{(v.rating ?? 5).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Progress to next rank */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
            <span className="text-slate-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              تقدّمك نحو الرتبة التالية
            </span>
            {nextRank ? (
              <span className="text-slate-500">
                {nextRank.title} • باقي <strong className="text-primary">{(nextRank.min - points).toLocaleString()}</strong> نقطة
              </span>
            ) : (
              <span className="text-amber-600">وصلت لأعلى رتبة في المنظومة 🏆</span>
            )}
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mini stat row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'أنشطة شاركت بها', value: stats.activitiesCount, icon: Clock, color: 'text-primary' },
            { label: 'مشاركات معتمدة', value: stats.approvedCount, icon: CheckCircle, color: 'text-emerald-600' },
            { label: 'دورات تدريبية', value: stats.trainingCount, icon: GraduationCap, color: 'text-purple-600' },
            { label: 'شهادات وتكريمات', value: stats.certificatesCount, icon: Award, color: 'text-amber-600' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
                <Icon className={`w-4 h-4 ${s.color}`} />
                <div className="mt-1.5 text-lg font-extrabold text-slate-900">{s.value}</div>
                <div className="text-[10px] text-slate-400 font-semibold">{s.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                active
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}{typeof t.count === 'number' ? ` (${t.count})` : ''}</span>
            </button>
          );
        })}
      </div>

      {/* Overview: digital pass + personal data */}
      {tab === 'overview' && (
        <div id="pass" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-navy-royal to-navy-deep text-white p-5 shadow-2xl border border-primary/40 flex flex-col justify-between min-h-[400px]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400" />
              <div className="flex items-center justify-between pb-4 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md">
                    <img src="/images/logo.png" alt="الشعار" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block leading-tight">جمعية خواطر أحلى شباب</span>
                    <span className="text-[10px] text-sky-200 block">بطاقة عضوية متطوع معتمد</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 my-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-emerald-400 text-slate-900 flex items-center justify-center font-extrabold text-xl shadow-lg border-2 border-white/50 flex-shrink-0">
                  {v.name?.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base text-white truncate">{v.name}</h3>
                  <p className="text-xs text-sky-200 mt-0.5">{v.teamName || 'بدون فريق'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-mono font-bold bg-white/15 px-2 py-0.5 rounded-md">
                      {v.volunteerCode || '—'}
                    </span>
                    <span className="text-[11px] text-slate-300">{v.governorate}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/15 flex items-center gap-3">
                {qrDataUrl && (
                  <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-md flex-shrink-0">
                    <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    رمز الفحص الميداني المعتمد
                  </span>
                  <p className="text-[10px] text-slate-300 mt-0.5 leading-tight">
                    للتحقق الفوري من صلاحية العضوية
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/15 flex items-center justify-between text-[10px] text-slate-300">
                <span>صلاحية العضوية: 2026 - 2027</span>
                <span className="font-bold text-sky-300">منظومة VOS الرقمية</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="mt-3 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors no-print"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة بطاقة الهوية</span>
            </button>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              📋 بياناتي الشخصية والميدانية
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <Field label="الاسم رباعي" value={v.name} />
              <Field label="الرقم القومي" value={v.nationalId} mono />
              <Field label="رقم الهاتف" value={v.phone} mono ltr />
              <Field label="واتساب" value={v.whatsapp || v.phone} mono ltr />
              <Field label="المحافظة والمدينة" value={`${v.governorate || '-'}${v.city ? ' - ' + v.city : ''}`} />
              <Field label="المؤهل والتخصص" value={`${v.qualification || '-'}${v.major ? ' (' + v.major + ')' : ''}`} />
              <Field label="المهنة / جهة العمل" value={v.jobTitle || v.workplace} />
              <Field label="تاريخ الميلاد / السن" value={v.dob ? `${formatDate(v.dob)}${age != null ? ` — ${age} سنة` : ''}` : null} />
              <Field label="العنوان" value={v.address} />
              <Field label="جهة اتصال الطوارئ" value={v.emergencyContact} />
              <Field label="البريد الإلكتروني" value={v.email} ltr />
              <Field label="تاريخ الانضمام" value={formatDate(v.createdAt)} />
              <div className="sm:col-span-2">
                <Field label="المهارات والخبرات" value={v.skills || 'لا توجد مهارات مسجلة'} />
              </div>
              <div className="sm:col-span-2">
                <Field label="المجالات المفضلة" value={v.preferredFields || 'قوافل ميدانية، إغاثة'} />
              </div>
              {v.notes && (
                <div className="sm:col-span-2">
                  <Field label="ملاحظات الإدارة" value={v.notes} />
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
              لتعديل بياناتك الأساسية تواصل مع إدارة المتطوعين.
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      {tab === 'timeline' && (
        <Panel title="الخط الزمني لرحلتي التطوعية">
          {timeline.length === 0 ? (
            <Empty text="لا توجد أحداث مسجلة بعد." />
          ) : (
            <ol className="relative border-r-2 border-slate-100 pr-4 space-y-4">
              {timeline.map((e, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -right-[1.35rem] top-1 w-3 h-3 rounded-full ring-4 ring-white ${TIMELINE_STYLE[e.kind] || 'bg-slate-400'}`}
                  />
                  <div className="text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{e.title}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{formatDate(e.date)}</span>
                    </div>
                    {e.detail && <p className="text-slate-500 text-[11px] mt-0.5">{e.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      )}

      {/* Attendance */}
      {tab === 'attendance' && (
        <Panel title="سجل مشاركاتي وساعات حضوري الميداني">
          {(!v.attendances || v.attendances.length === 0) ? (
            <Empty text="لا توجد سجلات حضور مسجلة بعد." />
          ) : (
            <div className="divide-y divide-slate-100">
              {v.attendances.map((att: any) => (
                <div key={att.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{att.activityName}</h4>
                    <span className="text-slate-400 text-[10px]">
                      {formatDate(att.date)} • {att.governorate || att.convoy?.title || 'المقر'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-slate-800">{att.hours} س</span>
                    <span className="font-bold text-amber-600">+{att.points}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${att.approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {att.approved ? 'معتمد ✓' : 'قيد الاعتماد'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Points */}
      {tab === 'points' && (
        <Panel title="سجل حركات رصيد نقاطي">
          {(!v.pointsLedger || v.pointsLedger.length === 0) ? (
            <Empty text="لا توجد حركات نقاط مسجلة بعد." />
          ) : (
            <div className="divide-y divide-slate-100">
              {v.pointsLedger.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 block truncate">{item.reason}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(item.createdAt)} • {item.type}</span>
                  </div>
                  <span className={`font-extrabold text-sm flex-shrink-0 ${item.points >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {item.points >= 0 ? '+' : ''}{item.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Evaluations */}
      {tab === 'evaluations' && (
        <Panel title="تقييمات أدائي الدورية">
          {(!v.evaluationsReceived || v.evaluationsReceived.length === 0) ? (
            <Empty text="لا توجد تقييمات سابقة." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {v.evaluationsReceived.map((ev: any) => (
                <div key={ev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ev.evaluatorName || 'المشرف'}</span>
                    <span className="font-extrabold text-amber-500">★ {ev.overallScore} / 5</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500 pt-1">
                    <span>الالتزام: {ev.commitmentScore}/5</span>
                    <span>التعاون: {ev.cooperationScore}/5</span>
                    <span>المبادرة: {ev.initiativeScore}/5</span>
                    <span>السلوك: {ev.behaviorScore}/5</span>
                  </div>
                  {ev.notes && <p className="text-slate-600 italic text-[11px] pt-1">"{ev.notes}"</p>}
                  <span className="text-[10px] text-slate-400 block">{formatDate(ev.evaluationDate || ev.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Certificates */}
      {tab === 'certificates' && (
        <Panel title="شهاداتي وأوسمة التكريم">
          {(!v.rewards || v.rewards.length === 0) ? (
            <Empty text="لا توجد شهادات صادرة لك حتى الآن." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {v.rewards.map((reward: any) => (
                <div key={reward.id} className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs truncate">{reward.type}</h4>
                      <p className="text-[10px] text-slate-500 truncate">{reward.reason}</p>
                      <span className="text-[10px] font-mono text-primary font-bold">{reward.code}</span>
                    </div>
                  </div>
                  <Link
                    href={`/verify/${reward.code}`}
                    target="_blank"
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-700 text-xs font-bold hover:bg-amber-100 flex-shrink-0 shadow-xs"
                  >
                    عرض
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Training */}
      {tab === 'training' && (
        <Panel title="دوراتي التدريبية والتأهيلية">
          {(!v.trainingAttendances || v.trainingAttendances.length === 0) ? (
            <Empty text="لم تلتحق بأي دورة تدريبية بعد." />
          ) : (
            <div className="divide-y divide-slate-100">
              {v.trainingAttendances.map((t: any) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{t.course?.title || 'دورة تدريبية'}</h4>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(t.course?.date)} • {t.course?.trainer || 'مدرب معتمد'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {typeof t.score === 'number' && <span className="font-bold text-slate-700">{t.score}%</span>}
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${t.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {t.passed ? 'اجتاز ✓' : 'لم يجتز'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Security */}
      {tab === 'security' && (
        <div id="security" className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 max-w-lg">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <span>تغيير كلمة المرور</span>
          </h3>

          {passMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{passMsg}</span>
            </div>
          )}
          {passError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {passError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">كلمة المرور الحالية</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">كلمة المرور الجديدة *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="•••••••• (6 أحرف أو أرقام على الأقل)"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">تأكيد كلمة المرور الجديدة *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={passLoading}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md shadow-primary/20 transition-all disabled:opacity-50"
              >
                {passLoading ? 'جاري الحفظ...' : 'تحديث كلمة المرور'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono, ltr }: { label: string; value?: string | null; mono?: boolean; ltr?: boolean }) {
  return (
    <div>
      <span className="text-slate-400 block font-semibold">{label}</span>
      <span
        className={`font-bold text-slate-800 ${mono ? 'font-mono' : ''}`}
        dir={ltr ? 'ltr' : undefined}
      >
        {value || 'غير مسجل'}
      </span>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
      <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="p-8 text-center text-slate-400 text-xs">{text}</div>;
}
