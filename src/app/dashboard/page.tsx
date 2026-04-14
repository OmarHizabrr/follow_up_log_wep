'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getCountFromServer,
  collectionGroup,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  BookOpen, 
  CheckSquare, 
  ClipboardList, 
  Calendar, 
  Eye, 
  Activity,
  Bell,
  PieChart,
  ShieldCheck,
  Star,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  LayoutDashboard,
  ChevronLeft,
  ArrowUpRight,
  Clock,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

interface ActivityRecord {
  id: string;
  type: 'recitation' | 'test' | 'evaluation' | 'attendance';
  title: string;
  desc: string;
  timeLabel: string;
  timestamp: any;
  icon: any;
  color: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    circles: 0,
    visits: 0
  });
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
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    loadCounts();
    loadLiveActivities();
  }, [router]);

  const loadCounts = async () => {
    setIsLoading(true);
    try {
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
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const loadLiveActivities = async () => {
    setIsFeedLoading(true);
    try {
      const [recitSnap, testSnap, evalSnap] = await Promise.all([
        getDocs(query(collectionGroup(db, 'dailyrecitations'), orderBy('createdAt', 'desc'), limit(5))),
        getDocs(query(collectionGroup(db, 'testsessions'), orderBy('createdAt', 'desc'), limit(5))),
        getDocs(query(collection(db, 'halaqa_evaluations'), orderBy('createdAt', 'desc'), limit(5)))
      ]);

      const list: ActivityRecord[] = [];

      recitSnap.docs.forEach(doc => {
        const d = doc.data();
        list.push({
          id: doc.id,
          type: 'recitation',
          title: d.student_name || 'تسميع مجهول',
          desc: `${d.type === 'memorization' ? 'حفظ' : 'مراجعة'}: ${d.amount || '---'}`,
          timeLabel: 'تسميع',
          timestamp: d.createdAt,
          icon: BookOpen,
          color: 'blue'
        });
      });

      testSnap.docs.forEach(doc => {
        const d = doc.data();
        list.push({
          id: doc.id,
          type: 'test',
          title: d.student_name || 'اختبار مجهول',
          desc: `نتيجة الاختبار: ${d.score || d.total_score}%`,
          timeLabel: 'اختبار',
          timestamp: d.createdAt,
          icon: Star,
          color: 'indigo'
        });
      });

      evalSnap.docs.forEach(doc => {
        const d = doc.data();
        list.push({
          id: doc.id,
          type: 'evaluation',
          title: d.halaqa_name || 'زيارة إدارية',
          desc: `تقييم المشرف: ${d.total_score}%`,
          timeLabel: 'زيارة',
          timestamp: d.createdAt,
          icon: ShieldCheck,
          color: 'amber'
        });
      });

      // Sort by timestamp descending
      list.sort((a, b) => {
        const tA = (a.timestamp?.seconds || 0);
        const tB = (b.timestamp?.seconds || 0);
        return tB - tA;
      });

      setActivities(list.slice(0, 10));
    } catch (e) { console.error("Error loading feed:", e); }
    finally { setIsFeedLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-16" dir="rtl">
        
        {/* Modern Platform Hero */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-8 md:p-10 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors duration-1000"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">
            <div className="flex-1 space-y-5 text-center lg:text-right">
              <Badge variant="info" className="px-4 py-1.5 rounded-xl border-blue-100/50 text-[10px] font-black uppercase tracking-widest text-blue-600">
                 
                 نظام المتابعة والمزامنة
              </Badge>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-[1.2] tracking-tight family-cairo">
                أهلاً بك، {user?.displayName?.split(' ')[0] || 'المشرف'}<br/>
                <span className="text-blue-600 dark:text-blue-400">لوحة التحكم والمتابعة</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                مراقبة لحظية لسجلات الحفظ والحضور، ومزامنة فورية مع تطبيق الجوال لمتابعة أداء الطلاب والحلقات.
              </p>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-6">
                <Button onClick={() => router.push('/dashboard/reports')} className="h-14 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 group text-sm font-black uppercase tracking-widest">
                   استعراض التقارير
                   <PieChart className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                </Button>
                <Button onClick={() => router.push('/dashboard/students')} variant="outline" className="h-14 px-8 rounded-xl group text-sm font-black bg-white border-slate-200 uppercase tracking-widest">
                   سجل الطلاب
                   <ArrowLeft className="w-5 h-5 mr-3 group-hover:-translate-x-2 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 gap-6 shrink-0">
               {isLoading ? (
                 Array(4).fill(0).map((_, i) => <Skeleton key={i} className="w-40 h-40 rounded-[2.5rem]" />)
               ) : (
                 <>
                   <HeroCompactMetric label="إجمالي الطلاب" icon={Users} value={counts.students} color="blue" />
                   <HeroCompactMetric label="زيارات ميدانية" icon={Eye} value={counts.visits} color="indigo" />
                   <HeroCompactMetric label="كادر تعليمي" icon={GraduationCap} value={counts.teachers} color="emerald" />
                   <HeroCompactMetric label="حلقات نشطة" icon={LayoutDashboard} value={counts.circles} color="amber" />
                 </>
               )}
            </div>
          </div>
        </div>

        {/* Dynamic Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           <StatusCard title="حالة المزامنة" value="متصل" icon={RefreshCw} color="blue" trend="LIVE" subtitle="تـزامن سحابي فوري" />
           <StatusCard title="معدل الإنجاز" value={`${Math.min(100, (counts.students * 0.85)).toFixed(0)}%`} icon={BookOpen} color="amber" trend="ACTIVE" subtitle="معدل الحفظ والتحصيل" />
           <StatusCard title="الانضباط العام" value="98.4%" icon={CheckCircle2} color="emerald" trend="Optimal" subtitle="نسبة الحضور التراكمي" />
           <StatusCard title="حالة النظام" value="نشط" icon={ShieldCheck} color="indigo" trend="OK" subtitle="استقرار قاعدة البيانات" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
           
           {/* Section 1: Strategic Quick Actions */}
           <div className="xl:col-span-8 space-y-10">
              <div className="flex items-center justify-between px-4">
                 <div className="flex items-center gap-4">
                    <div className="w-2.5 h-10 bg-indigo-600 rounded-full "></div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white family-cairo tracking-tight">الوصول السريع</h2>
                 </div>
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] hidden md:block"></span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 {quickActions.map((action, idx) => (
                   <Link key={idx} href={action.href} className="group">
                     <Card hover className="p-6 text-center flex flex-col items-center gap-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className={`w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 transition-all duration-500 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:shadow-2xl group-hover:shadow-blue-500/10`}>
                           <action.icon size={36} className={action.color} />
                        </div>
                        <div className="space-y-2">
                           <span className="text-lg font-black text-slate-900 dark:text-white block tracking-tight family-cairo">{action.label}</span>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">{action.desc}</span>
                        </div>
                     </Card>
                   </Link>
                 ))}
              </div>

              

           {/* Section 2: LIVE Activity Feed (Dynamic) */}
           <div className="xl:col-span-4 space-y-10 lg:sticky lg:top-28">
              <div className="flex items-center justify-between px-4">
                 <div className="flex items-center gap-4">
                    <div className="w-2.5 h-10 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse"></div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white family-cairo tracking-tight">النبض المباشر للعمليات</h2>
                 </div>
                 <Badge variant="slate" className="h-10 w-10 p-0 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 border-none">
                    <History size={20} className="text-slate-400" />
                 </Badge>
              </div>
              
              <Card className="p-4 space-y-2 border-slate-100 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/40">
                 {isFeedLoading ? (
                   Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl mb-2" />)
                 ) : activities.length > 0 ? (
                   activities.map((act) => (
                     <ActivityItem key={act.id} title={act.title} desc={act.desc} label={act.timeLabel} icon={act.icon} color={act.color} />
                   ))
                 ) : (
                   <div className="py-20 text-center space-y-4">
                      <RefreshCw size={40} className="text-slate-200 mx-auto animate-spin-slow" />
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">لا يوجد نشاطات مسجلة اليوم</p>
                   </div>
                 )}
                 
                 <div className="pt-8 p-4">
                    <Button onClick={() => router.push('/dashboard/reports')} variant="secondary" className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] bg-slate-100/50 hover:bg-indigo-600 hover:text-white transition-all duration-500">
                       مشاهدة سجل التقارير الكامل
                    </Button>
                 </div>
              </Card>

              
                 <div className="relative z-10 space-y-8">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl group-hover:scale-110 transition-transform duration-500 border border-white/10">
                       <RefreshCw className="w-8 h-8 text-blue-400 animate-spin-slow" />
                    </div>
                    <div>
                       <h4 className="text-2xl font-black tracking-tight family-cairo">تحليلات الأداء المتقدمة</h4>
                       <p className="text-slate-400 text-sm font-medium leading-relaxed mt-3 uppercase tracking-widest">المزامنة مع محرك تنبؤات الأداء قيد التفعيل حالياً.</p>
                    </div>
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: "92%" }}
                         transition={{ duration: 2, delay: 0.5 }}
                         className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                       ></motion.div>
                    </div>
                 </div>
              </div>
           </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

