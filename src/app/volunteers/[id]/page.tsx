'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User, Phone, MapPin, Award, Clock, Trophy, Calendar,
  CheckCircle, Printer, IdCard, Star, ChevronRight, Download
} from 'lucide-react';
import QRCode from 'qrcode';
import { getStatusBadge, getRankBadge } from '@/lib/utils';

export default function VolunteerDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [volunteer, setVolunteer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pass' | 'attendance' | 'points' | 'evaluations' | 'certificates'>('pass');

  const [evalModal, setEvalModal] = useState(false);
  const [commitment, setCommitment] = useState(5);
  const [cooperation, setCooperation] = useState(5);
  const [initiative, setInitiative] = useState(5);
  const [behavior, setBehavior] = useState(5);
  const [evalNotes, setEvalNotes] = useState('');
  const [evalSaving, setEvalSaving] = useState(false);

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
      if (data.success) {
        setEvalModal(false);
        fetchVolunteer();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvalSaving(false);
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
      if (data.success) {
        setCertModal(false);
        fetchVolunteer();
      }
    } catch (err) {
      console.error(err);
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
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              كود العضوية: <strong className="text-primary font-mono">{volunteer.volunteerCode}</strong> • فرع {volunteer.governorate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEvalModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span>تقييم الأداء</span>
          </button>
          <button
            onClick={() => setCertModal(true)}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all"
          >
            <Award className="w-4 h-4" />
            <span>منح شهادة / تكريم</span>
          </button>
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
            <button
              onClick={() => setCertModal(true)}
              className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs"
            >
              + منح شهادة جديدة
            </button>
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
                  <option value="شهادة تقدير وتكريم">شهادة تقدير وتكريم</option>
                  <option value="درع التميز والعطاء">درع التميز والعطاء</option>
                  <option value="وسام متطوع الشهر">وسام متطوع الشهر</option>
                  <option value="شهادة اجتياز دورة قيادية">شهادة اجتياز دورة قيادية</option>
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
