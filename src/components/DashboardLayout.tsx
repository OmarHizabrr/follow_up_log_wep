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
  LogOut, 
  Menu, 
  X, 
  Bell,
  Search,
  Settings
} from 'lucide-react';

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
    { name: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard },
    { name: 'إدارة الطلاب', href: '/dashboard/students', icon: Users },
    { name: 'تحضير الحلقات', href: '/dashboard/attendance', icon: CheckSquare },
    { name: 'متابعة الحفظ', href: '/dashboard/recitation', icon: BookOpen },
    { name: 'الاختبارات', href: '/dashboard/tests', icon: ClipboardList },
    { name: 'المناهج', href: '/dashboard/plans', icon: FileText },
    { name: 'الزيارات الإدارية', href: '/dashboard/visits', icon: Eye },
    { name: 'التقارير', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f3f4f6] dark:bg-[#111827] text-gray-900 dark:text-gray-100 font-['Tajawal']" dir="rtl">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 h-full z-20 shadow-sm transition-colors duration-200">
        
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center p-1">
               <img src="/images/logo/logo.png" alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
             </div>
             <h1 className="text-xl font-bold text-gray-800 dark:text-white">نظام المتابعة</h1>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 px-3 uppercase tracking-wider">
             القائمة الرئيسية
          </div>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className="text-sm">{link.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* User Profile Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center text-blue-600 dark:text-white font-bold text-sm shrink-0">
              {user?.displayName ? user.displayName[0] : 'U'}
            </div>
            <div className="min-w-0 flex-1">
               <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.displayName || 'مستخدم النظام'}</p>
               <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-semibold"
          >
             <LogOut className="w-4 h-4" />
             تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 transition-colors duration-200">
           
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="lg:hidden p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                 <Menu className="w-6 h-6" />
              </button>
              
              {/* Global Search */}
              <div className="hidden md:flex items-center relative w-96">
                <Search className="w-5 h-5 absolute right-3 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="البحث في النظام..." 
                  className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-lg py-2 pr-10 pl-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none dark:text-white transition-shadow"
                />
              </div>
           </div>

           <div className="flex items-center gap-3">
              <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative transition-colors">
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
              </button>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden sm:block mx-1"></div>
              <div className="hidden sm:flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center text-blue-600 dark:text-white font-bold text-sm">
                   {user?.displayName ? user.displayName[0] : 'U'}
                 </div>
              </div>
           </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
           <div className="max-w-[1400px] mx-auto min-h-full">
              {children}
           </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
           <div 
             className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" 
             onClick={() => setIsSidebarOpen(false)}
           ></div>
           
           <aside className="relative w-72 h-full bg-white dark:bg-gray-800 flex flex-col shadow-2xl animate-in slide-in-from-right-full duration-200">
              <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                   <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
                     <span className="text-white font-bold text-xs">M</span>
                   </div>
                   <h1 className="text-lg font-bold text-gray-800 dark:text-white">نظام المتابعة</h1>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="p-1 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} href={link.href} onClick={() => setIsSidebarOpen(false)}>
                      <div className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
                        isActive ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                        <span className="text-sm">{link.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
           </aside>
        </div>
      )}
    </div>
  );
}
