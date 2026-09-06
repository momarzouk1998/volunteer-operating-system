'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Search, Check, ShieldCheck, RotateCcw } from 'lucide-react';
import { toast, confirmDialog } from '@/lib/ui';
import { SkeletonList } from '@/components/Skeleton';
import Pagination from '@/components/Pagination';

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [approved, setApproved] = useState('الكل');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchAttendances = async (goPage = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        search,
        approved: approved === 'معتمد' ? 'yes' : approved === 'قيد الاعتماد' ? 'no' : '',
        page: String(goPage),
        pageSize: '20',
      });
      const res = await fetch(`/api/attendance?${q}`);
      const data = await res.json();
      if (data.success) {
        setAttendances(data.attendances);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const key = `${search}|${approved}`;
  const prev = React.useRef(key);
  useEffect(() => {
    if (prev.current !== key) {
      prev.current = key;
      if (page !== 1) { setPage(1); return; }
    }
    fetchAttendances(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, page]);

  const act = async (id: string, action?: 'UNAPPROVE') => {
    if (action === 'UNAPPROVE' && !(await confirmDialog({ title: 'إلغاء اعتماد هذا السجل؟', message: 'سيتم خصم الساعات والنقاط من رصيد المتطوع وتصحيحه.', danger: true, confirmText: 'إلغاء الاعتماد' }))) return;
    setBusyId(id);
    try {
      const res = await fetch('/api/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceId: id, action }),
      });
      const data = await res.json();
      toast(data.success ? data.message : data.error, data.success ? 'success' : 'error');
      if (data.success) fetchAttendances();
    } finally {
      setBusyId(null);
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
          قاعدة ذهبية: لا تُحتسب الساعات أو النقاط إلا بعد اعتماد المشرف. يمكن إلغاء الاعتماد للتصحيح.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative flex items-center sm:col-span-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالمتطوع، النشاط، الكود..."
            className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
        </div>
        <select value={approved} onChange={(e) => setApproved(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none">
          <option>الكل</option>
          <option>قيد الاعتماد</option>
          <option>معتمد</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <SkeletonList rows={6} />
        ) : attendances.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">لا توجد سجلات مطابقة.</div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {attendances.map((record) => (
                <div key={record.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{record.code}</span>
                      <h3 className="text-sm font-extrabold text-slate-900">{record.volunteer?.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">({record.volunteer?.volunteerCode})</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${record.approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {record.approved ? 'معتمد ✓' : 'بانتظار الاعتماد'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      النشاط: <strong>{record.activityName}</strong> • {record.date?.split('T')[0]} • {record.governorate || record.convoy?.title || 'المقر'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>الساعات: <strong className="text-slate-800">{record.hours}</strong></span>
                      <span>النقاط: <strong className="text-amber-600">+{record.points}</strong></span>
                      {record.approvedBy && <span>المعتمد: <strong>{record.approvedBy}</strong></span>}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {!record.approved ? (
                      <button
                        onClick={() => act(record.id)}
                        disabled={busyId === record.id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{busyId === record.id ? '...' : 'اعتماد وترحيل الرصيد'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => act(record.id, 'UNAPPROVE')}
                        disabled={busyId === record.id}
                        className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>{busyId === record.id ? '...' : 'إلغاء الاعتماد'}</span>
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
    </div>
  );
}
