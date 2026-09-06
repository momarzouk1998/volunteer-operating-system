'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search } from 'lucide-react';
import { SkeletonList } from '@/components/Skeleton';
import Pagination from '@/components/Pagination';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<string[]>([]);
  const [entities, setEntities] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async (goPage = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search, action, entity, from, to, page: String(goPage), pageSize: '30' });
      const res = await fetch(`/api/audit-logs?${q}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setActions(data.actions || []);
        setEntities(data.entities || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const key = `${search}|${action}|${entity}|${from}|${to}`;
  const prev = React.useRef(key);
  useEffect(() => {
    if (prev.current !== key) {
      prev.current = key;
      if (page !== 1) { setPage(1); return; }
    }
    fetchLogs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <span>سجل الرقابة والتدقيق (Audit Log)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          توثيق كل العمليات الحساسة — غير قابل للتعديل. بحث وفلترة بالنوع والكيان والتاريخ.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="relative flex items-center lg:col-span-1">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالمستخدم / التفاصيل" className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-primary" />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 pointer-events-none" />
        </div>
        <select value={action} onChange={(e) => setAction(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none">
          <option value="">كل الإجراءات</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={entity} onChange={(e) => setEntity(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none">
          <option value="">كل الكيانات</option>
          {entities.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <SkeletonList rows={8} />
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">لا توجد سجلات مطابقة.</div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-mono font-bold">{log.action}</span>
                      <span className="font-bold text-slate-900">{log.userName || 'النظام'}</span>
                      <span className="text-slate-400">• {log.entity}</span>
                    </div>
                    <p className="text-slate-700 font-medium">{log.details}</p>
                  </div>
                  <div className="text-left text-slate-400 text-[10px] font-mono">{new Date(log.createdAt).toLocaleString('ar-EG')}</div>
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
