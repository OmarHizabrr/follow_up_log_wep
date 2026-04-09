'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getCountFromServer,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

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
      const { role, type, uid } = userData;
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
      <div className="animate-snappy space-y-8 pb-10">
        
        {/* Bento Grid Header / Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           
           {/* Main Welcome - Bento Large */}
           <div className="lg:col-span-8 glass-panel p-10 md:p-14 rounded-[3rem] border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[120px] -mr-40 -mt-40 transition-all duration-1000 group-hover:bg-primary/20"></div>
              <div className="relative z-10">
                 <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.4em] mb-8">
                    <span className="w-10 h-[2px] bg-primary shadow-primary-glow"></span>
                    Unified Platform Ecosystem
                 </div>
                 <h1 className="text-4xl md:text-6xl font-black text-gradient tracking-tight leading-[1.1] mb-6">
                    أهلاً بك، <br/> {user?.displayName?.split(' ')[0] || 'المشرف'} 👋
                 </h1>
                 <p className="text-slate-500 font-bold max-w-md text-sm leading-relaxed">
                    منصة المتابعة الموحدة تمنحك تحكماً كاملاً في المسيرة التعليمية للطلاب وتفاعل الحلقات لحظياً.
                 </p>
              </div>
              
              <div className="mt-12 flex gap-4 relative z-10">
                 <Link href="/dashboard/reports" className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">تصدير التقارير</Link>
                 <Link href="/dashboard/students" className="px-8 py-3.5 bg-white/5 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all">قاعدة البيانات</Link>
              </div>
           </div>

           {/* Quick Stat - Bento Small */}
           <div className="lg:col-span-4 glass-panel p-10 rounded-[3rem] border-white/5 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl transition-all group-hover:bg-emerald-500/10"></div>
              <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">إجمالي الطلاب</p>
                 <h3 className="text-6xl font-black font-outfit tracking-tighter text-gradient">{counts.students}</h3>
              </div>
              <div className="mt-8">
                 <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[75%] shadow-primary-glow"></div>
                 </div>
                 <p className="text-[9px] font-black text-primary mt-3 uppercase tracking-widest">Growth Rate: +12% this month</p>
              </div>
           </div>
        </div>

        {/* Action Center - Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
           <BentoAction href="/dashboard/recitation" icon="📖" label="التسميع" count={counts.students} color="emerald" />
           <BentoAction href="/dashboard/attendance" icon="✅" label="التحضير" color="blue" />
           <BentoAction href="/dashboard/tests" icon="📝" label="الاختبارات" color="rose" />
           <BentoAction href="/dashboard/plans" icon="📅" label="الخطط" color="amber" />
           <BentoAction href="/dashboard/visits" icon="🔭" label="الزيارات" count={counts.visits} color="purple" />
           <BentoAction href="/dashboard/students" icon="👥" label="الطلاب" color="primary" />
        </div>

        {/* Bottom Section - Two Large Horizontal Bento Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
           
           {/* Insight Bento */}
           <div className="glass-panel p-10 rounded-[3rem] border-white/5 relative group min-h-[400px]">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black tracking-tight">نظرة عامة على الأداء</h2>
                 <span className="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-500 border border-white/5">System Insight</span>
              </div>
              
              <div className="space-y-8">
                 <InsightMetric label="متوسط الحفظ اليومي" value="84%" progress={84} color="emerald" />
                 <InsightMetric label="نسبة الحضور الأسبوعية" value="92%" progress={92} color="blue" />
                 <InsightMetric label="معدل نجاح الاختبارات" value="78%" progress={78} color="rose" />
                 <InsightMetric label="كفاءة الحلقات" value="89%" progress={89} color="amber" />
              </div>
           </div>

           {/* Activity Mini Feed / Global Alerts */}
           <div className="glass-panel p-10 rounded-[3rem] border-white/5 flex flex-col">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black tracking-tight">تنبيهات المنصة</h2>
                 <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-primary-glow animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase text-emerald-500">Live Sync</span>
                 </div>
              </div>

              <div className="flex-1 space-y-6">
                 <AlertRow icon="🔔" text="تم تحديث بيانات 12 طالب من تطبيق الموبايل" time="منذ دقيقتين" />
                 <AlertRow icon="📊" text="تقرير الأداء الشهري جاهز للمراجعة" time="منذ ساعة" />
                 <AlertRow icon="⚠️" text="حلقة (عاصم) لم تسجل الحضور اليوم" time="منذ ساعتين" color="rose" />
                 <AlertRow icon="🏆" text="3 طلاب حققوا المركز الأول في الاختبارات" time="منذ 4 ساعات" />
              </div>

              <Link href="/dashboard/reports" className="w-full py-4 mt-8 bg-white/5 hover:bg-white/10 text-center rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-all">عرض كافة النشاطات</Link>
           </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

function BentoAction({ href, icon, label, count, color }: any) {
  const colors: any = {
    emerald: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-500 ring-blue-500/20',
    rose: 'bg-rose-500/10 text-rose-500 ring-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-500 ring-purple-500/20',
    primary: 'bg-primary/10 text-primary ring-primary/20',
  }
  return (
    <Link href={href} className="glass-card p-6 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center text-center group hover:scale-[1.05] transition-all duration-500">
       <div className={`w-14 h-14 ${colors[color]} rounded-3xl flex items-center justify-center text-2xl mb-4 ring-1 transition-transform group-hover:rotate-12`}>
          {icon}
       </div>
       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors group-hover:text-white">{label}</span>
       {count !== undefined && <span className="mt-2 text-xl font-black font-outfit tracking-tighter">{count}</span>}
    </Link>
  );
}

function InsightMetric({ label, value, progress, color }: any) {
  const colors: any = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500'
  }
  return (
    <div className="space-y-3">
       <div className="flex justify-between items-end">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
          <span className="text-xl font-black font-outfit text-white">{value}</span>
       </div>
       <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full ${colors[color]} shadow-lg`} style={{ width: `${progress}%` }}></div>
       </div>
    </div>
  );
}

function AlertRow({ icon, text, time, color }: any) {
  return (
    <div className="flex items-center justify-between group cursor-default">
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">{icon}</div>
          <div>
             <p className={`text-xs font-bold ${color === 'rose' ? 'text-rose-400' : 'text-slate-300'}`}>{text}</p>
             <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter mt-1">{time}</p>
          </div>
       </div>
       <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
       </div>
    </div>
  );
}
