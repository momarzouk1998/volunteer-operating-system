'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { KeyRound } from 'lucide-react';

function ResetInner() {
  const sp = useSearchParams();
  const token = sp.get('token') || '';
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { if (!token) setErr('رابط غير صالح'); }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (p1 !== p2) { setErr('كلمتا المرور غير متطابقتين'); return; }
    if (p1.length < 6) { setErr('كلمة المرور 6 أحرف على الأقل'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: p1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');
      setMsg(data.message);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-dark to-navy-royal flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-extrabold text-slate-900">تعيين كلمة مرور جديدة</h1>
        </div>

        {msg ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">{msg}</div>
            <a href="/login" className="inline-block px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs">تسجيل الدخول</a>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {err && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">{err}</div>}
            <input type="password" required value={p1} onChange={(e) => setP1(e.target.value)} placeholder="كلمة المرور الجديدة"
              className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none" />
            <input type="password" required value={p2} onChange={(e) => setP2(e.target.value)} placeholder="تأكيد كلمة المرور"
              className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none" />
            <button type="submit" disabled={loading || !token}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-md disabled:opacity-50">
              {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <ResetInner />
    </Suspense>
  );
}
