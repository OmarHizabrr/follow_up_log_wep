'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userData');
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="auth-page-wrapper relative overflow-hidden bg-bg-main font-['Tajawal'] antialiased">
      {/* Background Dynamics */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
      
      <main className="welcome-container glass-panel p-12 md:p-20 rounded-[4rem] border-white/5 animate-snappy relative z-10 shadow-2xl">
        <div className="logo-container mb-10 scale-125">
          <img src="/images/logo/logo.png" alt="Logo" className="w-full h-full object-contain p-2" />
        </div>

        {user ? (
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl font-black text-gradient tracking-tight">أهلاً بك، {user.displayName?.split(' ')[0]}</h1>
            <p className="text-slate-500 font-bold text-lg">
              لحسن الحظ، أنت مسجل دخول بالفعل. يمكنك الانتقال مباشرة للوحة التحكم.
            </p>
            
            <div className="flex flex-col gap-4 w-full">
              <Link href="/dashboard" className="w-full primary-gradient py-5 rounded-3xl font-black text-white text-center shadow-xl shadow-primary-glow hover:scale-[1.02] active:scale-95 transition-all">
                لوحة التحكم القوية
              </Link>
              
              <button onClick={handleLogout} className="w-full py-4 rounded-3xl bg-white/5 border border-white/10 text-slate-500 font-black hover:text-white transition-all">
                تسجيل الخروج
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-gradient tracking-tighter mb-6">روضة الحافظين</h1>
              <p className="text-slate-500 font-bold text-xl leading-relaxed">
                المنصة الأولى لإدارة ومتابعة الحلقات القرآنية بأسلوب عصري ومبتكر يجمع بين الأصالة والتقنية.
              </p>
            </div>
            
            <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
              <Link href="/login" className="flex items-center justify-center gap-3 w-full primary-gradient py-6 rounded-[2.5rem] font-black text-lg text-white shadow-2xl shadow-primary-glow hover:scale-[1.05] active:scale-95 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                الدخول للمنصة
              </Link>
              
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Integrated Tracking Solutions</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
