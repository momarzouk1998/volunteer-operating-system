'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UiHost } from '@/lib/ui';

export default function AppLayout({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser?: any;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Pages that don't need the dashboard layout (e.g. login, public application, public verify certificate)
  const isAuthPage = pathname === '/login' || pathname === '/apply' || pathname.startsWith('/verify');

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-slate-50">
        {children}
        <UiHost />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex">
      <UiHost />
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300',
          isCollapsed ? 'lg:mr-[4.75rem]' : 'lg:mr-72'
        )}
      >
        <Header setMobileOpen={setMobileOpen} currentUser={currentUser} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-12 max-w-7xl mx-auto w-full">
          {children}
        </main>

        <MobileBottomNav currentUser={currentUser} />
      </div>
    </div>
  );
}
