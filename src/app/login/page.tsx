'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { Phone, Mail, ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 font-['Tajawal']" dir="rtl">
      <div className="w-full max-w-md">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 font-medium">
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-900 dark:text-gray-100 relative overflow-hidden">
          
          <div className="mx-auto w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 mb-6 shadow-sm border border-gray-100 dark:border-gray-700 z-10 relative">
            <img src="/images/logo/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <h1 className="text-2xl font-bold mb-2">تسجيل الدخول</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            قم بالدخول للوصول إلى لوحة التحكم الخاصة بك
          </p>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-right">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={signInWithGoogle} 
              disabled={isLoading}
              className="enterprise-button-secondary w-full py-3.5 font-bold hover:shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              ) : (
                 <>
                   <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                   تسجيل الدخول بحساب Google
                 </>
              )}
            </button>

            <button 
              onClick={() => router.push('/login/phone')}
              className="enterprise-button-secondary w-full py-3.5 font-bold hover:shadow-md"
            >
              <Phone className="w-5 h-5 text-gray-500" />
              تسجيل الدخول برقم الهاتف
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            تأمين وحماية البيانات بموجب المعايير القياسية
          </div>
        </div>

      </div>
    </div>
  );
}
