'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Plus, Calendar, Users, Award, CheckCircle, Clock, Pencil, Trash2, ClipboardList, X
} from 'lucide-react';
import { useLists } from '@/lib/useLists';
import { toast, confirmDialog } from '@/lib/ui';
import { SkeletonCards } from '@/components/Skeleton';
import NumberInput from '@/components/NumberInput';

export default function TrainingPage() {
  const { lists } = useLists();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // شاشة المسجّلين وتقييم نتائج التدريب
  const [gradingCourse, setGradingCourse] = useState<any>(null);
  const [drafts, setDrafts] = useState<Record<string, { attended: boolean; passed: boolean; score: string; notes: string; certificateCode: string }>>({});
  const [rowSaving, setRowSaving] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    title: '',
    type: 'تأهيل متطوعين جدد',
    trainer: '',
    date: '',
    hours: 4,
    isLeadershipPrereq: false,
    location: 'مقر الجمعية بالمهندسين',
    notes: '',
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/training');
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ title: '', type: lists.trainingTypes[0] || 'تأهيل متطوعين جدد', trainer: '', date: '', hours: 4, isLeadershipPrereq: false, location: 'مقر الجمعية بالمهندسين', notes: '' });
    setIsModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setFormData({
      title: c.title || '', type: c.type || '', trainer: c.trainer || '',
      date: c.date ? new Date(c.date).toISOString().slice(0, 16) : '',
      hours: c.hours || 4, isLeadershipPrereq: !!c.isLeadershipPrereq,
      location: c.location || '', notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/training/${editingId}` : '/api/training';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ');
      toast(editingId ? 'تم تحديث الدورة' : 'تم إنشاء الدورة', 'success');
      setIsModalOpen(false);
      setEditingId(null);
      fetchCourses();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openGrading = (c: any) => {
    setGradingCourse(c);
    const d: typeof drafts = {};
    (c.attendances || []).forEach((a: any) => {
      d[a.id] = {
        attended: !!a.attended,
        passed: !!a.passed,
        score: a.score ?? '',
        notes: a.notes || '',
        certificateCode: a.certificateCode || '',
      };
    });
    setDrafts(d);
  };

  const saveRow = async (attendanceId: string) => {
    if (!gradingCourse) return;
    const d = drafts[attendanceId];
    if (!d) return;
    setRowSaving((p) => ({ ...p, [attendanceId]: true }));
    try {
      const res = await fetch(`/api/training/${gradingCourse.id}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceId,
          attended: d.attended,
          passed: d.passed,
          score: d.score === '' ? '' : Number(d.score),
          notes: d.notes,
          certificateCode: d.certificateCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ');
      toast('تم حفظ النتيجة', 'success');
      fetchCourses();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setRowSaving((p) => ({ ...p, [attendanceId]: false }));
    }
  };

  const handleDeleteCourse = async (c: any) => {
    if (!(await confirmDialog({ title: `حذف الدورة "${c.title}"`, danger: true, confirmText: 'حذف' }))) return;
    try {
      const res = await fetch(`/api/training/${c.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      toast('تم حذف الدورة', 'success');
      fetchCourses();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span>برامج التدريب والتأهيل القيادي</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إدارة الدورات التدريبية، ورش العمل الميدانية، وتأهيل المتطوعين للمستويات القيادية
          </p>
        </div>

        <button
          onClick={openCreate}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة دورة تدريبية</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full"><SkeletonCards count={6} /></div>
        ) : courses.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs">لا توجد دورات تدريبية مسجلة حالياً.</div>
        ) : (
          courses.map((c) => (
            <div key={c.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">
                  {c.type}
                </span>
                {c.isLeadershipPrereq && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                    شرط ترقية قيادية ⭐
                  </span>
                )}
              </div>

              <h3 className="font-extrabold text-base text-slate-900 leading-snug">{c.title}</h3>

              <div className="space-y-1 text-xs text-slate-500">
                <p>المدرب: <strong className="text-slate-800">{c.trainer}</strong></p>
                <p>الموعد: {new Date(c.date).toLocaleDateString('ar-EG')} ({c.hours} ساعات)</p>
                <p>المكان: {c.location}</p>
                <p>عدد الحضور المسجلين: <strong className="text-primary">{c._count?.attendances || 0} متطوع</strong></p>
              </div>

              <button
                onClick={() => openGrading(c)}
                className="w-full px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold flex items-center justify-center gap-1.5"
              >
                <ClipboardList className="w-3.5 h-3.5" /> المسجّلون والتقييم ({c._count?.attendances || 0})
              </button>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => openEdit(c)} className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1">
                  <Pencil className="w-3.5 h-3.5 text-primary" /> تعديل
                </button>
                <button onClick={() => handleDeleteCourse(c)} className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold flex items-center justify-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">{editingId ? 'تعديل دورة تدريبية' : 'إنشاء دورة تدريبية وتأهيل'}</h3>
            <form onSubmit={handleSubmitCourse} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الدورة *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: مهارات إدارة الأزمات والإسعافات الأولية"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع التدريب</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {(lists.trainingTypes.length ? lists.trainingTypes : [formData.type]).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدرب *</label>
                  <input
                    type="text"
                    required
                    value={formData.trainer}
                    onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التاريخ *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عدد الساعات</label>
                  <NumberInput
                    value={formData.hours}
                    onChange={(v) => setFormData({ ...formData, hours: v })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="leadershipPrereq"
                  checked={formData.isLeadershipPrereq}
                  onChange={(e) => setFormData({ ...formData, isLeadershipPrereq: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <label htmlFor="leadershipPrereq" className="font-bold text-slate-700">
                  هذه الدورة شرط إلزامي للترشح للمناصب القيادية
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ الدورة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {gradingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">المسجّلون في: {gradingCourse.title}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">سجّل الحضور والنجاح ودرجة كل متطوع بعد انعقاد الدورة</p>
              </div>
              <button onClick={() => setGradingCourse(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-3">
              {(gradingCourse.attendances || []).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">لا يوجد متطوعون مسجّلون في هذه الدورة بعد.</div>
              ) : (
                gradingCourse.attendances.map((a: any) => {
                  const d = drafts[a.id] || { attended: false, passed: false, score: '', notes: '', certificateCode: '' };
                  const busy = !!rowSaving[a.id];
                  return (
                    <div key={a.id} className="p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs truncate">{a.volunteer?.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{a.volunteer?.volunteerCode} • {a.volunteer?.phone}</span>
                        </div>
                        <button
                          onClick={() => saveRow(a.id)}
                          disabled={busy}
                          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-[11px] font-bold disabled:opacity-50 flex-shrink-0"
                        >
                          {busy ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={d.attended}
                            onChange={(e) => setDrafts((p) => ({ ...p, [a.id]: { ...d, attended: e.target.checked } }))}
                            className="rounded border-slate-300"
                          />
                          حضر
                        </label>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={d.passed}
                            onChange={(e) => setDrafts((p) => ({ ...p, [a.id]: { ...d, passed: e.target.checked } }))}
                            className="rounded border-slate-300"
                          />
                          نجح
                        </label>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">الدرجة</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={d.score}
                            onChange={(e) => setDrafts((p) => ({ ...p, [a.id]: { ...d, score: e.target.value } }))}
                            placeholder="—"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">كود الشهادة (اختياري)</label>
                          <input
                            type="text"
                            value={d.certificateCode}
                            onChange={(e) => setDrafts((p) => ({ ...p, [a.id]: { ...d, certificateCode: e.target.value } }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        value={d.notes}
                        onChange={(e) => setDrafts((p) => ({ ...p, [a.id]: { ...d, notes: e.target.value } }))}
                        placeholder="ملاحظات (اختياري)"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => setGradingCourse(null)} className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
