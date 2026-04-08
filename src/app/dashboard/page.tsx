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
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8">
      <Head>
        <title>لوحة التحكم | منصة المتابعة</title>
      </Head>

      {/* Floating Shapes background */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>

      <header className="flex justify-between items-center mb-12 bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#10B981] to-[#064E3B] flex items-center justify-center border border-white/20">
            <img src="/images/logo/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#10B981]">لوحة التحكم</h1>
            <p className="text-sm text-slate-400">أهلاً بك، {user.displayName}</p>
          </div>
        </div>
        
        <button onClick={handleLogout} className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300 border border-red-500/20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      <main>
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <StatCard title="الطلاب" count={counts.students} icon="users" color="#10B981" />
          <StatCard title="المدرسين" count={counts.teachers} icon="school" color="#3B82F6" />
          <StatCard title="الحلقات" count={counts.circles} icon="groups" color="#F59E0B" />
          <StatCard title="المشرفين" count={counts.mentors} icon="shield" color="#8B5CF6" />
          <StatCard title="إجمالي المستخدمين" count={counts.users} icon="person" color="#6366F1" />
        </div>

        {/* Roles Based Quick Actions */}
        <section className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
             <span className="w-2 h-8 bg-[#10B981] rounded-full"></span>
             إجراءات سريعة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <button className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#10B981]/50 hover:bg-[#10B981]/5 transition-all group">
              <div className="w-12 h-12 bg-[#10B981]/10 text-[#10B981] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-medium">إضافة طالب</span>
            </button>
            <Link href="/dashboard/students" className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 hover:border-[#10B981]/50 transition-all group">
              <div className="w-12 h-12 bg-[#10B981]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-1">إدارة الطلاب</h3>
              <p className="text-slate-400 text-sm">عرض، إضافة، وتعديل بيانات الطلاب</p>
            </Link>

            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 hover:border-[#10B981]/50 transition-all group">
              <div className="w-12 h-12 bg-[#10B981]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-1">تحضير الحلقات</h3>
              <p className="text-slate-400 text-sm">تسجيل حضور الطلاب ومتابعة الحفظ</p>
            </div>
            <button className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/5 transition-all group">
              <div className="w-12 h-12 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-medium">الإعدادات</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, count, icon, color }: { title: string, count: number, icon: string, color: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 hover:scale-[1.02] transition-transform duration-300">
      <div className="flex justify-between items-start mb-4">
        <div style={{ backgroundColor: `${color}15`, color: color }} className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
           {icon === 'users' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
           {icon === 'school' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>}
           {icon === 'groups' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
           {icon === 'shield' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
           {icon === 'person' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        </div>
      </div>
      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-black">{count}</p>
      </div>
    </div>
  );
}
