'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
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
  Search, 
  Star,
  Sparkles,
  Zap,
  Database,
  GraduationCap,
  ChevronLeft,
  Hash,
  Trophy,
  Filter,
  CheckCircle2,
  List,
  Target,
  ArrowRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { injectMetadata, getRatingLabel, getStudentSubCollection } from '@/lib/firebaseUtils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { isAdminLike, isTeacher } from '@/lib/access';
import { Modal } from '@/components/ui/Modal';
import { UI_TEXT } from '@/lib/ui-text';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface Student {
  id: string;
  displayName: string;
  halaqaId?: string;
  photoURL?: string;
  number?: string | number;
  educationalStage?: string;
}

interface TestRecord {
  id?: string;
  test_name: string;
  score: number;
  grade_enum: number;
  grade_text: string;
  mistakes_count: number;
  notes: string;
  date: string;
  user_id: string;
  student_name: string;
  duration_seconds?: number;
}

interface MistakeType {
  id: string;
  name: string;
  value: number;
  symbol: string;
}

export default function TestsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [recordsMap, setRecordsMap] = useState<Record<string, TestRecord[]>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalaqa, setSelectedHalaqa] = useState<string>('all');
  const [user, setUser] = useState<any>(null);

  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [editingRecord, setEditingRecord] = useState<Partial<TestRecord> | null>(null);
  
  // LIVE SESSION STATE
  const [isLiveSession, setIsLiveSession] = useState(false);
  const [mistakeTypes, setMistakeTypes] = useState<MistakeType[]>([]);
  const [questions, setQuestions] = useState<Record<string, number>[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(storedUser);
    setUser(userData);
    fetchHalaqas();
    fetchMistakeConfigs();
    fetchData(userData, selectedDate);
  }, [selectedDate, router]);

  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const fetchHalaqas = async () => {
    try {
      const q = query(collection(db, 'users'), where('type', '==', 'halaqa'));
      const snap = await getDocs(q);
      setCircles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const fetchMistakeConfigs = async () => {
    try {
      const q = query(collection(db, 'assessmentconfig'), where('type', '==', 'mistake'));
      const snap = await getDocs(q);
      setMistakeTypes(snap.docs.map(d => ({ id: d.id, ...d.data() } as MistakeType)));
    } catch (e) { console.error(e); }
  };

  const fetchData = async (currentUser: any, date: string) => {
    setIsLoading(true);
    try {
      let sQuery;
      if (isTeacher(currentUser) && currentUser.halaqaId) {
        sQuery = query(collection(db, 'users'), where('type', '==', 'student'), where('halaqaId', '==', currentUser.halaqaId));
        setSelectedHalaqa(currentUser.halaqaId);
      } else {
        sQuery = query(collection(db, 'users'), where('type', '==', 'student'));
      }

      const snap = await getDocs(sQuery);
      const studentList = snap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Student));
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

  const startLiveSession = (student: Student) => {
    setActiveStudent(student);
    setIsLiveSession(true);
    setQuestions([{}]);
    setElapsedSeconds(0);
    setTimerActive(true);
    setEditingRecord({
      test_name: '',
      score: 100,
      grade_enum: 1,
      grade_text: getRatingLabel(1),
      mistakes_count: 0,
      notes: '',
      date: selectedDate,
      user_id: student.id,
      student_name: student.displayName
    });
  };

  const addQuestion = () => setQuestions(prev => [...prev, {}]);

  const updateMistake = (qIndex: number, mistakeId: string, delta: number) => {
    setQuestions(prev => {
      const next = [...prev];
      const q = { ...next[qIndex] };
      q[mistakeId] = Math.max(0, (q[mistakeId] || 0) + delta);
      next[qIndex] = q;
      return next;
    });
  };

  const calculateLiveScore = () => {
    let deductions = 0;
    questions.forEach(q => {
      Object.entries(q).forEach(([id, count]) => {
        const config = mistakeTypes.find(m => m.id === id);
        if (config) deductions += config.value * count;
      });
    });
    return Math.max(0, 100 - deductions);
  };

  const handleOpenModal = (student: Student, record?: TestRecord) => {
    if (!record) {
      startLiveSession(student);
      return;
    }
    setActiveStudent(student);
    setIsLiveSession(false);
    setEditingRecord(record);
  };

  const saveRecord = async () => {
    if (!activeStudent || !editingRecord || !user) return;
    setIsSaving(true);
    try {
      const finalScore = isLiveSession ? calculateLiveScore() : (Number(editingRecord.score) || 0);
      const totalMistakes = isLiveSession 
        ? questions.reduce((acc, q) => acc + Object.values(q).reduce((sum, v) => sum + v, 0), 0)
        : (Number(editingRecord.mistakes_count) || 0);

      const finalData = injectMetadata({ 
        ...editingRecord, 
        grade_enum: finalScore >= 90 ? 1 : (finalScore >= 80 ? 2 : (finalScore >= 70 ? 3 : 4)),
        grade_text: getRatingLabel(finalScore >= 90 ? 1 : (finalScore >= 80 ? 2 : (finalScore >= 70 ? 3 : 4))),
        score: finalScore,
        mistakes_count: totalMistakes,
        duration_seconds: elapsedSeconds
      });

      let recId = editingRecord.id;
      if (editingRecord.id) {
        await updateDoc(doc(db, 'testsessions', activeStudent.id, 'testsessions', editingRecord.id), finalData);
      } else {
        const docRef = doc(collection(db, 'testsessions', activeStudent.id, 'testsessions'));
        recId = docRef.id;
        await setDoc(docRef, { ...finalData, id: docRef.id });
      }

      if (isLiveSession) {
        const mistakesColRef = collection(db, 'testmistakes', activeStudent.id, 'testmistakes');
        for (const [qIndex, q] of questions.entries()) {
          for (const [mId, count] of Object.entries(q)) {
            if (count > 0) {
              await setDoc(doc(mistakesColRef), injectMetadata({
                test_session_id: recId,
                mistake_config_id: mId,
                count,
                question_index: qIndex,
                user_id: activeStudent.id
              }));
            }
          }
        }
      }

      // AUTO-ATTENDANCE LINKAGE (Logic Parity with Mobile)
      // If a student took a test, they are definitely present today.
      const todayDateStr = new Date().toISOString().split('T')[0];
      const trackingDocId = `${activeStudent.id}_${todayDateStr}`;
      const trackingRef = doc(db, 'tracking', trackingDocId);
      await setDoc(trackingRef, injectMetadata({
        student_id: activeStudent.id,
        student_name: activeStudent.displayName,
        halaqa_id: activeStudent.halaqaId || '',
        date: todayDateStr,
        status: 'حاضر', // Marking as Present automatically
        source: 'web_test_linkage'
      }), { merge: true });

      setTimerActive(false);
      setActiveStudent(null);
      fetchData(user, selectedDate);
    } catch (e) {
      console.error(e);
      setFeedbackMessage(UI_TEXT.messages.testSaveError);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.number?.toString().includes(searchQuery);
    const matchesHalaqa = selectedHalaqa === 'all' || s.halaqaId === selectedHalaqa;
    return matchesSearch && matchesHalaqa;
  });

  const formatTime = (seconds: number) => {
     const m = Math.floor(seconds / 60);
     const s = seconds % 60;
     return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16">
        
        {/* Header */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-8 md:p-10 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="space-y-4">
              <Badge variant="info" className="px-3 py-1 rounded-lg border-indigo-100/50 text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                مركز التقييم السحابي المركزي
              </Badge>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight family-cairo">
                إدارة الاختبارات والنتائج
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                 رصد وتوثيق نتائج الاختبارات الدورية والنهائية للطلاب ومتابعة مستوى التحصيل العلمي عبر مؤشرات كفاءة متقدمة.
              </p>
            </div>
            <div className="flex items-center gap-4 px-6 py-3 bg-white/50 backdrop-blur-md dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
               <Zap className="w-5 h-5 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">نظام رصد سحابي مرن</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
           
           {/* Sidebar */}
           <div className="xl:col-span-4 xl:sticky xl:top-28 space-y-6">
              <Card className="p-4 space-y-6 border-slate-200/70 dark:border-slate-800 h-[750px] flex flex-col overflow-hidden rounded-2xl">
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-1">
                      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                         <List className="w-4 h-4" />
                         قائمة الطلاب
                      </h3>
                      {isAdminLike(user) && (
                        <div className="w-52">
                          <SearchableSelect
                            value={selectedHalaqa}
                            onChange={setSelectedHalaqa}
                            options={[
                              { value: 'all', label: 'جميع الحلقات' },
                              ...circles.map((circle) => ({ value: circle.id, label: circle.displayName || 'حلقة' })),
                            ]}
                            searchPlaceholder="ابحث عن الحلقة..."
                          />
                        </div>
                      )}
                   </div>
                   <Input 
                      placeholder="ابحث عن طالب..." 
                      icon={Search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 bg-slate-50/50 border-slate-100 dark:border-slate-800"
                   />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 ml-[-4px]">
                   {isLoading ? (
                     Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
                   ) : filteredStudents.map(s => (
                     <button 
                       key={s.id} 
                       onClick={() => handleOpenModal(s)}
                       className="w-full p-5 rounded-2xl text-right flex items-center justify-between bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-2 border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                     >
                        <div className="flex items-center gap-4 min-w-0">
                           <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                              {s.displayName[0]}
                           </div>
                           <div className="min-w-0">
                              <p className="text-base font-bold truncate tracking-tight">{s.displayName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {recordsMap[s.id]?.length > 0 && (
                                  <Badge variant="info" className="px-1.5 py-0 rounded text-[8px] font-black">{recordsMap[s.id].length} اختبار</Badge>
                                )}
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{s.number}</span>
                              </div>
                           </div>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-slate-300" />
                     </button>
                   ))}
                </div>
              </Card>
           </div>

           {/* Main Grid */}
           <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-[2rem]" />)
              ) : filteredStudents.map(s => {
                const records = recordsMap[s.id] || [];
                return (
                  <Card key={s.id} className="p-8 border-slate-200/60 dark:border-slate-800 hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 dark:border-indigo-800/30">
                             {s.displayName[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{s.displayName}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.educationalStage}</p>
                          </div>
                       </div>
                       <Button variant="ghost" size="sm" onClick={() => handleOpenModal(s)} className="h-10 w-10 p-0 rounded-xl bg-slate-50 dark:bg-slate-800 text-indigo-600">
                          <Plus size={20} />
                       </Button>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar-hide">
                       {records.length === 0 ? (
                         <div className="w-full py-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            لا يوجد سجلات لليوم
                         </div>
                       ) : records.map(r => (
                         <button key={r.id} onClick={() => handleOpenModal(s, r)} className="flex flex-col items-center gap-1 p-3 min-w-[85px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:border-indigo-500 transition-all relative">
                            <span className="text-[8px] font-black text-slate-400 uppercase truncate w-full text-center">{r.test_name}</span>
                            <span className="text-sm font-black text-indigo-600 family-mono">{r.score}%</span>
                            {r.score >= 90 && (
                               <Badge className="px-1 py-0 bg-amber-500 text-white border-none text-[7px] font-black rounded-sm absolute -top-1 -right-1 shadow-sm">
                                  CERTIFIED
                               </Badge>
                             )}
                         </button>
                       ))}
                    </div>
                  </Card>
                );
              })}
           </div>
        </div>

        {/* Modal Overlay */}
        <AnimatePresence>
          {activeStudent && editingRecord && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setActiveStudent(null)} />
               
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 50 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 50 }}
                 className={`relative bg-white dark:bg-[#0f172a] rounded-2xl shadow-lg w-full overflow-hidden border border-slate-200/70 dark:border-slate-800 ${isLiveSession ? 'max-w-4xl h-[90vh]' : 'max-w-xl'}`}
               >
                 {/* Modal Header */}
                 <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                          {isLiveSession ? <Zap size={24} /> : <Trophy size={24} />}
                       </div>
                       <div>
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{isLiveSession ? 'جلسة تقييم مباشرة' : 'تعديل السجل'}</h2>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeStudent.displayName}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       {isLiveSession && (
                         <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black family-mono flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                            <Clock size={14} />
                            {formatTime(elapsedSeconds)}
                         </div>
                       )}
                       <Button variant="ghost" onClick={() => setActiveStudent(null)} className="h-10 w-10 p-0 rounded-xl text-slate-400">
                          <X size={20} />
                       </Button>
                    </div>
                 </div>

                 <div className="p-8 h-full overflow-y-auto custom-scrollbar pb-32">
                    {isLiveSession ? (
                      <div className="space-y-10">
                         {/* Live Score Display */}
                         <div className="flex items-center justify-between p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20">
                            <div className="space-y-1">
                               <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">درجة الإتقان الحالية</label>
                               <div className="text-6xl font-black family-mono leading-none">{calculateLiveScore()}%</div>
                            </div>
                            <div className="text-right space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">عنوان الفرع</label>
                               <input 
                                 className="bg-transparent border-none outline-none text-2xl font-bold p-0 text-white placeholder:text-white/30 text-right w-full"
                                 placeholder="أدخل اسم الاختبار..."
                                 value={editingRecord.test_name}
                                 onChange={(e) => setEditingRecord({...editingRecord, test_name: e.target.value})}
                                 autoFocus
                               />
                            </div>
                         </div>

                         {/* Questions Grid */}
                         <div className="space-y-8">
                            {questions.map((q, qIdx) => (
                               <div key={qIdx} className="p-8 bg-slate-50/50 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100/50 dark:border-slate-800 relative">
                                  <div className="absolute -right-3 -top-3 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black shadow-lg">Q{qIdx+1}</div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                     {mistakeTypes.map(m => {
                                        const count = q[m.id] || 0;
                                        return (
                                          <div key={m.id} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${count > 0 ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 hover:border-indigo-100'}`}>
                                             <div className="flex items-center justify-between w-full px-1">
                                                <button onClick={() => updateMistake(qIdx, m.id, -1)} className={`w-6 h-6 rounded flex items-center justify-center font-black ${count > 0 ? 'bg-white/20 hover:bg-white/30' : 'text-slate-300'}`}>-</button>
                                                <span className="text-lg font-black family-mono">{count}</span>
                                                <button onClick={() => updateMistake(qIdx, m.id, 1)} className={`w-6 h-6 rounded flex items-center justify-center font-black ${count > 0 ? 'bg-white/20 hover:bg-white/30' : 'bg-indigo-50 text-indigo-500'}`}>+</button>
                                             </div>
                                             <span className={`text-[9px] font-bold text-center leading-tight uppercase tracking-tighter ${count > 0 ? 'text-white/80' : 'text-slate-400'}`}>{m.name}</span>
                                          </div>
                                        );
                                     })}
                                  </div>
                               </div>
                            ))}
                            <Button variant="outline" onClick={addQuestion} className="w-full h-16 rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all">
                               <Plus className="mr-2" size={20} />
                               إضافة موقع سؤال جديد
                            </Button>
                         </div>

                         <div className="space-y-4">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">ملاحظات تربوية ختامية</label>
                            <textarea 
                               rows={3}
                               className="w-full p-6 bg-slate-50/50 dark:bg-slate-900/40 border-2 border-slate-100/5 dark:border-slate-800 rounded-[2rem] text-base font-medium outline-none focus:border-indigo-500/30 transition-all resize-none" 
                               value={editingRecord.notes || ''} 
                               onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})} 
                               placeholder="اكتب توجيهاتك..."
                            />
                         </div>
                      </div>
                    ) : (
                      <div className="space-y-10">
                        <div className="space-y-4">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">اسم الاختبار</label>
                          <Input className="h-14 bg-slate-50/50 text-base" value={editingRecord.test_name || ''} onChange={(e) => setEditingRecord({...editingRecord, test_name: e.target.value})} icon={GraduationCap} />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">الدرجة (%)</label>
                            <Input type="number" className="h-14 bg-slate-50/50 text-base" value={editingRecord.score || ''} onChange={(e) => setEditingRecord({...editingRecord, score: Number(e.target.value)})} icon={Hash} />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">عدد الأخطاء</label>
                            <Input type="number" className="h-14 bg-slate-50/50 text-base" value={editingRecord.mistakes_count ?? 0} onChange={(e) => setEditingRecord({...editingRecord, mistakes_count: Number(e.target.value)})} icon={Zap} />
                          </div>
                        </div>
                        <div className="space-y-4">
                           <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">ملاحظات</label>
                           <textarea rows={4} className="w-full p-6 bg-slate-50/50 border-2 border-slate-100 rounded-[2rem] text-base font-medium outline-none" value={editingRecord.notes || ''} onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})} />
                        </div>
                      </div>
                    )}
                 </div>

                 {/* Modal Footer */}
                 <div className="absolute bottom-0 left-0 right-0 p-8 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-between items-center z-20">
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100">
                       <Calendar className="w-4 h-4 text-slate-400" />
                       <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{selectedDate}</span>
                    </div>
                    <div className="flex gap-4">
                       <Button variant="ghost" onClick={() => setActiveStudent(null)} className="h-14 px-8 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-[11px]">إغلاق</Button>
                       <Button 
                          onClick={saveRecord} 
                          disabled={isSaving} 
                          isLoading={isSaving}
                          className="h-14 px-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold group shadow-xl shadow-indigo-500/20"
                       >
                          {editingRecord.id ? 'حفظ التغييرات' : (isLiveSession ? 'إنهاء وحفظ الجلسة' : 'اعتماد السجل')}
                          {!isSaving && <CheckCircle2 size={20} className="ml-2 group-hover:scale-110 transition-transform" />}
                       </Button>
                    </div>
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
        <Modal
          isOpen={Boolean(feedbackMessage)}
          onClose={() => setFeedbackMessage(null)}
          title="تنبيه النظام"
        >
          <div className="space-y-6 text-right">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {feedbackMessage || ''}
            </p>
            <div className="flex justify-end">
              <Button className="h-10 px-6" onClick={() => setFeedbackMessage(null)}>
                {UI_TEXT.actions.close}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
