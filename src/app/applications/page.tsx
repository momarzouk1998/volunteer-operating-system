'use client';

import React, { useState, useEffect } from 'react';
import {
  UserPlus, Search, Calendar, CheckCircle, XCircle, Clock,
  Filter, Eye, MessageSquare, Star, ArrowRight, Check, Trash2
} from 'lucide-react';
import { toast, confirmDialog } from '@/lib/ui';
import Pagination from '@/components/Pagination';
import { SkeletonList } from '@/components/Skeleton';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('الكل');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [interviewModal, setInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  const [scoringModal, setScoringModal] = useState(false);
  const [commitment, setCommitment] = useState(20);
  const [teamwork, setTeamwork] = useState(20);
  const [beneficiary, setBeneficiary] = useState(20);
  const [skills, setSkills] = useState(20);
  const [leadership, setLeadership] = useState(20);
  const [recommendation, setRecommendation] = useState('مقبول');

  const [saving, setSaving] = useState(false);

  const fetchApps = async (goPage = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: status !== 'الكل' ? status : '',
        search,
        page: String(goPage),
        pageSize: '20',
      });
      const res = await fetch(`/api/applications?${q}`);
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const key = `${status}|${search}`;
  const prev = React.useRef(key);
  useEffect(() => {
    if (prev.current !== key) {
      prev.current = key;
      if (page !== 1) { setPage(1); return; }
    }
    fetchApps(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, page]);

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !interviewDate) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${selectedApp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SCHEDULE_INTERVIEW',
          interviewDate,
          notes: interviewNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInterviewModal(false);
        fetchApps();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRecordScoring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${selectedApp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_INTERVIEW',
          scores: {
            commitment,
            teamwork,
            beneficiary,
            skills,
            leadership,
            recommendation,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScoringModal(false);
        fetchApps();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (appId: string, force = false) => {
    if (!force && !(await confirmDialog({ title: 'اعتماد وقبول المتطوع', message: 'سيتم توليد كود عضوية KAS وإنشاء/تحديث حساب المتطوع.', confirmText: 'اعتماد' }))) return;
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE_VOLUNTEER', force }),
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message, 'success');
        fetchApps();
      } else if (data.needsForce) {
        if (await confirmDialog({ title: 'توصية المقابلة سلبية', message: data.error, danger: true, confirmText: 'اعتماد رغم ذلك' })) {
          handleApprove(appId, true);
        }
      } else {
        toast(data.error || 'فشل الاعتماد', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (appId: string) => {
    if (!(await confirmDialog({ title: 'حذف الطلب', message: 'سيُحذف الطلب نهائياً من السجل.', danger: true, confirmText: 'حذف' }))) return;
    try {
      const res = await fetch(`/api/applications/${appId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      toast('تم حذف الطلب', 'success');
      fetchApps();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleReject = async (appId: string) => {
    if (!(await confirmDialog({ title: 'رفض الطلب', message: 'سيتم تحويل حالة الطلب إلى مرفوض.', danger: true, confirmText: 'رفض' }))) return;
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchApps();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            <span>طلبات الانضمام ومقابلات التطوع</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            دورة حياة الاستقطاب: طلب جديد ← جدولة مقابلة ← تقييم المقابلة ← اعتماد وتوليد كود KAS
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، الكود، الهاتف..."
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-primary w-52"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none"
          >
            <option value="الكل">كل الطلبات</option>
            <option value="NEW">طلبات جديدة</option>
            <option value="UNDER_REVIEW">قيد المراجعة</option>
            <option value="INTERVIEW">موعد مقابلة</option>
            <option value="ACCEPTED">مقبول ومعتمد</option>
            <option value="REJECTED">مرفوض</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <SkeletonList rows={6} />
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">لا توجد طلبات مطابقة.</div>
        ) : (
          <>
          <div className="divide-y divide-slate-100">
            {applications.map((app) => (
              <div key={app.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{app.code}</span>
                    <h3 className="text-sm font-extrabold text-slate-900">{app.fullName}</h3>
                    {app.status === 'NEW' && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                        طلب جديد
                      </span>
                    )}
                    {app.status === 'INTERVIEW' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                        موعد مقابلة
                      </span>
                    )}
                    {app.status === 'ACCEPTED' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        مقبول ✓ ({app.volunteerCode})
                      </span>
                    )}
                    {app.status === 'REJECTED' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                        مرفوض
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>الهاتف: <strong className="text-slate-700 font-mono" dir="ltr">{app.phone}</strong></span>
                    <span>المحافظة: <strong className="text-slate-700">{app.governorate}</strong></span>
                    <span>المؤهل: <strong className="text-slate-700">{app.qualification || '-'}</strong></span>
                    <span>المصدر: <strong className="text-slate-700">{app.source || 'الموقع'}</strong></span>
                  </div>
                  {app.skills && (
                    <p className="text-[11px] text-slate-600 bg-slate-100/70 px-2.5 py-1 rounded-lg inline-block">
                      المهارات: {app.skills} {app.preferredFields ? `• المجالات: ${app.preferredFields}` : ''}
                    </p>
                  )}
                  {app.interview && (
                    <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-2 border border-emerald-200">
                      <span>درجة المقابلة: <strong>{app.interview.totalScore}/100</strong></span>
                      <span>التوصية: <strong>{app.interview.recommendation}</strong></span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                  {app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && (
                    <>
                      <button
                        onClick={() => { setSelectedApp(app); setInterviewModal(true); }}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold border border-amber-200 flex items-center gap-1 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>موعد مقابلة</span>
                      </button>

                      <button
                        onClick={() => { setSelectedApp(app); setScoringModal(true); }}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-100 text-xs font-bold border border-purple-200 flex items-center gap-1 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>تسجيل المقابلة</span>
                      </button>

                      <button
                        onClick={() => handleApprove(app.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>اعتماد وإصدار الكود</span>
                      </button>

                      <button
                        onClick={() => handleReject(app.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-bold transition-colors"
                      >
                        رفض
                      </button>
                    </>
                  )}
                  {app.status !== 'ACCEPTED' && (
                    <button
                      onClick={() => handleDelete(app.id)}
                      title="حذف الطلب"
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100">
            <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
          </div>
          </>
        )}
      </div>

      {/* Schedule Interview Modal */}
      {interviewModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">تحديد موعد مقابلة للمتقدم: {selectedApp.fullName}</h3>
            <form onSubmit={handleScheduleInterview} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ ووقت المقابلة *</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات التحضير</label>
                <textarea
                  rows={2}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="مكان المقابلة (مقر الجمعية / أونلاين)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInterviewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold"
                >
                  {saving ? 'جاري الحفظ...' : 'تأكيد الموعد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Interview Scoring Modal */}
      {scoringModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">تسجيل نتائج المقابلة الشخصية (SRS VOS-01)</h3>
            <form onSubmit={handleRecordScoring} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الالتزام والمسؤولية (من 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={commitment}
                    onChange={(e) => setCommitment(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العمل الجماعي (من 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={teamwork}
                    onChange={(e) => setTeamwork(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التعامل مع المستفيدين (من 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={beneficiary}
                    onChange={(e) => setBeneficiary(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الخبرة والمهارات (من 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={skills}
                    onChange={(e) => setSkills(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">الرغبة والقدرة القيادية (من 20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={leadership}
                    onChange={(e) => setLeadership(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between font-bold">
                <span>المجموع الكلي:</span>
                <span className="text-primary text-sm font-mono">{commitment + teamwork + beneficiary + skills + leadership} / 100</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">توصية اللجنة</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  <option value="مقبول">مقبول</option>
                  <option value="مقبول مع تدريب قيادي">مقبول مع تدريب قيادي</option>
                  <option value="قائمة انتظار">قائمة انتظار</option>
                  <option value="غير مستوفٍ">غير مستوفٍ</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScoringModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ قرار المقابلة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
