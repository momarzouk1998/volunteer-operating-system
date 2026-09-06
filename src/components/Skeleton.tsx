'use client';

import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

/** صفوف هيكلية لقائمة/جدول أثناء التحميل. */
export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-7 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-9 w-full rounded-xl mt-2" />
        </div>
      ))}
    </div>
  );
}
