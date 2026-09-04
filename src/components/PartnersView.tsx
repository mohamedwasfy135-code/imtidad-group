"use client";
import { useState, useMemo } from 'react';
import { Project, Expense, Payment } from './ProjectsView';
import { DailyLog } from './DailyLogView';
import { Worker } from './WorkersView';

export interface Partner {
  id: string;
  name: string;
  sharePercentage: number; // النسبة المئوية (مثلاً 50 تعني 50%)
}

export interface Withdrawal {
  id: number;
  partnerId: string;
  projectId?: string | null; // إذا كانت null فهي سحب عام من الخزنة
  date: string;
  amount: number;
  notes: string;
}

interface PartnersViewProps {
  partners: Partner[];
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
  withdrawals: Withdrawal[];
  setWithdrawals: React.Dispatch<React.SetStateAction<Withdrawal[]>>;
  projects: Project[];
  expenses: Expense[];
  payments: Payment[];
  logs: DailyLog[];
  workers: Worker[];
}

export default function PartnersView({ 
  partners, setPartners, 
  withdrawals, setWithdrawals,
  projects, expenses, payments, logs, workers 
}: PartnersViewProps) {
  
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  
  // حالة نموذج شريك جديد
  const [pName, setPName] = useState('');
  const [pShare, setPShare] = useState('');

  // حالة نموذج سحب
  const [wPartnerId, setWPartnerId] = useState('');
  const [wProjectId, setWProjectId] = useState('');
  const [wAmount, setWAmount] = useState('');
  const [wDate, setWDate] = useState(new Date().toISOString().split('T')[0]);
  const [wNotes, setWNotes] = useState('');

  // --- دوال الحفظ ---
  const handleAddPartner = () => {
    if (!pName || !pShare) return;
    setPartners(prev => [...prev, {
      id: Date.now().toString(),
      name: pName,
      sharePercentage: parseFloat(pShare) || 0
    }]);
    setPName(''); setPShare(''); setShowPartnerForm(false);
  };

  const handleAddWithdrawal = () => {
    if (!wPartnerId || !wAmount) return;
    setWithdrawals(prev => [...prev, {
      id: Date.now(),
      partnerId: wPartnerId,
      projectId: wProjectId || null,
      date: wDate,
      amount: parseFloat(wAmount) || 0,
      notes: wNotes
    }]);
    setWAmount(''); setWNotes(''); setShowWithdrawalForm(false);
  };

  // --- الحسابات الذكية للتسوية ---
  const settlementData = useMemo(() => {
    return partners.map(partner => {
      // 1. حساب إجمالي أرباح الشركة الصافية (من جميع المشاريع)
      let totalCompanyNetProfit = 0;
      
      projects.forEach(project => {
        const projExpenses = expenses.filter(e => e.projectId === project.id && e.type === 'project');
        const projPayments = payments.filter(p => p.projectId === project.id);
        
        const materialCost = projExpenses.reduce((s, e) => s + e.amount, 0);
        let laborCost = 0;
        logs.filter(l => l.projectId === project.id).forEach(log => {
          const w = workers.find(worker => worker.id === log.workerId);
          if (w) laborCost += w.dailyWage + ((log.otHours || 0) * (w.dailyWage / 8));
        });
        
        const received = projPayments.reduce((s, p) => s + p.amount, 0);
        totalCompanyNetProfit += (received - materialCost - laborCost);
      });

      // خصم المصاريف الإدارية من الربح الإجمالي قبل التوزيع (اختياري حسب الاتفاق)
      const adminExpenses = expenses.filter(e => e.type === 'admin').reduce((s, e) => s + e.amount, 0);
      const distributableProfit = totalCompanyNetProfit - adminExpenses;

      // 2. حصة الشريك النظرية
      const theoreticalShare = distributableProfit * (partner.sharePercentage / 100);

      // 3. إجمالي السحوبات
      const totalWithdrawn = withdrawals
        .filter(w => w.partnerId === partner.id)
        .reduce((s, w) => s + w.amount, 0);

      // 4. الرصيد المستحق للتسوية
      const balanceDue = theoreticalShare - totalWithdrawn;

      return {
        ...partner,
        theoreticalShare,
        totalWithdrawn,
        balanceDue,
        withdrawCount: withdrawals.filter(w => w.partnerId === partner.id).length
      };
    });
  }, [partners, projects, expenses, payments, logs, workers, withdrawals]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8" dir="rtl">
      <header className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">الشركاء وتسوية الأرباح</h2>
          <p className="text-slate-400">توزيع الأرباح ومتابعة السحوبات الشخصية للشركاء</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowWithdrawalForm(true)} className="bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border border-orange-500/30 px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2">
            <span>💸</span> تسجيل سحب
          </button>
          <button onClick={() => setShowPartnerForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
            + إضافة شريك
          </button>
        </div>
      </header>

      {/* بطاقات ملخص الشركاء */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {settlementData.map(s => (
          <div key={s.id} className={`bg-[#1e293b] p-6 rounded-2xl border ${s.balanceDue >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'} relative overflow-hidden`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-50"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{s.name}</h3>
                <p className="text-slate-400 text-sm mt-1">نسبة المشاركة: {s.sharePercentage}%</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 uppercase tracking-wider">الرصيد المستحق</p>
                <p className={`text-2xl font-bold font-mono ${s.balanceDue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.balanceDue.toLocaleString()} د.ك
                </p>
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-slate-700/50">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">الحصة النظرية:</span>
                <span className="text-blue-400 font-mono">{s.theoreticalShare.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">إجمالي السحوبات ({s.withdrawCount}):</span>
                <span className="text-orange-400 font-mono">{s.totalWithdrawn.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
        
        {partners.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-500 bg-[#1e293b] rounded-2xl border border-dashed border-slate-700">
            لا يوجد شركاء مسجلين. ابدأ بإضافة أول شريك.
          </div>
        )}
      </div>

      {/* جدول تفاصيل السحوبات */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-xl font-bold text-white">سجل السحوبات الشخصية</h3>
        </div>
        {withdrawals.length === 0 ? (
          <div className="p-12 text-center text-slate-500">لا توجد سحوبات مسجلة.</div>
        ) : (
          <table className="w-full text-right">
            <thead className="bg-[#162032] text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">الشريك</th>
                <th className="px-6 py-4">المشروع (إن وجد)</th>
                <th className="px-6 py-4">ملاحظات</th>
                <th className="px-6 py-4 text-left">المبلغ المسحوب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {[...withdrawals].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(w => {
                const partner = partners.find(p => p.id === w.partnerId);
                const project = projects.find(p => p.id === w.projectId);
                return (
                  <tr key={w.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">{w.date}</td>
                    <td className="px-6 py-4 text-white font-medium">{partner?.name || 'شريك محذوف'}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{project?.name || 'سحب عام'}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{w.notes || '-'}</td>
                    <td className="px-6 py-4 text-orange-400 font-bold font-mono text-left">{w.amount.toFixed(3)} د.ك</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* نافذة إضافة شريك */}
      {showPartnerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">إضافة شريك جديد</h3>
            <div className="space-y-4">
              <div><label className="block text-sm text-slate-400 mb-1.5">اسم الشريك *</label><input type="text" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="الاسم الكامل" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" /></div>
              <div><label className="block text-sm text-slate-400 mb-1.5">نسبة المشاركة (%) *</label><input type="number" min="0" max="100" value={pShare} onChange={(e) => setPShare(e.target.value)} placeholder="مثال: 50" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none font-mono" /></div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={handleAddPartner} disabled={!pName || !pShare} className="flex-1 py-3 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors">حفظ الشريك</button>
              <button onClick={() => setShowPartnerForm(false)} className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تسجيل سحب */}
      {showWithdrawalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">تسجيل سحب شخصي</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">الشريك *</label>
                <select value={wPartnerId} onChange={(e) => setWPartnerId(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none">
                  <option value="">اختر شريك...</option>
                  {partners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sharePercentage}%)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">ربط بمشروع (اختياري)</label>
                <select value={wProjectId} onChange={(e) => setWProjectId(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none">
                  <option value="">سحب عام من الخزنة</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-slate-400 mb-1.5">المبلغ (د.ك) *</label><input type="number" value={wAmount} onChange={(e) => setWAmount(e.target.value)} placeholder="0.000" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none font-mono" /></div>
                <div><label className="block text-sm text-slate-400 mb-1.5">التاريخ</label><input type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none [color-scheme:dark]" /></div>
              </div>
              <div><label className="block text-sm text-slate-400 mb-1.5">ملاحظات</label><textarea value={wNotes} onChange={(e) => setWNotes(e.target.value)} rows={2} placeholder="سبب السحب..." className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={handleAddWithdrawal} disabled={!wPartnerId || !wAmount} className="flex-1 py-3 rounded-lg bg-orange-600 text-white disabled:opacity-50 hover:bg-orange-700 transition-colors">تسجيل السحب</button>
              <button onClick={() => setShowWithdrawalForm(false)} className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
