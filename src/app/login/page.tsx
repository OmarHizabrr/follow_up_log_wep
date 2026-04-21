'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { Phone, Mail, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');

  const shouldCompleteProfile = (data: Record<string, unknown> | null | undefined) => {
    if (!data) return true;
    const phoneNumber = String(data.phoneNumber ?? '').trim();
    const password = String(data.password ?? '').trim();
    return !phoneNumber || !password;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const rawData = localStorage.getItem('userData');
        const parsedData = rawData ? JSON.parse(rawData) : null;
        router.push(shouldCompleteProfile(parsedData) ? '/login/complete-profile' : '/dashboard');
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
        router.push(shouldCompleteProfile(sessionData) ? '/login/complete-profile' : '/dashboard');
      }
    } catch (error: any) {
      setErrorMsg('فشل تسجيل الدخول. يرجى التحقق من الاتصال والمحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-[100svh] min-h-[100dvh] bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-700 dark:from-[#08271f] dark:via-[#0d3a2f] dark:to-[#175443] flex flex-col items-center justify-center relative overflow-x-clip font-['Cairo'] antialiased"
      dir="rtl"
      style={{
        paddingTop: 'max(1.25rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
        paddingInlineStart: 'max(0.9rem, env(safe-area-inset-right, 0px))',
        paddingInlineEnd: 'max(0.9rem, env(safe-area-inset-left, 0px))',
      }}
    >
      
      {/* Background Decorative Effects */}
      <div className="absolute top-0 right-0 w-[380px] h-[380px] sm:w-[500px] sm:h-[500px] bg-emerald-300/15 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] bg-lime-200/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[420px] z-10"
      >
        {/* Back Link */}
        <div className="mb-6 sm:mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-100/80 hover:text-white transition-colors group">
            <span>العودة للرئيسية</span>
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl shadow-black/15 border-emerald-50/70 dark:border-emerald-900/40 relative overflow-hidden bg-white/95 dark:bg-slate-950/90">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700"></div>
          
          <CardContent className="p-5 sm:p-8 md:p-10">
            <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
              
              <div className="relative group">
                 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-900 rounded-[1.25rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-center p-3 sm:p-4 transition-transform group-hover:scale-110 duration-500">
                   <img src="/images/logo/logo.png" alt="Logo" className="w-full h-full object-contain" />
                 </div>
                 <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-slate-900">
                    <ShieldCheck size={14} />
                 </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">بوابة الوصول الآمن</h1>
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
                  className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl gap-3 sm:gap-4 group text-sm sm:text-base"
                >
                   <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
                      <Mail size={16} />
                   </div>
                   تسجيل الدخول باستخدام Google
                </Button>

                <Button 
                  onClick={() => router.push('/login/phone')}
                  variant="outline"
                  className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl group border-slate-200 dark:border-slate-800"
                >
                  <div className="w-7 h-7 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                     <Phone size={16} />
                  </div>
                  <span className="text-sm sm:text-base">الدخول عبر رقم الهاتف</span>
                </Button>
              </div>

              <div className="pt-6 sm:pt-8 w-full border-t border-slate-100 dark:border-slate-800/60 mt-2 sm:mt-4 flex flex-col items-center gap-4">
                 <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
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

        <div className="mt-7 sm:mt-12 text-center">
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.6em]">ALMOSAWA • v2.5</p>
        </div>
      </motion.div>
    </div>
  );
}
