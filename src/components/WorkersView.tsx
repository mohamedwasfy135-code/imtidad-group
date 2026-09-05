"use client";
import { useState } from 'react';
export interface Worker { id: number; name: string; phone: string; job: string; dailyWage: number; }
export default function WorkersView({ workers, setWorkers }: { workers: Worker[]; setWorkers: React.Dispatch<React.SetStateAction<Worker[]>> }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [job, setJob] = useState(''); const [dailyWage, setDailyWage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim() || !job.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), job: job.trim(), dailyWage: parseFloat(dailyWage) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'فشل حفظ العامل'); return; }
      setWorkers(prev => [data.worker, ...prev]);
      setName(''); setPhone(''); setJob(''); setDailyWage(''); setShowForm(false);
    } catch {
      alert('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const prevWorkers = workers;
    setWorkers(prev => prev.filter(x => x.id !== id));
    try {
      const res = await fetch(`/api/workers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      alert('تعذر حذف العامل، سيتم استرجاعه');
      setWorkers(prevWorkers);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto" dir="rtl">
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">إدارة العمال</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">{showForm ? 'إخفاء النموذج' : '+ إضافة عامل جديد'}</button>
      </header>
      {showForm && (
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">تسجيل عامل جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div><label className="block text-sm text-slate-400 mb-1.5">الاسم الكامل *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="أدخل اسم العامل" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" /></div>
            <div><label className="block text-sm text-slate-400 mb-1.5">رقم الهاتف *</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" maxLength={8} className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none font-mono" /></div>
            <div><label className="block text-sm text-slate-400 mb-1.5">التخصص *</label><input type="text" value={job} onChange={(e) => setJob(e.target.value)} placeholder="كهربائي، سائق..." className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" /></div>
            <div><label className="block text-sm text-slate-400 mb-1.5">الأجر اليومي (د.ك)</label><input type="number" step="0.001" value={dailyWage} onChange={(e) => setDailyWage(e.target.value)} placeholder="0.000" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none font-mono" /></div>
          </div>
          <div className="flex gap-3"><button onClick={handleAdd} disabled={!name || !phone || !job || saving} className="px-6 py-3 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors">{saving ? 'جارٍ الحفظ...' : 'حفظ العامل'}</button><button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">إلغاء</button></div>
        </div>
      )}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden">
        {workers.length === 0 ? <div className="p-16 text-center text-slate-400">لا يوجد عمال مسجلين بعد.</div> : (
          <table className="w-full text-right"><thead className="bg-[#0f172a] text-slate-400 text-xs uppercase"><tr><th className="px-6 py-4">#</th><th className="px-6 py-4">الاسم</th><th className="px-6 py-4">الهاتف</th><th className="px-6 py-4">التخصص</th><th className="px-6 py-4">الأجر اليومي</th><th className="px-6 py-4">حذف</th></tr></thead>
          <tbody className="divide-y divide-slate-700/50">{workers.map((w, i) => (<tr key={w.id} className="hover:bg-slate-800/30 transition-colors"><td className="px-6 py-4 text-slate-500">{i + 1}</td><td className="px-6 py-4 text-white font-medium">{w.name}</td><td className="px-6 py-4 text-slate-300 font-mono" dir="ltr">{w.phone}</td><td className="px-6 py-4 text-slate-300">{w.job}</td><td className="px-6 py-4 text-emerald-400 font-bold font-mono">{w.dailyWage.toFixed(3)} د.ك</td><td className="px-6 py-4"><button onClick={() => handleDelete(w.id)} className="text-red-400 hover:text-red-300 text-lg">×</button></td></tr>))}</tbody></table>
        )}
      </div>
    </div>
  );
}
