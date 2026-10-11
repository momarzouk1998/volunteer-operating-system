'use client';

import { useEffect, useState } from 'react';

/** بيبلّغ الشاشة المفتوحة إن النظام بيتحدث، وبعدين إن فيه نسخة أحدث ولازم Refresh.
 *  بيسأل /api/version كل دقيقة لما الشاشة ظاهرة + لما الموظف يرجع للشاشة — طلب واحد
 *  فى نفس الوقت، من غير تراكم. */
const DOWN = [502, 503, 504, 520, 521, 522, 523, 524];

export default function UpdateBanner() {
  const [state, setState] = useState<null | 'updating' | 'updated'>(null);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const mine = process.env.APP_BUILD_ID;

    async function check() {
      if (inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      try {
        const res = await fetch('/api/version', { cache: 'no-store', redirect: 'manual' });
        if (cancelled) return;
        if (DOWN.includes(res.status)) {
          setState((s) => (s === 'updated' ? s : 'updating'));
          return;
        }
        if (!res.ok) return;
        const d = await res.json();
        if (cancelled) return;
        if (d.buildId && mine && d.buildId !== mine) setState('updated');
        else setState((s) => (s === 'updating' ? null : s));
      } catch {
        /* مفيش نت — سيب اللى ظاهر */
      } finally {
        inFlight = false;
      }
    }

    check();
    const timer = setInterval(check, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  if (!state) return null;

  return (
    <div
      dir="rtl"
      role="status"
      className={`no-print print:hidden fixed inset-x-0 top-0 z-[100] flex flex-wrap items-center justify-center gap-3 px-4 py-2.5 text-sm font-bold shadow-lg ${
        state === 'updated' ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-black'
      }`}
    >
      {state === 'updated' ? (
        <>
          <span>✅ تم تحديث النظام — اعمل تحديث للصفحة عشان تشتغل على النسخة الجديدة</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-white px-3 py-1 font-black text-emerald-700 hover:bg-emerald-50"
          >
            تحديث الصفحة
          </button>
        </>
      ) : (
        <span>⏳ جارى تحديث النظام… استنى ثوانى وماتدوسش حفظ دلوقتى</span>
      )}
    </div>
  );
}
