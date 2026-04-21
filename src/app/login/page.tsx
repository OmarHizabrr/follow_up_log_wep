'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        const cloudData = snap.exists() ? { uid: user.uid, ...snap.data() } : null;
        if (cloudData) {
          localStorage.setItem('userData', JSON.stringify(cloudData));
        }
        router.push(shouldCompleteProfile(cloudData) ? '/login/complete-profile' : '/dashboard');
      } catch {
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
      className="min-h-[100svh] min-h-[100dvh] bg-[#020b22] text-white font-['Cairo'] antialiased"
      dir="rtl"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="grid min-h-[100svh] min-h-[100dvh] lg:grid-cols-2">
        <section className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10 bg-[#020b22]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full max-w-[430px]"
          >
            <div className="mb-5 text-center">
              <h1 className="text-4xl font-black tracking-tight text-white">تسجيل الدخول</h1>
              <p className="mt-2 text-sm text-blue-100/80 font-semibold">
                أدخل بياناتك لمتابعة وردك اليومي وإنجازاتك.
              </p>
            </div>

            <Card className="bg-[#020b22]/80 border border-[#1f3564] rounded-3xl shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="w-full p-3.5 bg-red-900/20 border border-red-500/30 rounded-2xl text-sm font-bold text-red-300 flex items-center gap-2.5"
                    >
                      <Zap className="w-4 h-4 shrink-0" />
                      <p className="flex-1 text-right">{errorMsg}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  onClick={signInWithGoogle}
                  isLoading={isLoading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white border-0 shadow-lg shadow-blue-900/30"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  المتابعة بحساب Google
                </Button>

                <p className="text-center text-xs text-blue-100/70 leading-relaxed">
                  تسجيل الدخول متاح فقط عبر حساب Google لضمان أمان أعلى وربط موحد للحسابات.
                </p>

                <div className="pt-2 text-center space-y-2">
                  <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#8ca2cf] hover:text-white transition-colors">
                    العودة للرئيسية
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        <section className="hidden lg:flex relative overflow-hidden bg-[#0a1433] border-r border-[#1f3564]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.20),transparent_45%)]" />
          <div className="relative z-10 flex flex-col justify-between p-10 w-full">
            <div className="flex items-center justify-end gap-3">
              <img src="/images/logo/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
              <div className="text-right">
                <p className="text-white font-black text-2xl">روضة الحافظين</p>
                <p className="text-blue-100/70 text-sm">برنامج تحفيظ السنة</p>
              </div>
            </div>

            <div className="max-w-lg self-end text-right">
              <h2 className="text-5xl font-black leading-[1.25]">
                عُد إلى مأرز <span className="text-[#3B82F6]">الإيمان</span> واليقين
              </h2>
              <p className="mt-5 text-xl text-blue-100/75 leading-relaxed">
                الاستمرارية هي سر الإتقان. سجّل دخولك وواصل رحلتك في حفظ وضبط المتن الشريف.
              </p>
            </div>

            <div className="text-right text-sm text-blue-100/60">© 2026 روضة الحافظين</div>
          </div>
        </section>
      </div>

      <div className="lg:hidden text-center pb-4 text-[10px] font-bold text-blue-100/70 uppercase tracking-[0.45em]">
        ALMOSAWA • v2.5
      </div>
    </div>
  );
}
