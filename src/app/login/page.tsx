'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

interface UserSession {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  type?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: any;
  lastLoginAt?: any;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const [errorMsg, setErrorMsg] = useState('');

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        console.log('✅ تم تسجيل الدخول بجوجل:', result.user.uid);
        
        const userRef = doc(db, 'users', result.user.uid);
        const docSnap = await getDoc(userRef);
        
        let sessionData: UserSession;

        if (docSnap.exists()) {
          const data = docSnap.data();
          sessionData = {
            uid: result.user.uid,
            ...data
          } as UserSession;
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
        router.push('/');
      }
    } catch (error: any) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      setErrorMsg('فشل في تسجيل الدخول. تأكد من اتصالك أو حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToPhoneLogin = () => {
    router.push('/login/phone');
  };

  const closeAlert = () => setErrorMsg('');

  return (
    <div className="auth-page-wrapper">
      <Head>
        <title>تسجيل الدخول | منصة المتابعة</title>
      </Head>

      {/* Alert Modal */}
      {errorMsg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#042f2e] border border-amber-500 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl shadow-black/50">
            <svg className="w-12 h-12 text-amber-500 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3 className="text-white text-xl font-bold mb-2">تنبيه</h3>
            <p className="text-slate-400 mb-6 leading-relaxed">{errorMsg}</p>
            <button onClick={closeAlert} className="btn-secondary w-full">حسناً</button>
          </div>
        </div>
      )}

      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>

      <div className="welcome-container">
        <div className="logo-container">
          <img src="/images/logo/logo.png" alt="Logo" />
        </div>

        <h1 className="title">منصة المتابعة</h1>
        <p className="subtitle">يرجى تسجيل الدخول لمتابعة العمل</p>

        <button 
          onClick={signInWithGoogle} 
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              جاري الدخول...
            </span>
          ) : (
            <>
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              الدخول عبر جوجل
            </>
          )}
        </button>

        <div className="divider-wrapper">
          <hr />
          <span>أو</span>
          <hr />
        </div>

        <button onClick={goToPhoneLogin} className="btn-secondary">
          <svg className="icon" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="currentColor" fill="none" />
          </svg>
          رقم الهاتف
        </button>

        <div className="info-box">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>تنبيه: يجب أن يكون حسابك مسجلاً مسبقاً لدى الإدارة.</span>
        </div>
      </div>
    </div>
  );
}
