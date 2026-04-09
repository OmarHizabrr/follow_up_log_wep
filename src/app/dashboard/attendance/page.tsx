'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

export default function AttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchData(parsedUser);
  }, [router]);

  const fetchData = async (userData: any) => {
    setIsLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('type', '==', 'student')));
      setStudents(snap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(attendanceData).map(([studentId, status]) => {
        const student = students.find(s => s.id === studentId);
        return addDoc(collection(db, 'tracking', studentId, 'tracking'), {
          type: 'attendance',
          status,
          date: attendanceDate,
          student_id: studentId,
          student_name: student?.displayName || '',
          halaqa_id: student?.halaqaId || '',
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.displayName
        });
      });
      await Promise.all(promises);
      alert('تمت مزامنة التحضير بالكامل مع النظام الموحد');
      setAttendanceData({});
    } catch (e) {
      alert('خطأ في المزامنة');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-snappy space-y-10">
        
        {/* Elite Module Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-blue-500 font-black text-[10px] uppercase tracking-[0.4em]">
              <span className="w-12 h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></span>
              Attendance & Presence Logic
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gradient tracking-tight">تحضير الطلاب</h1>
            <p className="text-slate-500 font-bold max-w-lg text-sm leading-relaxed">
               نظام تحضير ذكي يضمن الدقة اللحظية والمزامنة الفورية مع قاعدة بيانات الطلاب المركزية.
            </p>
          </div>

          <div className="flex items-center gap-4">
             <div className="glass-panel px-6 py-3.5 rounded-2xl border-white/5 font-black text-xs uppercase tracking-widest text-slate-400">
                DATE: <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="bg-transparent border-none outline-none text-white ml-2 cursor-pointer" />
             </div>
             <button onClick={handleSaveAll} disabled={isSaving || Object.keys(attendanceData).length === 0} className="primary-gradient px-12 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary-glow/20 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale">
                {isSaving ? 'MAPPING DATA...' : 'حفظ كشوفات اليوم'}
             </button>
          </div>
        </div>

        {/* Global Student Presence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {isLoading ? (
             Array(12).fill(0).map((_, i) => <div key={i} className="h-64 glass-panel animate-pulse rounded-[3rem]"></div>)
           ) : (
             students.map(student => (
               <div key={student.id} className="glass-card p-10 rounded-[3rem] border-white/5 relative group overflow-hidden flex flex-col items-center text-center">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full -mr-12 -mt-12 transition-all group-hover:bg-primary/10"></div>
                  
                  <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 border border-white/10 p-1.5 mb-6 group-hover:scale-110 transition-transform duration-500">
                     <div className="w-full h-full rounded-[2rem] overflow-hidden bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center text-2xl font-black">
                        {student.photoURL ? <img src={student.photoURL} alt="" className="w-full h-full object-cover" /> : student.displayName[0]}
                     </div>
                  </div>

                  <h3 className="font-black text-xl mb-1 group-hover:text-primary transition-colors truncate w-full">{student.displayName}</h3>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-10">{student.educationalStage} • ID: {student.number}</p>

                  <div className="grid grid-cols-2 gap-3 w-full relative z-10">
                     <button 
                       onClick={() => handleStatusChange(student.id, 'present')}
                       className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${attendanceData[student.id] === 'present' ? 'bg-emerald-500 border-emerald-500/20 text-white shadow-xl shadow-emerald-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}
                     >
                        حاضر
                     </button>
                     <button 
                       onClick={() => handleStatusChange(student.id, 'absent')}
                       className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${attendanceData[student.id] === 'absent' ? 'bg-rose-500 border-rose-500/20 text-white shadow-xl shadow-rose-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}
                     >
                        غائب
                     </button>
                  </div>
               </div>
             ))
           )}
        </div>

      </div>
    </DashboardLayout>
  );
}
