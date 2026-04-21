'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function PhoneLoginPage() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => router.replace('/login'), 1200);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-[100svh] min-h-[100dvh] bg-[#020b22] flex items-center justify-center p-6" dir="rtl">
      <Card className="w-full max-w-md bg-[#020b22]/85 border border-[#1f3564] rounded-3xl">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-blue-300" />
          </div>
          <h1 className="text-xl font-black text-white">تم إيقاف تسجيل الدخول برقم الهاتف</h1>
          <p className="text-sm text-blue-100/70 leading-relaxed">
            تم اعتماد تسجيل الدخول عبر Google فقط. سيتم تحويلك تلقائيًا إلى صفحة الدخول.
          </p>
          <Button onClick={() => router.replace('/login')} className="w-full h-11 rounded-xl">
            الانتقال إلى تسجيل الدخول عبر Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
