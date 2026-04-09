'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc, 
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
  collectionGroup
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

interface Student {
  id: string;
  displayName: string;
  halaqaId?: string;
  photoURL?: string;
}

interface AttendanceRecord {
  status: 'present' | 'absent' | 'late' | 'excused' | 'dropped';
  note: string;
  docId: string | null;
}

interface UserData {
  uid: string;
  role: string;
  type: string;
  displayName?: string;
}

export default function AttendancePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeNoteStudent, setActiveNoteStudent] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(storedUser);
    setUser(userData);
    fetchData(userData, selectedDate);
  }, [selectedDate]);

  const fetchData = async (currentUser: UserData, date: string) => {
    setIsLoading(true);
    try {
      const { role, type, uid } = currentUser;
      let studentList: Student[] = [];

      if (role === 'admin' || role === 'mentor' || type === 'mentor') {
        const q = query(collection(db, 'users'), where('type', '==', 'student'));
        const snap = await getDocs(q);
        studentList = snap.docs.map((ds: QueryDocumentSnapshot<DocumentData>) => ({ id: ds.id, ...ds.data() } as Student));
      } else if (type === 'teacher' && uid) {
        const assignedSnap = await getDocs(collection(db, 'mumber', uid, 'member'));
        const assignedIds = assignedSnap.docs.map((ds: QueryDocumentSnapshot<DocumentData>) => ds.id);
        
        if (assignedIds.length > 0) {
          const q = query(
            collection(db, 'users'), 
            where('type', '==', 'student'), 
            where('halaqaId', 'in', assignedIds.slice(0, 30))
          );
          const snap = await getDocs(q);
          studentList = snap.docs.map((ds: QueryDocumentSnapshot<DocumentData>) => ({ id: ds.id, ...ds.data() } as Student));
        }
      }

      studentList.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setStudents(studentList);

      const attendanceSnap = await getDocs(
        query(
          collectionGroup(db, 'tracking'),
          where('date', '==', date),
          where('type', '==', 'attendance')
        )
      );

      const records: Record<string, AttendanceRecord> = {};
      studentList.forEach(s => {
        records[s.id] = { status: 'present', note: '', docId: null };
      });

      attendanceSnap.docs.forEach((ds: QueryDocumentSnapshot<DocumentData>) => {
        const data = ds.data();
        if (records[data.user_id]) {
          records[data.user_id] = {
            status: data.status,
            note: data.note || '',
            docId: ds.id
          };
        }
      });

      setAttendanceMap(records);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const markAll = (status: AttendanceRecord['status']) => {
    const newMap = { ...attendanceMap };
    students.forEach(s => {
      newMap[s.id] = { ...newMap[s.id], status };
    });
    setAttendanceMap(newMap);
  };

  const openNoteModal = (studentId: string) => {
    setActiveNoteStudent(studentId);
    setTempNote(attendanceMap[studentId]?.note || '');
  };

  const saveNote = () => {
    if (activeNoteStudent) {
      setAttendanceMap(prev => ({
        ...prev,
        [activeNoteStudent]: { ...prev[activeNoteStudent], note: tempNote }
      }));
    }
    setActiveNoteStudent(null);
  };

  const handleSaveBatch = async () => {
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      
      for (const student of students) {
        const data = attendanceMap[student.id];
        if (!data) continue;

        const recordData: DocumentData = {
          type: 'attendance',
          date: selectedDate,
          user_id: student.id,
          student_name: student.displayName,
          status: data.status,
          note: data.note,
          updated_at: serverTimestamp(),
          updatedTimes: serverTimestamp()
        };

        if (data.docId) {
          const docRef = doc(db, 'users', student.id, 'tracking', data.docId);
          batch.update(docRef, recordData);
        } else {
          const docRef = doc(collection(db, 'users', student.id, 'tracking'));
          batch.set(docRef, {
            ...recordData,
            created_at: serverTimestamp(),
            createdTimes: serverTimestamp()
          });
        }
      }

      await batch.commit();
      alert('تم حفظ التحضير بنجاح');
      if (user) fetchData(user, selectedDate);
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('فشل في حفظ التحضير');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user && typeof window !== 'undefined') return null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto animate-snappy">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold mb-3 uppercase tracking-widest">
              <Link href="/dashboard" className="hover:text-primary transition-colors">لوحة التحكم</Link>
              <span>/</span>
              <span className="text-primary/80">نظام التحضير الذكي</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gradient tracking-tight">
              تحضير الطلاب
            </h1>
            <p className="text-slate-500 mt-2 font-medium">إدارة الحضور والغياب اليومي بدقة عالية</p>
          </div>

          <div className="flex items-center gap-3 glass-panel p-2 rounded-2xl border-white/5 shadow-2xl">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 transition-all text-white font-bold text-sm"
            />
            <button 
              onClick={handleSaveBatch}
              disabled={isSaving || isLoading}
              className="bg-primary hover:scale-[1.02] active:scale-95 px-6 py-2.5 rounded-xl font-black text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-glow border border-white/10"
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ التحضير'}
            </button>
          </div>
        </div>

        {/* Global Action Shortcuts */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => markAll('present')}
            className="group relative flex items-center justify-center gap-3 py-4 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl transition-all"
          >
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="font-black text-emerald-400 tracking-wider text-sm uppercase">تحضير الجميع</span>
          </button>
          
          <button 
            onClick={() => markAll('absent')}
            className="group relative flex items-center justify-center gap-3 py-4 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-2xl transition-all"
          >
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="font-black text-rose-400 tracking-wider text-sm uppercase">تغييب الجميع</span>
          </button>
        </div>

        {/* Students List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 glass-panel rounded-[2rem]">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-primary-glow"></div>
              <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">جاري مزامنة بيانات الحضور...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="glass-panel rounded-[2rem] p-20 text-center border-dashed border-white/10">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <p className="text-slate-400 font-bold text-lg">لا يوجد طلاب في قوائم حلقتك حالياً</p>
            </div>
          ) : (
            students.map((student) => {
              const record = attendanceMap[student.id];
              return (
                <div key={student.id} className="glass-card rounded-[1.5rem] p-5 md:p-6 group animate-fade hover:translate-x-1 duration-300">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/5 font-black text-2xl overflow-hidden shrink-0 group-hover:border-primary/50 transition-colors shadow-2xl">
                        {student.photoURL ? (
                          <img src={student.photoURL} alt={student.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gradient">{student.displayName[0]}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-black group-hover:text-primary transition-colors duration-300">{student.displayName}</h3>
                        <button 
                          onClick={() => openNoteModal(student.id)}
                          className={`text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2 p-1.5 px-3 rounded-lg border transition-all ${record?.note ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {record?.note ? record.note : 'إضافة ملاحظة إدارية'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <StatusBadge label="حاضر" active={record?.status === 'present'} color="emerald" onClick={() => handleStatusChange(student.id, 'present')} />
                      <StatusBadge label="غائب" active={record?.status === 'absent'} color="rose" onClick={() => handleStatusChange(student.id, 'absent')} />
                      <StatusBadge label="متأخر" active={record?.status === 'late'} color="amber" onClick={() => handleStatusChange(student.id, 'late')} />
                      <StatusBadge label="مستأذن" active={record?.status === 'excused'} color="blue" onClick={() => handleStatusChange(student.id, 'excused')} />
                      <StatusBadge label="منقطع" active={record?.status === 'dropped'} color="slate" onClick={() => handleStatusChange(student.id, 'dropped')} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Note Entry Modal */}
        {activeNoteStudent && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <div className="fixed inset-0 bg-black/90 backdrop-blur-md animate-fade" onClick={() => setActiveNoteStudent(null)}></div>
             <div className="relative glass-panel rounded-[2.5rem] w-full max-w-md p-8 border-white/10 shadow-2xl animate-snappy">
               <h2 className="text-xl font-black text-gradient mb-6">إضافة ملاحظة للطالب</h2>
               <textarea 
                 value={tempNote}
                 onChange={(e) => setTempNote(e.target.value)}
                 placeholder="اكتب الأسباب أو الملاحظات هنا..."
                 className="w-full elite-input min-h-[150px] font-bold text-sm resize-none mb-8"
               />
               <div className="flex gap-4">
                 <button 
                   onClick={saveNote}
                   className="flex-1 primary-gradient py-4 rounded-2xl font-black text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary-glow"
                 >
                   حفظ الملاحظة
                 </button>
                 <button 
                   onClick={() => setActiveNoteStudent(null)}
                   className="px-8 glass-card py-4 rounded-2xl font-black text-xs text-slate-400 hover:text-white uppercase tracking-widest"
                 >
                   إلغاء
                 </button>
               </div>
             </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ label, active, color, onClick }: any) {
  const configs: any = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/10', active: 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/10', active: 'bg-rose-500 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/10', active: 'bg-amber-500 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/10', active: 'bg-blue-500 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
    slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/10', active: 'bg-slate-500 border-slate-500' },
  };

  const config = configs[color];

  return (
    <button 
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl border font-black text-[11px] transition-all duration-300 uppercase tracking-wider
        ${active ? config.active + ' text-white scale-105 z-10' : config.bg + ' ' + config.border + ' text-slate-500 hover:border-white/20'}`}
    >
      {label}
    </button>
  );
}
