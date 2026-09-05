'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Shield,
  KeyRound,
  IdCard,
} from 'lucide-react';

interface HeaderProps {
  setMobileOpen: (v: boolean) => void;
  currentUser?: any;
}

export default function Header({ setMobileOpen, currentUser }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 flex items-center justify-between shadow-xs">
      {/* Right Side: Mobile Hamburger & Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors"
          title="القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 rounded-xl px-3 py-1.5 w-64 border border-slate-200/60 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، الكود، الهاتف..."
            className="bg-transparent border-none outline-none text-xs w-full text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Left Side: Actions, Notifications, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Quick Link to Digital ID Card */}
        <Link
          href="/profile#pass"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-bold transition-all border border-primary/20 shadow-xs"
        >
          <IdCard className="w-4 h-4" />
          <span>بطاقة المتطوع الرقمية</span>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
            title="الإشعارات"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
              3
            </span>
          </button>

          {notificationsOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">التنبيهات العاجلة</span>
                <span className="text-[10px] text-primary font-semibold">3 جديدة</span>
              </div>
              <div className="divide-y divide-slate-50 py-1 max-h-64 overflow-y-auto text-xs">
                <div className="py-2 hover:bg-slate-50 px-1 rounded-lg transition-colors cursor-pointer">
                  <p className="font-semibold text-slate-800">قافلة العياط بحاجة لـ 7 متطوعين إضافيين</p>
                  <span className="text-[10px] text-slate-400">منذ 25 دقيقة • فريق الإغاثة</span>
                </div>
                <div className="py-2 hover:bg-slate-50 px-1 rounded-lg transition-colors cursor-pointer">
                  <p className="font-semibold text-slate-800">تم تسجيل طلب تطوع جديد برقم APP-2026-02</p>
                  <span className="text-[10px] text-slate-400">منذ ساعتين • بوابة المتطوعين</span>
                </div>
                <div className="py-2 hover:bg-slate-50 px-1 rounded-lg transition-colors cursor-pointer">
                  <p className="font-semibold text-slate-800">5 متطوعين تجاوزوا 60 يوماً دون مشاركة</p>
                  <span className="text-[10px] text-slate-400">مركز الاستعادة والتنشيط</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-navy-royal text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {currentUser?.name ? currentUser.name.slice(0, 2) : 'مد'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.name || 'مدير المنظومة'}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser?.phone || '+201000867705'}</p>
              </div>
              <div className="py-1 text-xs">
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span>الملف الشخصي</span>
                </Link>
                <Link
                  href="/profile#security"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span>تغيير كلمة المرور</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-right"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
