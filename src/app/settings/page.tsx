'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('تم حفظ وتحديث قواعد النقاط والإعدادات بنجاح!');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, val: string) => {
    setSettings(settings.map(s => s.key === key ? { ...s, value: val } : s));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          <span>إعدادات المنظومة وقواعد احتساب النقاط</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          تعديل معاملات النقاط وساعات التطوع وحد أيام عدم النشاط
        </p>
      </div>

      {msg && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
          ⭐ معاملات وقواعد الـ Gamification
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {settings.map((s) => (
            <div key={s.key} className="space-y-1">
              <label className="block font-bold text-slate-700">{s.description || s.key}</label>
              <input
                type="text"
                value={s.value}
                onChange={(e) => handleChange(s.key, e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono font-bold text-primary"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
