'use client';

import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(''); setMsg('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-slate-200 p-2 shadow-md flex items-center justify-center">
            <img src="/images/logo.png" alt="الشعار" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg font-extrabold text-slate-900">استعادة كلمة المرور</h1>
          <p className="text-xs text-slate-500">أدخل بريدك الإلكتروني المسجّل وسنرسل لك رابط إعادة التعيين</p>
        </div>

        {msg ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center">{msg}</div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {err && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">{err}</div>}
            <div className="relative flex items-center">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" dir="ltr"
                className="w-full pr-10 pl-3 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none" />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-md disabled:opacity-50">
              {loading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
            </button>
          </form>
        )}

        <a href="/login" className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> العودة لتسجيل الدخول
        </a>
      </div>
    </div>
  );
}
