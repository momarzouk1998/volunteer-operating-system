'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Phone,
  MapPin,
  Award,
  Clock,
  Trophy,
  ChevronLeft,
  Download,
  X,
  CheckCircle,
  Eye,
  IdCard,
} from 'lucide-react';
import { getStatusBadge } from '@/lib/utils';
import { useLists } from '@/lib/useLists';
import Pagination from '@/components/Pagination';
import { SkeletonList } from '@/components/Skeleton';
import { toast } from '@/lib/ui';
import * as XLSX from 'xlsx';

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [governorate, setGovernorate] = useState('الكل');
  const [team, setTeam] = useState('الكل');
  const [status, setStatus] = useState('الكل');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nationalId: '',
    phone: '',
    whatsapp: '',
    governorate: 'الجيزة',
    city: '',
    qualification: '',
    major: '',
    jobTitle: '',
    skills: '',
    preferredFields: '',
    teamName: 'فريق الإغاثة الميدانية',
    level: 'متطوع جديد',
    status: 'ACTIVE',
    notes: '',
  });

  const fetchVolunteers = async (goPage = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        search,
        governorate: governorate !== 'الكل' ? governorate : '',
        team: team !== 'الكل' ? team : '',
        status: status !== 'الكل' ? status : '',
        page: String(goPage),
        pageSize: '20',
      });
      const res = await fetch(`/api/volunteers?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        setVolunteers(data.volunteers);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterKey = `${search}|${governorate}|${team}|${status}`;
  const prevFilterKey = React.useRef(filterKey);

  // عند تغيّر الفلاتر: ارجع للصفحة الأولى
  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      if (page !== 1) { setPage(1); return; }
    }
    fetchVolunteers(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, page]);

  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل في إضافة المتطوع');

      setModalSuccess(data.message || 'تم حفظ المتطوع بنجاح!');
      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess('');
        fetchVolunteers();
      }, 1500);
    } catch (err: any) {
      setModalError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setModalLoading(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (volunteers.length === 0) return;
    const exportData = volunteers.map((v) => ({
      'كود المتطوع': v.volunteerCode,
      'الاسم رباعي': v.name,
      'الرقم القومي': v.nationalId || '-',
      'رقم الهاتف': v.phone,
      'المحافظة': v.governorate,
      'المدينة': v.city || '-',
      'المستوى التطوعي': v.level,
      'الفريق': v.teamName,
      'الحالة': v.status,
      'ساعات التطوع': v.totalHours,
      'النقاط': v.totalPoints,
      'التقييم': v.rating,
      'عدد القوافل': v.convoysCount,
      'تاريخ التسجيل': v.createdAt?.split('T')[0],
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل المتطوعين');
    XLSX.writeFile(wb, `سجل_المتطوعين_VOS_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const { lists } = useLists();
  const governoratesList = ['الكل', ...lists.governorates];
  const teamsList = ['الكل', ...lists.teams];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span>إدارة شؤون وسجلات المتطوعين</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            البحث والتصفية، إدارة الملفات الرقمية 360°، وتصدير التقارير الميدانية
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>تصدير إكسيل</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة متطوع جديد</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم، الكود، الهاتف، الرقم القومي..."
              className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none transition-all placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
          </div>

          {/* Governorate Filter */}
          <div>
            <select
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none transition-all text-slate-700"
            >
              <option value="الكل">كل المحافظات</option>
              {governoratesList.filter(g => g !== 'الكل').map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none transition-all text-slate-700"
            >
              <option value="الكل">كل الفرق واللجان</option>
              {teamsList.filter(t => t !== 'الكل').map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none transition-all text-slate-700"
            >
              <option value="الكل">كل الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="INACTIVE">غير نشط</option>
              <option value="DISTINGUISHED">متميز</option>
              <option value="DISCONTINUED">منقطع</option>
              <option value="EXCLUDED">مستبعد</option>
            </select>
          </div>
        </div>
      </div>

      {/* Volunteers Table & Responsive Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <SkeletonList rows={8} />
        ) : volunteers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">لا توجد سجلات متطابقّة مع معايير البحث.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">كود العضوية</th>
                    <th className="py-3.5 px-4">اسم المتطوع</th>
                    <th className="py-3.5 px-4">المحافظة / الفريق</th>
                    <th className="py-3.5 px-4">الهاتف</th>
                    <th className="py-3.5 px-4">المستوى</th>
                    <th className="py-3.5 px-4">الساعات</th>
                    <th className="py-3.5 px-4">النقاط</th>
                    <th className="py-3.5 px-4">الحالة</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {volunteers.map((vol) => {
                    const badge = getStatusBadge(vol.status);
                    return (
                      <tr key={vol.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-primary tracking-wider">
                          {vol.volunteerCode}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{vol.name}</div>
                          <span className="text-[10px] text-slate-400">{vol.jobTitle || vol.qualification || 'متطوع'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">{vol.governorate}</div>
                          <span className="text-[10px] text-slate-400">{vol.teamName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono" dir="ltr">
                          {vol.phone}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {vol.level}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {vol.totalHours} س
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-600">
                          {vol.totalPoints.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={`/volunteers/${vol.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-xs transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>الملف 360°</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {volunteers.map((vol) => {
                const badge = getStatusBadge(vol.status);
                return (
                  <div key={vol.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{vol.name}</h3>
                          <span className="font-mono text-xs font-bold text-primary">{vol.volunteerCode}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {vol.governorate} • {vol.teamName}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block">الساعات</span>
                        <span className="text-xs font-bold text-slate-800">{vol.totalHours} س</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">النقاط</span>
                        <span className="text-xs font-bold text-amber-600">{vol.totalPoints}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">المستوى</span>
                        <span className="text-[10px] font-bold text-slate-700 truncate block">{vol.level}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-600 font-mono" dir="ltr">{vol.phone}</span>
                      <Link
                        href={`/volunteers/${vol.id}`}
                        className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>عرض الملف الكامل</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {!loading && volunteers.length > 0 && (
          <div className="border-t border-slate-100">
            <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Add Volunteer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute left-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <span>تسجيل متطوع جديد وتوليد كود KAS</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                إدخال البيانات الرسمية للمتطوع واعتماده في منظومة جمعية خواطر أحلى شباب
              </p>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddVolunteer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم رباعي *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="الاسم كما هو مدون ببطاقة الرقم القومي"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الرقم القومي (14 رقم)</label>
                  <input
                    type="text"
                    maxLength={14}
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    placeholder="29XXXXXXXXXXXX"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المحافظة *</label>
                  <select
                    required
                    value={formData.governorate}
                    onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none"
                  >
                    {governoratesList.filter(g => g !== 'الكل').map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المركز / المدينة</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="مثال: الدقي / ملوي / بنها"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الفريق / اللجنة المسكن عليها</label>
                  <select
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none"
                  >
                    {teamsList.filter(t => t !== 'الكل').map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المستوى التطوعي</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none"
                  >
                    {(lists.levels.length ? lists.levels : [formData.level]).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">المهارات والخبرات السابقة</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="تنظيم، تصوير، قيادة، إسعافات، إكسيل..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {modalLoading ? 'جاري الحفظ وتوليد الكود...' : '💾 حفظ وإصدار الكود'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
