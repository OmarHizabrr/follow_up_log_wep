'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  LogIn, 
  LogOut, 
  Sparkles, 
  LayoutDashboard, 
  Smartphone,
  Shield,
  Zap,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-blue-100 selection:text-blue-900" dir="rtl">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg z-10"
      >
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl p-10 md:p-14 text-center space-y-8">
           
           {/* Logo Section */}
           <div className="flex flex-col items-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center p-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                 <img src="/images/logo/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>

              <div className="space-y-2">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                    <Shield className="w-3 h-3" />
                    المنصة الموحدة لإدارة الحلقات
                 </div>
                 <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">سجل المتابعة الذكي</h1>
                 <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                    النظام المتكامل لإدارة الحلقات التعليمية ومتابعة إنجاز الطلاب بدقة واحترافية عالية.
                 </p>
              </div>
           </div>

           {user ? (
             <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">مرحباً بك، {user.displayName}</span>
                </div>
                
                <div className="flex flex-col gap-3">
                   <Link href="/dashboard" className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/10 transition-all active:scale-95">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>الدخول للوحة التحكم</span>
                   </Link>
                   <button onClick={handleLogout} className="h-12 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-bold border border-slate-100 dark:border-slate-700 hover:bg-slate-100 transition-all text-xs">
                      تسجيل الخروج
                   </button>
                </div>
             </div>
           ) : (
             <div className="space-y-6">
                <Link href="/login" className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/10 transition-all active:scale-95">
                   <LogIn className="w-4 h-4" />
                   <span>تسجيل الدخول للمنصة</span>
                </Link>

                <div className="grid grid-cols-3 gap-3">
                   <MiniBadge icon={Smartphone} label="مزامنة" />
                   <MiniBadge icon={Zap} label="سرعة" />
                   <MiniBadge icon={CheckCircle2} label="دقة" />
                </div>
             </div>
           )}

        </div>

        <footer className="mt-8 flex flex-col md:flex-row items-center justify-between px-2 gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           <p>&copy; {new Date().getFullYear()} ALMOSAWA TECH</p>
           <div className="flex gap-4">
              <Link href="#" className="hover:text-blue-500 transition-colors">الدعم الفني</Link>
              <Link href="#" className="hover:text-blue-500 transition-colors">سياسة الخصوصية</Link>
           </div>
        </footer>
      </motion.div>
    </div>
  );
}

function MiniBadge({ icon: Icon, label }: any) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 transition-all hover:border-blue-500/30">
       <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400">
          <Icon className="w-4 h-4" />
       </div>
       <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}
