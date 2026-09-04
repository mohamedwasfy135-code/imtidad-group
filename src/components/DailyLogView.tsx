"use client";
import { useState, useMemo } from 'react';
import { Worker } from './WorkersView';
import { Project } from './ProjectsView';

export interface DailyLog {
  id: number;
  date: string;
  projectId: string;
  workerId: number;
  hours: number; // ساعات العمل العادية (8)
  otHours: number; // ساعات الاوفر تايم
  amount: number; // المبلغ الإجمالي (اليومية + الـ OT)
  notes: string;
}

interface DailyLogViewProps {
  logs: DailyLog[];
  setLogs: React.Dispatch<React.SetStateAction<DailyLog[]>>;
  workers: Worker[];
  projects: Project[];
}

export default function DailyLogView({ logs, setLogs, workers, projects }: DailyLogViewProps) {
  // --- حالة نموذج التسجيل العلوي ---
  const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [regProject, setRegProject] = useState('');
  
  // تخزين ساعات الـ OT لكل عامل: { workerId: hours }
  const [otInputs, setOtInputs] = useState<Record<number, string>>({});
  
  // العمال المختارون للإضافة
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
  const [regNotes, setRegNotes] = useState('');

  // تبديل اختيار عامل
  const toggleWorkerSelection = (id: number) => {
    setSelectedWorkers(prev => 
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    );
  };

  // تحديث ساعات الـ OT للعامل
  const handleOtChange = (id: number, value: string) => {
    // السماح فقط بالأرقام والنقاط
    if (value && !/^[0-9]*\.?[0-9]*$/.test(value)) return;
    
    setOtInputs(prev => ({ ...prev, [id]: value }));
    
    // إذا أدخل المستخدم ساعات وتم تحديد العامل تلقائياً (اختياري)، أو العكس
    if (parseFloat(value) > 0 && !selectedWorkers.includes(id)) {
      setSelectedWorkers(prev => [...prev, id]);
    }
  };

  // حفظ اليوميات المختارة
  const handleAddSelected = () => {
    if (!regProject || selectedWorkers.length === 0) return;
    
    const newLogs: DailyLog[] = selectedWorkers.map(workerId => {
      const worker = workers.find(w => w.id === workerId);
      if (!worker) return null;

      const baseWage = worker.dailyWage;
      const hourlyRate = baseWage / 8;
      const otHours = parseFloat(otInputs[workerId] || '0');
      const otAmount = hourlyRate * otHours;
      
      // المبلغ الإجمالي = اليومية الأساسية + قيمة الـ OT
      const totalAmount = baseWage + otAmount;

      return {
        id: Date.now() + Math.random(),
        date: regDate,
        projectId: regProject,
        workerId: workerId,
        hours: 8, // ثابتة لليوم الكامل
        otHours: otHours,
        amount: totalAmount,
        notes: regNotes
      };
    }).filter(Boolean) as DailyLog[];

    setLogs(prev => [...newLogs, ...prev]);
    
    // إعادة تعيين النموذج
    setSelectedWorkers([]);
    setOtInputs({});
    setRegNotes('');
  };

  // --- فلاتر الجدول السفلي ---
  const [filterProject, setFilterProject] = useState('');
  const [filterWorker, setFilterWorker] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchProject = filterProject ? log.projectId === filterProject : true;
      const matchWorker = filterWorker ? log.workerId === Number(filterWorker) : true;
      const matchSearch = searchQuery 
        ? (workers.find(w => w.id === log.workerId)?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           log.notes.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      
      let matchDate = true;
      if (dateFrom && log.date < dateFrom) matchDate = false;
      if (dateTo && log.date > dateTo) matchDate = false;

      return matchProject && matchWorker && matchSearch && matchDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, filterProject, filterWorker, searchQuery, dateFrom, dateTo, workers]);

  const getWorkerName = (id: number) => workers.find(w => w.id === id)?.name || '-';
  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || '-';
  const getWorkerJob = (id: number) => workers.find(w => w.id === id)?.job || '';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8" dir="rtl">
      
      {/* === القسم الأول: تسجيل اليوميات === */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 shadow-lg">
        {/* الصف العلوي: التاريخ والمشروع */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-6 border-b border-slate-700/50">
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-medium text-left">التاريخ:</label>
            <input 
              type="date" 
              value={regDate}
              onChange={(e) => setRegDate(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors [color-scheme:dark] text-left"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-medium text-right">المشروع:</label>
            <select 
              value={regProject}
              onChange={(e) => setRegProject(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors appearance-none cursor-pointer"
            >
              <option value="">اختر مشروع...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* قائمة العمال مع حقل الـ OT */}
        <div className="mb-6">
          <h3 className="text-slate-300 text-sm mb-4 font-medium text-right">اختر العمال وأدخل ساعات الـ OT:</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar bg-[#162032] rounded-xl p-3 border border-slate-800">
            {workers.length === 0 ? (
              <div className="text-center text-slate-500 py-8">لا يوجد عمال مسجلين</div>
            ) : (
              workers.map((worker) => {
                const isSelected = selectedWorkers.includes(worker.id);
                const otValue = otInputs[worker.id] || '';
                const hourlyRate = worker.dailyWage / 8;
                const extraAmount = (parseFloat(otValue) || 0) * hourlyRate;

                return (
                  <div 
                    key={worker.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-4 ${
                      isSelected 
                        ? 'bg-blue-600/10 border-blue-500/40' 
                        : 'bg-[#1e293b] border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {/* الجزء الأيمن: Checkbox واسم العامل */}
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => toggleWorkerSelection(worker.id)}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-500 bg-transparent'
                      }`}>
                        {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <div>
                        <span className={`font-medium block ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {worker.name}
                        </span>
                        <span className="text-xs text-slate-500">{worker.job}</span>
                      </div>
                    </div>

                    {/* الجزء الأوسط: حقل إدخال الـ OT */}
                    <div className="flex items-center gap-2 bg-[#0f172a] rounded-lg px-3 py-2 border border-slate-700 focus-within:border-yellow-500/50 transition-colors">
                      <span className="text-yellow-500 text-xs font-bold">OT</span>
                      <input 
                        type="number" 
                        step="0.5"
                        min="0"
                        placeholder="0"
                        value={otValue}
                        onChange={(e) => handleOtChange(worker.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()} // منع تفعيل الـ checkbox عند النقر للحقل
                        className="w-16 bg-transparent text-white text-sm font-mono outline-none text-center placeholder-slate-600"
                      />
                      <span className="text-slate-500 text-xs">ساعة</span>
                    </div>

                    {/* الجزء الأيسر: الأسعار */}
                    <div className="text-left min-w-[140px]">
                      <div className="text-slate-400 text-xs font-mono mb-1">
                        أساسي: {worker.dailyWage.toFixed(3)}
                      </div>
                      {extraAmount > 0 && (
                        <div className="text-yellow-500 text-xs font-mono font-bold bg-yellow-500/10 px-2 py-0.5 rounded inline-block">
                          +{extraAmount.toFixed(3)} د.ك
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* الملاحظات وزر الحفظ */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <label className="block text-slate-400 text-sm mb-2 font-medium text-left">ملاحظات عامة:</label>
          <textarea 
            value={regNotes}
            onChange={(e) => setRegNotes(e.target.value)}
            placeholder="ملاحظات إضافية..."
            rows={2}
            className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors resize-none mb-4"
          />
          <div className="flex justify-end">
            <button 
              onClick={handleAddSelected}
              disabled={!regProject || selectedWorkers.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-900/20 flex items-center gap-2"
            >
              <span>+</span> إضافة اليوميات المختارة
            </button>
          </div>
        </div>
      </div>

      {/* === القسم الثاني: سجل اليوميات === */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-r-4 border-blue-500 pr-4">سجل اليوميات</h2>
        
        {/* لوحة الفلاتر */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-1">
            <label className="block text-xs text-slate-500 mb-1.5">بحث:</label>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="اكتب للبحث..." 
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">فلترة حسب العامل:</label>
            <select value={filterWorker} onChange={(e) => setFilterWorker(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none">
              <option value="">— جميع العمال —</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">فلترة حسب المشروع:</label>
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none">
              <option value="">— جميع المشاريع —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
             <div>
                <label className="block text-xs text-slate-500 mb-1.5">من تاريخ:</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} 
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-2 py-2.5 text-xs text-white focus:border-blue-500 outline-none [color-scheme:dark]" />
             </div>
             <div>
                <label className="block text-xs text-slate-500 mb-1.5">إلى تاريخ:</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} 
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-2 py-2.5 text-xs text-white focus:border-blue-500 outline-none [color-scheme:dark]" />
             </div>
          </div>
          <button onClick={() => {setFilterProject(''); setFilterWorker(''); setSearchQuery(''); setDateFrom(''); setDateTo('')}} 
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-amber-900/20">
            مسح كل الفلاتر
          </button>
        </div>

        {/* الجدول */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[1000px]">
              <thead className="bg-[#162032] text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-medium w-12">#</th>
                  <th className="px-6 py-4 font-medium">التاريخ</th>
                  <th className="px-6 py-4 font-medium">المشروع</th>
                  <th className="px-6 py-4 font-medium">العامل</th>
                  <th className="px-6 py-4 font-medium text-center">الساعات</th>
                  <th className="px-6 py-4 font-medium text-center">OT ⚡</th>
                  <th className="px-6 py-4 font-medium text-left">المبلغ الإجمالي</th>
                  <th className="px-6 py-4 font-medium">ملاحظات</th>
                  <th className="px-6 py-4 font-medium text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-500">لا توجد سجلات مطابقة.</td></tr>
                ) : (
                  filteredLogs.map((log, index) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-4 text-slate-500 text-sm">{index + 1}</td>
                      <td className="px-6 py-4 text-white font-mono text-sm">{log.date}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{getProjectName(log.projectId)}</td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium text-sm">{getWorkerName(log.workerId)}</div>
                        <div className="text-slate-500 text-xs">{getWorkerJob(log.workerId)}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-300 font-mono">{log.hours.toFixed(1)}</td>
                      <td className="px-6 py-4 text-center">
                        {log.otHours > 0 ? (
                          <span className="text-yellow-500 font-mono font-bold bg-yellow-500/10 px-2 py-1 rounded text-xs">{log.otHours} س</span>
                        ) : <span className="text-slate-600">-</span>}
                      </td>
                      <td className="px-6 py-4 text-left text-emerald-400 font-bold font-mono">{log.amount.toFixed(3)} د.ك</td>
                      <td className="px-6 py-4 text-slate-500 text-xs max-w-[150px] truncate" title={log.notes}>{log.notes || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-amber-500 hover:text-amber-400 text-xs border border-amber-500/30 hover:bg-amber-500/10 px-3 py-1.5 rounded transition-all">
                          تعديل
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
