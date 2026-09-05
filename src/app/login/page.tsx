'use client';

import React, { useState } from 'react';
import { Lock, Phone, ArrowLeft, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }

      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-dark to-navy-royal flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient lights */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 border border-slate-100">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-navy-royal p-2 shadow-lg mb-3 flex items-center justify-center">
            <img
              src="/images/logo.png"
              alt="جمعية خواطر أحلى شباب"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            جمعية خواطر أحلى شباب
          </h1>
          <p className="text-xs sm:text-sm text-primary font-bold mt-1">
            منظومة إدارة وتشغيل المتطوعين الرقمية (VOS 2026)
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">
              رقم الهاتف المسجل *
            </label>
            <div className="relative flex items-center">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 01000867705 أو +201012611725"
                className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 text-xs font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 text-left"
                dir="ltr"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">
              كلمة المرور *
            </label>
            <div className="relative flex items-center">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 text-xs font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400"
                dir="ltr"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-right">
              كلمة المرور الافتراضية للحسابات هي 123456 ويمكن تغييرها بعد الدخول
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-md shadow-primary/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>جاري التحقق والدخول...</span>
            ) : (
              <>
                <span>تسجيل الدخول للمنظومة</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Public Application Link */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600 mb-2">ترغب في الانضمام لأسرة المتطوعين؟</p>
          <a
            href="/apply"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>تقديم طلب تطوع جديد</span>
          </a>
        </div>
      </div>
    </div>
  );
}
