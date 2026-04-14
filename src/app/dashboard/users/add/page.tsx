'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import UserForm from '@/components/users/UserForm';
import { Badge } from '@/components/ui/Badge';
import { User, UserPlus } from 'lucide-react';

export default function AddUserPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16" dir="rtl">
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-10 md:p-12 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <div className="relative z-10 space-y-4">
            <Badge variant="info" className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              <UserPlus className="w-3.5 h-3.5" />
              مستخدم جديد
            </Badge>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white family-cairo tracking-tight">إضافة مستخدم</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              إنشاء ملف مستخدم جديد بصيغة متوافقة مع التطبيق وبواجهة حديثة.
            </p>
          </div>
        </div>

        <UserForm mode="create" />
      </div>
    </DashboardLayout>
  );
}
