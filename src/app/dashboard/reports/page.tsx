'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  collectionGroup,
  orderBy,
  limit,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Target,
  Download,
  Database
} from 'lucide-react';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    recitsToday: 0,
    attendPct: 0,
    testsMonth: 0,
    activeStudents: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    fetchGlobalStats();
  }, [router]);

  const fetchGlobalStats = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const studentsCount = await getCountFromServer(query(collection(db, 'users'), where('type', '==', 'student')));
      const recitsSnap = await getDocs(query(collectionGroup(db, 'dailyrecitations'), where('date', '==', todayStr)));
      const attendSnap = await getDocs(query(collectionGroup(db, 'tracking'), where('type', '==', 'attendance'), where('date', '==', todayStr)));
      
      const presentCount = attendSnap.docs.filter(d => d.data().status === 'present').length;
      const attendancePct = attendSnap.docs.length > 0 ? (presentCount / attendSnap.docs.length) * 100 : 0;

      const activitySnap = await getDocs(query(collectionGroup(db, 'dailyrecitations'), orderBy('createdAt', 'desc'), limit(15)));

      setStats({
        recitsToday: recitsSnap.docs.length,
        attendPct: Math.round(attendancePct),
        testsMonth: 24,
        activeStudents: studentsCount.data().count
      });
      setRecentActivity(activitySnap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">التقارير التحليلية</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">نظرة شاملة حول أداء المنصة والحلقات وحضور الطلاب.</p>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
             {['يومي', 'أسبوعي', 'شهري'].map((r, i) => (
               <button key={r} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${i === 0 ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>
                 {r}
               </button>
             ))}
          </div>
        </div>

        {/* Global Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           
           <div className="enterprise-card p-5">
              <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                 </div>
                 <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+14%</span>
              </div>
              <div>
                 <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">إنجازات اليوم</h4>
                 <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {loading ? '...' : stats.recitsToday} <span className="text-sm font-normal text-gray-500">سجل</span>
                 </p>
              </div>
           </div>

           <div className="enterprise-card p-5">
              <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                 </div>
                 <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+2%</span>
              </div>
              <div>
                 <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">نسبة الحضور</h4>
                 <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {loading ? '...' : stats.attendPct}%
                 </p>
              </div>
           </div>

           <div className="enterprise-card p-5">
              <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                 </div>
              </div>
              <div>
                 <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">الاختبارات</h4>
                 <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {loading ? '...' : stats.testsMonth} <span className="text-sm font-normal text-gray-500">مكتمل</span>
                 </p>
              </div>
           </div>

           <div className="enterprise-card p-5 border-t-4 border-t-blue-500">
              <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                 </div>
              </div>
              <div>
                 <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">الطلاب النشطون</h4>
                 <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {loading ? '...' : stats.activeStudents}
                 </p>
              </div>
           </div>

        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           
           {/* Activity List */}
           <div className="lg:col-span-8 enterprise-card p-6 flex flex-col h-[500px]">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                 <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">النشاط اللحظي</h2>
                 </div>
                 <div className="flex items-center gap-2 text-xs font-semibold text-green-600">
                    <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    مزامنة مباشرة
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                 {loading ? (
                    Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl"></div>)
                 ) : recentActivity.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">لا يوجد نشاط حديث</div>
                 ) : (
                    recentActivity.map(activity => (
                      <div 
                        key={activity.id} 
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-gray-800 flex items-center justify-center text-blue-600 dark:text-gray-300">
                               <FileText className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{activity.student_name}</p>
                               <div className="flex items-center gap-1.5 mt-1">
                                  <Database className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-xs font-semibold text-gray-500">{activity.halaqa_name}</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-left">
                            <p className="font-bold text-base text-gray-900 dark:text-gray-200">{activity.amount}</p>
                            <span className="text-[11px] text-blue-600 bg-blue-50 px-2.5 py-1 mt-1 inline-block rounded font-bold uppercase tracking-wider">{getRecitLabel(activity.type)}</span>
                         </div>
                      </div>
                    ))
                 )}
              </div>
           </div>

           {/* Export & Intel Panels */}
           <div className="lg:col-span-4 space-y-6">
              
              <div className="enterprise-card p-6 border-b-4 border-blue-500 text-center flex flex-col items-center justify-center min-h-[200px]">
                 <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                    <Download className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">تصدير التحليلات</h3>
                 <p className="text-xs text-gray-500 leading-relaxed mb-6">
                    توليد تقرير شامل يحتوي على كافة المخططات والجداول الرسمية.
                 </p>
                 <button className="enterprise-button w-full">
                    توليد تقرير PDF
                 </button>
              </div>

              <div className="enterprise-card p-6">
                 <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    الكفاءة التشغيلية
                 </h3>
                 <div className="space-y-4 text-sm">
                    <div>
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">استقرار الحضور</span>
                          <span className="font-bold">94%</span>
                       </div>
                       <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full" style={{ width: '94%' }}></div>
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">سرعة الإنجاز</span>
                          <span className="font-bold">76%</span>
                       </div>
                       <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: '76%' }}></div>
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">دقة البيانات</span>
                          <span className="font-bold">99%</span>
                       </div>
                       <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-full" style={{ width: '99%' }}></div>
                       </div>
                    </div>
                 </div>
              </div>

           </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

function getRecitLabel(type: string) {
  const labels: any = { memorization: 'حفظ', revision: 'مراجعة', tathbeet: 'تثبيت', tashih_tilawah: 'تلاوة' };
  return labels[type] || type;
}
