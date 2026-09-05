'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck, Plus, Calendar, MapPin, Users, AlertCircle, ShieldCheck,
  ChevronLeft, Filter, Search, Clock
} from 'lucide-react';

export default function ConvoysPage() {
  const [convoys, setConvoys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [governorate, setGovernorate] = useState('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'قافلة إغاثية',
    governorate: 'الجيزة',
    location: '',
    startDate: '',
    supervisor: '',
    requiredCount: 25,
    description: '',
  });

  const fetchConvoys = async () => {
    setLoading(true);
    try {
      const q = governorate !== 'الكل' ? `?governorate=${governorate}` : '';
      const res = await fetch(`/api/convoys${q}`);
      const data = await res.json();
      if (data.success) {
        setConvoys(data.convoys);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConvoys();
  }, [governorate]);

  const handleCreateConvoy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/convoys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchConvoys();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const typesList = [
    'قافلة إغاثية', 'قافلة طبية', 'إطعام وتوزيع وجبات', 'تركيب أسقف وبناء',
    'حفر ووصلات مياه', 'معارض كساء وتجهيز عرائس', 'دعم لوجستي وتخزين'
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            <span>إدارة وتشغيل القوافل الميدانية</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            جدولة القوافل، تسكين الفرق، رصد الاحتياج العددي، وتوزيع التكليفات الميدانية
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء قافلة جديدة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs">جاري تحميل القوافل...</div>
        ) : convoys.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs">لا توجد قوافل مسجلة. اضغط على إنشاء قافلة لجدولة مهمة جديدة.</div>
        ) : (
          convoys.map((c) => {
            const shortage = c.requiredCount - c.confirmedCount;
            return (
              <div key={c.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary">{c.code}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                      {c.type}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">{c.title}</h3>

                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.governorate} - {c.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.startDate?.split('T')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>المشرف: <strong className="text-slate-700">{c.supervisor}</strong></span>
                    </div>
                  </div>

                  {c.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl line-clamp-2">
                      {c.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">الجاهزية</span>
                    <span className="text-xs font-bold text-slate-800">{c.confirmedCount} / {c.requiredCount} متطوع</span>
                  </div>

                  <Link
                    href={`/convoys/${c.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <span>التشغيل والفرق</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Convoy Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">إنشاء قافلة ميدانية جديدة</h3>
            <form onSubmit={handleCreateConvoy} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم وعنوان القافلة *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: قافلة إغاثة قرى بني سويف الكبرى"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع القافلة *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {typesList.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المحافظة *</label>
                  <input
                    type="text"
                    required
                    value={formData.governorate}
                    onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الموقع الميداني / القرية *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="مركز الفشن وقرى الظهير"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الانطلاق *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المشرف الميداني</label>
                  <input
                    type="text"
                    value={formData.supervisor}
                    onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                    placeholder="اسم قائد القافلة"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاحتياج العددي (متطوع)</label>
                  <input
                    type="number"
                    value={formData.requiredCount}
                    onChange={(e) => setFormData({ ...formData, requiredCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تفاصيل وأهداف القافلة</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="الأنشطة المستهدفة، التوزيعات، خطة السير..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold"
                >
                  {saving ? 'جاري الإنشاء...' : 'حفظ القافلة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
