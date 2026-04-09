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
import { quranSurahs, Surah } from '@/lib/quranData';

interface Student {
  id: string;
  displayName: string;
  halaqaId?: string;
  photoURL?: string;
}

interface RecitationRecord {
  hifz_surah: number | null;
  hifz_from_ayah: number | null;
  hifz_to_ayah: number | null;
  hifz_grade: string;
  murajaah_surah: number | null;
  murajaah_from_ayah: number | null;
  murajaah_to_ayah: number | null;
  murajaah_grade: string;
  docId: string | null;
}

interface UserData {
  uid: string;
  role: string;
  type: string;
  displayName?: string;
}

export default function RecitationPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [recitationMap, setRecitationMap] = useState<Record<string, RecitationRecord>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal State
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [tempRecord, setTempRecord] = useState<RecitationRecord | null>(null);

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
        studentList = snap.docs.map((ds) => ({ id: ds.id, ...ds.data() } as Student));
      } else if (type === 'teacher' && uid) {
        const assignedSnap = await getDocs(collection(db, 'mumber', uid, 'member'));
        const assignedIds = assignedSnap.docs.map((ds) => ds.id);
        
        if (assignedIds.length > 0) {
          const q = query(
            collection(db, 'users'), 
            where('type', '==', 'student'), 
            where('halaqaId', 'in', assignedIds.slice(0, 30))
          );
          const snap = await getDocs(q);
          studentList = snap.docs.map((ds) => ({ id: ds.id, ...ds.data() } as Student));
        }
      }

      studentList.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setStudents(studentList);

      const trackingSnap = await getDocs(
        query(
          collectionGroup(db, 'tracking'),
          where('date', '==', date),
          where('type', '==', 'recitation')
        )
      );

      const records: Record<string, RecitationRecord> = {};
      studentList.forEach(s => {
        records[s.id] = {
          hifz_surah: null, hifz_from_ayah: null, hifz_to_ayah: null, hifz_grade: '',
          murajaah_surah: null, murajaah_from_ayah: null, murajaah_to_ayah: null, murajaah_grade: '',
          docId: null
        };
      });

      trackingSnap.docs.forEach((ds) => {
        const data = ds.data();
        if (records[data.user_id]) {
          records[data.user_id] = {
            hifz_surah: data.hifz_surah || null,
            hifz_from_ayah: data.hifz_from_ayah || null,
            hifz_to_ayah: data.hifz_to_ayah || null,
            hifz_grade: data.hifz_grade || '',
            murajaah_surah: data.murajaah_surah || null,
            murajaah_from_ayah: data.murajaah_from_ayah || null,
            murajaah_to_ayah: data.murajaah_to_ayah || null,
            murajaah_grade: data.murajaah_grade || '',
            docId: ds.id
          };
        }
      });

      setRecitationMap(records);
    } catch (error) {
      console.error('Error fetching recitation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openStudentModal = (student: Student) => {
    setActiveStudent(student);
    setTempRecord(recitationMap[student.id] ? { ...recitationMap[student.id] } : {
      hifz_surah: null, hifz_from_ayah: null, hifz_to_ayah: null, hifz_grade: '',
      murajaah_surah: null, murajaah_from_ayah: null, murajaah_to_ayah: null, murajaah_grade: '',
      docId: null
    });
  };

  const handleSaveModal = () => {
    if (activeStudent && tempRecord) {
      setRecitationMap(prev => ({
        ...prev,
        [activeStudent.id]: tempRecord
      }));
    }
    setActiveStudent(null);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      
      for (const student of students) {
        const data = recitationMap[student.id];
        if (!data) continue;
        
        if (!data.hifz_surah && !data.murajaah_surah && !data.docId) continue;

        const recordData: DocumentData = {
          type: 'recitation',
          date: selectedDate,
          user_id: student.id,
          student_name: student.displayName,
          hifz_surah: data.hifz_surah,
          hifz_from_ayah: data.hifz_from_ayah,
          hifz_to_ayah: data.hifz_to_ayah,
          hifz_grade: data.hifz_grade,
          murajaah_surah: data.murajaah_surah,
          murajaah_from_ayah: data.murajaah_from_ayah,
          murajaah_to_ayah: data.murajaah_to_ayah,
          murajaah_grade: data.murajaah_grade,
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
      alert('تم حفظ البيانات بنجاح');
      if (user) fetchData(user, selectedDate);
    } catch (error) {
      console.error('Error saving recitation:', error);
      alert('فشل في الحفظ');
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
              <span className="text-primary/80">سجل الإنجاز اليومي</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gradient tracking-tight">
              متابعة الحفظ والمراجعة
            </h1>
            <p className="text-slate-500 mt-2 font-medium">نظام المتابعة القرآني المتطور للحلقات</p>
          </div>

          <div className="flex items-center gap-3 glass-panel p-2 rounded-2xl border-white/5 shadow-2xl">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 transition-all text-white font-bold text-sm"
            />
            <button 
              onClick={handleSaveAll}
              disabled={isSaving || isLoading}
              className="bg-primary hover:scale-[1.02] active:scale-95 px-6 py-2.5 rounded-xl font-black text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-glow border border-white/10"
            >
              {isSaving ? 'انتظر...' : 'اعتماد السجل'}
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 glass-panel rounded-[2rem]">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-primary-glow"></div>
              <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">جاري مزامنة البيانات السحابية...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="glass-panel rounded-[2rem] p-20 text-center border-dashed border-white/10">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <p className="text-slate-400 font-bold text-lg">لا يوجد طلاب مسجلين في حلقتك حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {students.map((student) => {
                const record = recitationMap[student.id];
                const hasData = record && (record.hifz_surah || record.murajaah_surah);
                const hifzName = record?.hifz_surah ? quranSurahs.find(s => s.id === record.hifz_surah)?.name : null;
                const murajaahName = record?.murajaah_surah ? quranSurahs.find(s => s.id === record.murajaah_surah)?.name : null;

                return (
                  <div key={student.id} 
                      onClick={() => openStudentModal(student)}
                      className="glass-card rounded-[1.5rem] p-5 cursor-pointer group animate-fade">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/5 font-black text-2xl overflow-hidden shrink-0 group-hover:border-primary/50 transition-colors shadow-2xl">
                            {student.photoURL ? (
                              <img src={student.photoURL} alt={student.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gradient">{student.displayName[0]}</span>
                            )}
                          </div>
                          {hasData && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-[#111] animate-pulse shadow-primary-glow"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-black group-hover:text-primary transition-colors duration-300">{student.displayName}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                             {hasData ? (
                               <>
                                {hifzName && <span className="text-[10px] font-bold py-1 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">حفظ: {hifzName}</span>}
                                {murajaahName && <span className="text-[10px] font-bold py-1 px-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/10">مراجعة: {murajaahName}</span>}
                               </>
                             ) : (
                               <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">بانتظار الإدخال اليومي...</span>
                             )}
                          </div>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Elite Modal */}
        {activeStudent && tempRecord && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md animate-fade" onClick={() => setActiveStudent(null)}></div>
            <div className="relative glass-panel rounded-[2.5rem] w-full max-w-2xl p-8 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-snappy overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] -mr-16 -mt-16 rounded-full"></div>
              
              <div className="flex items-center justify-between mb-10 relative">
                <div>
                  <h2 className="text-2xl font-black text-gradient">تحديث سجل الإنجاز</h2>
                  <p className="text-slate-500 text-sm font-bold">{activeStudent.displayName}</p>
                </div>
                <button onClick={() => setActiveStudent(null)} className="p-3 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 rounded-2xl transition-all active:scale-90 border border-white/5">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8 relative">
                {/* Hifz Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <span className="font-black uppercase tracking-widest text-xs">الحفظ الجديد</span>
                  </div>
                  
                  <div className="glass-card rounded-2xl p-5 space-y-5 border-white/5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">اختيار السورة</label>
                      <select 
                        value={tempRecord.hifz_surah || ''}
                        onChange={(e) => setTempRecord({...tempRecord, hifz_surah: e.target.value ? Number(e.target.value) : null, hifz_from_ayah: null, hifz_to_ayah: null})}
                        className="w-full elite-input font-bold text-sm"
                      >
                        <option value="" className="bg-[#111]">تحديد السورة...</option>
                        {quranSurahs.map(s => (
                          <option key={s.id} value={s.id} className="bg-[#111]">{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {tempRecord.hifz_surah && (
                      <div className="grid grid-cols-2 gap-3 animate-snappy">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">من آية</label>
                          <input 
                            type="number" min="1" max={quranSurahs.find(s=>s.id === tempRecord.hifz_surah)?.ayahCount || 1}
                            value={tempRecord.hifz_from_ayah || ''}
                            onChange={(e) => setTempRecord({...tempRecord, hifz_from_ayah: Number(e.target.value)})}
                            className="w-full elite-input font-black text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">إلى آية</label>
                          <input 
                            type="number" min="1" max={quranSurahs.find(s=>s.id === tempRecord.hifz_surah)?.ayahCount || 1}
                            value={tempRecord.hifz_to_ayah || ''}
                            onChange={(e) => setTempRecord({...tempRecord, hifz_to_ayah: Number(e.target.value)})}
                            className="w-full elite-input font-black text-center"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">التقييم اليومي</label>
                       <div className="grid grid-cols-2 gap-2">
                          {['ممتاز', 'جيد جدا', 'جيد', 'ضعيف'].map(grade => (
                            <button
                              key={'h'+grade}
                              onClick={() => setTempRecord({...tempRecord, hifz_grade: grade})}
                              className={`py-2 px-1 text-[11px] font-black rounded-lg transition-all duration-300 border
                                ${tempRecord.hifz_grade === grade 
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                  : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'}`}
                            >
                              {grade}
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>

                {/* Murajaah Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-blue-400">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </div>
                    <span className="font-black uppercase tracking-widest text-xs">سجل المراجعة</span>
                  </div>

                  <div className="glass-card rounded-2xl p-5 space-y-5 border-white/5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">اختيار السورة</label>
                      <select 
                        value={tempRecord.murajaah_surah || ''}
                        onChange={(e) => setTempRecord({...tempRecord, murajaah_surah: e.target.value ? Number(e.target.value) : null, murajaah_from_ayah: null, murajaah_to_ayah: null})}
                        className="w-full elite-input font-bold text-sm"
                      >
                        <option value="" className="bg-[#111]">تحديد السورة...</option>
                        {quranSurahs.map(s => (
                          <option key={'m'+s.id} value={s.id} className="bg-[#111]">{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {tempRecord.murajaah_surah && (
                      <div className="grid grid-cols-2 gap-3 animate-snappy">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">من آية</label>
                          <input 
                            type="number" min="1" max={quranSurahs.find(s=>s.id === tempRecord.murajaah_surah)?.ayahCount || 1}
                            value={tempRecord.murajaah_from_ayah || ''}
                            onChange={(e) => setTempRecord({...tempRecord, murajaah_from_ayah: Number(e.target.value)})}
                            className="w-full elite-input font-black text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">إلى آية</label>
                          <input 
                            type="number" min="1" max={quranSurahs.find(s=>s.id === tempRecord.murajaah_surah)?.ayahCount || 1}
                            value={tempRecord.murajaah_to_ayah || ''}
                            onChange={(e) => setTempRecord({...tempRecord, murajaah_to_ayah: Number(e.target.value)})}
                            className="w-full elite-input font-black text-center"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">التقييم اليومي</label>
                       <div className="grid grid-cols-2 gap-2">
                          {['ممتاز', 'جيد جدا', 'جيد', 'ضعيف'].map(grade => (
                            <button
                              key={'m'+grade}
                              onClick={() => setTempRecord({...tempRecord, murajaah_grade: grade})}
                              className={`py-2 px-1 text-[11px] font-black rounded-lg transition-all duration-300 border
                                ${tempRecord.murajaah_grade === grade 
                                  ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                                  : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'}`}
                            >
                              {grade}
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4 pt-4 border-t border-white/5 relative">
                <button 
                  onClick={handleSaveModal}
                  className="flex-1 primary-gradient py-4 rounded-2xl font-black text-sm tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary-glow"
                >
                  حفظ التحديثات
                </button>
                <button 
                  onClick={() => {
                     setTempRecord({
                        ...tempRecord, 
                        hifz_surah: null, hifz_from_ayah: null, hifz_to_ayah: null, hifz_grade: '',
                        murajaah_surah: null, murajaah_from_ayah: null, murajaah_to_ayah: null, murajaah_grade: ''
                     });
                  }}
                  className="px-8 glass-card py-4 rounded-2xl font-black text-xs text-slate-400 hover:text-white uppercase tracking-widest"
                >
                   تصفير
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
