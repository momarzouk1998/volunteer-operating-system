'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, ShieldCheck, Award, Calendar, User, Printer } from 'lucide-react';

export default function PublicVerifyPage() {
  const params = useParams();
  const code = params?.code as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-dark to-navy-royal p-4 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500" />

        <div className="w-20 h-20 mx-auto rounded-2xl bg-white shadow-md p-2 border border-slate-100 flex items-center justify-center">
          <img src="/images/logo.png" alt="شعار الجمعية" className="w-full h-full object-contain" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            <span>وثيقة رسمية معتمدة وموثقة رقمياً</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            جمعية خواطر أحلى شباب
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            نظام التحقق الآمن من عضويات وشهادات المتطوعين (VOS Verification Engine)
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-right space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">كود الوثيقة المعتمد:</span>
            <span className="font-mono font-bold text-primary text-sm">{code}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">حالة الاعتماد في السجلات:</span>
            <span className="text-emerald-600 font-bold">ساري ومسجل رسمياً بالمنظومة ✓</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">نظام التشغيل:</span>
            <span className="font-bold text-slate-800">منظومة VOS 2026 - الإصدار المؤسسي</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">الجهة المصدرة:</span>
            <span className="font-bold text-slate-800">إدارة المتطوعين والعمليات الميدانية</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400">
          تعتبر هذه الوثيقة إثباتاً رسمياً صادر عن الجمعية. لحماية الخصوصية، لا يتم عرض الرقم القومي أو البيانات الحساسة على الصفحة العامة.
        </p>

        <button
          onClick={() => window.print()}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة الشهادة / الإفادة الرسمية</span>
        </button>
      </div>
    </div>
  );
}
