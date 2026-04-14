'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StudentForm from '@/components/students/StudentForm';
import { Badge } from '@/components/ui/Badge';
import { UserPlus } from 'lucide-react';

export default function AddStudentPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16" dir="rtl">
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-10 md:p-12 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <div className="relative z-10 space-y-4">
            <Badge variant="info" className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              <UserPlus className="w-3.5 h-3.5" />
              ملف طالب جديد
            </Badge>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white family-cairo tracking-tight">
              إضافة طالب جديد
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              أنشئ ملف الطالب من صفحة كاملة وواضحة مثل التطبيق، مع ربطه بالحلقة وولي الأمر مباشرة.
            </p>
          </div>
        </div>

        <StudentForm mode="create" />
      </div>
    </DashboardLayout>
  );
}
