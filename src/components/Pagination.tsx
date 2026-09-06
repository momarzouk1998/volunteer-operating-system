'use client';

import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  total?: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, onChange }: Props) {
  if (totalPages <= 1) {
    return total !== undefined ? (
      <div className="py-3 text-center text-[11px] text-slate-400">{total} سجل</div>
    ) : null;
  }

  // نافذة أرقام صفحات مختصرة حول الصفحة الحالية
  const pages: (number | '…')[] = [];
  const push = (n: number) => pages.push(n);
  push(1);
  if (page > 3) pages.push('…');
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) push(i);
  if (page < totalPages - 2) pages.push('…');
  if (totalPages > 1) push(totalPages);

  return (
    <div className="flex items-center justify-between gap-3 py-3 px-2 flex-wrap">
      <span className="text-[11px] text-slate-400">
        صفحة {page} من {totalPages}{total !== undefined ? ` • ${total} سجل` : ''}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1 text-slate-400 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-colors ${
                p === page
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
