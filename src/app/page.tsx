'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LogIn, LogOut, ShieldCheck } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);
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

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 font-['Tajawal'] antialiased">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-900 dark:text-gray-100">
        
        <div className="mx-auto w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <img src="/images/logo/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>

        {user ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">مرحباً، {user.displayName?.split(' ')[0]}</h1>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              تم تسجيل الدخول بنجاح
            </div>
            
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Link href="/dashboard" className="enterprise-button w-full py-3.5 text-base shadow-md">
                الذهاب للوحة التحكم
              </Link>
              <button 
                onClick={handleLogout} 
                className="enterprise-button-secondary w-full py-3.5 text-base"
              >
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">نظام المتابعة</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                المنصة الإدارية الموحدة لمتابعة البيانات وتسجيل الحضور وإدارة الحلقات.
              </p>
            </div>
            
            <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
              <Link href="/login" className="enterprise-button w-full py-3.5 text-base shadow-md">
                <LogIn className="w-5 h-5" />
                الدخول للنظام
              </Link>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 text-xs text-gray-400 dark:text-gray-500">
        &copy; {new Date().getFullYear()} نظام المتابعة الإداري - الإصدار المؤسسي
      </footer>
    </div>
  );
}
