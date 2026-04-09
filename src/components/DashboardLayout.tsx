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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
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
    { name: 'التقارير', href: '/dashboard/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'الإعدادات', href: '/dashboard/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  if (!user && typeof window !== 'undefined') return null;

  return (
    <div className="flex h-screen bg-transparent font-['Tajawal'] text-white overflow-hidden p-4 md:p-6" dir="rtl">
      {/* Desktop Sidebar - Now as a Floating Glass Panel */}
      <aside className="hidden lg:flex flex-col w-72 h-full glass-panel rounded-[2.5rem] overflow-hidden animate-snappy border-white/5">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center p-2.5 shadow-lg shadow-primary-glow border border-white/10 ring-1 ring-white/20">
              <img src="/images/logo/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
               <h1 className="text-xl font-black tracking-tight text-gradient leading-none">منصة المتابعة</h1>
               <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold opacity-80">AlMosawa Platform</span>
            </div>
          </div>

          <nav className="space-y-2.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`group relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-xl shadow-primary-glow' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                    </svg>
                  </div>
                  <span className="font-bold text-sm tracking-wide">{link.name}</span>
                  {isActive && (
                    <div className="absolute left-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center font-black text-primary border-white/10 text-lg">
              {user?.displayName ? user.displayName[0] : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-gradient">{user?.displayName}</p>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{user?.role === 'admin' ? 'مدير النظام' : 'معلم الحلقة'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-rose-500/10 text-rose-500 font-bold text-sm bg-rose-500/5 hover:bg-rose-500 hover:text-white rounded-2xl transition-all active:scale-95 duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden mr-0 lg:mr-6 animate-fade">
        {/* Top Header - Desktop: Global Tools, Mobile: Toggle & Brand */}
        <header className="h-20 lg:h-24 glass-panel rounded-[2rem] flex items-center justify-between px-8 mb-6 shrink-0 border-white/5 relative overflow-hidden group">
          {/* Mobile Toggle */}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-3 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>

          {/* Search Box - Hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-4 flex-1 max-w-md mx-4">
             <div className="relative w-full group/search">
                <input 
                  type="text" 
                  placeholder="البحث السريع في النظام..." 
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold placeholder:text-slate-600 focus:bg-white/[0.07] focus:border-primary/50 outline-none transition-all"
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/search:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Notification Bell */}
             <button className="relative w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-all group/bell">
                <svg className="w-6 h-6 group-hover/bell:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#020617] animate-pulse"></span>
             </button>

             {/* User Profile Mini (Desktop Only) */}
             <div className="hidden md:flex items-center gap-3 bg-white/5 p-2 pr-4 rounded-2xl border border-white/5">
                <div className="text-right">
                   <p className="text-xs font-black text-white">{user?.displayName?.split(' ')[0]}</p>
                   <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">Online</p>
                </div>
                <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center font-black text-primary border-white/10 text-sm">
                  {user?.displayName ? user.displayName[0] : 'U'}
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar pr-1">
          <div className="max-w-[1400px] mx-auto h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer (Overlay) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex lg:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-[85%] max-w-sm glass-panel m-4 rounded-[2.5rem] p-8 shadow-2xl animate-snappy flex flex-col border-white/10">
            <div className="flex items-center justify-between mb-10">
              <span className="text-xl font-black text-gradient">القائمة الرئيسية</span>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2.5 bg-white/5 text-slate-400 rounded-xl border border-white/10">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="space-y-3">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all shadow-sm ${pathname === link.href ? 'bg-primary text-white shadow-primary-glow' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                  </svg>
                  <span className="font-bold">{link.name}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-auto pt-8 border-t border-white/5">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
