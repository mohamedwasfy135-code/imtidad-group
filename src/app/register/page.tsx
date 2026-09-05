"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل إنشاء الحساب');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1120]" dir="rtl">
      <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700/50 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">حساب جديد</h1>
        <p className="text-slate-400 text-sm text-center mb-8">أنشئ حسابك الخاص لبدء استخدام النظام</p>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">الاسم</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
            {loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
          </button>
          <p className="text-center text-sm text-slate-400">
            لديك حساب بالفعل؟ <Link href="/login" className="text-blue-400 hover:underline">تسجيل الدخول</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
