'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getCountFromServer
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
    mentors: 0,
    users: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [quote, setQuote] = useState('');
  const router = useRouter();

  const quotes = [
    "«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»",
    "قال تعالى: «وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا»",
    "قال تعالى: «إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ»",
    "الاستمرار والمتابعة هما سر النجاح في حفظ كتاب الله.",
    "كل آية يحفظها الطالب هي خطوة نحو رفعة الدرجات."
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    loadCounts(parsedUser);
    
    // Set Dynamic Greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('صباح الخير');
    else if (hour < 18) setGreeting('طاب يومك');
    else setGreeting('مساء الخير');

    // Set Random Quote
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [router]);

  const loadCounts = async (userData: any) => {
    setIsLoading(true);
    try {
      const { role, type, uid } = userData;

      if (role === 'admin' || role === 'mentor' || type === 'mentor') {
        const usersRef = collection(db, 'users');
        const [studentCount, teacherCount, circlesCount, mentorsCount, totalUsers] = await Promise.all([
          getCountFromServer(query(usersRef, where('type', '==', 'student'))),
          getCountFromServer(query(usersRef, where('type', '==', 'teacher'))),
          getCountFromServer(query(usersRef, where('type', '==', 'halaqa'))),
          getCountFromServer(query(usersRef, where('type', '==', 'mentor'))),
          getCountFromServer(usersRef)
        ]);

        setCounts({
          students: studentCount.data().count,
          teachers: teacherCount.data().count,
          circles: circlesCount.data().count,
          mentors: mentorsCount.data().count,
          users: totalUsers.data().count
        });
      } else if (type === 'teacher' && uid) {
        const assignedSnap = await getDocs(collection(db, 'mumber', uid, 'member'));
        const assignedHalaqaIds = assignedSnap.docs.map(doc => doc.id);
        
        if (assignedHalaqaIds.length > 0) {
          const studentsQuery = query(
            collection(db, 'users'), 
            where('type', '==', 'student'), 
            where('halaqaId', 'in', assignedHalaqaIds.slice(0, 30))
          );
          const studentCount = await getCountFromServer(studentsQuery);
          setCounts({
            students: studentCount.data().count,
            teachers: 0,
            circles: assignedHalaqaIds.length,
            mentors: 0,
            users: 0
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="animate-snappy">
        {/* Premium Smart Hero Section */}
        <div className="glass-panel p-10 md:p-14 rounded-[3rem] border-white/5 relative overflow-hidden mb-12 group shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* Inner Glows */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 to-transparent opacity-50"></div>
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="max-w-xl">
                  <div className="flex items-center gap-3 text-primary font-black text-xs uppercase tracking-[0.4em] mb-6">
                    <span className="w-12 h-[2px] bg-primary shadow-primary-glow"></span>
                    نظام المتابعة الذكي
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-gradient tracking-tighter mb-6 leading-[1.1]">
                    {greeting}، <br/> {user.displayName?.split(' ')[0]}
                  </h1>
                  <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 px-6 rounded-2xl border border-white/5 w-fit">
                     <span className="text-primary text-xl">✨</span>
                     <p className="text-slate-400 font-bold text-sm italic">{quote}</p>
                  </div>
               </div>

               <div className="hidden lg:block w-48 h-48 relative">
                  <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full animate-pulse"></div>
                  <div className="relative w-full h-full bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center backdrop-blur-xl shadow-2xl">
                     <svg className="w-20 h-20 text-primary opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
               </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <AnalyticWidget title="إجمالي الطلاب" count={counts.students} icon="users" color="var(--primary)" delay="0.1s" />
          <AnalyticWidget title="الحلقات النشطة" count={counts.circles} icon="groups" color="var(--accent)" delay="0.2s" />
          <AnalyticWidget title="المدرسين" count={counts.teachers} icon="school" color="#3B82F6" delay="0.3s" />
          <AnalyticWidget title="المشرفين" count={counts.mentors} icon="shield" color="#8B5CF6" delay="0.4s" />
        </div>

        {/* Action Center Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <section className="glass-panel p-10 rounded-[2.5rem] border-white/5 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[120px] -mr-32 -mt-32"></div>
              
              <div className="flex items-center justify-between mb-10 relative">
                <h2 className="text-2xl font-black tracking-tight">مركز التحكم السريع</h2>
                <div className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shadow-primary-glow">System Ready</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QuickActionLink href="/dashboard/students" title="إدارة الطلاب" desc="تكويد وتحديث بيانات الطلاب" icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" color="emerald" />
                <QuickActionLink href="/dashboard/attendance" title="تحضير الحلقات" desc="تسجيل الحضور اليومي للمجموعات" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" color="amber" />
                <QuickActionLink href="/dashboard/recitation" title="متابعة الحفظ" desc="سجل الإنجاز والتقييم النوعي" icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" color="primary" />
                <QuickActionLink href="/dashboard/reports" title="التقارير" desc="تحليل الأداء والمخرجات التعليمية" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" color="blue" />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="primary-gradient p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="relative z-10">
                <div className="bg-white/20 w-12 h-12 rounded-2xl mb-6 flex items-center justify-center backdrop-blur-md">
                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-black mb-4">نصيحة اليوم💡</h3>
                <p className="font-bold opacity-80 leading-relaxed text-sm">
                  دقة البيانات اليومية هي الوقود الحقيقي لاتخاذ القرارات الإدارية السليمة.
                </p>
              </div>
            </section>

            <section className="glass-panel p-8 rounded-[2.5rem] border-white/5 shadow-xl">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6">نشاط النظام الموحد</h3>
              <div className="space-y-6">
                <ActivityRow color="emerald" text="مزامنة حضور الطلاب جارية..." />
                <ActivityRow color="blue" text="توليد تقارير الحلقات تلقائياً" />
                <ActivityRow color="amber" text="تنبيه: يوجد نقص في بيانات الطلاب" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AnalyticWidget({ title, count, icon, color, delay }: any) {
  const iconPaths: Record<string, string> = {
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    school: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
    groups: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",
    shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
  };

  return (
    <div className="glass-card rounded-[2rem] p-7 group relative overflow-hidden animate-snappy" style={{ animationDelay: delay }}>
      <div className="absolute top-0 right-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-all duration-300"></div>
      <div className="flex justify-between items-start mb-6">
        <div style={{ backgroundColor: `${color}10`, color: color }} className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={iconPaths[icon]} />
           </svg>
        </div>
      </div>
      <div>
        <h3 className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mb-1">{title}</h3>
        <p className="text-4xl font-black tracking-tight group-hover:text-primary transition-colors">{count}</p>
      </div>
    </div>
  );
}

function QuickActionLink({ href, title, desc, icon, color }: any) {
  const colors: any = {
    emerald: 'text-emerald-400 bg-emerald-500/10 hover:border-emerald-500/50',
    amber: 'text-amber-400 bg-amber-500/10 hover:border-amber-500/50',
    blue: 'text-blue-400 bg-blue-500/10 hover:border-blue-500/50',
    primary: 'text-primary bg-primary/10 hover:border-primary/50'
  };

  return (
    <Link href={href} className={`p-6 rounded-3xl glass-card border border-white/5 transition-all group flex items-center gap-6 ${colors[color]}`}>
      <div className={`w-16 h-16 ${colors[color]} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon} />
        </svg>
      </div>
      <div>
        <h3 className="text-xl font-black group-hover:text-white transition-colors">{title}</h3>
        <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-tighter opacity-70">{desc}</p>
      </div>
    </Link>
  );
}

function ActivityRow({ color, text }: any) {
  const colorMap: any = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500'
  }
  return (
    <div className="flex items-center gap-4 group cursor-default">
      <div className={`w-1.5 h-1.5 rounded-full ${colorMap[color]} shadow-[0_0_10px_rgba(0,0,0,0.5)] group-hover:scale-150 transition-all shadow-primary-glow`}></div>
      <span className="text-[11px] font-bold text-slate-500 group-hover:text-white transition-colors">{text}</span>
    </div>
  );
}
