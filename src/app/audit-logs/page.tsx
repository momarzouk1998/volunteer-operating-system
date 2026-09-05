'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Clock, User, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/audit-logs');
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <span>سجل الرقابة والتدقيق غير القابل للتعديل (Audit Log)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          تسجيل وتوثيق كافة العمليات الإدارية الحساسة واعتماد الساعات وتغيير الصلاحيات
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">جاري تحميل سجل الرقابة...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">لا توجد سجلات تدقيق حتى الآن.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-mono font-bold">
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-900">{log.userName || 'المدير'}</span>
                    <span className="text-slate-400">• {log.entity}</span>
                  </div>
                  <p className="text-slate-700 font-medium">{log.details}</p>
                </div>
                <div className="text-left text-slate-400 text-[10px] font-mono">
                  {new Date(log.createdAt).toLocaleString('ar-EG')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
