'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { EGYPT_GOVERNORATES, ARABIC_NAME_RE, EG_PHONE_RE, NATIONAL_ID_RE } from '@/lib/egypt';

const EMPTY = {
  fullName: '', nationalId: '', gender: '', dob: '', phone: '', whatsapp: '', email: '',
  governorate: '', city: '', address: '', qualification: '', major: '',
  skills: '', preferredFields: '', emergencyContact: '',
  volunteeredBefore: 'no', prevOrg: '', prevRole: '',
  source: 'الموقع الإلكتروني',
};

export default function ApplyPage() {
  const [f, setF] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [govs, setGovs] = useState<string[]>(EGYPT_GOVERNORATES);

  useEffect(() => {
    fetch('/api/public/lists')
      .then((r) => r.json())
      .then((d) => { if (d.governorates?.length) setGovs(d.governorates); })
      .catch(() => {});
  }, []);

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const validate = (): string | null => {
    if (!ARABIC_NAME_RE.test(f.fullName.trim())) return 'الاسم يجب أن يكون بالحروف العربية فقط';
    if (f.fullName.trim().split(/\s+/).length < 2) return 'يرجى إدخال الاسم كاملاً';
    if (!NATIONAL_ID_RE.test(f.nationalId)) return 'الرقم القومي يجب أن يكون 14 رقماً بالضبط';
    if (f.gender !== 'ذكر' && f.gender !== 'أنثى') return 'يرجى تحديد النوع (ذكر / أنثى)';
    if (!f.dob) return 'تاريخ الميلاد مطلوب';
    if (!EG_PHONE_RE.test(f.phone)) return 'رقم الهاتف غير صحيح (11 رقماً يبدأ بـ 010/011/012/015)';
    if (!EG_PHONE_RE.test(f.whatsapp)) return 'رقم الواتساب غير صحيح (11 رقماً)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return 'البريد الإلكتروني غير صحيح';
    if (!f.governorate) return 'يرجى اختيار المحافظة';
    for (const [k, label] of [['city', 'المركز/المدينة'], ['address', 'العنوان'], ['qualification', 'المؤهل'], ['major', 'التخصص'], ['skills', 'المهارات'], ['preferredFields', 'المجالات المفضلة'], ['emergencyContact', 'جهة الطوارئ']] as const) {
      if (!(f as any)[k]?.trim()) return `حقل «${label}» مطلوب`;
    }
    if (f.volunteeredBefore === 'yes' && (!f.prevOrg.trim() || !f.prevRole.trim())) {
      return 'يرجى إدخال اسم الجمعية السابقة ودورك بها';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) { setErrorMsg(v); return; }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, volunteeredBefore: f.volunteeredBefore === 'yes' }),
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

  const input = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none focus:border-primary';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-dark to-navy-royal p-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="text-center mb-6 space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white p-2 shadow-md border border-slate-100 flex items-center justify-center">
            <img src="/images/logo.png" alt="الشعار" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            طلب انضمام متطوع لجمعية خواطر أحلى شباب
          </h1>
        </div>

        {successMsg ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{successMsg}</h2>
            <p className="text-xs text-slate-500">
              سيقوم فريق إدارة المتطوعين بمراجعة طلبك والتواصل معك لتحديد موعد المقابلة الشخصية.
              وبعد اعتماد طلبك ستصلك بيانات الدخول على بريدك الإلكتروني.
            </p>
            <a href="/login" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md">
              <span>العودة لصفحة الدخول</span>
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">{errorMsg}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">الاسم رباعي (عربي) *</label>
                <input type="text" required value={f.fullName}
                  onChange={(e) => set('fullName', e.target.value.replace(/[^ء-يـً-ْ\s]/g, ''))}
                  placeholder="الاسم كما هو مدون ببطاقة الرقم القومي" className={input} />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الرقم القومي (14 رقم) *</label>
                <input type="text" inputMode="numeric" required value={f.nationalId}
                  onChange={(e) => set('nationalId', e.target.value.replace(/\D/g, '').slice(0, 14))}
                  placeholder="14 رقماً" className={`${input} font-mono`} dir="ltr" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">النوع *</label>
                <div className="flex items-center gap-4 px-1 py-2">
                  <label className="flex items-center gap-1.5"><input type="radio" name="gender" checked={f.gender === 'ذكر'} onChange={() => set('gender', 'ذكر')} /> ذكر</label>
                  <label className="flex items-center gap-1.5"><input type="radio" name="gender" checked={f.gender === 'أنثى'} onChange={() => set('gender', 'أنثى')} /> أنثى</label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ الميلاد *</label>
                <input type="date" required value={f.dob} onChange={(e) => set('dob', e.target.value)} className={input} dir="ltr" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                <input type="tel" inputMode="numeric" required value={f.phone}
                  onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="01XXXXXXXXX" className={`${input} font-mono`} dir="ltr" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الواتساب *</label>
                <input type="tel" inputMode="numeric" required value={f.whatsapp}
                  onChange={(e) => set('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="01XXXXXXXXX" className={`${input} font-mono`} dir="ltr" />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني * (سيُستخدم للدخول)</label>
                <input type="email" required value={f.email} onChange={(e) => set('email', e.target.value.trim())}
                  placeholder="name@example.com" className={`${input} font-mono`} dir="ltr" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المحافظة *</label>
                <select required value={f.governorate} onChange={(e) => set('governorate', e.target.value)} className={input}>
                  <option value="">— اختر المحافظة —</option>
                  {govs.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">المركز / المدينة *</label>
                <input type="text" required value={f.city} onChange={(e) => set('city', e.target.value)}
                  placeholder="مثال: الدقي / ملوي / بنها" className={input} />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">العنوان بالتفصيل *</label>
                <input type="text" required value={f.address} onChange={(e) => set('address', e.target.value)}
                  placeholder="الحي، الشارع، رقم العقار" className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">جهة اتصال للطوارئ (اسم + رقم) *</label>
                <input type="text" required value={f.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)}
                  placeholder="مثال: والد المتطوع - 01XXXXXXXXX" className={input} />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المؤهل الدراسي *</label>
                <input type="text" required value={f.qualification} onChange={(e) => set('qualification', e.target.value)}
                  placeholder="طالب / بكالوريوس..." className={input} />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">التخصص *</label>
                <input type="text" required value={f.major} onChange={(e) => set('major', e.target.value)}
                  placeholder="تجارة / هندسة / طب / آداب..." className={input} />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">المهارات والخبرات السابقة *</label>
                <input type="text" required value={f.skills} onChange={(e) => set('skills', e.target.value)}
                  placeholder="تنظيم، تصوير، قيادة فرق، إسعافات أولية..." className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">المجالات المفضلة للتطوع *</label>
                <input type="text" required value={f.preferredFields} onChange={(e) => set('preferredFields', e.target.value)}
                  placeholder="قوافل إغاثة، قوافل علاجية، إطعام، معارض كساء..." className={input} />
              </div>

              {/* هل تطوعت من قبل؟ */}
              <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block font-bold text-slate-700">هل تطوعت من قبل؟ *</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5"><input type="radio" name="vb" checked={f.volunteeredBefore === 'yes'} onChange={() => set('volunteeredBefore', 'yes')} /> نعم</label>
                  <label className="flex items-center gap-1.5"><input type="radio" name="vb" checked={f.volunteeredBefore === 'no'} onChange={() => set('volunteeredBefore', 'no')} /> لا</label>
                </div>
                {f.volunteeredBefore === 'yes' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">اسم الجمعية أو المؤسسة *</label>
                      <input type="text" value={f.prevOrg} onChange={(e) => set('prevOrg', e.target.value)} className={input} />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ما كان دورك / طبيعة تطوعك؟ *</label>
                      <input type="text" value={f.prevRole} onChange={(e) => set('prevRole', e.target.value)} className={input} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <a href="/login" className="text-xs font-bold text-slate-500 hover:text-slate-700">لديك حساب بالفعل؟ تسجيل الدخول</a>
              <button type="submit" disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md shadow-primary/20 transition-all disabled:opacity-50">
                {loading ? 'جاري إرسال الطلب...' : 'إرسال طلب التطوع'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
