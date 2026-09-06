'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, QrCode, Search, CheckCircle, ExternalLink, Printer, Trash2 } from 'lucide-react';
import { toast, confirmDialog } from '@/lib/ui';
import { SkeletonList } from '@/components/Skeleton';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/certificates');
      const data = await res.json();
      if (data.success) {
        setCertificates(data.certificates);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleRevoke = async (cert: any) => {
    if (!(await confirmDialog({ title: `سحب "${cert.type}"`, message: `الكود ${cert.code} — سيتم خصم النقاط الممنوحة معها من رصيد المتطوع.`, danger: true, confirmText: 'سحب' }))) return;
    try {
      const res = await fetch(`/api/certificates/${cert.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل السحب');
      toast('تم سحب الشهادة', 'success');
      fetchCerts();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" />
          <span>سجل الشهادات والأوسمة المعتمدة برمز QR</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          جميع الشهادات الممنوحة موثقة برمز استجابة سريع عام للتحقق دون كشف البيانات الحساسة
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <SkeletonList rows={5} />
        ) : certificates.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">لا توجد شهادات صادرة حالياً. يمكنك منح شهادة من صفحة بروفايل أي متطوع.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {certificates.map((cert) => (
              <div key={cert.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{cert.code}</span>
                    <h3 className="text-sm font-extrabold text-slate-900">{cert.volunteer?.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                      {cert.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">السبب: {cert.reason}</p>
                  <span className="text-[10px] text-slate-400 block">
                    تاريخ الإصدار: {cert.issuedAt?.split('T')[0]} • النقاط الممنوحة: +{cert.points}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/verify/${cert.code}`}
                    target="_blank"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>عرض الوثيقة</span>
                  </Link>
                  <button
                    onClick={() => handleRevoke(cert)}
                    className="px-3 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>سحب</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
