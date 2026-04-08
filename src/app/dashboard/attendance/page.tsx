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

      // 1. Fetch Students based on permissions
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

      // Sort alphabetically
      studentList.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setStudents(studentList);

      // 2. Fetch existing attendance for this date
      const attendanceSnap = await getDocs(
        query(
          collectionGroup(db, 'tracking'),
          where('date', '==', date),
          where('type', '==', 'attendance')
        )
      );

      const records: Record<string, AttendanceRecord> = {};
      // Initialize with default 'present'
      studentList.forEach(s => {
        records[s.id] = { status: 'present', note: '', docId: null };
      });

      // Fill with actual data
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
    <div className="min-h-screen bg-[#0F172A] text-white p-4 md:p-8 font-['Outfit']" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Link href="/dashboard" className="hover:text-white transition-colors">لوحة التحكم</Link>
              <span>/</span>
              <span className="text-[#10B981]">تحضير الحلقات</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              التحضير اليومي
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-[#10B981] transition-all"
            />
            <button 
              onClick={handleSaveBatch}
              disabled={isSaving || isLoading}
              className="bg-[#10B981] hover:bg-[#059669] px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ التحضير'}
            </button>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="flex gap-3 mb-6">
          <button 
            onClick={() => markAll('present')}
            className="flex-1 py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            تحضير الكل
          </button>
          <button 
            onClick={() => markAll('absent')}
            className="flex-1 py-3 px-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            تغييب الكل
          </button>
        </div>

        {/* Students List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400">جاري تحميل بيانات الطلاب والتحضير...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <p className="text-slate-400">لا يوجد طلاب مسجلين في حلقاتك حالياً</p>
            </div>
          ) : (
            students.map((student) => {
              const record = attendanceMap[student.id];
              return (
                <div key={student.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 hover:bg-white/[0.07] transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#10B981]/20 to-[#3B82F6]/20 flex items-center justify-center border border-white/10 text-[#10B981] font-bold text-xl overflow-hidden">
                        {student.photoURL ? (
                          <img src={student.photoURL} alt={student.displayName} className="w-full h-full object-cover" />
                        ) : (
                          student.displayName[0]
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{student.displayName}</h3>
                        <button 
                          onClick={() => openNoteModal(student.id)}
                          className={`text-sm mt-1 flex items-center gap-1 transition-colors ${record?.note ? 'text-[#10B981]' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {record?.note ? record.note : 'إضافة ملاحظة'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusChip 
                        label="حاضر" 
                        status="present" 
                        active={record?.status === 'present'} 
                        color="emerald" 
                        onClick={() => handleStatusChange(student.id, 'present')} 
                      />
                      <StatusChip 
                        label="غائب" 
                        status="absent" 
                        active={record?.status === 'absent'} 
                        color="rose" 
                        onClick={() => handleStatusChange(student.id, 'absent')} 
                      />
                      <StatusChip 
                        label="متأخر" 
                        status="late" 
                        active={record?.status === 'late'} 
                        color="amber" 
                        onClick={() => handleStatusChange(student.id, 'late')} 
                      />
                      <StatusChip 
                        label="مستأذن" 
                        status="excused" 
                        active={record?.status === 'excused'} 
                        color="blue" 
                        onClick={() => handleStatusChange(student.id, 'excused')} 
                      />
                      <StatusChip 
                        label="منقطع" 
                        status="dropped" 
                        active={record?.status === 'dropped'} 
                        color="slate" 
                        onClick={() => handleStatusChange(student.id, 'dropped')} 
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Note Modal */}
        {activeNoteStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1E293B] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
              <h2 className="text-xl font-bold mb-4">إضافة ملاحظة</h2>
              <textarea 
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder="اكتب ملاحظاتك هنا..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-32 outline-none focus:border-[#10B981] transition-all resize-none mb-6"
              />
              <div className="flex gap-3">
                <button 
                  onClick={saveNote}
                  className="flex-1 bg-[#10B981] py-3 rounded-2xl font-bold hover:bg-[#059669] transition-all"
                >
                  حفظ
                </button>
                <button 
                  onClick={() => setActiveNoteStudent(null)}
                  className="flex-1 bg-white/5 py-3 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/10"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusChip({ label, status, active, color, onClick }: { 
  label: string, 
  status: string, 
  active: boolean, 
  color: string, 
  onClick: () => void 
}) {
  const colors: Record<string, string> = {
    emerald: active ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500 hover:border-emerald-500/50',
    rose: active ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-white/5 border-white/10 text-slate-500 hover:border-rose-500/50',
    amber: active ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-white/5 border-white/10 text-slate-500 hover:border-amber-500/50',
    blue: active ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-slate-500 hover:border-blue-500/50',
    slate: active ? 'bg-slate-500/20 border-slate-500 text-slate-400' : 'bg-white/5 border-white/10 text-slate-500 hover:border-slate-500/50',
  };

  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${colors[color]}`}
    >
      {label}
    </button>
  );
}
