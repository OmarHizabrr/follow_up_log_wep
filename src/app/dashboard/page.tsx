'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getCountFromServer, 
  doc, 
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
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
      const role = userData.role;
      const type = userData.type;
      const uid = userData.uid;

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
        // Fetch assigned halaqa IDs for teacher
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

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('userData');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <Head>
        <title>لوحة التحكم | منصة المتابعة</title>
      </Head>

      {/* Hero Welcome Section */}
      <div className="mb-10 animate-fade-in">
        <h2 className="text-4xl font-black mb-2">مرحباً بك مجدداً!</h2>
        <p className="text-slate-400 text-lg">إليك موجز سريع لما يحدث في حلقاتك اليوم.</p>
      </div>

      {/* Statistics Grid - 4 columns on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="إجمالي الطلاب" count={counts.students} icon="users" color="#10B981" />
        <StatCard title="الحلقات النشطة" count={counts.circles} icon="groups" color="#F59E0B" />
        <StatCard title="المدرسين" count={counts.teachers} icon="school" color="#3B82F6" />
        <StatCard title="المشرفين" count={counts.mentors} icon="shield" color="#8B5CF6" />
      </div>

      {/* Main Grid: Content & Info */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Quick Actions - Primary Area */}
        <div className="xl:col-span-2 space-y-8">
          <section className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/10 blur-3xl -mr-16 -mt-16 group-hover:bg-[#10B981]/20 transition-all"></div>
            
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="w-1.5 h-7 bg-[#10B981] rounded-full"></span>
              الوصول السريع
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/dashboard/students" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#10B981]/50 hover:bg-[#10B981]/5 transition-all group flex items-center gap-5">
                <div className="w-14 h-14 bg-[#10B981]/10 text-[#10B981] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">إدارة الطلاب</h3>
                  <p className="text-slate-400 text-sm mt-1">تعديل بيانات الطلاب والحلقات</p>
                </div>
              </Link>

              <Link href="/dashboard/attendance" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#10B981]/50 hover:bg-[#10B981]/5 transition-all group flex items-center gap-5">
                <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">تحضير الحلقات</h3>
                  <p className="text-slate-400 text-sm mt-1">تسجيل الحضور اليومي للمجموعات</p>
                </div>
              </Link>

              <Link href="/dashboard/reports" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">التقارير</h3>
                  <p className="text-slate-400 text-sm mt-1">الإحصائيات ونسب الحضور والإنجاز</p>
                </div>
              </Link>

              <button className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-slate-500/50 hover:bg-slate-500/5 transition-all group flex items-center gap-5">
                <div className="w-14 h-14 bg-slate-500/10 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">الإعدادات</h3>
                  <p className="text-slate-400 text-sm mt-1">إعدادات المنصة والملف الشخصي</p>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Sidebar Info - Secondary Area */}
        <div className="space-y-8">
          <section className="bg-gradient-to-br from-[#10B981] to-[#064E3B] p-8 rounded-3xl shadow-xl shadow-[#10B981]/10 text-white">
            <h3 className="text-xl font-bold mb-4">نصيحة اليوم 💡</h3>
            <p className="opacity-90 leading-relaxed">
              "الاستمرار في المتابعة اليومية للطلاب هو المفتاح الأساسي لتحفيزهم على الإنجاز وضمان عدم تراكم الحفظ."
            </p>
          </section>

          <section className="bg-white/5 border border-white/10 p-6 rounded-3xl">
            <h3 className="text-lg font-bold mb-4">نشاط المنصة اليوم</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-slate-300">تم تسجيل حضور 150 طالب اليوم</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm text-slate-300">تم إنجاز 45 اختباراً جديداً</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, count, icon, color }: { title: string, count: number, icon: string, color: string }) {
  const iconPaths: Record<string, string> = {
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    school: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
    groups: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",
    shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    person: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 hover:bg-white/[0.08] transition-all group overflow-hidden relative">
      <div className="absolute top-0 left-0 w-2 h-full transition-all group-hover:w-3" style={{ backgroundColor: color }}></div>
      <div className="flex justify-between items-start mb-4 relative z-10 mr-2">
        <div style={{ backgroundColor: `${color}15`, color: color }} className="w-12 h-12 rounded-2xl flex items-center justify-center">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPaths[icon]} />
           </svg>
        </div>
      </div>
      <div className="relative z-10 mr-2">
        <h3 className="text-slate-500 text-sm font-bold mb-1">{title}</h3>
        <p className="text-3xl font-black">{count}</p>
      </div>
    </div>
  );
}
