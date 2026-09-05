'use client';

import React, { useState, useEffect } from 'react';
import {
  FileBarChart, Download, Upload, Users, Clock, Trophy, Truck,
  CheckCircle, FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (data.success) {
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleExportFullReport = async () => {
    try {
      const res = await fetch('/api/volunteers');
      const data = await res.json();
      if (!data.success) return;

      const rows = data.volunteers.map((v: any) => ({
        'كود المتطوع': v.volunteerCode,
        'الاسم رباعي': v.name,
        'الرقم القومي': v.nationalId || '-',
        'الهاتف': v.phone,
        'المحافظة': v.governorate,
        'الفريق': v.teamName,
        'المستوى': v.level,
        'ساعات التطوع': v.totalHours,
        'النقاط': v.totalPoints,
        'التقييم': v.rating,
        'الحالة': v.status,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'قاعدة بيانات المتطوعين');
      XLSX.writeFile(wb, `تقرير_المتطوعين_الشامل_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-primary" />
            <span>التقارير والإحصائيات وتصدير البيانات</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            مؤشرات أداء المحافظات، تقارير القوافل، والهجرة من جداول Google Sheets
          </p>
        </div>

        <button
          onClick={handleExportFullReport}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>تصدير التقرير المؤسسي الشامل (Excel)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-slate-400 font-bold block">إجمالي المتطوعين</span>
          <span className="text-2xl font-black text-slate-900">{stats?.stats?.totalVolunteers || 0}</span>
          <span className="text-[10px] text-slate-400 block">مسجلون وموثقون بالمنظومة</span>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-slate-400 font-bold block">المتطوعون النشطون</span>
          <span className="text-2xl font-black text-emerald-600">{stats?.stats?.activeVolunteers || 0}</span>
          <span className="text-[10px] text-emerald-700 block">خلال آخر 60 يوماً</span>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-slate-400 font-bold block">إجمالي ساعات العمل</span>
          <span className="text-2xl font-black text-primary">{stats?.stats?.totalHours || 0} س</span>
          <span className="text-[10px] text-slate-400 block">ميداني وتخطيطي معتمد</span>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-slate-400 font-bold block">رصيد النقاط الكلي</span>
          <span className="text-2xl font-black text-amber-600">{(stats?.stats?.totalPoints || 0).toLocaleString()}</span>
          <span className="text-[10px] text-amber-700 block">Gamification Ledger</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">📊 ترتيب المحافظات وساعات العمل المنفذة</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="p-3">المحافظة</th>
                <th className="p-3">عدد المتطوعين</th>
                <th className="p-3">إجمالي الساعات</th>
                <th className="p-3">إجمالي النقاط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.govStats?.map((g: any) => (
                <tr key={g.governorate} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{g.governorate}</td>
                  <td className="p-3 font-semibold">{g._count.id} متطوع</td>
                  <td className="p-3 font-bold text-primary">{g._sum.totalHours || 0} ساعة</td>
                  <td className="p-3 font-bold text-amber-600">{(g._sum.totalPoints || 0).toLocaleString()} نقطة</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
