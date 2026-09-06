'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { CheckCircle, XCircle, Download, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { elementToPdf } from '@/lib/exportPdf';

export default function PublicVerifyPage() {
  const params = useParams();
  const code = params?.code as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [qr, setQr] = useState('');
  const [dl, setDl] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(code)}`);
        const json = await res.json();
        setData(json);
        if (typeof window !== 'undefined') {
          setQr(await QRCode.toDataURL(window.location.href, { width: 220, margin: 1, color: { dark: '#00469b', light: '#ffffff' } }));
        }
      } catch {
        setData({ valid: false });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-dark to-navy-royal flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  const valid = data?.valid;
  const isCert = data?.kind === 'CERTIFICATE';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-dark to-navy-royal p-4 py-8 flex items-center justify-center print:bg-white print:p-0">
      <div ref={cardRef} className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden relative print:shadow-none print:rounded-none print:max-w-none">
        {/* شريط علوي ملوّن */}
        <div className={`h-2 ${valid ? 'bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500' : 'bg-rose-500'}`} />

        <div className="p-8 sm:p-10 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white shadow-md p-2 border border-slate-100 flex items-center justify-center">
            <img src="/images/logo.png" alt="شعار الجمعية" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">جمعية خواطر أحلى شباب</h1>
            <p className="text-xs text-slate-500 font-semibold">نظام التحقق الآمن من عضويات وشهادات المتطوعين</p>
          </div>

          {valid ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle className="w-4 h-4" />
              <span>{isCert ? 'شهادة رسمية معتمدة وموثقة رقمياً' : 'عضوية سارية ومسجلة رسمياً بالمنظومة'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
              <XCircle className="w-4 h-4" />
              <span>لا يوجد سجل مطابق لهذا الكود</span>
            </div>
          )}

          {valid && (
            <>
              {isCert && (
                <div className="py-2">
                  <p className="text-[11px] text-slate-400 font-semibold">تشهد الجمعية بأن</p>
                  <p className="text-lg font-black text-primary mt-1">{data.holderName}</p>
                  <p className="text-xs text-slate-600 mt-1">قد حصل على «{data.certificateType}»</p>
                  {data.reason && <p className="text-[11px] text-slate-500 mt-1 italic">{data.reason}</p>}
                </div>
              )}

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-right space-y-3 text-xs">
                <Row label="كود الوثيقة المعتمد" value={data.documentCode} mono />
                {data.holderName && !isCert && <Row label="اسم المتطوع" value={data.holderName} />}
                {data.volunteerCode && <Row label="كود العضوية" value={data.volunteerCode} mono />}
                {data.governorate && <Row label="المحافظة / الفرع" value={data.governorate} />}
                {data.team && <Row label="الفريق" value={data.team} />}
                {data.level && <Row label="مستوى المتطوع" value={data.level} />}
                <Row label="تاريخ الإصدار" value={formatDate(data.issuedAt)} />
                <Row label="نظام التشغيل" value="منظومة VOS 2026 - الإصدار المؤسسي" />
              </div>

              {qr && (
                <div className="flex flex-col items-center gap-1.5">
                  <img src={qr} alt="QR" className="w-28 h-28" />
                  <span className="text-[10px] text-slate-400">رمز التحقق من صحة هذه الوثيقة</span>
                </div>
              )}
            </>
          )}

          <p className="text-[10px] text-slate-400">
            وثيقة إثبات رسمية صادرة عن الجمعية. لحماية الخصوصية لا يتم عرض الرقم القومي أو أي بيانات حساسة على الصفحة العامة.
          </p>

          <button
            onClick={async () => {
              if (!cardRef.current) return;
              setDl(true);
              try { await elementToPdf(cardRef.current, `${data?.documentCode || 'vos'}.pdf`); }
              catch { window.print(); }
              finally { setDl(false); }
            }}
            disabled={dl}
            className="no-print w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>{dl ? 'جاري التحضير...' : 'تحميل PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}:</span>
      <span className={`font-bold text-slate-800 ${mono ? 'font-mono text-primary' : ''}`}>{value || '-'}</span>
    </div>
  );
}
