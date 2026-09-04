"use client";
import { useState, useMemo } from 'react';
import { Worker } from './WorkersView';
import { DailyLog } from './DailyLogView';

interface SalariesViewProps {
  workers: Worker[];
  logs: DailyLog[];
}

export default function SalariesView({ workers, logs }: SalariesViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // حساب الرواتب بناءً على اليوميات المسجلة للشهر المختار
  const salaryReport = useMemo(() => {
    return workers.map(worker => {
      // فلترة يوميات العامل للشهر المختار
      const workerLogs = logs.filter(l => 
        l.workerId === worker.id && l.date.startsWith(selectedMonth)
      );
      
      // حساب الأيام الفعلية (كل سجل يومي يمثل يوم عمل واحد)
      const daysWorked = workerLogs.length;
      
      // حساب إجمالي ساعات الـ OT
      const totalOtHours = workerLogs.reduce((sum, log) => sum + (log.otHours || 0), 0);
      
      // المعادلة: (أيام العمل × الأجر اليومي) + (ساعات OT × سعر الساعة)
      const baseSalary = daysWorked * worker.dailyWage;
      const otAmount = totalOtHours * (worker.dailyWage / 8);
      const totalDue = baseSalary + otAmount;
      
      return {
        ...worker,
        daysWorked,
        totalOtHours,
        baseSalary,
        otAmount,
        totalDue
      };
    }).filter(w => w.daysWorked > 0 || w.totalOtHours > 0); // عرض العمال الذين لهم مستحقات فقط
  }, [workers, logs, selectedMonth]);

  // الإجماليات
  const totals = useMemo(() => {
    return salaryReport.reduce((acc, curr) => ({
      days: acc.days + curr.daysWorked,
      otHours: acc.otHours + curr.totalOtHours,
      amount: acc.amount + curr.totalDue
    }), { days: 0, otHours: 0, amount: 0 });
  }, [salaryReport]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">كشوف الرواتب الشهرية</h2>
          <p className="text-slate-400">حساب المستحقات تلقائياً بناءً على حضور العمال وساعات الـ OT</p>
        </div>
        
        {/* فلتر الشهر */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-2 flex items-center gap-3">
          <span className="text-slate-400 text-sm pr-2">شهر الصرف:</span>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none [color-scheme:dark]"
          />
        </div>
      </header>

      {/* ملخص الرواتب */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-slate-400 text-sm mb-2">إجمالي أيام العمل</h3>
          <p className="text-2xl font-bold text-white font-mono">{totals.days} يوم</p>
        </div>
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-yellow-500/30 bg-yellow-900/10">
          <h3 className="text-yellow-400 text-sm mb-2">إجمالي ساعات الـ OT</h3>
          <p className="text-2xl font-bold text-yellow-400 font-mono">{totals.otHours.toFixed(1)} ساعة</p>
        </div>
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-emerald-500/30 bg-emerald-900/10">
          <h3 className="text-emerald-400 text-sm mb-2">إجمالي المستحقات</h3>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{totals.amount.toLocaleString()} د.ك</p>
        </div>
      </div>

      {/* جدول الرواتب */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[1000px]">
            <thead className="bg-[#162032] text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">#</th>
                <th className="px-6 py-4 font-medium">اسم العامل</th>
                <th className="px-6 py-4 font-medium">المهنة</th>
                <th className="px-6 py-4 font-medium text-center">الأجر اليومي</th>
                <th className="px-6 py-4 font-medium text-center">أيام الحضور</th>
                <th className="px-6 py-4 font-medium text-center">ساعات OT</th>
                <th className="px-6 py-4 font-medium text-center">قيمة الـ OT</th>
                <th className="px-6 py-4 font-medium text-left">إجمالي المستحق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {salaryReport.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500">لا توجد يوميات مسجلة لهذا الشهر.</td></tr>
              ) : (
                salaryReport.map((w, index) => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4 text-slate-500 text-sm">{index + 1}</td>
                    <td className="px-6 py-4 text-white font-bold">{w.name}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{w.job}</td>
                    <td className="px-6 py-4 text-center text-slate-300 font-mono">{w.dailyWage.toFixed(3)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md text-sm font-mono border border-blue-500/20">
                        {w.daysWorked} يوم
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {w.totalOtHours > 0 ? (
                        <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-md text-sm font-mono border border-yellow-500/20">
                          {w.totalOtHours} س
                        </span>
                      ) : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="px-6 py-4 text-center text-yellow-400 font-mono text-sm">
                      {w.otAmount > 0 ? `+${w.otAmount.toFixed(3)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-left text-emerald-400 font-bold font-mono text-lg">
                      {w.totalDue.toFixed(3)} د.ك
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* صف الإجماليات في أسفل الجدول */}
            {salaryReport.length > 0 && (
              <tfoot className="bg-[#0f172a] border-t border-slate-700">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-slate-400 font-bold text-left">الإجمالي الكلي للشهر:</td>
                  <td className="px-6 py-4 text-center text-white font-mono">{totals.days}</td>
                  <td className="px-6 py-4 text-center text-yellow-400 font-mono">{totals.otHours.toFixed(1)}</td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 text-left text-emerald-400 font-bold font-mono text-xl">{totals.amount.toLocaleString()} د.ك</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
