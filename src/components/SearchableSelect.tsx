'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, Check, ChevronDown, Loader2 } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
  hint?: string;
}

interface Props {
  value: string;
  onChange: (value: string, option?: Option) => void;
  /** بحث غير متزامن (للقوائم الكبيرة) — يُستدعى بعد توقف الكتابة */
  fetcher: (query: string) => Promise<Option[]>;
  placeholder?: string;
  emptyText?: string;
}

/** قائمة منسدلة قابلة للبحث تدعم آلاف السجلات عبر بحث على الخادم. */
export default function SearchableSelect({
  value, onChange, fetcher, placeholder = 'اختر...', emptyText = 'لا نتائج',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetcher(query);
        if (alive) setOptions(res);
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query, open, fetcher]);

  useEffect(() => {
    const match = options.find((o) => o.value === value);
    if (match) setSelectedLabel(match.label);
  }, [value, options]);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-primary"
      >
        <span className={selectedLabel ? '' : 'text-slate-400'}>{selectedLabel || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الكود أو الهاتف..."
              className="flex-1 bg-transparent outline-none text-xs"
            />
            {loading && <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />}
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {options.length === 0 && !loading ? (
              <div className="px-3 py-4 text-center text-[11px] text-slate-400">{emptyText}</div>
            ) : (
              options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value, o);
                    setSelectedLabel(o.label);
                    setOpen(false);
                  }}
                  className="w-full text-right px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-2"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 truncate">{o.label}</span>
                    {o.hint && <span className="block text-[10px] text-slate-400 truncate">{o.hint}</span>}
                  </span>
                  {o.value === value && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
