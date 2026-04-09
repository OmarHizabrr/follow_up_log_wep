'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="animate-snappy">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold mb-3 uppercase tracking-widest">
              <Link href="/dashboard" className="hover:text-primary transition-colors">لوحة التحكم</Link>
              <span>/</span>
              <span className="text-primary/80">تخصيص تجربة المنصة</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gradient tracking-tight">
              الإعدادات العامة
            </h1>
            <p className="text-slate-500 mt-2 font-medium">إدارة تفضيلات الحساب، التنبيهات، وإعدادات النظام</p>
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-20 text-center border-dashed border-white/10">
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20">
            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-4">مركز الإعدادات الموحد</h2>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            ستتمكن قريباً من تخصيص مظهر المنصة، إدارة الموظفين، وضبط صلاحيات الوصول في مكان واحد وبواجهة Elite عصرية.
          </p>
          <div className="mt-10">
             <Link href="/dashboard" className="primary-gradient px-10 py-4 rounded-2xl font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all inline-block shadow-xl shadow-primary-glow">
                العودة للرئيسية
             </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
