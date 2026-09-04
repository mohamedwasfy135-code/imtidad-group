"use client";
import { useMemo } from 'react';
import { Project, Expense, Payment } from './ProjectsView';
import { DailyLog } from './DailyLogView';
import { Worker } from './WorkersView';

interface GeneralSummaryProps {
  projects: Project[];
  expenses: Expense[];
  payments: Payment[];
  logs: DailyLog[];
  workers: Worker[];
}

export default function GeneralSummary({ projects, expenses, payments, logs, workers }: GeneralSummaryProps) {
  
  // --- الحسابات الأساسية لكل مشروع ---
  const projectStats = useMemo(() => {
    return projects.map(project => {
      const projExpenses = expenses.filter(e => e.projectId === project.id && e.type === 'project');
      const projPayments = payments.filter(p => p.projectId === project.id);
      
      const materialCost = projExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      // حساب تكلفة العمالة من اليوميات
      let laborCost = 0;
      logs.filter(l => l.projectId === project.id).forEach(log => {
        const w = workers.find(worker => worker.id === log.workerId);
        if (w) laborCost += w.dailyWage + ((log.otHours || 0) * (w.dailyWage / 8));
      });

      const totalCost = materialCost + laborCost;
      const received = projPayments.reduce((sum, p) => sum + p.amount, 0);
      const profit = received - totalCost;
      const margin = received > 0 ? (profit / received) * 100 : 0;
      const collectionRate = project.budget > 0 ? (received / project.budget) * 100 : 0;

      return { ...project, materialCost, laborCost, totalCost, received, profit, margin, collectionRate };
    });
  }, [projects, expenses, payments, logs, workers]);

  // --- الإحصائيات العامة للشركة ---
  const companyOverview = useMemo(() => {
    const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
    const totalReceived = projectStats.reduce((s, p) => s + p.received, 0);
    const totalProjectCosts = projectStats.reduce((s, p) => s + p.totalCost, 0);
    const totalAdminExpenses = expenses.filter(e => e.type === 'admin').reduce((s, e) => s + e.amount, 0);
    const totalNetProfit = totalReceived - totalProjectCosts - totalAdminExpenses;
    
    // تحليل ذكي: إيجاد الأفضل والأسوأ
    const bestProject = [...projectStats].sort((a, b) => b.profit - a.profit)[0];
    const worstProject = [...projectStats].sort((a, b) => a.profit - b.profit)[0];
    
    // تحليل المخاطر: مشاريع تجاوزت 90% من الميزانية ولم تكتمل
    const atRiskProjects = projectStats.filter(p => (p.totalCost / p.budget) > 0.9 && p.collectionRate < 100);

    return { 
      totalBudget, totalReceived, totalProjectCosts, totalAdminExpenses, totalNetProfit,
      bestProject, worstProject, atRiskProjects 
    };
  }, [projects, projectStats, expenses]);

  // --- بيانات الرسم البياني للتكاليف ---
  const costDistribution = useMemo(() => {
    const materials = projectStats.reduce((s, p) => s + p.materialCost, 0);
    const labor = projectStats.reduce((s, p) => s + p.laborCost, 0);
    const admin = companyOverview.totalAdminExpenses;
    return [
      { name: 'مواد ومعدات', value: materials, color: '#f97316' }, // Orange
      { name: 'أجور عمالة', value: labor, color: '#eab308' },      // Yellow
      { name: 'مصروفات إدارية', value: admin, color: '#ef4444' }   // Red
    ];
  }, [projectStats, companyOverview]);

  const maxCostVal = Math.max(...costDistribution.map(c => c.value)) || 1;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" dir="rtl">
      <header className="border-b border-slate-800 pb-6">
        <h2 className="text-3xl font-bold text-white mb-2">الملخص العام والتحليل الذكي</h2>
        <p className="text-slate-400">نظرة شاملة على أداء الشركة المالي وتوزيع التكاليف</p>
      </header>

      {/* البطاقات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-slate-400 text-sm mb-2">إجمالي القيمة التعاقدية</h3>
          <p className="text-2xl font-bold text-white font-mono">{companyOverview.totalBudget.toLocaleString()} د.ك</p>
        </div>
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-blue-500/30 bg-blue-900/10">
          <h3 className="text-blue-400 text-sm mb-2">إجمالي المحصل (Cash In)</h3>
          <p className="text-2xl font-bold text-blue-400 font-mono">{companyOverview.totalReceived.toLocaleString()} د.ك</p>
        </div>
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-red-500/30 bg-red-900/10">
          <h3 className="text-red-400 text-sm mb-2">إجمالي المنصرف (Cash Out)</h3>
          <p className="text-2xl font-bold text-red-400 font-mono">
            {(companyOverview.totalProjectCosts + companyOverview.totalAdminExpenses).toLocaleString()} د.ك
          </p>
        </div>
        <div className={`bg-[#1e293b] p-6 rounded-2xl border ${companyOverview.totalNetProfit >= 0 ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-red-500/30 bg-red-900/10'}`}>
          <h3 className={`text-sm mb-2 ${companyOverview.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>صافي الربح الفعلي</h3>
          <p className={`text-2xl font-bold font-mono ${companyOverview.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {companyOverview.totalNetProfit.toLocaleString()} د.ك
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* التحليل الذكي والمخاطر */}
        <div className="lg:col-span-2 space-y-6">
          {/* أفضل وأسوأ مشروع */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {companyOverview.bestProject && (
              <div className="bg-gradient-to-br from-emerald-900/20 to-[#1e293b] p-6 rounded-2xl border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-emerald-400 font-bold">الأعلى ربحية</h3>
                </div>
                <p className="text-white text-lg font-bold mb-1">{companyOverview.bestProject.name}</p>
                <p className="text-emerald-400 font-mono text-xl font-bold">+{companyOverview.bestProject.profit.toLocaleString()} د.ك</p>
                <p className="text-slate-500 text-xs mt-2">هامش ربح: {companyOverview.bestProject.margin.toFixed(1)}%</p>
              </div>
            )}
            
            {companyOverview.worstProject && companyOverview.worstProject.profit < 0 && (
              <div className="bg-gradient-to-br from-red-900/20 to-[#1e293b] p-6 rounded-2xl border border-red-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">⚠️</span>
                  <h3 className="text-red-400 font-bold">يحتاج مراجعة</h3>
                </div>
                <p className="text-white text-lg font-bold mb-1">{companyOverview.worstProject.name}</p>
                <p className="text-red-400 font-mono text-xl font-bold">{companyOverview.worstProject.profit.toLocaleString()} د.ك</p>
                <p className="text-slate-500 text-xs mt-2">هامش ربح: {companyOverview.worstProject.margin.toFixed(1)}%</p>
              </div>
            )}
          </div>

          {/* تنبيهات المخاطر */}
          {companyOverview.atRiskProjects.length > 0 && (
            <div className="bg-amber-900/10 border border-amber-500/20 rounded-2xl p-6">
              <h3 className="text-amber-400 font-bold mb-4 flex items-center gap-2">🚨 تنبيهات المخاطر المالية</h3>
              <div className="space-y-3">
                {companyOverview.atRiskProjects.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-[#1e293b] p-3 rounded-lg border border-amber-500/10">
                    <div>
                      <p className="text-white font-medium">{p.name}</p>
                      <p className="text-xs text-slate-400">استهلك {(p.totalCost/p.budget*100).toFixed(0)}% من الميزانية</p>
                    </div>
                    <span className="text-amber-400 text-xs font-bold bg-amber-500/10 px-2 py-1 rounded">
                      تحصيل {p.collectionRate.toFixed(0)}% فقط
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* توزيع التكاليف (رسم بياني بسيط) */}
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 h-fit">
          <h3 className="text-white font-bold mb-6">توزيع هيكل التكاليف</h3>
          <div className="space-y-6">
            {costDistribution.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></span>
                    {item.name}
                  </span>
                  <span className="text-white font-mono font-bold">{item.value.toLocaleString()}</span>
                </div>
                <div className="w-full bg-[#0f172a] rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(item.value / maxCostVal) * 100}%`, backgroundColor: item.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-700/50">
             <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3">نسب التوزيع</h4>
             <div className="flex h-4 rounded-full overflow-hidden w-full">
                {costDistribution.map((item) => (
                   <div 
                     key={item.name} 
                     style={{ width: `${(item.value / (maxCostVal || 1)) * 100}%`, backgroundColor: item.color }}
                     title={`${item.name}: ${item.value.toLocaleString()}`}
                   ></div>
                ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
