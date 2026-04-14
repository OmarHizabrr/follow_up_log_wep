'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  CheckSquare,
  ClipboardList,
  Eye,
  GraduationCap,
  PieChart,
  RefreshCw,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import {
  collection,
  collectionGroup,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

interface ActivityRecord {
  id: string;
  title: string;
  desc: string;
  timeLabel: string;
  timestamp: any;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'indigo' | 'amber';
}

const quickActions = [
  { href: '/dashboard/recitation', icon: BookOpen, label: 'التسميع اليومي' },
  { href: '/dashboard/attendance', icon: CheckSquare, label: 'سجل الحضور' },
  { href: '/dashboard/tests', icon: ClipboardList, label: 'الاختبارات' },
  { href: '/dashboard/students', icon: Users, label: 'إدارة الطلاب' },
  { href: '/dashboard/visits', icon: Eye, label: 'الزيارات' },
  { href: '/dashboard/reports', icon: PieChart, label: 'التقارير' },
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [counts, setCounts] = useState({ students: 0, teachers: 0, circles: 0, visits: 0 });
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
    void loadCounts();
    void loadLiveActivities();
  }, [router]);

  const loadCounts = async () => {
    setIsLoading(true);
    try {
      const [s, t, h, v] = await Promise.all([
        getCountFromServer(query(collection(db, 'users'), where('type', '==', 'student'))),
        getCountFromServer(query(collection(db, 'users'), where('type', '==', 'teacher'))),
        getCountFromServer(query(collection(db, 'users'), where('type', '==', 'halaqa'))),
        getCountFromServer(collection(db, 'halaqa_evaluations')),
      ]);
      setCounts({
        students: s.data().count,
        teachers: t.data().count,
        circles: h.data().count,
        visits: v.data().count,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLiveActivities = async () => {
    setIsFeedLoading(true);
    try {
      const [recitSnap, testSnap, evalSnap] = await Promise.all([
        getDocs(query(collectionGroup(db, 'dailyrecitations'), orderBy('createdAt', 'desc'), limit(5))),
        getDocs(query(collectionGroup(db, 'testsessions'), orderBy('createdAt', 'desc'), limit(5))),
        getDocs(query(collection(db, 'halaqa_evaluations'), orderBy('createdAt', 'desc'), limit(5))),
      ]);

      const list: ActivityRecord[] = [];

      recitSnap.docs.forEach((docItem) => {
        const item = docItem.data();
        list.push({
          id: docItem.id,
          title: item.student_name || 'تسميع',
          desc: `${item.type === 'memorization' ? 'حفظ' : 'مراجعة'}: ${item.amount || '---'}`,
          timeLabel: 'تسميع',
          timestamp: item.createdAt,
          icon: BookOpen,
          color: 'blue',
        });
      });

      testSnap.docs.forEach((docItem) => {
        const item = docItem.data();
        list.push({
          id: docItem.id,
          title: item.student_name || 'اختبار',
          desc: `النتيجة: ${item.score || item.total_score || 0}%`,
          timeLabel: 'اختبار',
          timestamp: item.createdAt,
          icon: Star,
          color: 'indigo',
        });
      });

      evalSnap.docs.forEach((docItem) => {
        const item = docItem.data();
        list.push({
          id: docItem.id,
          title: item.halaqa_name || 'زيارة',
          desc: `تقييم المشرف: ${item.total_score || 0}%`,
          timeLabel: 'زيارة',
          timestamp: item.createdAt,
          icon: ShieldCheck,
          color: 'amber',
        });
      });

      list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setActivities(list.slice(0, 10));
    } catch (error) {
      console.error(error);
    } finally {
      setIsFeedLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-10" dir="rtl">
        <section className="bg-white dark:bg-[#0f172a] p-6 md:p-8 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="space-y-3">
              <Badge variant="info" className="px-3 py-1 text-[11px] font-bold rounded-lg">
                لوحة المتابعة
              </Badge>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                أهلا بك، {user?.displayName?.split(' ')[0] || 'المستخدم'}
              </h1>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl">
                متابعة يومية للحضور والتسميع والاختبارات مع مزامنة مباشرة بين التطبيق ومنصة الويب.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => router.push('/dashboard/reports')} className="h-11 px-6">
                عرض التقارير
              </Button>
              <Button onClick={() => router.push('/dashboard/students')} variant="outline" className="h-11 px-6">
                إدارة الطلاب
              </Button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-32 rounded-2xl" />)
          ) : (
            <>
              <MetricCard label="إجمالي الطلاب" value={counts.students} icon={Users} />
              <MetricCard label="عدد المعلمين" value={counts.teachers} icon={GraduationCap} />
              <MetricCard label="الحلقات النشطة" value={counts.circles} icon={BookOpen} />
              <MetricCard label="الزيارات" value={counts.visits} icon={Eye} />
            </>
          )}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 p-6 rounded-2xl border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">الوصول السريع</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <button className="w-full p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-200 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors text-right">
                    <action.icon className="w-5 h-5 text-blue-600 mb-2" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{action.label}</p>
                  </button>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white">آخر النشاطات</h2>
              <RefreshCw className={`w-4 h-4 text-slate-400 ${isFeedLoading ? 'animate-spin' : ''}`} />
            </div>
            <div className="space-y-2">
              {isFeedLoading ? (
                Array.from({ length: 5 }).map((_, idx) => <Skeleton key={idx} className="h-14 rounded-xl" />)
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <ActivityItem key={activity.id} title={activity.title} desc={activity.desc} label={activity.timeLabel} icon={activity.icon} color={activity.color} />
                ))
              ) : (
                <div className="py-10 text-center text-sm text-slate-400">لا توجد نشاطات حديثة.</div>
              )}
            </div>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="p-5 rounded-2xl border-slate-200/70 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

function ActivityItem({
  title,
  desc,
  label,
  icon: Icon,
  color,
}: {
  title: string;
  desc: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'indigo' | 'amber';
}) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{title}</p>
          <span className="text-[10px] text-slate-400">{label}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{desc}</p>
      </div>
    </div>
  );
}
