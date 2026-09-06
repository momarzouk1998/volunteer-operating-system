'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy, Crown, Star, Award, Medal, Users,
  Sparkles, ShieldCheck, ChevronLeft
} from 'lucide-react';
import { getRankBadge, computeVolunteerBadges } from '@/lib/utils';
import { useLists } from '@/lib/useLists';

export default function LeaderboardPage() {
  const { lists } = useLists();
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTop = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/volunteers?sort=points&pageSize=50&page=1');
        const data = await res.json();
        if (data.success) {
          setVolunteers(data.volunteers);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTop();
  }, []);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-primary p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
              <Crown className="w-3.5 h-3.5 text-amber-200" />
              <span>لوحة الشرف وتصنيف الرتب القيادية 2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black">
              أفضل سفراء العطاء والمتطوعين المتميزين
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
              نظام النقاط التراكمي: كل ساعة عمل معتمدة = {lists.rules.pointsPerHour} نقاط • حضور قافلة كاملة = {lists.rules.fullConvoyPoints} نقطة
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">جاري تحميل لوحة الشرف...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {volunteers.map((vol, index) => {
              const rank = getRankBadge(vol.totalPoints, vol.level);
              const badges = computeVolunteerBadges(vol);
              const earnedBadges = badges.filter((b) => b.earned);

              return (
                <div
                  key={vol.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      index === 0 ? 'bg-amber-400 text-white shadow-md shadow-amber-400/30 text-base' :
                      index === 1 ? 'bg-slate-300 text-slate-800' :
                      index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/volunteers/${vol.id}`} className="font-bold text-slate-900 text-sm hover:text-primary transition-colors">
                          {vol.name}
                        </Link>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rank.badgeBg}`}>
                          {rank.title}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 block truncate mt-0.5">
                        {vol.volunteerCode} • {vol.governorate} • {vol.teamName}
                      </span>
                      {earnedBadges.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {earnedBadges.map((b) => (
                            <span
                              key={b.id}
                              title={`${b.name}: ${b.desc}`}
                              className="text-sm bg-slate-100 px-1.5 py-0.5 rounded-md hover:scale-110 transition-transform cursor-help"
                            >
                              {b.icon}
                            </span>
                          ))}
                          <span className="text-[10px] text-slate-400 font-semibold mr-1">
                            ({earnedBadges.length} أوسمة)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:text-left flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-base font-black text-amber-600 block">
                      {vol.totalPoints.toLocaleString()} <span className="text-xs font-normal">نقطة</span>
                    </span>
                    <span className="text-xs text-slate-400 block font-medium">
                      {vol.totalHours} ساعة • {vol.convoysCount || 0} قافلة
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
