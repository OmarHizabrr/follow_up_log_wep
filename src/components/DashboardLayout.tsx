'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  BookOpen, 
  ClipboardList, 
  FileText, 
  Eye, 
  BarChart3, 
  Shield,
  LogOut, 
  Menu, 
  X, 
  Bell,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Command,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { canAccessRoute, getAllowedRoutes, isAdminLike, SessionUser } from '@/lib/access';
import { UI_TEXT } from '@/lib/ui-text';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user] = useState<SessionUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem('userData');
    return stored ? JSON.parse(stored) : null;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem('sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!canAccessRoute(pathname, user)) {
      router.push('/dashboard');
      return;
    }
  }, [router, pathname, user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 2000);
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('userData');
    router.push('/login');
  };

  const isAdmin = isAdminLike(user);

  const allNavLinks = [
    { name: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard },
    { name: 'إدارة الطلاب', href: '/dashboard/students', icon: Users },
    { name: 'تحضير الحلقات', href: '/dashboard/attendance', icon: CheckSquare },
    { name: 'متابعة الحفظ', href: '/dashboard/recitation', icon: BookOpen },
    { name: 'الاختبارات', href: '/dashboard/tests', icon: ClipboardList },
    { name: 'المناهج', href: '/dashboard/plans', icon: FileText },
    { name: 'الزيارات الإدارية', href: '/dashboard/visits', icon: Eye },
    { name: 'إدارة المستخدمين', href: '/dashboard/users', icon: Shield },
    { name: 'التقارير', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
  ];
  const allowedRoutes = getAllowedRoutes(user);
  const navLinks = allNavLinks.filter((link) => allowedRoutes.includes(link.href));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-['Cairo'] antialiased selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden" dir="rtl">
      
      {/* Sidebar - Desktop */}
      <motion.aside 
        animate={{ width: isCollapsed ? 96 : 288 }}
        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
        className="fixed inset-y-0 right-0 hidden lg:flex flex-col bg-white dark:bg-[#0b1220] border-l border-slate-200/70 dark:border-slate-800 z-30 shadow-sm"
      >
        
        {/* Toggle Button */}
        <button 
          onClick={toggleCollapse}
          className="absolute -left-3.5 top-10 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 z-[60] transition-colors"
        >
          {isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Logo Area */}
        <div className={`h-24 flex items-center shrink-0 relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'px-0 justify-center' : 'px-8'}`}>
          <div className="flex items-center gap-4">
             <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center p-2.5 transition-transform shrink-0">
               <img src="/images/logo/logo.png" alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
             </div>
             {!isCollapsed && (
               <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter leading-none">نظام المتابعة</h1>
                  <div className="flex items-center gap-1.5 mt-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"> </span>
                  </div>
               </motion.div>
             )}
          </div>
        </div>

        {/* Navigation */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-6 space-y-1.5 ${isCollapsed ? 'px-3' : 'px-4'}`}>
          {!isCollapsed && (
            <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 mb-6 px-4 uppercase tracking-[0.25em]">
               المنصة الرئيسية
            </div>
          )}
          
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className="block">
                <div className={`group flex items-center rounded-2xl transition-all duration-300 relative ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/25' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                } ${isCollapsed ? 'h-14 w-14 justify-center mx-auto' : 'px-4 py-3.5'}`}>
                  
                  <div className={`flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isCollapsed ? 'w-full h-full' : 'w-9 h-9 ml-3.5 rounded-2xl'
                  } ${
                    isActive 
                      ? isCollapsed ? '' : 'bg-white/15 text-white scale-110' 
                      : 'text-slate-400 group-hover:text-blue-500'
                  }`}>
                    <Icon className={isCollapsed ? 'w-6 h-6' : 'w-4.5 h-4.5'} />
                  </div>

                  {!isCollapsed && <span className="text-sm font-bold tracking-tight whitespace-nowrap">{link.name}</span>}
                  
                  {isActive && !isCollapsed && (
                    <motion.div layoutId="active-nav" className="w-1.5 h-1.5 rounded-full bg-white/60 mr-auto"></motion.div>
                  )}

                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && (
                    <div className="absolute right-full mr-4 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-[100] shadow-xl">
                      {link.name}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* User Profile Area */}
        <div className={`p-4 shrink-0 mt-auto transition-all ${isCollapsed ? 'px-3' : 'px-4'}`}>
          <div className={`p-3 rounded-[1.5rem] border ${isCollapsed ? 'border-transparent bg-transparent' : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30'}`}>
            <div className={`flex items-center ${isCollapsed ? 'flex-col gap-4' : 'gap-3.5 mb-4'}`}>
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-sm overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    user?.displayName ? user.displayName[0] : 'U'
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></div>
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                   <p className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">{user?.displayName || 'مستخدم'}</p>
                   <p className="text-[10px] font-bold text-slate-400 truncate tracking-widest uppercase mt-0.5">{isAdmin ? 'مشرف عام' : 'طالب/معلم'}</p>
                </div>
              )}
              {isCollapsed && (
                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-11 h-11 flex items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 transition-colors shadow-sm"
                  title="تسجيل الخروج"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
            {!isCollapsed && (
              <Button 
                onClick={() => setIsLogoutModalOpen(true)}
                variant="danger"
                className="w-full h-11 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] gap-2.5 opacity-90 hover:opacity-100 shadow-md shadow-red-500/5"
              >
                 <LogOut size={14} />
                 خروج
              </Button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.div 
        animate={{ paddingRight: isCollapsed ? 96 : 288 }}
        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#020617]"
      >
        
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-[72px] bg-white/90 dark:bg-[#020617]/90 backdrop-blur border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between px-8 lg:px-12 shrink-0">
           
            <div className="flex items-center gap-8 flex-1">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="lg:hidden p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-95"
              >
                 <Menu className="w-6 h-6" />
              </button>
              
              {/* Global Search Platform */}
              <div className="hidden md:flex items-center relative w-full max-w-md group">
                <Search className="w-4 h-4 absolute right-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="ابحث عن التقارير والطلاب..." 
                className="w-full h-11 bg-slate-100/50 dark:bg-slate-900/40 border border-transparent focus:border-blue-500/20 rounded-xl pr-11 pl-12 text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:text-white transition-all shadow-inner"
                />
                <div className="absolute left-3.5 flex items-center gap-1 px-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 text-[10px] font-bold text-slate-400 tracking-widest shadow-sm">
                   <Command size={10} />
                   <span>K</span>
                </div>
              </div>
           </div>

           <div className="flex items-center gap-6 shrink-0">
              <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                 <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isSyncing ? 'animate-spin' : ''}`} />
                 <span className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-widest">مـزامن</span>
              </div>

              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800/60 hidden sm:block"></div>

              <div className="flex items-center gap-3">
                <button className="w-11 h-11 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl relative transition-all active:scale-95 group">
                   <Bell className="w-5.5 h-5.5" />
                   <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-500 border-2 border-white dark:border-[#020617] rounded-full shadow-lg shadow-blue-500/40 animate-bounce"></span>
                </button>
                
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-md transition-all active:scale-95">
                   {user?.displayName ? user.displayName[0] : 'U'}
                </div>
              </div>
           </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
           <AnimatePresence mode="wait">
             <motion.div 
               key={pathname}
               initial={{ opacity: 0, y: 8 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -8 }}
               transition={{ duration: 0.15, ease: "easeOut" }}
               className="max-w-[1700px] mx-auto min-h-full"
             >
                {children}
             </motion.div>
           </AnimatePresence>
        </main>
      </motion.div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" 
               onClick={() => setIsSidebarOpen(false)}
            ></motion.div>
            
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 40, stiffness: 450 }}
              className="relative w-80 h-full bg-white dark:bg-[#0f172a] flex flex-col shadow-2xl"
            >
                {/* Mobile Drawer Header */}
                 <div className="h-24 flex items-center justify-between px-8 border-b border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <img src="/images/logo/logo.png" alt="Logo" className="w-5.5 h-5.5 object-contain filter brightness-0 invert" />
                      </div>
                      <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">نظام المتابعة</h1>
                   </div>
                   <button 
                     onClick={() => setIsSidebarOpen(false)} 
                     className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                   >
                     <X className="w-6.5 h-6.5" />
                   </button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 space-y-2">
                   {navLinks.map((link) => {
                     const isActive = pathname === link.href;
                     const Icon = link.icon;
                     return (
                       <Link key={link.href} href={link.href} onClick={() => setIsSidebarOpen(false)}>
                         <div className={`flex items-center gap-4 px-5 py-4.5 rounded-2xl transition-all ${
                           isActive ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/20' : 'text-slate-600 dark:text-slate-400'
                         }`}>
                           <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                           <span className="text-[15px] font-bold tracking-tight">{link.name}</span>
                         </div>
                       </Link>
                     );
                   })}
                 </div>

                 <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                    <Button 
                      onClick={handleLogout}
                      variant="danger"
                      className="w-full h-14 rounded-2xl font-bold text-sm tracking-widest gap-3"
                    >
                       <LogOut size={20} />
                       تسجيل الخروج
                    </Button>
                 </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title={UI_TEXT.dialogs.logoutTitle}
      >
        <div className="space-y-6 text-right">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            هل أنت متأكد من أنك تريد تسجيل الخروج من المنصة؟
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              className="h-11 px-6"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              {UI_TEXT.actions.cancel}
            </Button>
            <Button
              variant="danger"
              className="h-11 px-6"
              onClick={async () => {
                setIsLogoutModalOpen(false);
                await handleLogout();
              }}
            >
              {UI_TEXT.actions.logout}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
