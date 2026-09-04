"use client";
import { useState, useMemo } from 'react';

// تعريف أنواع البيانات
export interface Project { 
  id: string; 
  name: string; 
  client: string; 
  budget: number; 
}

export interface Expense {
  id: number;
  projectId: string;
  date: string;
  description: string;
  amount: number;
  invoiceFile?: string;
  fileType?: 'image' | 'pdf';
}

export interface Payment {
  id: number;
  projectId: string;
  date: string;
  amount: number;
  notes: string;
  checkImage?: string; // اسم ملف صورة الشيك
}

interface ProjectsViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
}

export default function ProjectsView({ 
  projects, setProjects, 
  expenses, setExpenses, 
  payments, setPayments 
}: ProjectsViewProps) {
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // حالة نموذج إضافة مشروع جديد
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjBudget, setNewProjBudget] = useState('');

  // حالة نموذج إضافة تكلفة
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expFile, setExpFile] = useState<File | null>(null);

  // حالة نموذج إضافة دفعة (محدث لإضافة صورة الشيك)
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [checkFile, setCheckFile] = useState<File | null>(null); // ملف صورة الشيك

  // --- دوال المساعدة ---
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  const getProjectExpenses = (pid: string) => expenses.filter(e => e.projectId === pid);
  const getProjectPayments = (pid: string) => payments.filter(p => p.projectId === pid);
  
  const getTotalSpent = (pid: string) => 
    getProjectExpenses(pid).reduce((sum, e) => sum + e.amount, 0);

  const handleAddProject = () => {
    if (!newProjName || !newProjBudget) return;
    setProjects(prev => [...prev, {
      id: Date.now().toString(),
      name: newProjName,
      client: newProjClient,
      budget: parseFloat(newProjBudget) || 0
    }]);
    setNewProjName(''); setNewProjClient(''); setNewProjBudget('');
    setShowNewProjectForm(false);
  };

  const handleAddExpense = () => {
    if (!selectedProjectId || !expDesc || !expAmount) return;
    
    let fileType: 'image' | 'pdf' | undefined = undefined;
    if (expFile) {
      fileType = expFile.type.includes('pdf') ? 'pdf' : 'image';
    }

    setExpenses(prev => [...prev, {
      id: Date.now(),
      projectId: selectedProjectId,
      date: expDate,
      description: expDesc,
      amount: parseFloat(expAmount) || 0,
      invoiceFile: expFile?.name,
      fileType
    }]);
    
    setExpDesc(''); setExpAmount(''); setExpFile(null);
    setShowExpenseForm(false);
  };

  // دالة حفظ الدفعة مع صورة الشيك
  const handleAddPayment = () => {
    if (!selectedProjectId || !payAmount) return;
    
    setPayments(prev => [...prev, {
      id: Date.now(),
      projectId: selectedProjectId,
      date: payDate,
      amount: parseFloat(payAmount) || 0,
      notes: payNotes,
      checkImage: checkFile?.name // حفظ اسم الملف للعرض
    }]);
    
    setPayAmount(''); setPayNotes(''); setCheckFile(null);
    setShowPaymentForm(false);
  };

  // محاكاة رفع الملفات
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  // --- العرض الرئيسي ---
  if (!selectedProjectId) {
    // عرض قائمة المشاريع
    return (
      <div className="p-8 max-w-6xl mx-auto" dir="rtl">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">إدارة المشاريع</h2>
          <button onClick={() => setShowNewProjectForm(!showNewProjectForm)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
            {showNewProjectForm ? 'إخفاء النموذج' : '+ مشروع جديد'}
          </button>
        </header>

        {showNewProjectForm && (
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-xl font-bold text-white mb-6">تسجيل مشروع جديد</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div><label className="block text-sm text-slate-400 mb-1.5">اسم المشروع *</label><input type="text" value={newProjName} onChange={(e) => setNewProjName(e.target.value)} placeholder="مثال: مبنى صباح الأحمد" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" /></div>
              <div><label className="block text-sm text-slate-400 mb-1.5">اسم العميل</label><input type="text" value={newProjClient} onChange={(e) => setNewProjClient(e.target.value)} placeholder="مثال: شركة الأبراج" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" /></div>
              <div><label className="block text-sm text-slate-400 mb-1.5">الميزانية (د.ك) *</label><input type="number" value={newProjBudget} onChange={(e) => setNewProjBudget(e.target.value)} placeholder="0.000" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none font-mono" /></div>
            </div>
            <div className="flex gap-3"><button onClick={handleAddProject} disabled={!newProjName || !newProjBudget} className="px-6 py-3 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors">حفظ المشروع</button><button onClick={() => setShowNewProjectForm(false)} className="px-6 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">إلغاء</button></div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full p-16 text-center text-slate-400 bg-[#1e293b] rounded-2xl border border-dashed border-slate-700">لا توجد مشاريع مسجلة بعد.</div>
          ) : (
            projects.map((p) => {
              const spent = getTotalSpent(p.id);
              const progress = Math.min((spent / p.budget) * 100, 100);
              return (
                <div key={p.id} onClick={() => setSelectedProjectId(p.id)} 
                  className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/10 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{p.name}</h3>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700">عرض التفاصيل</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-6">العميل: {p.client || 'غير محدد'}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-slate-400">الميزانية:</span><span className="text-white font-mono">{p.budget.toLocaleString()} د.ك</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400">المنصرف:</span><span className="text-red-400 font-mono">{spent.toLocaleString()} د.ك</span></div>
                    <div className="w-full bg-[#0f172a] rounded-full h-2 mt-2 overflow-hidden">
                      <div className={`h-2 rounded-full transition-all duration-500 ${progress > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${progress}%`}}></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // --- عرض تفاصيل المشروع المحدد ---
  const projExpenses = getProjectExpenses(selectedProjectId);
  const projPayments = getProjectPayments(selectedProjectId);
  const totalSpent = projExpenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid = projPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8" dir="rtl">
      {/* رأس الصفحة وزر العودة */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <button onClick={() => setSelectedProjectId(null)} className="text-slate-400 hover:text-white text-sm mb-2 flex items-center gap-1 transition-colors">
             ← العودة لقائمة المشاريع
          </button>
          <h2 className="text-3xl font-bold text-white">{selectedProject?.name}</h2>
          <p className="text-slate-400 text-sm mt-1">العميل: {selectedProject?.client}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowExpenseForm(true)} className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2">
            <span>+</span> إضافة تكلفة
          </button>
          <button onClick={() => setShowPaymentForm(true)} className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2">
            <span>+</span> إضافة دفعة
          </button>
        </div>
      </div>

      {/* بطاقات الملخص المالي */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-slate-400 text-sm mb-2">الميزانية المعتمدة</h3>
          <p className="text-2xl font-bold text-white font-mono">{selectedProject?.budget.toLocaleString()} د.ك</p>
        </div>
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-slate-400 text-sm mb-2">إجمالي التكاليف</h3>
          <p className="text-2xl font-bold text-red-400 font-mono">{totalSpent.toLocaleString()} د.ك</p>
        </div>
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-slate-400 text-sm mb-2">إجمالي المدفوعات</h3>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{totalPaid.toLocaleString()} د.ك</p>
        </div>
      </div>

      {/* قسم التكاليف */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-red-400">💸</span> سجل التكاليف</h3>
          <span className="text-sm text-slate-500">{projExpenses.length} عملية</span>
        </div>
        {projExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500">لا توجد تكاليف مسجلة لهذا المشروع.</div>
        ) : (
          <table className="w-full text-right">
            <thead className="bg-[#162032] text-slate-400 text-xs uppercase">
              <tr><th className="px-6 py-4">التاريخ</th><th className="px-6 py-4">الوصف</th><th className="px-6 py-4">الفاتورة</th><th className="px-6 py-4 text-left">المبلغ</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {projExpenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-800/30">
                  <td className="px-6 py-4 text-slate-300 font-mono text-sm">{e.date}</td>
                  <td className="px-6 py-4 text-white">{e.description}</td>
                  <td className="px-6 py-4">
                    {e.invoiceFile ? (
                      <span className={`text-xs px-2 py-1 rounded border ${e.fileType === 'pdf' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {e.fileType === 'pdf' ? 'PDF' : 'IMG'}: {e.invoiceFile}
                      </span>
                    ) : <span className="text-slate-600 text-sm">-</span>}
                  </td>
                  <td className="px-6 py-4 text-red-400 font-bold font-mono text-left">{e.amount.toFixed(3)} د.ك</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* قسم المدفوعات */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-emerald-400">💰</span> سجل المدفوعات</h3>
          <span className="text-sm text-slate-500">{projPayments.length} دفعة</span>
        </div>
        {projPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">لا توجد مدفوعات مسجلة لهذا المشروع.</div>
        ) : (
          <table className="w-full text-right">
            <thead className="bg-[#162032] text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">ملاحظات</th>
                <th className="px-6 py-4">صورة الشيك</th>
                <th className="px-6 py-4 text-left">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {projPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/30">
                  <td className="px-6 py-4 text-slate-300 font-mono text-sm">{p.date}</td>
                  <td className="px-6 py-4 text-white">{p.notes || '-'}</td>
                  <td className="px-6 py-4">
                    {p.checkImage ? (
                      <span className="text-xs px-2 py-1 rounded border bg-purple-500/10 text-purple-400 border-purple-500/20 flex items-center gap-1 w-fit">
                        📷 {p.checkImage}
                      </span>
                    ) : <span className="text-slate-600 text-sm">-</span>}
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-bold font-mono text-left">{p.amount.toFixed(3)} د.ك</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* === نوافذ الإضافة (Modals) === */}
      
      {/* نافذة إضافة تكلفة */}
      {showExpenseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">إضافة تكلفة جديدة</h3>
            <div className="space-y-4">
              <div><label className="block text-sm text-slate-400 mb-1.5">الوصف *</label><input type="text" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="مثال: شراء أسمنت، إيجار معدات..." className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-slate-400 mb-1.5">المبلغ (د.ك) *</label><input type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="0.000" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none font-mono" /></div>
                <div><label className="block text-sm text-slate-400 mb-1.5">التاريخ</label><input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none [color-scheme:dark]" /></div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">استيراد فاتورة (صورة/PDF)</label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center hover:border-blue-500/50 transition-colors relative">
                  <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, setExpFile)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {expFile ? (
                    <span className="text-blue-400 text-sm font-medium"> {expFile.name}</span>
                  ) : (
                    <span className="text-slate-500 text-sm">اضغط هنا لرفع الملف أو اسحبه сюда</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={handleAddExpense} disabled={!expDesc || !expAmount} className="flex-1 py-3 rounded-lg bg-red-600 text-white disabled:opacity-50 hover:bg-red-700 transition-colors">حفظ التكلفة</button>
              <button onClick={() => setShowExpenseForm(false)} className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة دفعة (محدثة مع حقل صورة الشيك) */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">تسجيل دفعة جديدة</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-slate-400 mb-1.5">مبلغ الدفعة (د.ك) *</label><input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.000" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none font-mono" /></div>
                <div><label className="block text-sm text-slate-400 mb-1.5">تاريخ الدفعة</label><input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none [color-scheme:dark]" /></div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">إرفاق صورة الشيك</label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center hover:border-emerald-500/50 transition-colors relative">
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setCheckFile)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {checkFile ? (
                    <span className="text-emerald-400 text-sm font-medium">📷 {checkFile.name}</span>
                  ) : (
                    <span className="text-slate-500 text-sm">اضغط لاختيار صورة الشيك</span>
                  )}
                </div>
              </div>

              <div><label className="block text-sm text-slate-400 mb-1.5">ملاحظات</label><textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} rows={3} placeholder="رقم الشيك، طريقة الدفع..." className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={handleAddPayment} disabled={!payAmount} className="flex-1 py-3 rounded-lg bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-700 transition-colors">حفظ الدفعة</button>
              <button onClick={() => setShowPaymentForm(false)} className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
