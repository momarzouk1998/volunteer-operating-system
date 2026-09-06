'use client';

import React from 'react';

interface Props {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  className?: string;
  required?: boolean;
}

/**
 * حقل رقمي بقواعد OpenAppo:
 * - يبدأ فارغاً بدل صفر افتراضي
 * - step="any" لكتابة الكسور مباشرة
 * - يحدد المحتوى عند التركيز لسهولة الاستبدال
 */
export default function NumberInput({
  value, onChange, placeholder = '0', min, max, className = '', required,
}: Props) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step="any"
      required={required}
      min={min}
      max={max}
      placeholder={placeholder}
      value={value === 0 || value === undefined || Number.isNaN(value) ? '' : value}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      onFocus={(e) => e.target.select()}
      className={
        className ||
        'w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none text-xs'
      }
    />
  );
}
