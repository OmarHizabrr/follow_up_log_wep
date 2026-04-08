'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check local storage for user data and redirect if exists
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

  return (
    <>
      <Head>
        <title>سجل الحلقات | الرئيسية</title>
      </Head>

      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      
      <main className="welcome-container">
        <div className="logo-container" style={{ width: '80px', height: '80px', marginBottom: '1.5rem' }}>
          <img src="/images/logo/logo.png" alt="شعار منصة المتابعة" />
        </div>

        {user ? (
          <>
            <h1 className="title" style={{ fontSize: '2.5rem' }}>أهلاً بك، {user.displayName || 'مستخدم'}</h1>
            <p className="subtitle">
              لقد سجلت الدخول بنجاح إلى منصة المتابعة. يمكنك الآن البدء في إدارة الحلقات.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column' }}>
              <Link href="/dashboard" className="btn-primary">
                انتقل إلى لوحة التحكم
              </Link>
              
              <button onClick={handleLogout} className="btn-secondary">
                تسجيل الخروج
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="title">سجل الحلقات</h1>
            <p className="subtitle">
              المنصة الأولى لإدارة ومتابعة الحلقات القرآنية بأسلوب عصري ومبتكر
            </p>
            
            <Link href="/login" className="btn-primary">
              <svg className="icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              الدخول للمنصة
            </Link>
          </>
        )}
      </main>
    </>
  );
}
