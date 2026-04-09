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
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

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
        testsMonth: 24, // Mocked for UI density
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
      <div className="animate-snappy space-y-10">
        
        {/* Elite Reports Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.4em]">
              <span className="w-12 h-[2px] bg-primary"></span>
              Strategic Intelligence Hub
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gradient tracking-tight">التقارير التحليلية</h1>
            <p className="text-slate-500 font-bold max-w-lg text-sm leading-relaxed">
               تحليل شامل لكافة مدخلات المنصة (الويب والموبايل) لتوفير رؤية استراتيجية لأداء الحلقات والطلاب.
            </p>
          </div>

          <div className="flex items-center gap-3">
             <div className="glass-panel p-2 rounded-2xl flex gap-2 border-white/5">
                {['اليوم', 'أسبوع', 'شهر', 'سنة'].map(r => (
                  <button key={r} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${r === 'اليوم' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                    {r}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Global Key Metrics - High Pressure Visuals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <ReportStat label="إنجازات الطلاب" value={stats.recitsToday} unit="سجل" icon="✨" color="primary" trend="+14% From yesterday" />
           <ReportStat label="نسبة الحضور" value={stats.attendPct} unit="%" icon="📊" color="blue" trend="Stable performance" />
           <ReportStat label="الاختبارات" value={stats.testsMonth} unit="اختبار" icon="📝" color="rose" trend="8 Pending review" />
           <ReportStat label="الطلاب النشطون" value={stats.activeStudents} unit="طالب" icon="👥" color="emerald" trend="100% Data integrity" />
        </div>

        {/* Bento Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Activity Timeline - Bento Left Large */}
           <div className="lg:col-span-8 glass-panel p-10 rounded-[3rem] border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[120px] -mr-40 -mt-40"></div>
              
              <div className="flex justify-between items-center mb-10 relative z-10">
                 <h2 className="text-2xl font-black tracking-tight">النشاط اللحظي (Platform-wide)</h2>
                 <button className="text-[10px] font-black uppercase text-primary tracking-widest border-b border-primary/30 pb-1">Live Feed</button>
              </div>

              <div className="space-y-5 relative z-10">
                 {loading ? (
                    Array(6).fill(0).map((_, i) => <div key={i} className="h-22 bg-white/5 animate-pulse rounded-3xl border border-white/5"></div>)
                 ) : (
                    recentActivity.map(activity => (
                      <div key={activity.id} className="glass-card p-6 rounded-3xl flex items-center justify-between border-white/[0.03] hover:border-primary/20 transition-all group">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                               {getRecitIcon(activity.type)}
                            </div>
                            <div>
                               <p className="font-black text-lg group-hover:text-primary transition-colors">{activity.student_name}</p>
                               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{activity.halaqa_name}</span>
                            </div>
                         </div>
                         <div className="text-left">
                            <p className="font-black text-sm tracking-tighter">{activity.amount}</p>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{getRecitLabel(activity.type)}</span>
                         </div>
                      </div>
                    ))
                 )}
              </div>
           </div>

           {/* Performance Insights - Bento Right Small */}
           <div className="lg:col-span-4 space-y-8">
              
              <div className="glass-panel p-10 rounded-[3rem] border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
                 <h3 className="text-xl font-black mb-8">الكفاءة التشغيلية</h3>
                 <div className="space-y-8">
                    <ChartBar label="استقرار الحضور" value="94%" progress={94} color="emerald" />
                    <ChartBar label="سرعة الإنجاز" value="76%" progress={76} color="blue" />
                    <ChartBar label="دقة البيانات" value="99%" progress={99} color="amber" />
                 </div>
              </div>

              <div className="glass-panel p-10 rounded-[3rem] border-white/5 flex flex-col items-center text-center justify-center group overflow-hidden relative min-h-[400px]">
                 <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--primary-glow)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                 <div className="relative z-10">
                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center text-3xl mb-8 mx-auto shadow-2xl shadow-emerald-500/20 group-hover:scale-110 transition-transform">💎</div>
                    <h3 className="text-2xl font-black mb-4 tracking-tight leading-snug text-gradient">تصدير التحليلات للوزارة</h3>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed max-w-xs mx-auto mb-10">
                       بإمكانك بضغطة واحدة توليد ملف PDF شامل يحتوي على كافة المخططات والجداول الرسمية المعتمدة.
                    </p>
                    <button className="primary-gradient px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest">توليد التقرير الموحد</button>
                 </div>
              </div>

           </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

function ReportStat({ label, value, unit, icon, color, trend }: any) {
  const colors: any = {
    primary: 'from-primary/20 to-transparent text-primary border-primary/10',
    blue: 'from-blue-500/20 to-transparent text-blue-400 border-blue-500/10',
    rose: 'from-rose-500/20 to-transparent text-rose-400 border-rose-500/10',
    emerald: 'from-emerald-500/20 to-transparent text-emerald-400 border-emerald-500/10',
  };
  return (
    <div className={`glass-card p-10 rounded-[3rem] bg-gradient-to-br border relative overflow-hidden group hover:scale-[1.03] transition-all duration-500 ${colors[color]}`}>
       <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-all group-hover:opacity-30 bg-current"></div>
       <div className="text-3xl mb-6 relative z-10 opacity-80 group-hover:scale-125 transition-transform inline-block">{icon}</div>
       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60 relative z-10">{label}</h4>
       <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-5xl font-black font-outfit tracking-tighter">{value}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">{unit}</span>
       </div>
       <div className="mt-8 flex items-center gap-2 relative z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
          <span className="text-[9px] font-black uppercase tracking-tighter opacity-40">{trend}</span>
       </div>
    </div>
  );
}

function ChartBar({ label, value, progress, color }: any) {
  const colors: any = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500'
  }
  return (
    <div className="space-y-3">
       <div className="flex justify-between items-end">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
          <span className="text-xl font-black font-outfit text-white">{value}</span>
       </div>
       <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full ${colors[color]} shadow-lg transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
       </div>
    </div>
  );
}

function getRecitIcon(type: string) {
  const icons: any = { memorization: '✨', revision: '🔄', tathbeet: '💎', tashih_tilawah: '📖' };
  return icons[type] || '📖';
}

function getRecitLabel(type: string) {
  const labels: any = { memorization: 'حفظ جديد', revision: 'مراجعة', tathbeet: 'تثبيت', tashih_tilawah: 'تصحيح تلاوة' };
  return labels[type] || type;
}