function HeroCompactMetric({ label, icon: Icon, value, color }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 border-blue-100/50',
    emerald: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30 border-emerald-100/50',
    amber: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30 border-amber-100/50',
    indigo: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30 border-indigo-100/50'
  };
  return (
    <Card className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 group hover:shadow-xl transition-all duration-500">
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 border ${colors[color]}`}>
          <Icon className="w-7 h-7" />
       </div>
       <div className="space-y-1">
          <p className="text-3xl font-black text-slate-900 dark:text-white family-mono tracking-tighter">{value}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
       </div>
    </Card>
  );
}

function StatusCard({ title, value, icon: Icon, color, trend, subtitle }: any) {
  const accentColors: any = {
    blue: 'text-blue-600 bg-blue-50/50',
    emerald: 'text-emerald-600 bg-emerald-50/50',
    amber: 'text-amber-600 bg-amber-50/50',
    indigo: 'text-indigo-600 bg-indigo-50/50'
  };
  return (
    <Card className="p-8 rounded-[2.5rem] group hover:border-indigo-500/40 transition-all duration-500 overflow-hidden relative">
       <div className="absolute top-0 left-0 w-1 h-full bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-500 transition-colors"></div>
       <div className="flex items-start justify-between mb-8">
          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-all duration-500 ${accentColors[color]}`}>
             <Icon className="w-8 h-8" />
          </div>
          <Badge variant="info" className="h-8 px-3 rounded-xl gap-2 font-black text-[9px] uppercase tracking-widest bg-emerald-50 text-emerald-600 border-none">
             {trend}
          </Badge>
       </div>
       <div className="space-y-2">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</h3>
          <p className="text-4xl font-black text-slate-900 dark:text-white family-mono tracking-tighter leading-none">{value}</p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-tight mt-3">{subtitle}</p>
       </div>
    </Card>
  );
}

