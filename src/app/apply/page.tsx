'use client';

import React, { useState } from 'react';
import { HeartHandshake, CheckCircle, ArrowLeft, Phone, User, MapPin } from 'lucide-react';

export default function ApplyPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    phone: '',
    whatsapp: '',
    governorate: 'الجيزة',
    city: '',
    qualification: '',
    major: '',
    skills: '',
    preferredFields: '',
    source: 'الموقع الإلكتروني',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال الطلب');

      setSuccessMsg(data.message || 'تم إرسال طلبك بنجاح!');
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  const governoratesList = [
    'القاهرة', 'الجيزة', 'القليوبية', 'الإسكندرية', 'المنيا', 
    'مطروح', 'بني سويف', 'الفيوم', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-dark to-navy-royal p-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="text-center mb-6 space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white p-2 shadow-md border border-slate-100 flex items-center justify-center">
            <img src="/images/logo.png" alt="الشعار" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            طلب الانضمام لأسرة متطوعي جمعية خواطر أحلى شباب
          </h1>
          <p className="text-xs text-primary font-bold">
            كن جزءاً من قوافل العطاء والمبادرات الإنسانية في محافظات مصر
          </p>
        </div>

        {successMsg ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{successMsg}</h2>
            <p className="text-xs text-slate-500">
              سيقوم فريق إدارة المتطوعين بمراجعة طلبك والتواصل معك لتحديد موعد المقابلة الشخصية.
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md"
            >
              <span>العودة لصفحة الدخول</span>
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">الاسم رباعي *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="الاسم كما هو مدون ببطاقة الرقم القومي"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الواتساب</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المحافظة *</label>
                <select
                  required
                  value={formData.governorate}
                  onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
                >
                  {governoratesList.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المركز / المدينة</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="مثال: الدقي / ملوي / بنها"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المؤهل الدراسي</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="طالب / بكالوريوس..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">التخصص</label>
                <input
                  type="text"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  placeholder="تجارة / هندسة / طب / آداب..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">المهارات والخبرات السابقة</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="تنظيم، تصوير، قيادة فرق، إسعافات أولية..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">المجالات المفضلة للتطوع</label>
                <input
                  type="text"
                  value={formData.preferredFields}
                  onChange={(e) => setFormData({ ...formData, preferredFields: e.target.value })}
                  placeholder="قوافل إغاثة، قوافل علاجية، إطعام، معارض كساء..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <a href="/login" className="text-xs font-bold text-slate-500 hover:text-slate-700">
                لديك حساب بالفعل؟ تسجيل الدخول
              </a>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md shadow-primary/20 transition-all disabled:opacity-50"
              >
                {loading ? 'جاري إرسال الطلب...' : 'إرسال طلب التطوع 🚀'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
