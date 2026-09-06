'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Menu, Bell, Search, User, LogOut, KeyRound, IdCard } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface HeaderProps {
  setMobileOpen: (v: boolean) => void;
  currentUser?: any;
}

export default function Header({ setMobileOpen, currentUser }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  const prevUnread = React.useRef<number | null>(null);

  const beep = () => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ac = new Ctx();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.frequency.value = 880; o.type = 'sine';
      g.gain.setValueAtTime(0.06, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.25);
      o.start(); o.stop(ac.currentTime + 0.26);
    } catch {
      /* ignore */
    }
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        const u = data.unread || 0;
        if (prevUnread.current !== null && u > prevUnread.current) beep();
        prevUnread.current = u;
        setUnread(u);
        if (typeof document !== 'undefined') {
          document.title = u > 0 ? `(${u}) منظومة VOS` : 'منظومة VOS';
        }
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 45000);
    return () => clearInterval(t);
  }, [load]);

  const openNotifications = async () => {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    if (next && unread > 0) {
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ all: true }),
        });
        setUnread(0);
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch {
        /* silent */
      }
    }
  };

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

      <div className="flex items-center gap-2.5">
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
            onClick={openNotifications}
            className="relative w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
            title="الإشعارات"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -left-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">الإشعارات</span>
                <Link
                  href="/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[10px] text-primary font-semibold hover:underline"
                >
                  عرض الكل
                </Link>
              </div>
              <div className="divide-y divide-slate-50 py-1 max-h-72 overflow-y-auto text-xs">
                {items.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">لا توجد إشعارات</div>
                ) : (
                  items.slice(0, 8).map((n) => (
                    <Link
                      key={n.id}
                      href={n.link || '#'}
                      onClick={() => setNotificationsOpen(false)}
                      className="block py-2 hover:bg-slate-50 px-1 rounded-lg transition-colors"
                    >
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      {n.body && <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{n.body}</p>}
                      <span className="text-[10px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                    </Link>
                  ))
                )}
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
                <p className="text-[10px] text-slate-500 truncate">{currentUser?.phone || ''}</p>
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
