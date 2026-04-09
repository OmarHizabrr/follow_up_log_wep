'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

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
    
    setIsLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', phoneNumber.trim()), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('لم يتم العثور على مستخدم مرتبط بهذا الرقم.');
      }

      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
      
      if (!data.password || data.password !== password.trim()) {
        throw new Error('بيانات الدخول غير صحيحة.');
      }

      await updateDoc(doc(db, 'users', userDoc.id), { lastLoginAt: serverTimestamp() });
      
      const sessionData = { uid: userDoc.id, ...data };
      localStorage.setItem('userData', JSON.stringify(sessionData));
      
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMsg(error.message || 'فشل في تسجيل الدخول.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper relative overflow-hidden bg-bg-main font-['Tajawal'] antialiased">
      {/* Background Dynamics */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
      
      <div className="welcome-container glass-panel p-10 md:p-16 rounded-[3rem] border-white/5 animate-snappy relative z-10 shadow-2xl">
        <div className="flex justify-start w-full mb-8">
           <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-white transition-all font-bold text-sm group">
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 12H5m7-7l-7 7 7 7" /></svg>
              العودة للخلف
           </button>
        </div>

        <div className="logo-container mb-8">
          <img src="/images/logo/logo.png" alt="Logo" className="w-full h-full object-contain p-2" />
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-gradient tracking-tight mb-4">الدخول بالهاتف</h1>
        <p className="text-slate-500 font-bold mb-10 text-lg">يرجى إدخال بيانات الدخول الخاصة بك</p>

        <div className="space-y-6 w-full text-right">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mr-2">رقم الهاتف</label>
            <input 
              type="tel" 
              placeholder="+966 50 000 0000" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full elite-input font-bold text-center tracking-widest"
              dir="ltr"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mr-2">كلمة المرور</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full elite-input font-bold text-center tracking-widest"
              dir="ltr"
            />
          </div>
          
          <button 
            onClick={handlePhoneLogin} 
            disabled={isLoading || !phoneNumber || !password}
            className="w-full primary-gradient py-5 rounded-2xl font-black text-white text-sm tracking-[0.2em] shadow-xl shadow-primary-glow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4"
          >
            {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </div>

        {errorMsg && (
          <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-bold animate-snappy">
            {errorMsg}
          </div>
        )}
      </div>

      <footer className="absolute bottom-6 left-0 right-0 text-center">
         <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Integrated Secure Login System</p>
      </footer>
    </div>
  );
}
