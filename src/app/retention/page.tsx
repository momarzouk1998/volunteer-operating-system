'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RotateCcw, Phone, Calendar, CheckCircle, MessageSquare,
  AlertTriangle, Users, ArrowRight, Clock
} from 'lucide-react';

export default function RetentionPage() {
  const [inactiveVolunteers, setInactiveVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedVol, setSelectedVol] = useState<any>(null);
  const [contactModal, setContactModal] = useState(false);
  const [reason, setReason] = useState('');
  const [whatEncourages, setWhatEncourages] = useState('');
  const [contactOutcome, setContactOutcome] = useState('تم التواصل هاتفياً ورحب بالمشاركة في القافلة القادمة');
  const [nextAction, setNextAction] = useState('إرسال تكليف القافلة');
  const [retentionStatus, setRetentionStatus] = useState('تمت الاستعادة بنجاح');
  const [saving, setSaving] = useState(false);

  const fetchRetention = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/retention');
      const data = await res.json();
      if (data.success) {
        setInactiveVolunteers(data.inactiveVolunteers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetention();
  }, []);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVol) return;
    setSaving(true);
    try {
      const res = await fetch('/api/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: selectedVol.id,
          reason,
          whatEncourages,
          contactOutcome,
          nextAction,
          status: retentionStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContactModal(false);
        fetchRetention();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-primary" />
          <span>مركز استعادة وتنشيط المتطوعين القدامى</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          رصد المتطوعين الذين تجاوزوا 60 يوماً دون مشاركة ميدانية لتجديد التواصل وحل أسباب الانقطاع
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">جاري فحص سجلات النشاط...</div>
        ) : inactiveVolunteers.length === 0 ? (
          <div className="p-12 text-center text-emerald-600 font-bold text-xs">
            🎉 رائع! جميع المتطوعين نشطون وشاركوا خلال آخر 60 يوماً.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {inactiveVolunteers.map((vol) => (
              <div key={vol.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{vol.volunteerCode}</span>
                    <Link href={`/volunteers/${vol.id}`} className="text-sm font-extrabold text-slate-900 hover:text-primary">
                      {vol.name}
                    </Link>
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      منقطع منذ {vol.lastActiveDate ? Math.floor((new Date().getTime() - new Date(vol.lastActiveDate).getTime()) / (1000 * 3600 * 24)) : 60} يوماً
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>الهاتف: <strong className="text-slate-800 font-mono" dir="ltr">{vol.phone}</strong></span>
                    <span>المحافظة: {vol.governorate}</span>
                    <span>الفريق: {vol.teamName}</span>
                    <span>الرصيد التراكمي: {vol.totalHours} ساعة • {vol.totalPoints} نقطة</span>
                  </div>
                  {vol.retentionRecords && vol.retentionRecords[0] && (
                    <div className="text-[11px] text-blue-700 bg-blue-50 p-2 rounded-xl mt-1">
                      آخر نتيجة تواصل: <strong>{vol.retentionRecords[0].contactOutcome}</strong> (الإجراء التالي: {vol.retentionRecords[0].nextAction})
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => { setSelectedVol(vol); setContactModal(true); }}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span>تسجيل نتيجة التواصل والمتابعة</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {contactModal && selectedVol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900">متابعة استعادة المتطوع: {selectedVol.name}</h3>
            <form onSubmit={handleSaveContact} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب الابتعاد أو الانقطاع</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ظروف عمل، دراسة، سفر، مواعيد غير مناسبة..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ما يشجعه على العودة والمشاركة</label>
                <input
                  type="text"
                  value={whatEncourages}
                  onChange={(e) => setWhatEncourages(e.target.value)}
                  placeholder="مهام مسائية، قوافل يوم الجمعة فقط، إعلام وتوثيق..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نتيجة التواصل الهاتفي</label>
                <textarea
                  rows={2}
                  required
                  value={contactOutcome}
                  onChange={(e) => setContactOutcome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الإجراء التالي</label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="إرسال تكليف القافلة القادمة"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حالة المتطوع بعد الاتصال</label>
                  <select
                    value={retentionStatus}
                    onChange={(e) => setRetentionStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="تمت الاستعادة بنجاح">تمت الاستعادة بنجاح</option>
                    <option value="قيد المتابعة">قيد المتابعة</option>
                    <option value="معتذر مؤقتاً">معتذر مؤقتاً</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContactModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ المتابعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
