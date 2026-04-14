'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import StudentForm from '@/components/students/StudentForm';
import { Badge } from '@/components/ui/Badge';
import { Edit3 } from 'lucide-react';

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16" dir="rtl">
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-10 md:p-12 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <div className="relative z-10 space-y-4">
            <Badge variant="info" className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              <Edit3 className="w-3.5 h-3.5" />
              تعديل ملف الطالب
            </Badge>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white family-cairo tracking-tight">
              تعديل بيانات الطالب
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              حدّث بيانات الطالب الأساسية والربط الإداري من صفحة مخصصة بدل النوافذ الصغيرة.
            </p>
          </div>
        </div>

        <StudentForm mode="edit" studentId={id} />
      </div>
    </DashboardLayout>
  );
}
