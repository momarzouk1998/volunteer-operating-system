'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock, CheckCircle, Filter, Search, UserCheck, Check,
  AlertCircle, ShieldCheck
} from 'lucide-react';

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance');
      const data = await res.json();
      if (data.success) {
        setAttendances(data.attendances);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, []);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch('/api/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceId: id }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAttendances();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" />
          <span>سجل الحضور واعتماد الساعات والنقاط</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          قاعدة ذهبية: لا تُحتسب الساعات أو النقاط في رصيد المتطوع إلا بعد اعتماد المشرف المسؤول
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">جاري تحميل سجلات الحضور...</div>
        ) : attendances.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">لا توجد سجلات حضور مسجلة حالياً.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attendances.map((record) => (
              <div key={record.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{record.code}</span>
                    <h3 className="text-sm font-extrabold text-slate-900">{record.volunteer?.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">({record.volunteer?.volunteerCode})</span>
                    {record.approved ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        معتمد ✓
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                        بانتظار الاعتماد
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    النشاط: <strong>{record.activityName}</strong> • التاريخ: {record.date?.split('T')[0]}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>عدد الساعات: <strong className="text-slate-800">{record.hours} ساعة</strong></span>
                    <span>النقاط المستحقة: <strong className="text-amber-600">+{record.points} نقطة</strong></span>
                    {record.approvedBy && (
                      <span>المعتمد: <strong>{record.approvedBy}</strong></span>
                    )}
                  </div>
                </div>

                <div>
                  {!record.approved ? (
                    <button
                      onClick={() => handleApprove(record.id)}
                      disabled={approvingId === record.id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{approvingId === record.id ? 'جاري الاعتماد...' : 'اعتماد وترحيل الرصيد'}</span>
                    </button>
                  ) : (
                    <div className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <ShieldCheck className="w-4 h-4" />
                      <span>تم الاعتماد وإضافة النقاط</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
