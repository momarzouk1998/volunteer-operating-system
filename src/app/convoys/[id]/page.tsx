'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Truck, Calendar, MapPin, Users, ChevronRight, CheckCircle,
  Clock, Plus, ShieldCheck, AlertCircle, FileText, UserPlus, X
} from 'lucide-react';

export default function ConvoyDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [convoy, setConvoy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Assign Task Modal
  const [taskModal, setTaskModal] = useState(false);
  const [volunteersList, setVolunteersList] = useState<any[]>([]);
  const [selectedVolId, setSelectedVolId] = useState('');
  const [taskRole, setTaskRole] = useState('عضو فريق التوزيع الميداني');
  const [taskType, setTaskType] = useState('توزيع وإغاثة');
  const [taskSaving, setTaskSaving] = useState(false);

  const fetchConvoy = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/convoys/${id}`);
      const data = await res.json();
      if (data.success && data.convoy) {
        setConvoy(data.convoy);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const res = await fetch('/api/volunteers');
      const data = await res.json();
      if (data.success) {
        setVolunteersList(data.volunteers);
        if (data.volunteers.length > 0) setSelectedVolId(data.volunteers[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchConvoy();
      fetchVolunteers();
    }
  }, [id]);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVolId) return;
    setTaskSaving(true);
    try {
      // Create attendance draft or task assignment
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: selectedVolId,
          convoyId: convoy.id,
          activityName: convoy.title,
          governorate: convoy.governorate,
          date: convoy.startDate,
          status: 'PRESENT',
          hours: 8,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Increment confirmed count
        await fetch(`/api/convoys/${convoy.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...convoy,
            confirmedCount: (convoy.confirmedCount || 0) + 1,
          }),
        });
        setTaskModal(false);
        fetchConvoy();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTaskSaving(false);
    }
  };

  const resolveJoin = async (taskId: string, decision: 'ACCEPT' | 'REJECT') => {
    try {
      const res = await fetch(`/api/convoys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESOLVE_JOIN', taskId, decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تنفيذ الإجراء');
      fetchConvoy();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 text-xs">جاري تحميل تفاصيل القافلة...</div>;
  if (!convoy) return <div className="p-12 text-center text-slate-400 text-xs">القافلة غير موجودة.</div>;

  const joinRequests = (convoy.tasks || []).filter((t: any) => t.status === 'طلب انضمام');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/convoys"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-xs"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{convoy.title}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                {convoy.type}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              كود القافلة: <strong className="font-mono text-primary">{convoy.code}</strong> • المحافظة: {convoy.governorate}
            </p>
          </div>
        </div>

        <button
          onClick={() => setTaskModal(true)}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>تسكين متطوع / تكليف بمهمة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              📋 بيانات الخطة والمسار الميداني
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">الموقع ونقطة التجمع</span>
                <span className="font-bold text-slate-800">{convoy.location}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">تاريخ ووقت الانطلاق</span>
                <span className="font-bold text-slate-800">{new Date(convoy.startDate).toLocaleString('ar-EG')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">المشرف المسؤول</span>
                <span className="font-bold text-slate-800">{convoy.supervisor}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">الاحتياج العددي والجاهزية</span>
                <span className="font-bold text-slate-800">{convoy.confirmedCount} مؤكد / {convoy.requiredCount} مستهدف</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block font-semibold">وصف وتفاصيل المهمة</span>
                <p className="text-slate-700 mt-1">{convoy.description || 'لا توجد تفاصيل إضافية مسجلة'}</p>
              </div>
            </div>
          </div>

          {/* Join Requests from volunteers */}
          {joinRequests.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-500" />
                طلبات انضمام بانتظار الموافقة ({joinRequests.length})
              </h3>
              <div className="divide-y divide-slate-100">
                {joinRequests.map((t: any) => (
                  <div key={t.id} className="py-3 flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0">
                      <Link href={`/volunteers/${t.volunteer?.id}`} className="font-bold text-slate-900 hover:text-primary">
                        {t.volunteer?.name}
                      </Link>
                      <span className="text-[10px] text-slate-400 block">
                        {t.volunteer?.volunteerCode} • {t.volunteer?.governorate} • {t.volunteer?.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => resolveJoin(t.id, 'ACCEPT')} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> قبول
                      </button>
                      <button onClick={() => resolveJoin(t.id, 'REJECT')} className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> رفض
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Volunteers Roster */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                👥 كشف المتطوعين المسكنين على القافلة ({convoy.attendances?.length || 0})
              </h3>
              <Link
                href="/attendance"
                className="text-xs font-bold text-primary hover:underline"
              >
                اعتماد الحضور والساعات
              </Link>
            </div>

            {convoy.attendances?.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                لم يتم تسكين متطوعين على هذه القافلة بعد. اضغط على "تسكين متطوع" بالأعلى.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {convoy.attendances.map((att: any) => (
                  <div key={att.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {att.volunteer?.name?.slice(0, 2) || 'مت'}
                      </div>
                      <div>
                        <Link href={`/volunteers/${att.volunteer?.id}`} className="font-bold text-slate-900 hover:text-primary">
                          {att.volunteer?.name}
                        </Link>
                        <span className="text-[10px] text-slate-400 block">{att.volunteer?.volunteerCode} • {att.volunteer?.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700">{att.hours} ساعة</span>
                      {att.approved ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          حاضر ومعتمد ✓
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                          مسكن (بانتظار الاعتماد)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">مؤشرات الجاهزية</h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
              <span className="text-3xl font-black text-primary">
                {Math.round(((convoy.confirmedCount || 0) / convoy.requiredCount) * 100)}%
              </span>
              <span className="text-xs text-slate-500 block">نسبة اكتمال الفريق</span>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, Math.round(((convoy.confirmedCount || 0) / convoy.requiredCount) * 100))}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">المتطوعون المستهدفون</span>
                <span className="font-bold text-slate-800">{convoy.requiredCount}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">المؤكدون حالياً</span>
                <span className="font-bold text-emerald-600">{convoy.confirmedCount}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">العجز المطلوب تغطيته</span>
                <span className="font-bold text-rose-600">{Math.max(0, convoy.requiredCount - (convoy.confirmedCount || 0))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Task Modal */}
      {taskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">تسكين متطوع على قافلة: {convoy.title}</h3>
            <form onSubmit={handleAssignTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اختر المتطوع *</label>
                <select
                  value={selectedVolId}
                  onChange={(e) => setSelectedVolId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  {volunteersList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.volunteerCode}) - {v.governorate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المهمة والدور الميداني</label>
                <input
                  type="text"
                  value={taskRole}
                  onChange={(e) => setTaskRole(e.target.value)}
                  placeholder="مثال: مسؤول فرز وتعبئة، مشرف لجنة طبية"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={taskSaving}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold"
                >
                  {taskSaving ? 'جاري التسكين...' : 'تأكيد التسكين'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
