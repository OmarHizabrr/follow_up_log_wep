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
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  Calendar, 
  Save, 
  X, 
  ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        updatedAt: serverTimestamp()
      };

      const finalData = { ...editingRecord, ...metadata };

      if (editingRecord.id) {
        await updateDoc(doc(db, 'testsessions', activeStudent.id, 'testsessions', editingRecord.id), finalData);
      } else {
        const docRef = doc(collection(db, 'testsessions', activeStudent.id, 'testsessions'));
        await setDoc(docRef, { ...finalData, id: docRef.id, createdAt: serverTimestamp() });
      }
      setActiveStudent(null);
      fetchData(user, selectedDate);
    } catch (e) {
      alert('خطأ في مزامنة الاختبار');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">جدول الاختبارات</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">تتبع تقييمات الطلاب اليومية وإدارة درجات الاختبارات.</p>
          </div>
          
          <div className="relative">
             <Calendar className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input 
               type="date" 
               value={selectedDate} 
               onChange={(e) => setSelectedDate(e.target.value)} 
               className="enterprise-input pr-10 w-48 text-left"
               dir="ltr"
             />
          </div>
        </div>

        {/* Dynamic Student Grid Table Style */}
        <div className="flex flex-col gap-4">
           {isLoading ? (
             Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl"></div>)
           ) : (
             students.map(student => {
               const records = recordsMap[student.id] || [];
               return (
                 <div 
                   key={student.id} 
                   className="enterprise-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
                          {student.displayName[0]}
                       </div>
                       <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-base">{student.displayName}</h3>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">رقم الهوية: #{student.number || 'N/A'}</div>
                       </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                       {records.map(rec => (
                         <button 
                           key={rec.id} 
                           onClick={() => handleOpenModal(student, rec)} 
                           className="bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 flex items-center gap-3 transition-colors"
                         >
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{rec.test_name}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${rec.score >= 85 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {rec.score}%
                            </span>
                         </button>
                       ))}
                       
                       <button 
                         onClick={() => handleOpenModal(student)} 
                         className="px-3 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-white border border-blue-200 border-dashed rounded-lg transition-colors flex items-center gap-1"
                       >
                          <Plus className="w-3.5 h-3.5" />
                          إضافة اختبار
                       </button>
                    </div>
                 </div>
               );
             })
           )}
        </div>

        {/* Modal Assessment Dialog */}
        <AnimatePresence>
          {activeStudent && editingRecord && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setActiveStudent(null)}></div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                   <div>
                     <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-gray-400" />
                        سجل الاختبار والتقييم
                     </h2>
                     <p className="text-sm font-semibold text-blue-600 mt-1">{activeStudent.displayName}</p>
                   </div>
                   <button onClick={() => setActiveStudent(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                     <X className="w-5 h-5" />
                   </button>
                </div>
                
                <div className="p-6 space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">اسم الاختبار / الجزء</label>
                    <input 
                      className="enterprise-input" 
                      value={editingRecord.test_name || ''} 
                      onChange={(e) => setEditingRecord({...editingRecord, test_name: e.target.value})} 
                      placeholder="مثال: جزء عم, الأجزاء الثلاثة..." 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">الدرجة المئوية</label>
                      <input 
                         type="number" 
                         className="enterprise-input text-left" dir="ltr"
                         value={editingRecord.score || ''} 
                         onChange={(e) => setEditingRecord({...editingRecord, score: Number(e.target.value)})} 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">التقييم اللفظي</label>
                      <select 
                         className="enterprise-input cursor-pointer" 
                         value={editingRecord.rating || 5} 
                         onChange={(e) => setEditingRecord({...editingRecord, rating: Number(e.target.value)})}
                      >
                         <option value="5">ممتاز ✨</option>
                         <option value="4">جيد جداً 👍</option>
                         <option value="3">جيد 🆗</option>
                         <option value="2">مقبول ⚠️</option>
                      </select>
                    </div>
                  </div>

                  <div>
                     <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">ملاحظات و توجيهات إضافية (اختياري)</label>
                     <textarea 
                        rows={3}
                        className="enterprise-input resize-none py-2" 
                        value={editingRecord.notes || ''} 
                        onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})} 
                        placeholder="الملاحظات..."
                     />
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                     <button 
                        onClick={() => setActiveStudent(null)} 
                        className="enterprise-button-secondary"
                     >
                        إلغاء
                     </button>
                     <button 
                        onClick={saveRecord} 
                        disabled={isSaving} 
                        className="enterprise-button min-w-[120px]"
                     >
                        {isSaving ? 'لحظات...' : 'حفظ النتيجة'}
                     </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
