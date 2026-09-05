'use client';

import React, { useState, useEffect } from 'react';
import { User, KeyRound, CheckCircle, ShieldCheck, Phone, IdCard } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        // Just verify session
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassMsg('');

    if (newPassword !== confirmPassword) {
      setPassError('كلمة المرور الجديدة غير متطابقة مع التأكيد');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام');
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تغيير كلمة المرور');

      setPassMsg('تم تحديث كلمة المرور بنجاح!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          <span>الملف الشخصي وإعدادات الأمان</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          تعديل كلمة المرور وبيانات الحساب
        </p>
      </div>

      {/* Change Password Form */}
      <div id="security" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <KeyRound className="w-4 h-4 text-amber-500" />
          <span>تغيير كلمة المرور</span>
        </h3>

        {passMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{passMsg}</span>
          </div>
        )}

        {passError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {passError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">كلمة المرور الحالية</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">كلمة المرور الجديدة *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="•••••••• (6 أحرف أو أرقام على الأقل)"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">تأكيد كلمة المرور الجديدة *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={passLoading}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md shadow-primary/20 transition-all disabled:opacity-50"
            >
              {passLoading ? 'جاري الحفظ...' : 'تحديث كلمة المرور'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
