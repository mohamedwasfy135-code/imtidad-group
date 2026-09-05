"use client";
import { useState, useMemo, useRef } from 'react';
import { Project, Expense } from './ProjectsView';

interface ExpensesViewProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  projects: Project[];
}

export default function ExpensesView({ expenses, setExpenses, projects }: ExpensesViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'project' | 'admin'>('admin');
  const [projectId, setProjectId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [existingInvoiceFile, setExistingInvoiceFile] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const isSubmitting = useRef(false);

  const [filterType, setFilterType] = useState<'all' | 'project' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const resetForm = () => {
    setDesc(''); setAmount(''); setFile(null); setExistingInvoiceFile(undefined);
    setEditingId(null); setShowForm(false);
    setDate(new Date().toISOString().split('T')[0]); setType('admin'); setProjectId('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setDesc(exp.description);
    setAmount(String(exp.amount));
    setDate(exp.date);
    setType(exp.type);
    setProjectId(exp.projectId || '');
    setExistingInvoiceFile(exp.invoiceFile);
    setFile(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!desc || !amount || (type === 'project' && !projectId)) return;
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setSaving(true);

    let fileType: 'image' | 'pdf' | undefined = undefined;
    if (file) fileType = file.type.includes('pdf') ? 'pdf' : 'image';

    try {
      const isEdit = editingId !== null;
      const url = isEdit ? `/api/expenses/${editingId}` : '/api/expenses';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: type === 'project' ? projectId : null,
          date,
          description: desc,
          amount: parseFloat(amount) || 0,
          type,
          invoiceFile: file?.name || existingInvoiceFile,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'فشل حفظ المصروف'); return; }

      if (isEdit) {
        setExpenses(prev => prev.map(x => x.id === editingId ? { ...data.expense, fileType: fileType || x.fileType } : x));
      } else {
        setExpenses(prev => [...prev, { ...data.expense, fileType }]);
      }
      resetForm();
    } catch {
      alert('تعذر الاتصال بالخادم');
    } finally {
      isSubmitting.current = false;
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد حذف هذا المصروف نهائياً؟')) return;
    const prev = expenses;
    setExpenses(list => list.filter(x => x.id !== id));
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      alert('تعذر حذف المصروف، سيتم استرجاعه');
      setExpenses(prev);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchType = filterType === 'all' ? true : e.type === filterType;
      const matchSearch = searchQuery
        ? e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.invoiceFile?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      return matchType && matchSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filterType, searchQuery]);

  const totals = useMemo(() => {
    const adminTotal = expenses.filter(e => e.type === 'admin').reduce((s, e) => s + e.amount, 0);
    const projectTotal = expenses.filter(e => e.type === 'project').reduce((s, e) => s + e.amount, 0);
    return { adminTotal, projectTotal, grandTotal: adminTotal + projectTotal };
  }, [expenses]);

  const getProjectName = (id: string | null | undefined) => {
    if (!id) return '-';
    return projects.find(p => p.id === id)?.name || 'مشروع محذوف';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">سجل المصروفات</h2>
          <p className="text-slate-400">إدارة جميع النفقات الإدارية وتكاليف المشاريع من مكان واحد</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2">
          <span>+</span> تسجيل مصروف جديد
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-slate-400 text-sm mb-2">المصروفات الإدارية</h3>
          <p className="text-2xl font-bold text-orange-400 font-mono">{totals.adminTotal.toLocaleString()} د.ك</p>
        </div>
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-slate-400 text-sm mb-2">تكاليف المشاريع</h3>
          <p className="text-2xl font-bold text-red-400 font-mono">{totals.projectTotal.toLocaleString()} د.ك</p>
        </div>
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-slate-400 text-sm mb-2">إجمالي النفقات</h3>
          <p className="text-2xl font-bold text-white font-mono">{totals.grandTotal.toLocaleString()} د.ك</p>
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث في الوصف أو اسم الملف..."
            className="w-full bg-[#0f172a] border border-slate-700 rounded-lg pr-4 pl-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none" />
        </div>
        <div className="flex bg-[#0f172a] rounded-lg p-1 border border-slate-700 w-full md:w-auto">
          {(['all', 'admin', 'project'] as const).map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filterType === t ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}>
              {t === 'all' ? 'الكل' : t === 'admin' ? 'إداري' : 'مشاريع'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[1000px]">
            <thead className="bg-[#162032] text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">التاريخ</th>
                <th className="px-6 py-4 font-medium">النوع</th>
                <th className="px-6 py-4 font-medium">الوصف</th>
                <th className="px-6 py-4 font-medium">المشروع / الجهة</th>
                <th className="px-6 py-4 font-medium">الفاتورة</th>
                <th className="px-6 py-4 font-medium text-left">المبلغ</th>
                <th className="px-6 py-4 font-medium text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredExpenses.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">لا توجد مصروفات مسجلة تطابق معايير البحث.</td></tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">{e.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        e.type === 'admin'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {e.type === 'admin' ? 'مصروف إداري' : 'تكلفة مشروع'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{e.description}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {e.type === 'project' ? getProjectName(e.projectId) : 'الإدارة العامة'}
                    </td>
                    <td className="px-6 py-4">
                      {e.invoiceFile ? (
                        <span className={`text-xs px-2 py-1 rounded border flex items-center gap-1 w-fit ${
                          e.fileType === 'pdf' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {e.fileType === 'pdf' ? 'PDF' : 'IMG'}: {e.invoiceFile}
                        </span>
                      ) : <span className="text-slate-600 text-sm">-</span>}
                    </td>
                    <td className="px-6 py-4 text-red-400 font-bold font-mono text-left">{e.amount.toFixed(3)} د.ك</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenEdit(e)}
                          className="text-blue-400 hover:text-blue-300 text-xs px-2.5 py-1.5 rounded border border-blue-500/30 hover:bg-blue-500/10 transition-colors">
                          تعديل
                        </button>
                        <button onClick={() => handleDelete(e.id)}
                          className="text-red-400 hover:text-red-300 text-xs px-2.5 py-1.5 rounded border border-red-500/30 hover:bg-red-500/10 transition-colors">
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">{editingId !== null ? 'تعديل المصروف' : 'تسجيل مصروف جديد'}</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-1 bg-[#0f172a] rounded-lg border border-slate-700">
                <button onClick={() => setType('admin')} className={`py-2.5 rounded-md text-sm font-medium transition-all ${type === 'admin' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  مصروف إداري
                </button>
                <button onClick={() => setType('project')} className={`py-2.5 rounded-md text-sm font-medium transition-all ${type === 'project' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  تكلفة مشروع
                </button>
              </div>

              {type === 'project' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">اختر المشروع *</label>
                  <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-red-500 outline-none appearance-none cursor-pointer">
                    <option value="">-- اختر مشروع --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">الوصف *</label>
                <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
                  placeholder={type === 'admin' ? "مثال: فاتورة كهرباء المكتب..." : "مثال: شراء أسمنت..."}
                  className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">المبلغ (د.ك) *</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.000"
                    className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">التاريخ</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none [color-scheme:dark]" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">إرفاق فاتورة (صورة/PDF)</label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center hover:border-blue-500/50 transition-colors relative cursor-pointer">
                  <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {file ? (
                    <span className="text-blue-400 text-sm font-medium">📎 {file.name}</span>
                  ) : existingInvoiceFile ? (
                    <span className="text-slate-400 text-sm">📎 {existingInvoiceFile} (اضغط للاستبدال)</span>
                  ) : (
                    <span className="text-slate-500 text-sm">اضغط هنا لرفع الملف</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={handleSave} disabled={!desc || !amount || (type === 'project' && !projectId) || saving}
                className="flex-1 py-3 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors font-medium">
                {saving ? 'جارٍ الحفظ...' : (editingId !== null ? 'حفظ التعديلات' : 'حفظ المصروف')}
              </button>
              <button onClick={resetForm}
                className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
