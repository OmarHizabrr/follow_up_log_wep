'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Phone, ArrowRight, Lock } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 font-['Tajawal']" dir="rtl">
      <div className="w-full max-w-md">
        
        <div className="mb-6">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 font-medium">
            <ArrowRight className="w-4 h-4" />
            العودة للخلف
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-900 dark:text-gray-100">
          
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center p-1.5 mb-5">
            <img src="/images/logo/logo.png" alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
          </div>

          <h1 className="text-xl font-bold mb-1">تسجيل الدخول</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            أدخل رقم الجوال وكلمة المرور للوصول لحسابك
          </p>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-right">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4 text-right">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                رقم الجوال
              </label>
              <input 
                type="tel" 
                placeholder="05XXXXXXXX" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-left"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                كلمة المرور
              </label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-left"
                dir="ltr"
              />
            </div>

            <button 
              onClick={handlePhoneLogin} 
              disabled={isLoading || !phoneNumber || !password}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-lg mt-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'جاري التحقق...' : 'دخول للمنصة'}
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            بياناتك مشفرة ومحمية بالكامل
          </div>
        </div>

      </div>
    </div>
  );
}
