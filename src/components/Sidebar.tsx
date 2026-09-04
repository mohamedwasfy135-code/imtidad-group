"use client";
import Image from 'next/image';

const menuItems = [
  { id: 'dashboard', label: 'الرئيسية', icon: '' },
  { id: 'workers', label: 'العمال', icon: '' },
  { id: 'projects', label: 'المشاريع', icon: '️' },
  { id: 'daily', label: 'اليوميات', icon: '' },
  { id: 'expenses', label: 'المصروفات', icon: '' },
  { id: 'salaries', label: 'الرواتب الشهرية', icon: '💰' },
  { id: 'profits', label: 'تقرير الأرباح', icon: '📈' },
  { id: 'summary', label: 'الملخص العام', icon: '🧠' },
  { id: 'partners', label: 'الشركاء والتسويات', icon: '🤝' },
];

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (id: string) => void }) {
  return (
    <aside className="w-72 bg-[#111827] border-l border-slate-800 fixed h-full right-0 z-40 flex flex-col">
      {/* منطقة الشعار - تصميم محسن */}
      <div className="p-6 border-b border-slate-800 flex flex-col items-center gap-4 bg-gradient-to-b from-[#0f172a] to-[#111827]">
        <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20 border-4 border-white/5 group">
          {/* 
             ملاحظة: تأكد من وجود الملف في: public/images/logo.png 
             إذا كان الامتداد jpg، قم بتغيير src إلى /images/logo.jpg 
          */}
          <Image 
            src="/images/logo.png" 
            alt="شعار امتداد جروب" 
            width={120} 
            height={120}
            className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
            priority
            unoptimized={true} // لتجنب مشاكل التحميل إذا كانت الصورة كبيرة
          />
        </div>
        
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-wide drop-shadow-md">امتداد جروب</h1>
          <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase opacity-80">EMTDAD GROUP COMPANY</p>
          <div className="w-12 h-0.5 bg-blue-500 mx-auto mt-2 rounded-full"></div>
        </div>
      </div>

      {/* القائمة الجانبية */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm translate-x-[-4px]' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 hover:translate-x-[-2px]'
            }`}>
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
      
      {/* تذييل القائمة */}
      <div className="p-4 border-t border-slate-800 text-center bg-[#0b1120]/50">
        <p className="text-[10px] text-slate-500 font-mono">نظام الإدارة المتكامل v2.0</p>
      </div>
    </aside>
  );
}
