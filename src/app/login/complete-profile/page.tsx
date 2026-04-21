'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User, Phone, Lock, ArrowLeft, CheckCircle2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resolvePhoneNumber = (data: UserData) => {
    const direct = data.phoneNumber;
    if (direct !== undefined && direct !== null && String(direct).trim()) {
      return String(direct);
    }

    const fallbackKey = Object.keys(data).find((key) => key.toLowerCase().includes('phone'));
    if (fallbackKey) {
      const fallbackValue = data[fallbackKey];
      if (fallbackValue !== undefined && fallbackValue !== null) {
        return String(fallbackValue);
      }
    }

    return '';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (sessionUser) => {
      if (!sessionUser) {
        router.replace('/login');
        return;
      }

      try {
        const userRef = doc(db, 'users', sessionUser.uid);
        const snap = await getDoc(userRef);

        const cloudData = snap.exists()
          ? ({ uid: sessionUser.uid, ...snap.data() } as UserData)
          : ({
              uid: sessionUser.uid,
              displayName: sessionUser.displayName || '',
              email: sessionUser.email || '',
            } as UserData);

        setUserData(cloudData);
        setDisplayName(String(cloudData.displayName ?? ''));
        const resolvedPhoneNumber = resolvePhoneNumber(cloudData);
        setPhoneNumber(resolvedPhoneNumber);
        setPassword(String(cloudData.password ?? ''));
        localStorage.setItem('userData', JSON.stringify({ ...cloudData, phoneNumber: resolvedPhoneNumber }));
      } catch {
        setErrorMsg('تعذر تحميل بياناتك الحالية من قاعدة البيانات.');
      } finally {
        setIsLoadingProfile(false);
      }
    });

    return () => unsubscribe();
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
      className="min-h-[100svh] min-h-[100dvh] bg-[#020b22] text-white font-['Cairo']"
      dir="rtl"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="grid min-h-[100svh] min-h-[100dvh] lg:grid-cols-2">
        <section className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10 bg-[#020b22]">
          <div className="w-full max-w-[430px]">
            <div className="mb-5 text-center">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">أكمل ملفك الشخصي</h1>
              <p className="mt-2 text-sm text-blue-100/80 font-semibold">
                أضف بياناتك الأساسية للمتابعة إلى المنصة.
              </p>
            </div>

            <Card className="bg-[#020b22]/80 border border-[#1f3564] rounded-3xl shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="rounded-xl bg-[#031231] border border-[#1f3564] px-3 py-2 text-center text-xs font-bold text-blue-100/75">
                  أكمل البيانات التالية لمرة واحدة فقط ثم تابع مباشرة إلى المنصة.
                </div>
                <Input
                  label="الاسم"
                  placeholder="الاسم الكامل"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  icon={User}
                  className="bg-[#031231] border-[#1f3564] text-white placeholder:text-slate-500"
                />

                <Input
                  label="رقم الهاتف"
                  placeholder="05XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  icon={Phone}
                  dir="ltr"
                  className="bg-[#031231] border-[#1f3564] text-white placeholder:text-slate-500"
                />

                <div className="space-y-2.5 w-full text-right">
                  <label className="text-xs font-bold text-blue-100/80 uppercase tracking-widest px-1">
                    كلمة المرور
                  </label>
                  <div className="relative group">
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                      <Lock size={20} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      dir="ltr"
                      className="w-full h-11 text-sm px-4 pr-14 pl-12 font-medium bg-[#031231] text-white border border-[#1f3564] rounded-lg focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600/80 focus:outline-none transition-colors placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-sm font-semibold text-red-300 bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-right">
                    {errorMsg}
                  </p>
                )}

                <Button
                  onClick={handleContinue}
                  isLoading={isSaving || isLoadingProfile}
                  disabled={!canContinue}
                  className="w-full h-12 rounded-xl text-sm sm:text-base font-bold gap-2 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white border-0 shadow-lg shadow-blue-900/30"
                >
                  متابعة
                  <ArrowLeft className="w-4 h-4" />
                </Button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#8ca2cf] hover:text-white transition-colors"
                  >
                    الرجوع لصفحة تسجيل الدخول
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="hidden lg:flex relative overflow-hidden bg-[#0a1433] border-r border-[#1f3564]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.20),transparent_45%)]" />
          <div className="relative z-10 flex flex-col justify-between p-10 w-full">
            <div className="flex items-center justify-end gap-3">
              <img src="/images/logo/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
              <div className="text-right">
                <p className="text-white font-black text-2xl">منصة المتابعة</p>
                <p className="text-blue-100/70 text-sm">تهيئة الحساب</p>
              </div>
            </div>

            <div className="max-w-lg self-end text-right space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-100 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-blue-400" />
                خطوة أخيرة قبل الدخول
              </div>
              <h2 className="text-5xl font-black leading-[1.25]">
                عُد إلى مأرز <span className="text-[#3B82F6]">الإيمان</span> واليقين
              </h2>
              <div className="space-y-2 text-blue-100/75 text-lg">
                <p className="flex items-center justify-end gap-2">
                  تصميم واضح وسهل الاستخدام
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </p>
                <p className="flex items-center justify-end gap-2">
                  جلب تلقائي للبيانات المحفوظة
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </p>
                <p className="flex items-center justify-end gap-2">
                  زر المتابعة يتفعل عند اكتمال البيانات
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </p>
              </div>
            </div>

            <div className="text-right text-sm text-blue-100/60">© 2026 منصة المتابعة</div>
          </div>
        </section>
      </div>
      <div className="lg:hidden text-center pb-4 text-[10px] font-bold text-blue-100/70 uppercase tracking-[0.45em]">
        ALMOSAWA • v2.5
      </div>
    </div>
  );
}
