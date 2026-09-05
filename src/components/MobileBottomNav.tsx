'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, IdCard, Truck, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const items = [
    { label: 'الرئيسية', href: '/', icon: LayoutDashboard },
    { label: 'القوافل', href: '/convoys', icon: Truck },
    { label: 'الهوية', href: '/profile#pass', icon: IdCard },
    { label: 'الشرف', href: '/leaderboard', icon: Trophy },
    { label: 'حسابي', href: '/profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-around px-2 shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all',
              isActive ? 'text-primary font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Icon className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-slate-400')} />
            <span className="text-[10px] leading-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
