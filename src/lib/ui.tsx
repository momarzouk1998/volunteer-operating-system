'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, X, TriangleAlert } from 'lucide-react';

// ============================================================================
//  نظام تنبيهات (Toast) ونوافذ تأكيد (Confirm) موحّد — استدعاء أمري بدون Context
// ============================================================================

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; type: ToastType }
interface ConfirmOpts {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}
interface ConfirmState extends ConfirmOpts { id: number; resolve: (v: boolean) => void }

let _pushToast: ((t: Omit<ToastItem, 'id'>) => void) | null = null;
let _openConfirm: ((c: Omit<ConfirmState, 'id'>) => void) | null = null;
let _seq = 1;

export function toast(message: string, type: ToastType = 'success') {
  _pushToast?.({ message, type });
}

export function confirmDialog(opts: ConfirmOpts): Promise<boolean> {
  return new Promise((resolve) => {
    if (_openConfirm) _openConfirm({ ...opts, resolve });
    else resolve(window.confirm(opts.message || opts.title));
  });
}

export function UiHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  useEffect(() => {
    _pushToast = (t) => {
      const id = _seq++;
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3500);
    };
    _openConfirm = (c) => setConfirmState({ ...c, id: _seq++ });
    return () => {
      _pushToast = null;
      _openConfirm = null;
    };
  }, []);

  const closeConfirm = (v: boolean) => {
    confirmState?.resolve(v);
    setConfirmState(null);
  };

  return (
    <>
      {/* Toasts */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-[92vw] max-w-sm">
        {toasts.map((t) => {
          const Icon = t.type === 'success' ? CheckCircle : t.type === 'error' ? AlertTriangle : Info;
          const color =
            t.type === 'success'
              ? 'bg-emerald-600'
              : t.type === 'error'
              ? 'bg-rose-600'
              : 'bg-slate-800';
          return (
            <div
              key={t.id}
              className={`${color} text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 w-full animate-in fade-in slide-in-from-bottom-2`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{t.message}</span>
            </div>
          );
        })}
      </div>

      {/* Confirm dialog */}
      {confirmState && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  confirmState.danger ? 'bg-rose-50 text-rose-600' : 'bg-primary/10 text-primary'
                }`}
              >
                <TriangleAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900">{confirmState.title}</h3>
                {confirmState.message && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{confirmState.message}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => closeConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                {confirmState.cancelText || 'إلغاء'}
              </button>
              <button
                onClick={() => closeConfirm(true)}
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md ${
                  confirmState.danger
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : 'bg-primary hover:bg-primary-dark shadow-primary/20'
                }`}
              >
                {confirmState.confirmText || 'تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
