'use client';

import React, { useState, useEffect } from 'react';
import { FileBarChart, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SkeletonCards } from '@/components/Skeleton';
import { toast } from '@/lib/ui';

export default function ReportsPage() {
  const [r, setR] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then((res) => res.json())
      .then((d) => { if (d.success) setR(d); })
      .finally(() => setLoading(false));
  }, []);

  const exportWorkbook = async () => {
    try {
      const vols = await fetch('/api/volunteers?export=1').then((x) => x.json());
      const wb = XLSX.utils.book_new();

      if (vols.success) {
        const rows = vols.volunteers.map((v: any) => ({
          'كود المتطوع': v.volunteerCode, 'الاسم': v.name, 'الرقم القومي': v.nationalId ? `****${String(v.nationalId).slice(-4)}` : '-',
          'الهاتف': v.phone, 'المحافظة': v.governorate, 'الفريق': v.teamName, 'المستوى': v.level,
          'الساعات': v.totalHours, 'النقاط': v.totalPoints, 'التقييم': v.rating, 'القوافل': v.convoysCount, 'الحالة': v.status,
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'المتطوعون');
      }
      if (r) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.byGovernorate), 'حسب المحافظة');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.byTeam), 'حسب الفريق');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.byLevel), 'المستويات');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.ageBands), 'الفئات العمرية');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.topSkills), 'المهارات');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.convoysByStatus), 'القوافل');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.training), 'التدريب');
      }
      XLSX.writeFile(wb, `تقرير_VOS_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch {
      toast('تعذّر التصدير', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-primary" />
            <span>التقارير والإحصائيات المؤسسية</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">توزيعات المتطوعين، الفئات العمرية، المهارات، القوافل، والتدريب</p>
        </div>
        <button onClick={exportWorkbook} className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20">
          <Download className="w-4 h-4" />
          <span>تصدير التقرير الشامل (Excel)</span>
        </button>
      </div>

      {loading ? (
        <SkeletonCards count={6} />
      ) : !r ? (
        <div className="p-12 text-center text-slate-400 text-xs">تعذّر تحميل التقارير.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="ساعات معتمدة" value={r.attendance.approvedHours} color="text-primary" />
            <Stat label="نقاط معتمدة" value={(r.attendance.approvedPoints || 0).toLocaleString()} color="text-amber-600" />
            <Stat label="سجلات حضور معتمدة" value={r.attendance.approvedRecords} color="text-emerald-600" />
            <Stat label="متوسط التقييم العام" value={`★ ${r.evaluations.avg}`} color="text-purple-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Table title="حسب المحافظة" head={['المحافظة', 'متطوعون', 'ساعات', 'نقاط']} rows={r.byGovernorate.map((x: any) => [x.governorate, x.count, x.hours, x.points])} />
            <Table title="أفضل الفرق (بالساعات)" head={['الفريق', 'أعضاء', 'ساعات', 'نقاط']} rows={r.byTeam.slice(0, 10).map((x: any) => [x.team, x.count, x.hours, x.points])} />
            <Table title="الفئات العمرية" head={['الفئة', 'العدد']} rows={r.ageBands.map((x: any) => [x.band, x.count])} />
            <Table title="المستويات" head={['المستوى', 'العدد']} rows={r.byLevel.map((x: any) => [x.level, x.count])} />
            <Table title="أكثر المهارات شيوعاً" head={['المهارة', 'العدد']} rows={r.topSkills.map((x: any) => [x.name, x.count])} />
            <Table title="القوافل حسب الحالة" head={['الحالة', 'العدد', 'مطلوب', 'مؤكد']} rows={r.convoysByStatus.map((x: any) => [x.status, x.count, x.required, x.confirmed])} />
            <Table title="التدريب" head={['الدورة', 'المسجّلون']} rows={r.training.map((x: any) => [x.title, x.attendees])} />
            <Table title="حالات العضوية" head={['الحالة', 'العدد']} rows={r.byStatus.map((x: any) => [x.status, x.count])} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-center space-y-1">
      <span className="text-xs text-slate-400 font-bold block">{label}</span>
      <span className={`text-2xl font-black ${color}`}>{value}</span>
    </div>
  );
}

function Table({ title, head, rows }: { title: string; head: string[]; rows: any[][] }) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
      <h3 className="text-sm font-extrabold text-slate-900 mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>{head.map((h) => <th key={h} className="p-2">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr><td colSpan={head.length} className="p-3 text-center text-slate-400">لا بيانات</td></tr>
            ) : rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {row.map((c, j) => <td key={j} className={`p-2 ${j === 0 ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{typeof c === 'number' ? c.toLocaleString() : c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
