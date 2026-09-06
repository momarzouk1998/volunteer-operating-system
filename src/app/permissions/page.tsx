'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck, Users, Building2, ListChecks, Table2, Save, Trash2, Plus,
  KeyRound, CheckCircle, X,
} from 'lucide-react';
import { ROLE_LABELS, PERMISSION_MATRIX, ALL_ADMIN_ROLES, type Role } from '@/lib/rbac';

const ALL_ROLES: Role[] = ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER', 'VOLUNTEER'];
type TabKey = 'users' | 'matrix' | 'geo' | 'lists' | 'rules';

export default function PermissionsPage() {
  const [tab, setTab] = useState<TabKey>('users');
  const [toast, setToast] = useState('');
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <span>الأدوار والصلاحيات وإدارة المنصة</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          التحكم الكامل في صلاحيات المستخدمين، المحافظات والفرق، القوائم المنسدلة، وقواعد النقاط — كلها في قاعدة البيانات.
        </p>
      </div>

      {toast && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {([
          { k: 'users', l: 'المستخدمون والأدوار', i: Users },
          { k: 'matrix', l: 'مصفوفة الصلاحيات', i: Table2 },
          { k: 'geo', l: 'المحافظات والفرق', i: Building2 },
          { k: 'lists', l: 'القوائم والتصنيفات', i: ListChecks },
          { k: 'rules', l: 'قواعد النقاط', i: KeyRound },
        ] as const).map(({ k, l, i: Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              tab === k ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" /> {l}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab flash={flash} />}
      {tab === 'matrix' && <MatrixTab />}
      {tab === 'geo' && <GeoTab flash={flash} />}
      {tab === 'lists' && <ListsTab flash={flash} />}
      {tab === 'rules' && <RulesTab flash={flash} />}
    </div>
  );
}

/* ------------------------------- المستخدمون ------------------------------- */
function UsersTab({ flash }: { flash: (m: string) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [govs, setGovs] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [u, l] = await Promise.all([
      fetch(`/api/admin/users?search=${encodeURIComponent(search)}`).then((r) => r.json()),
      fetch('/api/lists').then((r) => r.json()),
    ]);
    if (u.success) setUsers(u.users);
    if (l.success) setGovs(l.governorates);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const patch = async (id: string, payload: any, msg: string) => {
    setBusy(id);
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });
    const d = await res.json();
    flash(d.success ? msg : d.error || 'فشل التحديث');
    await load();
    setBusy(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم / الهاتف / الكود..."
          className="w-full sm:w-72 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-primary"
        />
      </div>
      {loading ? (
        <div className="p-10 text-center text-slate-400 text-xs">جاري التحميل...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="p-3">المستخدم</th>
                <th className="p-3">الدور</th>
                <th className="p-3">المحافظة</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{u.name}</div>
                    <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{u.phone}</span>
                  </td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      disabled={busy === u.id}
                      onChange={(e) => patch(u.id, { role: e.target.value }, 'تم تحديث الدور')}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={u.governorate || ''}
                      disabled={busy === u.id}
                      onChange={(e) => patch(u.id, { governorate: e.target.value }, 'تم تحديث المحافظة')}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    >
                      <option value="">— غير محدد —</option>
                      {govs.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={u.status}
                      disabled={busy === u.id}
                      onChange={(e) => patch(u.id, { status: e.target.value }, 'تم تحديث الحالة')}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    >
                      <option value="ACTIVE">نشط</option>
                      <option value="INACTIVE">غير نشط</option>
                      <option value="EXCLUDED">مستبعد</option>
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      disabled={busy === u.id}
                      onClick={() => { if (confirm(`تصفير كلمة مرور ${u.name} إلى 123456؟`)) patch(u.id, { resetPassword: true }, 'تم تصفير كلمة المرور'); }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> تصفير المرور
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- المصفوفة ------------------------------- */
function MatrixTab() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-[11px]">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>
              <th className="p-3 min-w-[180px]">الصلاحية / الميزة</th>
              {ALL_ADMIN_ROLES.map((r) => (
                <th key={r} className="p-3 text-center whitespace-nowrap">{ROLE_LABELS[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PERMISSION_MATRIX.map((row) => (
              <tr key={row.feature} className="hover:bg-slate-50/70">
                <td className="p-3 font-bold text-slate-800">{row.feature}</td>
                {ALL_ADMIN_ROLES.map((r) => (
                  <td key={r} className="p-3 text-center">
                    {row.roles.includes(r) ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 inline" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-300 inline" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="p-3 text-[10px] text-slate-400 border-t border-slate-100">
        هذه المصفوفة مطبّقة فعلياً على الخادم (middleware + فحص الدور في كل مسار API) وليست عرضاً فقط.
      </p>
    </div>
  );
}

/* --------------------------- المحافظات والفرق --------------------------- */
function GeoTab({ flash }: { flash: (m: string) => void }) {
  const [govs, setGovs] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [gName, setGName] = useState('');
  const [tName, setTName] = useState('');
  const [tGov, setTGov] = useState('');

  const load = useCallback(async () => {
    const [g, t] = await Promise.all([
      fetch('/api/admin/governorates').then((r) => r.json()),
      fetch('/api/admin/teams').then((r) => r.json()),
    ]);
    if (g.success) setGovs(g.items);
    if (t.success) setTeams(t.items);
  }, []);
  useEffect(() => { load(); }, [load]);

  const addGov = async () => {
    if (!gName.trim()) return;
    const d = await fetch('/api/admin/governorates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: gName }) }).then((r) => r.json());
    flash(d.success ? 'تمت إضافة المحافظة' : d.error);
    setGName(''); load();
  };
  const delGov = async (id: string) => {
    if (!confirm('حذف المحافظة؟')) return;
    const d = await fetch(`/api/admin/governorates?id=${id}`, { method: 'DELETE' }).then((r) => r.json());
    flash(d.success ? 'تم الحذف' : d.error); load();
  };
  const addTeam = async () => {
    if (!tName.trim()) return;
    const d = await fetch('/api/admin/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: tName, governorate: tGov || govs[0]?.name }) }).then((r) => r.json());
    flash(d.success ? 'تمت إضافة الفريق' : d.error);
    setTName(''); load();
  };
  const delTeam = async (id: string) => {
    if (!confirm('حذف الفريق؟')) return;
    const d = await fetch(`/api/admin/teams?id=${id}`, { method: 'DELETE' }).then((r) => r.json());
    flash(d.success ? 'تم الحذف' : d.error); load();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900">المحافظات ({govs.length})</h3>
        <div className="flex gap-2">
          <input value={gName} onChange={(e) => setGName(e.target.value)} placeholder="اسم محافظة جديدة" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-primary" />
          <button onClick={addGov} className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {govs.map((g) => (
            <div key={g.id} className="py-2 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">{g.name}</span>
              <button onClick={() => delGov(g.id)} className="text-rose-500 hover:bg-rose-50 rounded-lg p-1"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900">الفرق واللجان ({teams.length})</h3>
        <div className="flex gap-2">
          <input value={tName} onChange={(e) => setTName(e.target.value)} placeholder="اسم فريق جديد" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-primary" />
          <select value={tGov} onChange={(e) => setTGov(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-200 bg-white text-xs">
            <option value="">المحافظة</option>
            {govs.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
          <button onClick={addTeam} className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {teams.map((t) => (
            <div key={t.id} className="py-2 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">{t.name} <span className="text-slate-400 font-normal">• {t.governorate}</span></span>
              <button onClick={() => delTeam(t.id)} className="text-rose-500 hover:bg-rose-50 rounded-lg p-1"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- القوائم والتصنيفات --------------------------- */
function ListsTab({ flash }: { flash: (m: string) => void }) {
  const [lists, setLists] = useState<any[]>([]);
  const load = useCallback(async () => {
    const d = await fetch('/api/admin/lists').then((r) => r.json());
    if (d.success) setLists(d.lists);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (key: string, text: string) => {
    const values = text.split('\n').map((s) => s.trim()).filter(Boolean);
    const d = await fetch('/api/admin/lists', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, values }) }).then((r) => r.json());
    flash(d.success ? 'تم حفظ القائمة' : d.error);
    load();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {lists.map((l) => (
        <ListEditor key={l.key} l={l} onSave={save} />
      ))}
    </div>
  );
}
function ListEditor({ l, onSave }: { l: any; onSave: (k: string, t: string) => void }) {
  const [text, setText] = useState(l.values.join('\n'));
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-2">
      <h3 className="text-sm font-extrabold text-slate-900">{l.label}</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-primary font-mono"
      />
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-400">عنصر لكل سطر</span>
        <button onClick={() => onSave(l.key, text)} className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1"><Save className="w-3.5 h-3.5" /> حفظ</button>
      </div>
    </div>
  );
}

/* ------------------------------ قواعد النقاط ------------------------------ */
function RulesTab({ flash }: { flash: (m: string) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => {
    const d = await fetch('/api/settings').then((r) => r.json());
    if (d.success) setRows(d.settings.filter((s: any) => s.category !== 'LIST'));
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const d = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: rows }) }).then((r) => r.json());
    flash(d.success ? 'تم حفظ القواعد' : d.error || 'فشل الحفظ');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
      <h3 className="text-sm font-extrabold text-slate-900">قواعد النقاط وحد عدم النشاط</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {rows.map((s, i) => (
          <div key={s.key} className="space-y-1">
            <label className="block font-bold text-slate-700">{s.description || s.key}</label>
            <input
              value={s.value}
              onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-primary outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-2"><Save className="w-4 h-4" /> حفظ القواعد</button>
      </div>
    </div>
  );
}
