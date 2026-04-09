'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="animate-snappy">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold mb-3 uppercase tracking-widest">
              <Link href="/dashboard" className="hover:text-primary transition-colors">لوحة التحكم</Link>
              <span>/</span>
              <span className="text-primary/80">نظام تقارير الأداء الذكي</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gradient tracking-tight">
              التقارير والإحصائيات
            </h1>
            <p className="text-slate-500 mt-2 font-medium">تحليل بيانات الحفظ والمراجعة والحضور بشكل تفصيلي</p>
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-20 text-center border-dashed border-white/10">
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20">
            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-4">نظام التقارير المتقدم قيد التطوير</h2>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            نحن نعمل على بناء نظام تقارير تفاعلي يتيح لك تتبع نمو الطلاب وتوزيع الدرجات بشكل رسومي متقدم. انتظرونا قريباً.
          </p>
          <div className="mt-10">
             <Link href="/dashboard" className="primary-gradient px-10 py-4 rounded-2xl font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all inline-block shadow-xl shadow-primary-glow">
                العودة للوحة التحكم
             </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
