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
    <>
      <Head>
        <title>تسجيل الدخول | منصة المتابعة</title>
      </Head>

      {/* Alert Modal */}
      {errorMsg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'var(--bg-gradient-start)', padding: '2rem', borderRadius: '16px',
            border: '1px solid var(--accent)', maxWidth: '400px', width: '90%',
            textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <svg style={{margin: '0 auto 1rem', width: '48px', height: '48px', color: 'var(--accent)'}} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3 style={{marginBottom: '1rem', color: '#fff', fontSize: '1.25rem'}}>تنبيه</h3>
            <p style={{color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5}}>{errorMsg}</p>
            <button onClick={closeAlert} className="btn-secondary" style={{padding: '0.75rem 2rem'}}>حسناً</button>
          </div>
        </div>
      )}

      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      
      <main className="welcome-container">
        
        <div className="logo-container">
          {/* We will use a standard img tag until next/image is configured for local external images, or directly use next/image with imported local src. */}
          <img src="/images/logo/logo.png" alt="شعار منصة المتابعة" />
        </div>

        <h1 className="title">منصة المتابعة</h1>
        <p className="subtitle">بوابة القبول الالكترونية</p>
        
        <button 
          onClick={signInWithGoogle} 
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? 'جاري تسجيل الدخول...' : (
            <>
              {/* Google Icon Approximation */}
              <svg className="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              تسجيل الدخول عبر جوجل
            </>
          )}
        </button>

        <div className="divider-wrapper">
          <hr />
          <span>أو اختر طريقة أخرى</span>
          <hr />
        </div>

        <button onClick={goToPhoneLogin} disabled={isLoading} className="btn-secondary">
          <svg className="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
          الدخول عبر رقم الجوال
        </button>

        <div className="info-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <p>يجب أن تكون مسجلاً في حساب للوصول للتطبيق</p>
        </div>

      </main>
    </>
  );
}
