'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Truck,
  Clock,
  Trophy,
  RotateCcw,
  GraduationCap,
  Award,
  FileBarChart,
  ShieldAlert,
  Settings,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  currentUser?: any;
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
  currentUser,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'لوحة المؤشرات', href: '/', icon: LayoutDashboard },
    { label: 'إدارة المتطوعين', href: '/volunteers', icon: Users },
    { label: 'طلبات التطوع', href: '/applications', icon: UserPlus },
    { label: 'القوافل والمهام', href: '/convoys', icon: Truck },
    { label: 'تسجيل الحضور', href: '/attendance', icon: Clock },
    { label: 'لوحة الشرف والرتب', href: '/leaderboard', icon: Trophy },
    { label: 'استعادة المتطوعين', href: '/retention', icon: RotateCcw },
    { label: 'التدريب والتأهيل', href: '/training', icon: GraduationCap },
    { label: 'الشهادات والتكريم', href: '/certificates', icon: Award },
    { label: 'التقارير والإحصائيات', href: '/reports', icon: FileBarChart },
    { label: 'سجل الرقابة والتدقيق', href: '/audit-logs', icon: ShieldAlert },
    { label: 'إعدادات المنظومة', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 right-0 bottom-0 bg-white border-l border-slate-200 z-50 flex flex-col transition-all duration-300 shadow-xl lg:shadow-none',
          // Mobile state
          mobileOpen ? 'translate-x-0 w-72' : 'translate-x-full lg:translate-x-0',
          // Desktop state
          isCollapsed ? 'lg:w-[4.75rem]' : 'lg:w-72'
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-navy-royal p-1.5 flex items-center justify-center flex-shrink-0 shadow-md">
              <img
                src="/images/logo.png"
                alt="خواطر أحلى شباب"
                className="w-full h-full object-contain rounded-md"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            {(!isCollapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-navy-royal text-sm truncate">
                  خواطر أحلى شباب
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  منظومة VOS 2026
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 items-center justify-center transition-colors"
            title={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20 font-bold'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'
                  )}
                />
                {(!isCollapsed || mobileOpen) && (
                  <span className="truncate">{item.label}</span>
                )}
                {isActive && (!isCollapsed || mobileOpen) && (
                  <span className="mr-auto w-1.5 h-4 rounded-full bg-sky-300" />
                )}
              </Link>
            );
          })}
        </div>

        {/* User Card & Action at Bottom */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-2.5 min-w-0 flex-1 p-1 rounded-xl hover:bg-white transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-sky-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm border border-white">
                {currentUser?.name ? currentUser.name.slice(0, 2) : 'مد'}
              </div>
              {(!isCollapsed || mobileOpen) && (
                <div className="flex flex-col min-w-0 flex-1 text-right">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {currentUser?.name || 'مدير المنظومة'}
                  </span>
                  <span className="text-[10px] text-primary font-semibold truncate">
                    {currentUser?.role === 'SUPER_ADMIN' ? 'مدير عام المنظومة' : 'متطوع معتمد'}
                  </span>
                </div>
              )}
            </Link>

            {(!isCollapsed || mobileOpen) && (
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
