'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { 
  Phone, 
  Mail, 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  Zap,
  LayoutDashboard,
  Shield,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const userRef = doc(db, 'users', result.user.uid);
        const docSnap = await getDoc(userRef);
        
        let sessionData;

        if (docSnap.exists()) {
          const data = docSnap.data();
          sessionData = { uid: result.user.uid, ...data };
          await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
        } else {
          sessionData = {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            type: 'user',
            role: 'user',
            isActive: true,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          };
          await setDoc(userRef, sessionData);
        }
        
        localStorage.setItem('userData', JSON.stringify(sessionData));
        router.push('/dashboard');
      }
    } catch (error: any) {
      setErrorMsg('فشل تسجيل الدخول. يرجى التحقق من الاتصال والمحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden font-['Cairo'] antialiased" dir="rtl">
      
      {/* Background Decorative Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[420px] z-10"
      >
        {/* Back Link */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors group">
            <span>العودة للرئيسية</span>
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl shadow-blue-500/10 border-slate-200/60 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          
          <CardContent className="p-8 md:p-12">
            <div className="flex flex-col items-center text-center space-y-8">
              
              <div className="relative group">
                 <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-center p-4 transition-transform group-hover:scale-110 duration-500">
                   <img src="/images/logo/logo.png" alt="Logo" className="w-full h-full object-contain" />
                 </div>
                 <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-slate-900">
                    <ShieldCheck size={14} />
                 </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">بوابة الوصول الآمن</h1>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                  نظام إدارة المتابعة التعليمية المؤسسية
                </p>
              </div>

              <AnimatePresence>
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-3"
                  >
                    <Zap className="w-4 h-4 shrink-0" />
                    <p className="flex-1 text-right">{errorMsg}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full space-y-4">
                <Button 
                  onClick={signInWithGoogle} 
                  isLoading={isLoading}
                  className="w-full h-14 rounded-2xl gap-4 group text-base"
                >
                   <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
                      <Mail size={16} />
                   </div>
                   تسجيل الدخول باستخدام Google
                </Button>

                <Button 
                  onClick={() => router.push('/login/phone')}
                  variant="outline"
                  className="w-full h-14 rounded-2xl group border-slate-200 dark:border-slate-800"
                >
                  <div className="w-7 h-7 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                     <Phone size={16} />
                  </div>
                  <span className="text-base">الدخول عبر رقم الهاتف</span>
                </Button>
              </div>

              <div className="pt-8 w-full border-t border-slate-100 dark:border-slate-800/60 mt-4 flex flex-col items-center gap-4">
                 <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    نظام وصول مشفر ومعياري
                 </div>
                 <div className="flex items-center gap-5 opacity-20 grayscale">
                    <div className="w-6 h-6 rounded bg-slate-400"></div>
                    <div className="w-6 h-6 rounded bg-slate-400"></div>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.6em]">ALMOSAWA • v2.5</p>
        </div>
      </motion.div>
    </div>
  );
}
