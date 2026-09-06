'use client';

import React, { useEffect, useState } from 'react';
import { CalendarHeart, MapPin, Users, Clock, CheckCircle2, Hourglass, XCircle, GraduationCap } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from '@/lib/ui';

const STATUS_AR: Record<string, string> = {
  PLANNED: 'مخططة',
  IN_PROGRESS: 'قيد التنفيذ',
};

function MyBadge({ status }: { status: string | null }) {
  if (!status) return null;
  if (status === 'مؤكد')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
        <CheckCircle2 className="w-3 h-3" /> مؤكد
      </span>
    );
  if (status === 'مرفوض')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
        <XCircle className="w-3 h-3" /> مرفوض
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
      <Hourglass className="w-3 h-3" /> طلبك قيد المراجعة
    </span>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [training, setTraining] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
        setMyTasks(data.myTasks || []);
        setTraining(data.training || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const enroll = async (courseId: string) => {
    setBusyId(courseId);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      toast(data.message || data.error || '', data.success ? 'success' : 'error');
      await load();
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const requestJoin = async (convoyId: string) => {
    setBusyId(convoyId);
    setMsg('');
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ convoyId }),
      });
      const data = await res.json();
      setMsg(data.message || data.error || '');
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <CalendarHeart className="w-6 h-6 text-primary" />
          <span>الفرص والقوافل المتاحة</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          تصفّح القوافل القادمة وأرسل طلب انضمامك، وسيراجعه فريق الإدارة.
        </p>
      </div>

      {msg && (
        <div className="p-3 rounded-2xl bg-primary/5 border border-primary/15 text-primary text-xs font-bold">{msg}</div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">جاري تحميل الفرص المتاحة...</div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
          لا توجد قوافل متاحة للانضمام حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {events.map((e) => {
            const full = e.confirmedCount >= e.requiredCount;
            return (
              <div key={e.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-sm truncate">{e.title}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">{e.code} • {e.type}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold flex-shrink-0">
                    {STATUS_AR[e.status] || e.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{e.governorate} - {e.location}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" />{formatDate(e.startDate)}</span>
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" />{e.confirmedCount}/{e.requiredCount} متطوع</span>
                  <span className="text-slate-400">المشرف: {e.supervisor}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <MyBadge status={e.myStatus} />
                  {!e.myStatus && (
                    <button
                      onClick={() => requestJoin(e.id)}
                      disabled={busyId === e.id || full}
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md shadow-primary/20 transition-all disabled:opacity-50"
                    >
                      {full ? 'اكتمل العدد' : busyId === e.id ? 'جاري الإرسال...' : 'طلب الانضمام'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {myTasks.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">تكليفاتي وطلباتي</h3>
          <div className="divide-y divide-slate-100">
            {myTasks.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{t.convoy?.title || t.taskType}</h4>
                  <span className="text-[10px] text-slate-400">
                    {t.role} • {formatDate(t.createdAt)}
                    {t.convoy?.startDate ? ` • انطلاق ${formatDate(t.convoy.startDate)}` : ''}
                  </span>
                </div>
                <MyBadge status={t.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {training.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-600" />
            الدورات التدريبية المتاحة
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {training.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-xs">{c.title}</h4>
                  {c.isLeadershipPrereq && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold flex-shrink-0">شرط قيادي ⭐</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>{c.type} • {c.trainer}</p>
                  <p>{formatDate(c.date)} • {c.hours} ساعات • {c.location}</p>
                </div>
                {c.enrolled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" /> مسجّل
                  </span>
                ) : (
                  <button
                    onClick={() => enroll(c.id)}
                    disabled={busyId === c.id}
                    className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-[11px] font-bold disabled:opacity-50"
                  >
                    {busyId === c.id ? '...' : 'سجّلني في الدورة'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
