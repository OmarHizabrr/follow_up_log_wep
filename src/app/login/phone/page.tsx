'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function PhoneLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handlePhoneLogin = async () => {
    setErrorMsg('');
    if (!phoneNumber) return setErrorMsg('الرجاء إدخال رقم الجوال');
    if (!password) return setErrorMsg('الرجاء إدخال كلمة المرور');
    
    // Format if necessary
    const normalizedPhone = phoneNumber.trim();

    setIsLoading(true);
    try {
      // Fetch user from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', normalizedPhone), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('لم يتم العثور على مستخدم مرتبط بهذا الرقم. يجب التسجيل عبر جوجل أولاً.');
      }

      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
      const storedPassword = data.password;

      if (!storedPassword) {
        throw new Error('لم يتم تعيين كلمة مرور لهذا الحساب بعد.');
      }

      if (storedPassword !== password.trim()) {
        throw new Error('كلمة المرور غير صحيحة.');
      }

      // Check success!
      console.log('✅ تم تسجيل الدخول بنجاح:', userDoc.id);
      
      // Update the login field only (lastLoginAt)
      await updateDoc(doc(db, 'users', userDoc.id), { lastLoginAt: serverTimestamp() });
      
      // Store local session (matching flutter behaviour)
      const sessionData = {
        uid: userDoc.id,
        ...data
      };
      localStorage.setItem('userData', JSON.stringify(sessionData));
      
      router.push('/');
    } catch (error: any) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      setErrorMsg(error.message || 'فشل في تسجيل الدخول. أعد المحاولة.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  const closeAlert = () => setErrorMsg('');

  return (
    <>
      <Head>
        <title>التسجيل برقم الهاتف | منصة المتابعة</title>
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
      
      <main className="welcome-container" style={{ paddingTop: '2rem' }}>
        
        {/* Back Button */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
          <button onClick={goBack} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)', marginLeft: '8px' }}>
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
            رجوع
          </button>
        </div>

        <div className="logo-container" style={{ width: '100px', height: '100px', marginBottom: '1.5rem' }}>
          <img src="/images/logo/logo.png" alt="شعار منصة المتابعة" />
        </div>

        <h1 className="title" style={{ fontSize: '2rem' }}>الدخول برقم الجوال</h1>
        <p className="subtitle" style={{ marginBottom: '2rem' }}>
          يرجى إدخال رقم هاتفك وكلمة المرور المسجلة مسبقاً
        </p>

        <input 
          type="tel" 
          placeholder="رقم الهاتف (مثال: +9665xxxxxxxxx)" 
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="input-field"
          dir="ltr"
        />
        
        <input 
          type="password" 
          placeholder="كلمة المرور" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          dir="ltr"
        />
        
        <button 
          onClick={handlePhoneLogin} 
          disabled={isLoading || !phoneNumber || !password}
          className="btn-primary"
        >
          {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
        </button>
      </main>
    </>
  );
}
