'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User, Phone, Lock, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type UserData = {
  uid: string;
  displayName?: string;
  phoneNumber?: string;
  password?: string;
  email?: string;
  [key: string]: unknown;
};

export default function CompleteProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const rawData = localStorage.getItem('userData');
    if (!rawData) {
      router.replace('/login');
      return;
    }

    const parsed = JSON.parse(rawData) as UserData;
    if (!parsed?.uid) {
      router.replace('/login');
      return;
    }

    setUserData(parsed);
    setDisplayName(String(parsed.displayName ?? ''));
    setPhoneNumber(String(parsed.phoneNumber ?? ''));
    setPassword(String(parsed.password ?? ''));
  }, [router]);

  const canContinue = useMemo(() => {
    return Boolean(phoneNumber.trim() && password.trim());
  }, [phoneNumber, password]);

  const handleContinue = async () => {
    if (!userData?.uid || !canContinue) return;

    setErrorMsg('');
    setIsSaving(true);
    try {
      const payload = {
        displayName: displayName.trim() || userData.displayName || '',
        phoneNumber: phoneNumber.trim(),
        password: password.trim(),
        profileCompleted: true,
        lastProfileUpdateAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'users', userData.uid), payload);

      const updatedSession = { ...userData, ...payload };
      localStorage.setItem('userData', JSON.stringify(updatedSession));

      router.push('/dashboard');
    } catch (error) {
      setErrorMsg('تعذر حفظ بيانات الملف الشخصي، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="min-h-[100svh] min-h-[100dvh] bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-700 dark:from-[#08271f] dark:via-[#0d3a2f] dark:to-[#175443] flex items-center justify-center relative overflow-x-clip font-['Cairo']"
      dir="rtl"
      style={{
        paddingTop: 'max(1.25rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
        paddingInlineStart: 'max(0.9rem, env(safe-area-inset-right, 0px))',
        paddingInlineEnd: 'max(0.9rem, env(safe-area-inset-left, 0px))',
      }}
    >
      <div className="absolute top-0 right-0 w-[380px] h-[380px] sm:w-[460px] sm:h-[460px] bg-emerald-300/15 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] bg-lime-200/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-4xl relative z-10">
        <Card className="overflow-hidden border-emerald-50/70 dark:border-emerald-900/40 shadow-2xl shadow-black/15 bg-white/95 dark:bg-slate-950/90">
          <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700" />
          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-10">
            <div className="grid lg:grid-cols-[1.05fr_1fr] gap-5 sm:gap-7 md:gap-8 lg:gap-10 items-start">
              <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <Sparkles className="w-4 h-4" />
                  خطوة أخيرة قبل دخول المنصة
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                    أكمل ملفك الشخصي
                  </h1>
                  <p className="text-[13px] sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    عدل الاسم وأضف رقم الهاتف وكلمة المرور لتفعيل حسابك والانطلاق إلى باقي المنصة.
                  </p>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-start gap-2.5 sm:gap-3 text-slate-600 dark:text-slate-300 text-[13px] sm:text-sm leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    تصميم واضح وسهل الاستخدام على الجوال والكمبيوتر
                  </div>
                  <div className="flex items-start gap-2.5 sm:gap-3 text-slate-600 dark:text-slate-300 text-[13px] sm:text-sm leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    حفظ آمن ومباشر للبيانات في الملف الشخصي
                  </div>
                  <div className="flex items-start gap-2.5 sm:gap-3 text-slate-600 dark:text-slate-300 text-[13px] sm:text-sm leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    زر المتابعة يتفعل فقط عند إدخال الرقم وكلمة المرور
                  </div>
                </div>
              </div>

              <div className="bg-white/90 dark:bg-slate-900/75 border border-emerald-100/80 dark:border-emerald-900/40 rounded-2xl p-4 sm:p-5 md:p-6 space-y-3.5 sm:space-y-4 order-1 lg:order-2">
                <Input
                  label="الاسم"
                  placeholder="الاسم الكامل"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  icon={User}
                />

                <Input
                  label="رقم الهاتف"
                  placeholder="05XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  icon={Phone}
                  dir="ltr"
                />

                <Input
                  label="كلمة المرور"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={Lock}
                  dir="ltr"
                />

                {errorMsg && (
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400 text-right">{errorMsg}</p>
                )}

                <Button
                  onClick={handleContinue}
                  isLoading={isSaving}
                  disabled={!canContinue}
                  className="w-full h-12 sm:h-12 rounded-xl text-sm sm:text-base font-bold gap-2"
                >
                  متابعة
                  <ArrowLeft className="w-4 h-4" />
                </Button>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                  بتعبئة البيانات أنت توافق على إكمال تهيئة حسابك للوصول إلى النظام.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
