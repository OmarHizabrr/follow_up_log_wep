'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  serverTimestamp,
  collectionGroup,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

interface Student {
  id: string;
  displayName: string;
  halaqaId?: string;
  photoURL?: string;
  number?: string | number;
}

interface TestRecord {
  id?: string;
  test_name: string;
  score: number;
  rating: number;
  notes: string;
  date: string;
  user_id: string;
  student_name: string;
}

export default function TestsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [recordsMap, setRecordsMap] = useState<Record<string, TestRecord[]>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [editingRecord, setEditingRecord] = useState<Partial<TestRecord> | null>(null);

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
  }, [selectedDate, router]);

  const fetchData = async (currentUser: any, date: string) => {
    setIsLoading(true);
    try {
      const { role, type, uid } = currentUser;
      let studentList: Student[] = [];

      if (role === 'admin' || role === 'mentor' || type === 'mentor') {
        const q = query(collection(db, 'users'), where('type', '==', 'student'));
        const snap = await getDocs(q);
        studentList = snap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Student));
      } else if (type === 'teacher' && uid) {
        const assignedSnap = await getDocs(collection(db, 'mumber', uid, 'member'));
        const assignedIds = assignedSnap.docs.map(ds => ds.id);
        if (assignedIds.length > 0) {
          const q = query(collection(db, 'users'), where('type', '==', 'student'), where('halaqaId', 'in', assignedIds));
          const snap = await getDocs(q);
          studentList = snap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Student));
        }
      }

      studentList.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setStudents(studentList);

      const testsSnap = await getDocs(query(collectionGroup(db, 'testsessions'), where('date', '==', date)));
      const records: Record<string, TestRecord[]> = {};
      studentList.forEach(s => records[s.id] = []);
      testsSnap.docs.forEach(ds => {
        const data = ds.data() as TestRecord;
        if (records[data.user_id]) records[data.user_id].push({ ...data, id: ds.id });
      });
      setRecordsMap(records);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (student: Student, record?: TestRecord) => {
    setActiveStudent(student);
    if (record) {
      setEditingRecord(record);
    } else {
      setEditingRecord({
        test_name: '',
        score: 0,
        rating: 5,
        notes: '',
        date: selectedDate,
        user_id: student.id,
        student_name: student.displayName
      });
    }
  };

  const saveRecord = async () => {
    if (!activeStudent || !editingRecord || !user) return;
    setIsSaving(true);
    try {
      const metadata = {
        createdByName: user.displayName,
        createdBy: user.uid,
        updatedAt: serverTimestamp(),
        updatedTimes: serverTimestamp()
      };

      const finalData = { ...editingRecord, ...metadata };

      if (editingRecord.id) {
        await updateDoc(doc(db, 'testsessions', activeStudent.id, 'testsessions', editingRecord.id), finalData);
      } else {
        const docRef = doc(collection(db, 'testsessions', activeStudent.id, 'testsessions'));
        await setDoc(docRef, { ...finalData, id: docRef.id, createdAt: serverTimestamp(), createdTimes: serverTimestamp() });
      }
      setActiveStudent(null);
      fetchData(user, selectedDate);
    } catch (e) {
      alert('Error saving record');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto animate-snappy">
        {/* Elite Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold mb-3 uppercase tracking-widest">
              <Link href="/dashboard" className="hover:text-primary transition-colors">لوحة التحكم</Link>
              <span>/</span>
              <span className="text-primary/80">نظام الاختبارات والتقييم</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gradient tracking-tight">
              اختبارات الطلاب
            </h1>
            <p className="text-slate-500 mt-2 font-medium">توثيق نتائج الاختبارات الشهرية والفرعية</p>
          </div>

          <div className="flex items-center gap-3 glass-panel p-2 rounded-2xl border-white/5 shadow-2xl">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 transition-all text-white font-bold text-sm" />
          </div>
        </div>

        {/* Student List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="py-20 text-center glass-panel rounded-[2rem]">
               <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">جاري جلب قائمة الطلاب...</p>
            </div>
          ) : (
            students.map(student => {
              const records = recordsMap[student.id] || [];
              return (
                <div key={student.id} className="glass-card rounded-[1.5rem] p-6 hover:border-primary/30 transition-all group">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center font-black text-xl text-gradient border border-white/10 group-hover:scale-110 transition-transform">
                            {student.displayName[0]}
                         </div>
                         <div>
                            <h3 className="font-black text-lg">{student.displayName}</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">رقم التسلسل: {student.number || '...'}</p>
                         </div>
                      </div>
                      <button onClick={() => handleOpenModal(student)} className="p-4 bg-primary/10 text-primary rounded-2xl hover:bg-primary hover:text-white transition-all shadow-lg">رصد اختبار جديد</button>
                   </div>

                   {records.length > 0 && (
                     <div className="mt-6 flex flex-wrap gap-2">
                        {records.map(rec => (
                          <div key={rec.id} onClick={() => handleOpenModal(student, rec)} className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                             <span className="text-xs font-bold">{rec.test_name}</span>
                             <span className="text-[10px] font-black text-primary">%{rec.score}</span>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal */}
        {activeStudent && editingRecord && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md animate-fade" onClick={() => setActiveStudent(null)}></div>
            <div className="relative glass-panel rounded-[2.5rem] w-full max-w-md p-8 border-white/10 shadow-2xl animate-snappy">
              <h2 className="text-2xl font-black text-gradient mb-8">رصد اختبار جديد</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">اسم الاختبار / المنهج</label>
                  <input className="w-full elite-input font-bold text-sm" value={editingRecord.test_name || ''} onChange={(e) => setEditingRecord({...editingRecord, test_name: e.target.value})} placeholder="مثال: اختبار جزء عم" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">الدرجة (من 100)</label>
                    <input type="number" className="w-full elite-input font-bold text-sm" value={editingRecord.score || 0} onChange={(e) => setEditingRecord({...editingRecord, score: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">التقييم</label>
                    <select className="w-full elite-input font-bold text-sm" value={editingRecord.rating || 5} onChange={(e) => setEditingRecord({...editingRecord, rating: Number(e.target.value)})}>
                       <option value="5" className="bg-black">ممتاز</option>
                       <option value="4" className="bg-black">جيد جداً</option>
                       <option value="3" className="bg-black">جيد</option>
                       <option value="2" className="bg-black">مقبول</option>
                    </select>
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">ملاحظات إضافية</label>
                   <textarea className="w-full elite-input min-h-[100px] font-bold text-sm" value={editingRecord.notes || ''} onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})} />
                </div>

                <div className="flex gap-4 pt-6">
                  <button onClick={saveRecord} disabled={isSaving} className="flex-1 primary-gradient py-4 rounded-2xl font-black text-xs uppercase tracking-widest">
                    {isSaving ? 'انتظر...' : 'حفظ النتيجة'}
                  </button>
                  <button onClick={() => setActiveStudent(null)} className="px-8 glass-card py-4 rounded-2xl font-black text-xs text-slate-400 uppercase tracking-widest">إلغاء</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
