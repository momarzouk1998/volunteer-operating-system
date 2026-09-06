'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

const TYPE_STYLE: Record<string, string> = {
  APPLICATION: 'bg-blue-50 text-blue-700',
  INTERVIEW: 'bg-purple-50 text-purple-700',
  ASSIGNMENT: 'bg-sky-50 text-sky-700',
  ATTENDANCE: 'bg-emerald-50 text-emerald-700',
  POINTS: 'bg-amber-50 text-amber-700',
  CERTIFICATE: 'bg-amber-50 text-amber-700',
  RETENTION: 'bg-rose-50 text-rose-700',
  GENERAL: 'bg-slate-100 text-slate-600',
};

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          <span>الإشعارات</span>
        </h1>
        {items.some((n) => !n.read) && (
          <button
            onClick={markAll}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
          >
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            تعليم الكل كمقروء
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">جاري التحميل...</div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
          لا توجد إشعارات بعد.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {items.map((n) => {
            const inner = (
              <div className={`p-4 flex items-start gap-3 ${n.read ? '' : 'bg-primary/[0.03]'}`}>
                <span className={`mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_STYLE[n.type] || TYPE_STYLE.GENERAL}`}>
                  {n.type || 'عام'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                    {n.title}
                  </p>
                  {n.body && <p className="text-xs text-slate-500 mt-1">{n.body}</p>}
                  <span className="text-[10px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} className="block hover:bg-slate-50 transition-colors">
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