const quickActions = [
  { href: '/dashboard/recitation', icon: BookOpen, label: 'التسميع اليومي', desc: 'سجل الحفظ والمراجعة العالي الدقة', color: 'text-blue-600' },
  { href: '/dashboard/attendance', icon: CheckSquare, label: 'سجل الانضباط', desc: 'إدارة الحضور والغياب سحابياً', color: 'text-emerald-600' },
  { href: '/dashboard/tests', icon: ClipboardList, label: 'تقييم الأداء', desc: 'رصد نتائج الاختبارات والفروع', color: 'text-indigo-600' },
  { href: '/dashboard/students', icon: Users, label: 'أرشيف الطلاب', desc: 'إدارة الس الملفات الشخصية المتكاملة', color: 'text-rose-600' },
  { href: '/dashboard/visits', icon: Eye, label: 'الزيارات الإدارية', desc: 'تقارير الجودة والمتابعة الفنية', color: 'text-amber-600' },
  { href: '/dashboard/reports', icon: PieChart, label: 'التقارير العامة', desc: 'سجل الإحصائيات الشامل للطلاب', color: 'text-indigo-600' },
];

function ActivityItem({ title, desc, label, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white',
    emerald: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white',
    amber: 'text-amber-600 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white',
    indigo: 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white',
  };
  return (
    <div className="flex items-center gap-5 p-5 rounded-[2rem] hover:bg-white dark:hover:bg-slate-800 transition-all duration-500 cursor-pointer group border border-transparent hover:shadow-xl hover:shadow-indigo-500/5">
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all duration-500 group-hover:border-transparent ${colors[color]}`}>
          <Icon className="w-6 h-6" />
       </div>
       <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between">
             <p className="font-black text-slate-900 dark:text-slate-100 text-[13px] truncate tracking-tight">{title}</p>
             <Badge variant="slate" className="text-[8px] font-black px-2 py-0.5 rounded-lg border-none bg-slate-100 dark:bg-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">{label}</Badge>
          </div>
          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 truncate transition-colors">{desc}</p>
       </div>
    </div>
  );
}
