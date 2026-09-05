"use client";
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import WorkersView, { Worker } from '@/components/WorkersView';
import ProjectsView, { Project, Expense, Payment } from '@/components/ProjectsView';
import DailyLogView, { DailyLog } from '@/components/DailyLogView';
import ExpensesView from '@/components/ExpensesView';
import SalariesView from '@/components/SalariesView';
import ProfitReport from '@/components/ProfitReport';
import GeneralSummary from '@/components/GeneralSummary';
import PartnersView, { Partner, Withdrawal } from '@/components/PartnersView';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  useEffect(() => {
    fetch('/api/workers')
      .then(res => res.json())
      .then(data => { if (data.workers) setWorkers(data.workers); })
      .catch(() => {});
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => { if (data.projects) setProjects(data.projects); })
      .catch(() => {});
    fetch('/api/expenses')
      .then(res => res.json())
      .then(data => { if (data.expenses) setExpenses(data.expenses); })
      .catch(() => {});
    fetch('/api/payments')
      .then(res => res.json())
      .then(data => { if (data.payments) setPayments(data.payments); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0b1120]" dir="rtl">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 md:mr-72 pt-16 md:pt-0">
        {activeTab === 'dashboard' && (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-4">لوحة التحكم الرئيسية</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50"><h3 className="text-slate-400 text-sm mb-2">إجمالي العمال</h3><p className="text-3xl font-bold text-white">{workers.length}</p></div>
              <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50"><h3 className="text-slate-400 text-sm mb-2">المشاريع النشطة</h3><p className="text-3xl font-bold text-white">{projects.length}</p></div>
              <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50"><h3 className="text-slate-400 text-sm mb-2">التقارير اليومية</h3><p className="text-3xl font-bold text-white">{logs.length}</p></div>
            </div>
          </div>
        )}
        {activeTab === 'workers' && <WorkersView workers={workers} setWorkers={setWorkers} />}
        {activeTab === 'projects' && <ProjectsView projects={projects} setProjects={setProjects} expenses={expenses} setExpenses={setExpenses} payments={payments} setPayments={setPayments} />}
        {activeTab === 'daily' && <DailyLogView logs={logs} setLogs={setLogs} workers={workers} projects={projects} />}
        {activeTab === 'expenses' && <ExpensesView expenses={expenses} setExpenses={setExpenses} projects={projects} />}
        {activeTab === 'salaries' && <SalariesView workers={workers} logs={logs} />}
        {activeTab === 'profits' && <ProfitReport projects={projects} expenses={expenses} payments={payments} logs={logs} workers={workers} />}
        {activeTab === 'summary' && <GeneralSummary projects={projects} expenses={expenses} payments={payments} logs={logs} workers={workers} />}
        {activeTab === 'partners' && <PartnersView partners={partners} setPartners={setPartners} withdrawals={withdrawals} setWithdrawals={setWithdrawals} projects={projects} expenses={expenses} payments={payments} logs={logs} workers={workers} />}
      </main>
    </div>
  );
}
