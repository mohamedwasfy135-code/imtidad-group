"use client";
import { useMemo } from 'react';
import { Project, Expense, Payment } from './ProjectsView';
import { DailyLog } from './DailyLogView';
import { Worker } from './WorkersView';

interface ProfitReportProps {
  projects: Project[];
  expenses: Expense[];
  payments: Payment[];
  logs: DailyLog[];
  workers: Worker[];
}

export default function ProfitReport({ projects, expenses, payments, logs, workers }: ProfitReportProps) {
  
  // دالة لحساب تكلفة العمالة للمشروع بناءً على اليوميات المسجلة
  const calculateLaborCost = (projectId: string) => {
    const projectLogs = logs.filter(l => l.projectId === projectId);
    let totalLabor = 0;
    
    projectLogs.forEach(log => {
      const worker = workers.find(w => w.id === log.workerId);
      if (worker) {
        // حساب أجر اليوم العادي (8 ساعات)
        const dailyWage = worker.dailyWage; 
        // حساب أجر الـ OT الإضافي
        const hourlyRate = worker.dailyWage / 8;
        const otCost = (log.otHours || 0) * hourlyRate;
        
        // إذا كان السجل يمثل يوم عمل كامل نضيف الأجر الأساسي
        // ملاحظة: في نظام اليوميات الحالي، كل سجل يمثل عامل واحد في يوم واحد
        totalLabor += dailyWage + otCost;
      }
    });
    return totalLabor;
  };

  // تجميع التقرير لكل مشروع
  const reportData = useMemo(() => {
    return projects.map(project => {
      const projExpenses = expenses.filter(e => e.projectId === project.id);
      const projPayments = payments.filter(p => p.projectId === project.id);
      
      const materialCost = projExpenses.reduce((sum, e) => sum + e.amount, 0);
      const laborCost = calculateLaborCost(project.id);
      const totalReceived = projPayments.reduce((sum, p) => sum + p.amount, 0);
      
      const totalCosts = materialCost + laborCost;
      const netProfit = totalReceived - totalCosts;
      const profitMargin = totalReceived > 0 ? (netProfit / totalReceived) * 100 : 0;
      const paymentRatio = project.budget > 0 ? (totalReceived / project.budget) * 100 : 0;

      return {
        ...project,
        materialCost,
        laborCost,
        totalCosts,
        totalReceived,
        netProfit,
        profitMargin,
        paymentRatio
      };
    });
  }, [projects, expenses, payments, logs, workers]);

  // الإجماليات العامة
  const totals = useMemo(() => {
    return reportData.reduce((acc, curr) => ({
      budget: acc.budget + curr.budget,
      received: acc.received + curr.totalReceived,
      costs: acc.costs + curr.totalCosts,
      profit: acc.profit + curr.netProfit
    }), { budget: 0, received: 0, costs: 0, profit: 0 });
  }, [reportData]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" dir="rtl">
      <header className="border-b border-slate-800 pb-6">
        <h2 className="text-3xl font-bold text-white mb-2">تقرير أرباح المشاريع</h2>
        <p className="text-slate-400">تحليل الربحية بناءً على الدفعات المستلمة والتكاليف الفعلية</p>
      </header>

      {/* البطاقات الإجمالية */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-slate-400 text-sm mb-2">إجمالي ميزانية المشاريع</h3>
          <p className="text-2xl font-bold text-white font-mono">{totals.budget.toLocaleString()} د.ك</p>
        </div>
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-slate-400 text-sm mb-2">إجمالي الدفعات المستلمة</h3>
          <p className="text-2xl font-bold text-blue-400 font-mono">{totals.received.toLocaleString()} د.ك</p>
        </div>
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-slate-400 text-sm mb-2">إجمالي التكاليف الفعلية</h3>
          <p className="text-2xl font-bold text-red-400 font-mono">{totals.costs.toLocaleString()} د.ك</p>
        </div>
        <div className={`bg-[#1e293b] p-6 rounded-2xl border ${totals.profit >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
          <h3 className="text-slate-400 text-sm mb-2">صافي الربح الكلي</h3>
          <p className={`text-2xl font-bold font-mono ${totals.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totals.profit.toLocaleString()} د.ك
          </p>
        </div>
      </div>

      {/* جدول التفاصيل */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[1200px]">
            <thead className="bg-[#162032] text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">المشروع</th>
                <th className="px-6 py-4 font-medium text-center">قيمة المشروع</th>
                <th className="px-6 py-4 font-medium text-center">الدفعات المستلمة</th>
                <th className="px-6 py-4 font-medium text-center">نسبة التحصيل</th>
                <th className="px-6 py-4 font-medium text-center">تكلفة المواد</th>
                <th className="px-6 py-4 font-medium text-center">تكلفة العمالة</th>
                <th className="px-6 py-4 font-medium text-center">إجمالي التكلفة</th>
                <th className="px-6 py-4 font-medium text-center">صافي الربح</th>
                <th className="px-6 py-4 font-medium text-center">هامش الربح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {reportData.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-500">لا توجد بيانات كافية لإعداد التقرير.</td></tr>
              ) : (
                reportData.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-white font-bold">{r.name}</div>
                      <div className="text-slate-500 text-xs mt-1">{r.client}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-300 font-mono">{r.budget.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center text-blue-400 font-bold font-mono">{r.totalReceived.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-slate-300 text-sm font-mono">{r.paymentRatio.toFixed(1)}%</span>
                        <div className="w-16 bg-slate-800 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{width: `${Math.min(r.paymentRatio, 100)}%`}}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-orange-400 font-mono text-sm">{r.materialCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center text-yellow-400 font-mono text-sm">{r.laborCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center text-red-400 font-bold font-mono">{r.totalCosts.toLocaleString()}</td>
                    <td className={`px-6 py-4 text-center font-bold font-mono ${r.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {r.netProfit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        r.profitMargin >= 20 ? 'bg-emerald-500/10 text-emerald-400' : 
                        r.profitMargin >= 0 ? 'bg-yellow-500/10 text-yellow-400' : 
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {r.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
