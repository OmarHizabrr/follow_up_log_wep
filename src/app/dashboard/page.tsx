'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  GraduationCap, 
  MapPin, 
  TrendingUp, 
  BookOpen, 
  CheckSquare, 
  ClipboardList, 
  Calendar, 
  Eye, 
  Activity,
  Bell,
  MoreVertical,
  ChevronLeft
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    circles: 0,
    visits: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    loadCounts(parsedUser);
  }, [router]);

  const loadCounts = async (userData: any) => {
    setIsLoading(true);
    try {
      const { role, type } = userData;
      if (role === 'admin' || role === 'mentor' || type === 'mentor') {
        const [s, t, h, v] = await Promise.all([
          getCountFromServer(query(collection(db, 'users'), where('type', '==', 'student'))),
          getCountFromServer(query(collection(db, 'users'), where('type', '==', 'teacher'))),
          getCountFromServer(query(collection(db, 'users'), where('type', '==', 'halaqa'))),
          getCountFromServer(collection(db, 'halaqa_evaluations'))
        ]);
        setCounts({
          students: s.data().count,
          teachers: t.data().count,
          circles: h.data().count,
          visits: v.data().count
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">أهلاً بك، {user?.displayName?.split(' ')[0] || 'المشرف'}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">هنا تجد ملخصاً للحالة العامة والأنشطة الأخيرة.</p>
          </div>
          <div className="flex items-center gap-3">
             <Link href="/dashboard/reports" className="enterprise-button">
                تصدير التقارير
             </Link>
             <Link href="/dashboard/students" className="enterprise-button-secondary">
                إضافة طالب
             </Link>
          </div>
        </div>

        {/* Overview Cards (Metrics) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
           
           <div className="enterprise-card p-6 border-b-4 border-b-blue-500 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6" />
                 </div>
                 <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold">إجمالي الطلاب</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                 {isLoading ? '...' : counts.students}
              </p>
              <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold bg-green-50 dark:bg-green-900/20 w-fit px-2.5 py-1 rounded-md">
                 <TrendingUp className="w-4 h-4" />
                 <span>+12% نمو النشاط</span>
              </div>
           </div>

           <div className="enterprise-card p-6 border-b-4 border-b-emerald-500 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6" />
                 </div>
                 <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold">المعلمون</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                 {isLoading ? '...' : counts.teachers}
              </p>
           </div>

           <div className="enterprise-card p-6 border-b-4 border-b-purple-500 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                 </div>
                 <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold">الحلقات النشطة</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                 {isLoading ? '...' : counts.circles}
              </p>
           </div>

           <div className="enterprise-card p-6 border-b-4 border-b-orange-500 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <Eye className="w-6 h-6" />
                 </div>
                 <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold">الزيارات المسجلة</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                 {isLoading ? '...' : counts.visits}
              </p>
           </div>

        </div>

        {/* Quick Actions Flex Layout instead of Tight Grid */}
        <div className="flex flex-wrap gap-4">
           {quickActions.map((action, idx) => (
             <Link key={idx} href={action.href} className="enterprise-card flex-1 min-w-[140px] px-4 py-5 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md group">
                <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                   <action.icon className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">{action.label}</span>
             </Link>
           ))}
        </div>

        {/* Bottom Section - Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           
           {/* Performance Overview (Progress Bars) */}
           <div className="enterprise-card p-6">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg font-bold text-gray-900 dark:text-white">نظرة عامة على الأداء</h2>
                 <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <MoreVertical className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="space-y-6">
                 <ProgressRow label="متوسط الحفظ اليومي" value="84%" progress={84} color="bg-emerald-500" />
                 <ProgressRow label="نسبة الحضور الأسبوعية" value="92%" progress={92} color="bg-blue-500" />
                 <ProgressRow label="معدل نجاح الاختبارات" value="78%" progress={78} color="bg-purple-500" />
                 <ProgressRow label="كفاءة الحلقات" value="89%" progress={89} color="bg-orange-500" />
              </div>
           </div>

           {/* Recent Activity List */}
           <div className="enterprise-card p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg font-bold text-gray-900 dark:text-white">أحدث النشاطات</h2>
                 <Link href="/dashboard/reports" className="text-sm text-blue-600 hover:underline">
                    عرض الكل
                 </Link>
              </div>

              <div className="flex-1 space-y-4">
                 <ActivityRow 
                   icon={<Bell className="w-4 h-4 text-blue-600" />} 
                   bg="bg-blue-50 dark:bg-blue-900/20"
                   text="تم تحديث بيانات 12 طالب" 
                   time="منذ دقيقتين" 
                 />
                 <ActivityRow 
                   icon={<Activity className="w-4 h-4 text-emerald-600" />} 
                   bg="bg-emerald-50 dark:bg-emerald-900/20"
                   text="تقرير الأداء الأسبوعي متوفر للتحميل" 
                   time="منذ ساعة" 
                 />
                 <ActivityRow 
                   icon={<CheckSquare className="w-4 h-4 text-rose-600" />} 
                   bg="bg-rose-50 dark:bg-rose-900/20"
                   text="حلقة (عاصم) لم تسجل الحضور اليوم" 
                   time="منذ ساعتين" 
                 />
                 <ActivityRow 
                   icon={<GraduationCap className="w-4 h-4 text-purple-600" />} 
                   bg="bg-purple-50 dark:bg-purple-900/20"
                   text="3 طلاب اجتازوا اختبار الأجزاء" 
                   time="منذ 4 ساعات" 
                 />
              </div>
           </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

const quickActions = [
  { href: '/dashboard/recitation', icon: BookOpen, label: 'التسميع' },
  { href: '/dashboard/attendance', icon: CheckSquare, label: 'التحضير' },
  { href: '/dashboard/tests', icon: ClipboardList, label: 'الاختبارات' },
  { href: '/dashboard/plans', icon: Calendar, label: 'الخطط' },
  { href: '/dashboard/visits', icon: Eye, label: 'الزيارات' },
  { href: '/dashboard/students', icon: Users, label: 'الطلاب' },
];

function ProgressRow({ label, value, progress, color }: any) {
  return (
    <div>
       <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
       </div>
       <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${progress}%` }}></div>
       </div>
    </div>
  );
}

function ActivityRow({ icon, bg, text, time }: any) {
  return (
    <div className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
       <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center shrink-0`}>
             {icon}
          </div>
          <div>
             <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{text}</p>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{time}</p>
          </div>
       </div>
       <ChevronLeft className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
