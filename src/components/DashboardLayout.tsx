'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('userData');
    router.push('/login');
  };

  const navLinks = [
    { name: 'الرئيسية', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'إدارة الطلاب', href: '/dashboard/students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'تحضير الحلقات', href: '/dashboard/attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { name: 'متابعة الحفظ', href: '/dashboard/recitation', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'الاختبارات', href: '/dashboard/tests', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'المناهج', href: '/dashboard/plans', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { name: 'الزيارات الإدارية', href: '/dashboard/visits', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { name: 'التقارير', href: '/dashboard/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-white overflow-hidden p-3 lg:p-5" dir="rtl">
      
      {/* Floating Elite Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 h-full glass-panel rounded-[2.5rem] border-white/5 relative z-[100] shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        <div className="p-8 flex-1">
          <div className="flex items-center gap-4 mb-14 px-2">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center p-2.5 shadow-[0_10px_30px_rgba(16,185,129,0.3)] ring-1 ring-white/20">
              <img src="/images/logo/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
               <h1 className="text-xl font-black text-gradient leading-none">مُتابعة</h1>
               <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-slate-500">Global Hub</span>
            </div>
          </div>

          <nav className="space-y-1.5 flex flex-col">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`group relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 
                    ${isActive ? 'bg-primary/15 text-primary border border-primary/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                               : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                >
                  <div className={`shrink-0 transition-transform duration-500 group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={link.icon} />
                    </svg>
                  </div>
                  <span className={`font-bold text-sm tracking-wide ${isActive ? 'text-white' : ''}`}>{link.name}</span>
                  {isActive && (
                    <div className="absolute left-4 w-1 h-4 rounded-full bg-primary shadow-primary-glow"></div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-8 mt-auto border-t border-white/5 mx-2">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary text-sm shadow-xl">
              {user?.displayName ? user.displayName[0] : 'U'}
            </div>
            <div className="min-w-0">
               <p className="text-xs font-black truncate">{user?.displayName}</p>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{user?.role || 'User'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-rose-500/5 text-rose-500 border border-rose-500/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all duration-300">
             خروج
          </button>
        </div>
      </aside>

      {/* Modern Main Hub */}
      <div className="flex-1 flex flex-col min-w-0 h-full mr-0 lg:mr-6">
        
        {/* Transparent Air Header */}
        <header className={`h-22 lg:h-26 flex items-center justify-between px-8 shrink-0 transition-all duration-300 ${scrolled ? 'glass-panel rounded-3xl mt-4 scale-98 mx-4 z-50' : ''}`}>
           <div className="flex items-center gap-6">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-white/5 rounded-2xl">
                 <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
              </button>
              <div className="hidden sm:flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-primary-glow"></span>
                 <span className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Operational Status: Live</span>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center glass-panel px-4 py-2.5 rounded-2xl border-white/5 shadow-inner">
                 <span className="text-xs font-bold text-slate-400 font-outfit">Today is {new Date().toLocaleDateString('ar-SA')}</span>
              </div>
              <button className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary transition-all">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </button>
           </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto custom-scrollbar px-4 lg:px-8 py-8">
           <div className="max-w-[1600px] mx-auto min-h-full">
              {children}
           </div>
        </main>
      </div>

      {/* Mobile Glass Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[200] flex lg:hidden">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
           <aside className="relative w-[300px] h-full glass-panel border-l-white/10 p-8 flex flex-col animate-snappy">
              <div className="flex justify-between items-center mb-12">
                 <span className="text-xl font-black text-gradient">القائمة</span>
                 <button onClick={() => setIsSidebarOpen(false)} className="p-3 bg-white/5 rounded-xl border border-white/10 text-slate-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <nav className="space-y-3">
                 {navLinks.map((link) => (
                   <Link key={link.href} href={link.href} onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-4 px-6 py-5 rounded-3xl transition-all ${pathname === link.href ? 'bg-primary text-white shadow-xl shadow-primary-glow' : 'text-slate-500 hover:text-white'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} /></svg>
                      <span className="font-bold">{link.name}</span>
                   </Link>
                 ))}
              </nav>
           </aside>
        </div>
      )}

    </div>
  );
}
