'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User, Phone, MapPin, Award, Clock, Trophy, Calendar,
  CheckCircle, Printer, IdCard, Star, ChevronRight, Download, Pencil, Trash2, X, RefreshCw
} from 'lucide-react';
import QRCode from 'qrcode';
import { getStatusBadge, getRankBadge, buildTimeline, calcAge, formatDate, computeVolunteerBadges } from '@/lib/utils';
import { useLists } from '@/lib/useLists';
import { toast, confirmDialog } from '@/lib/ui';

const RANKS = [
  { min: 0, title: 'عضو واعد' },
  { min: 300, title: 'متطوع ذهبي ملتزم' },
  { min: 700, title: 'متطوع ماسي مبادر' },
  { min: 1500, title: 'قائد ميداني متميز' },
  { min: 3000, title: 'سفير العطاء القيادي' },
];

export default function VolunteerDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [volunteer, setVolunteer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const canManage = myRole === 'SUPER_ADMIN' || myRole === 'VOLUNTEER_MANAGER' || myRole === 'GOVERNORATE_LEAD';
  const canCertify = myRole === 'SUPER_ADMIN' || myRole === 'VOLUNTEER_MANAGER';
  const canDelete = myRole === 'SUPER_ADMIN';
  const [activeTab, setActiveTab] = useState<'pass' | 'timeline' | 'attendance' | 'points' | 'evaluations' | 'certificates'>('pass');

  const [evalModal, setEvalModal] = useState(false);
  const [commitment, setCommitment] = useState(5);
  const [cooperation, setCooperation] = useState(5);
  const [initiative, setInitiative] = useState(5);
  const [behavior, setBehavior] = useState(5);
  const [evalNotes, setEvalNotes] = useState('');
  const [evalSaving, setEvalSaving] = useState(false);

  const { lists } = useLists();
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [certModal, setCertModal] = useState(false);
  const [certType, setCertType] = useState('شهادة تقدير وتكريم');
  const [certReason, setCertReason] = useState('التميز والمشاركة الفعالة في قوافل الإغاثة الميدانية');
  const [certPoints, setCertPoints] = useState(100);
  const [certSaving, setCertSaving] = useState(false);

  const fetchVolunteer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/volunteers/${id}`);
      const data = await res.json();
      if (data.success && data.volunteer) {
        setVolunteer(data.volunteer);
        const verifyUrl = `${window.location.origin}/verify/${data.volunteer.volunteerCode || data.volunteer.id}`;
        const qrUrl = await QRCode.toDataURL(verifyUrl, {
          width: 200,
          margin: 1,
          color: { dark: '#00469b', light: '#ffffff' },
        });
        setQrDataUrl(qrUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchVolunteer();
  }, [id]);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => { if (d.success) setMyRole(d.volunteer?.role || ''); })
      .catch(() => {});
  }, []);

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvalSaving(true);
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: volunteer.id,
          commitment,
          cooperation,
          initiative,
          behavior,
          notes: evalNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'فشل تسجيل التقييم');
      toast(data.message || 'تم تسجيل التقييم', 'success');
      setEvalModal(false);
      fetchVolunteer();
    } catch (err: any) {
      toast(err.message || 'حدث خطأ أثناء حفظ التقييم', 'error');
    } finally {
      setEvalSaving(false);
    }
  };

  const openEdit = () => {
    setEditForm({
      name: volunteer.name || '', nationalId: volunteer.nationalId || '', phone: volunteer.phone || '',
      whatsapp: volunteer.whatsapp || '', email: volunteer.email || '', governorate: volunteer.governorate || '',
      city: volunteer.city || '', address: volunteer.address || '', qualification: volunteer.qualification || '',
      major: volunteer.major || '', jobTitle: volunteer.jobTitle || '', skills: volunteer.skills || '',
      preferredFields: volunteer.preferredFields || '', teamName: volunteer.teamName || '', level: volunteer.level || '',
      status: volunteer.status || 'ACTIVE', emergencyContact: volunteer.emergencyContact || '', notes: volunteer.notes || '',
    });
    setEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const res = await fetch(`/api/volunteers/${volunteer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ');
      toast('تم حفظ التعديلات', 'success');
      setEditModal(false);
      fetchVolunteer();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleRecalc = async () => {
    try {
      const res = await fetch(`/api/volunteers/${volunteer.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RECALC' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل');
      toast(data.message, 'success');
      fetchVolunteer();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!(await confirmDialog({ title: `استبعاد المتطوع "${volunteer.name}"`, message: 'سيتحول لحالة "مستبعد" ويفقد صلاحية الدخول.', danger: true, confirmText: 'استبعاد' }))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/volunteers/${volunteer.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الاستبعاد');
      toast('تم استبعاد المتطوع', 'success');
      fetchVolunteer();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCertSaving(true);
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: volunteer.id,
          type: certType,
          reason: certReason,
          points: certPoints,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'فشل إصدار الشهادة');
      toast(data.message || 'تم إصدار الشهادة', 'success');
      setCertModal(false);
      fetchVolunteer();
    } catch (err: any) {
      toast(err.message || 'حدث خطأ أثناء إصدار الشهادة', 'error');
    } finally {
      setCertSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-xs">جاري تحميل الملف الرقمي 360°...</div>;
  }

  if (!volunteer) {
    return <div className="p-12 text-center text-slate-400 text-xs">المتطوع غير موجود.</div>;
  }

  const badge = getStatusBadge(volunteer.status);
  const rank = getRankBadge(volunteer.totalPoints, volunteer.level);
  const points = Number(volunteer.totalPoints || 0);
  const badges = computeVolunteerBadges(volunteer);

  // حساب التقدم نحو الرتبة التالية
  const currentRankIdx = RANKS.reduce((acc, r, i) => (points >= r.min ? i : acc), 0);
  const nextRank = RANKS[currentRankIdx + 1];
  const rankStart = RANKS[currentRankIdx].min;
  const progressPct = nextRank
    ? Math.min(100, Math.round(((points - rankStart) / (nextRank.min - rankStart)) * 100))
    : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/volunteers"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-xs"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{volunteer.name}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
              {volunteer.activity && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${volunteer.activity === 'نشط' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {volunteer.activity === 'نشط' ? 'نشاط: نشط' : 'نشاط: خامل'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              كود العضوية: <strong className="text-primary font-mono">{volunteer.volunteerCode}</strong> • فرع {volunteer.governorate}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <button
              onClick={openEdit}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Pencil className="w-4 h-4 text-primary" />
              <span>تعديل البيانات</span>
            </button>
          )}
          {canManage && (
            <button
              onClick={handleRecalc}
              title="إعادة احتساب الساعات والنقاط والمستوى من السجلات المعتمدة"
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>إعادة احتساب الرصيد</span>
            </button>
          )}
          <button
            onClick={() => setEvalModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span>تقييم الأداء</span>
          </button>
          {canCertify && (
            <button
              onClick={() => setCertModal(true)}
              className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all"
            >
              <Award className="w-4 h-4" />
              <span>منح شهادة / تكريم</span>
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting || volunteer.status === 'EXCLUDED'}
              className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-600 shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              <span>{volunteer.status === 'EXCLUDED' ? 'مستبعد' : deleting ? '...' : 'استبعاد'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-sky-500 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white">
                {volunteer.name.slice(0, 2)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px]">
                ✓
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">{volunteer.qualification || 'المؤهل غير محدد'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">{volunteer.jobTitle || 'المهنة'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${rank.badgeBg}`}>
                  👑 {rank.title}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {volunteer.level}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                  {volunteer.teamName}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <div className="px-3">
              <span className="text-[10px] text-slate-400 block font-semibold">ساعات العطاء</span>
              <span className="text-base font-extrabold text-slate-900">{volunteer.totalHours} س</span>
            </div>
            <div className="px-3 border-x border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold">نقاط المكافأة</span>
              <span className="text-base font-extrabold text-amber-600">{volunteer.totalPoints.toLocaleString()}</span>
            </div>
            <div className="px-3">
              <span className="text-[10px] text-slate-400 block font-semibold">التقييم العام</span>
              <span className="text-base font-extrabold text-emerald-600">★ {volunteer.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Rank progress bar */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
            <span className="text-slate-600 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              التقدم نحو الرتبة التالية ({rank.title})
            </span>
            {nextRank ? (
              <span className="text-slate-500">
                الرتبة القادمة: <strong className="text-primary">{nextRank.title}</strong> • باقي <strong className="text-amber-600">{(nextRank.min - points).toLocaleString()}</strong> نقطة
              </span>
            ) : (
              <span className="text-amber-600 font-bold">وصل لأعلى رتبة قيادية في المنظومة 🏆</span>
            )}
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-1 px-1">
            <span>{rankStart} نقطة</span>
            <span className="text-primary font-extrabold">{progressPct}% منجز</span>
            <span>{nextRank ? `${nextRank.min} نقطة` : 'القمة 👑'}</span>
          </div>
        </div>
      </div>

      {/* Badges card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎖️</span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">سجل الأوسمة والشارات المكتسبة للمتطوع</h3>
              <p className="text-[11px] text-slate-500">استحقاق الشارات بناءً على الساعات، القوافل، التقييم، والدورات</p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full self-start sm:self-auto">
            {badges.filter((b: any) => b.earned).length} من {badges.length} أوسمة مكتسبة
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((b: any) => (
            <div
              key={b.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                b.earned
                  ? 'bg-gradient-to-br from-white to-slate-50 border-amber-200 shadow-xs hover:shadow-md'
                  : 'bg-slate-50/60 border-slate-200/60 opacity-60 grayscale'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{b.icon}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    b.earned ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {b.earned ? 'مكتسب ✓' : 'قيد الإنجاز'}
                  </span>
                </div>
                <h4 className="text-xs font-extrabold text-slate-900 leading-snug">{b.name}</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{b.desc}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-600 flex items-center justify-between">
                <span>المؤشر:</span>
                <span className={b.earned ? 'text-primary' : 'text-slate-400'}>{b.progressText}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('pass')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'pass'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <IdCard className="w-4 h-4" />
          <span>بطاقة الهوية الرقمية (Pass)</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'timeline'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>الخط الزمني</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'attendance'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>سجل الحضور والمشاركات ({volunteer.attendances?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('points')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'points'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>سجل النقاط ({volunteer.pointsLedger?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluations')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'evaluations'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>التقييمات ({volunteer.evaluationsReceived?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'certificates'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>الشهادات والتكريم ({volunteer.rewards?.length || 0})</span>
        </button>
      </div>

      {activeTab === 'pass' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-navy-royal to-navy-deep text-white p-6 shadow-2xl border border-primary/40 flex flex-col justify-between min-h-[420px]">
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
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                  {rank.title}
                </span>
              </div>

              <div className="flex items-center gap-4 my-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-emerald-400 text-slate-900 flex items-center justify-center font-extrabold text-xl shadow-lg border-2 border-white/50 flex-shrink-0">
                  {volunteer.name.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base text-white truncate">{volunteer.name}</h3>
                  <p className="text-xs text-sky-200 mt-0.5">{volunteer.teamName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-mono font-bold bg-white/15 px-2 py-0.5 rounded-md">
                      {volunteer.volunteerCode}
                    </span>
                    <span className="text-[11px] text-slate-300">{volunteer.governorate}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3">
                {qrDataUrl && (
                  <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-md flex-shrink-0 flex items-center justify-center">
                    <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="text-right flex-1 min-w-0">
                  <span className="text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    رمز الفحص الميداني المعتمد
                  </span>
                  <p className="text-[10px] text-slate-300 mt-0.5 leading-tight">
                    مشفر للتحقق الفوري من صلاحية العضوية
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/15 flex items-center justify-between text-[10px] text-slate-300">
                <span>صلاحية العضوية: 2026 - 2027</span>
                <span className="font-bold text-sky-300">منظومة VOS الرقمية</span>
              </div>
            </div>

            <div className="mt-3">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة بطاقة الهوية</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              📋 البيانات الشخصية والميدانية المعتمدة
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">الاسم رباعي</span>
                <span className="font-bold text-slate-800">{volunteer.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">الرقم القومي (14 رقم)</span>
                <span className="font-bold text-slate-800 font-mono">{volunteer.nationalId || 'غير مسجل'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">رقم الهاتف</span>
                <span className="font-bold text-slate-800 font-mono" dir="ltr">{volunteer.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">واتساب</span>
                <span className="font-bold text-slate-800 font-mono" dir="ltr">{volunteer.whatsapp || volunteer.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">المحافظة والمدينة</span>
                <span className="font-bold text-slate-800">{volunteer.governorate} - {volunteer.city || 'المركز الرئيسي'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">تاريخ الميلاد / السن</span>
                <span className="font-bold text-slate-800">
                  {volunteer.dob ? `${formatDate(volunteer.dob)}${calcAge(volunteer.dob) != null ? ` — ${calcAge(volunteer.dob)} سنة` : ''}` : 'غير مسجل'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">جهة اتصال الطوارئ</span>
                <span className="font-bold text-slate-800">{volunteer.emergencyContact || 'غير مسجل'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">البريد الإلكتروني</span>
                <span className="font-bold text-slate-800 font-mono" dir="ltr">{volunteer.email || 'غير مسجل'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">المؤهل والتخصص</span>
                <span className="font-bold text-slate-800">{volunteer.qualification || '-'} {volunteer.major ? `(${volunteer.major})` : ''}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block font-semibold">المهارات والخبرات</span>
                <span className="font-bold text-slate-800">{volunteer.skills || 'لا توجد مهارات مسجلة'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block font-semibold">المجالات المفضلة</span>
                <span className="font-bold text-slate-800">{volunteer.preferredFields || 'قوافل ميدانية، إغاثة'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">الخط الزمني الموحّد لأحداث المتطوع</h3>
          {(() => {
            const events = buildTimeline(volunteer);
            const colors: Record<string, string> = {
              attendance: 'bg-primary', points: 'bg-amber-500', evaluation: 'bg-purple-500',
              certificate: 'bg-amber-600', training: 'bg-emerald-500', retention: 'bg-rose-500',
            };
            if (events.length === 0) {
              return <div className="p-8 text-center text-slate-400 text-xs">لا توجد أحداث مسجلة بعد.</div>;
            }
            return (
              <ol className="relative border-r-2 border-slate-100 pr-4 space-y-4">
                {events.map((e, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -right-[1.35rem] top-1 w-3 h-3 rounded-full ring-4 ring-white ${colors[e.kind] || 'bg-slate-400'}`} />
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
            );
          })()}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">سجل المشاركات وساعات الحضور الميداني</h3>
          {volunteer.attendances?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">لا توجد سجلات حضور مسجلة لهذا المتطوع بعد.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {volunteer.attendances.map((att: any) => (
                <div key={att.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{att.activityName}</h4>
                    <span className="text-slate-400 text-[10px]">
                      {att.date?.split('T')[0]} • {att.governorate || 'المقر'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">{att.hours} ساعة</span>
                    <span className="font-bold text-amber-600">+{att.points} نقطة</span>
                    {att.approved ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        معتمد ✓
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                        قيد الاعتماد
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'points' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">سجل حركات رصيد النقاط (Gamification Ledger)</h3>
          {volunteer.pointsLedger?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">لا توجد حركات نقاط مسجلة بعد.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {volunteer.pointsLedger.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{item.reason}</span>
                    <span className="text-[10px] text-slate-400 block">{item.createdAt?.split('T')[0]} • {item.type}</span>
                  </div>
                  <span className="font-extrabold text-amber-600 text-sm">+{item.points} نقطة</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'evaluations' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">التقييمات الدورية والأداء</h3>
            <button
              onClick={() => setEvalModal(true)}
              className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs"
            >
              + إضافة تقييم
            </button>
          </div>
          {volunteer.evaluationsReceived?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">لا توجد تقييمات سابقة.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {volunteer.evaluationsReceived.map((ev: any) => (
                <div key={ev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">المقيّم: {ev.evaluatorName || 'المشرف'}</span>
                    <span className="font-extrabold text-amber-500">★ {ev.overallScore} / 5</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1">
                    <span>الالتزام: {ev.commitmentScore}/5</span>
                    <span>التعاون: {ev.cooperationScore}/5</span>
                    <span>المبادرة: {ev.initiativeScore}/5</span>
                    <span>السلوك: {ev.behaviorScore}/5</span>
                  </div>
                  {ev.notes && <p className="text-slate-600 italic text-[11px] pt-1">"{ev.notes}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'certificates' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">الشهادات المعتمدة وأوسمة التكريم</h3>
            {canCertify && (
              <button
                onClick={() => setCertModal(true)}
                className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs"
              >
                + منح شهادة جديدة
              </button>
            )}
          </div>
          {volunteer.rewards?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">لا توجد شهادات صادرة حتى الآن.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {volunteer.rewards.map((reward: any) => (
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
                    عرض الشهادة
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 relative my-8">
            <button onClick={() => setEditModal(false)} className="absolute left-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-extrabold text-slate-900">تعديل بيانات المتطوع</h3>
            <form onSubmit={handleSaveEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                ['name', 'الاسم رباعي'], ['nationalId', 'الرقم القومي'], ['phone', 'الهاتف'], ['whatsapp', 'واتساب'],
                ['email', 'البريد'], ['city', 'المدينة'], ['address', 'العنوان'], ['qualification', 'المؤهل'],
                ['major', 'التخصص'], ['jobTitle', 'المهنة'], ['emergencyContact', 'جهة الطوارئ'],
              ].map(([k, label]) => (
                <div key={k}>
                  <label className="block font-bold text-slate-700 mb-1">{label}</label>
                  <input value={editForm[k] || ''} onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
              ))}
              <div>
                <label className="block font-bold text-slate-700 mb-1">المحافظة</label>
                <select value={editForm.governorate || ''} onChange={(e) => setEditForm({ ...editForm, governorate: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200">
                  {lists.governorates.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">الفريق</label>
                <select value={editForm.teamName || ''} onChange={(e) => setEditForm({ ...editForm, teamName: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200">
                  {lists.teams.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">المستوى</label>
                <select value={editForm.level || ''} onChange={(e) => setEditForm({ ...editForm, level: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200">
                  {lists.levels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">الحالة</label>
                <select value={editForm.status || 'ACTIVE'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200">
                  {lists.volunteerStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">المهارات</label>
                <input value={editForm.skills || ''} onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">المجالات المفضلة</label>
                <input value={editForm.preferredFields || ''} onChange={(e) => setEditForm({ ...editForm, preferredFields: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">ملاحظات الإدارة</label>
                <textarea rows={2} value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">إلغاء</button>
                <button type="submit" disabled={editSaving} className="px-5 py-2 rounded-xl bg-primary text-white font-bold disabled:opacity-50">
                  {editSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {evalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">تقييم أداء المتطوع</h3>
            <form onSubmit={handleSaveEvaluation} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الالتزام والمسؤولية (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={commitment}
                  onChange={(e) => setCommitment(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">العمل الجماعي والتعاون (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={cooperation}
                  onChange={(e) => setCooperation(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">المبادرة والابتكار (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={initiative}
                  onChange={(e) => setInitiative(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">التعامل مع المستفيدين (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={behavior}
                  onChange={(e) => setBehavior(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات التقييم</label>
                <textarea
                  rows={2}
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder="ملاحظات حول الانضباط والأداء الميداني..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEvalModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={evalSaving}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold"
                >
                  {evalSaving ? 'جاري الحفظ...' : 'حفظ التقييم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {certModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">منح شهادة تقدير / تكريم رسمي</h3>
            <form onSubmit={handleIssueCertificate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع الشهادة / التكريم</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  {(lists.rewardTypes.length ? lists.rewardTypes : [certType]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب الاستحقاق</label>
                <input
                  type="text"
                  required
                  value={certReason}
                  onChange={(e) => setCertReason(e.target.value)}
                  placeholder="مثال: قيادة قافلة مطروح بنجاح وإخلاص"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">نقاط إضافية تمنح مع الشهادة</label>
                <input
                  type="number"
                  value={certPoints}
                  onChange={(e) => setCertPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCertModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={certSaving}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold"
                >
                  {certSaving ? 'جاري الإصدار...' : 'إصدار وتوثيق الشهادة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
