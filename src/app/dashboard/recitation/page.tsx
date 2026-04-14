'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, setDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import HalaqaFilter from '@/components/HalaqaFilter';
import { 
  BookOpen, 
  Search, 
  ChevronLeft, 
  CheckCircle2,
  List,
  Star,
  Hash,
  BookMarked,
  Sparkles,
  Zap,
  GraduationCap,
  Calendar,
  ChevronRight,
  Database,
  ShieldCheck,
  X,
  Target,
  ArrowRight,
  User,
  History,
  Activity,
  Plus
} from 'lucide-react';
import { getStudentSubCollection, injectMetadata, getRatingLabel } from '@/lib/firebaseUtils';
import { quranSurahs } from '@/lib/quranData';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { UI_TEXT } from '@/lib/ui-text';
import { format } from 'date-fns';

interface Student {
  id: string;
  displayName: string;
  number?: string | number;
  halaqaId?: string;
}

export default function RecitationPage() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalaqaId, setSelectedHalaqaId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    type: 'memorization',
    fromSurah: 'الفاتحة',
    toSurah: 'الفاتحة',
    fromVerse: '1',
    toVerse: '7',
    rating: 1, 
    mistakes_count: '0',
    notes: '',
    isNonHafiz: false,
    isNotReviewed: false
  });

  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [surahOrder, setSurahOrder] = useState<'asc' | 'desc'>('asc');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchStudents();
  }, [router]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const sSnap = await getDocs(query(collection(db, 'users'), where('type', '==', 'student')));
      setStudents(sSnap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Student)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentHistory = async (studentId: string) => {
    setHistoryLoading(true);
    try {
      const colRef = getStudentSubCollection('dailyrecitations', studentId);
      const q = query(colRef, orderBy('created_at', 'desc'), limit(10));
      const snap = await getDocs(q);
      setStudentHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error fetching history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentHistory(selectedStudent.id);
    }
  }, [selectedStudent]);

  const handleFromSurahChange = (surahName: string) => {
    const surah = quranSurahs.find(s => s.name === surahName);
    setFormData(prev => ({
      ...prev,
      fromSurah: surahName,
      toSurah: surahName,
      toVerse: surah?.ayahCount.toString() || '1'
    }));
  };

  const sortedSurahs = useMemo(() => {
    const base = [...quranSurahs];
    return surahOrder === 'asc' ? base : base.reverse();
  }, [surahOrder]);

  const surahOptions = useMemo(
    () => sortedSurahs.map((surah) => ({ value: surah.name, label: surah.name })),
    [sortedSurahs]
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSaving(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const colRef = getStudentSubCollection('dailyrecitations', selectedStudent.id);
      const docRef = doc(colRef);
      
      let amountText = "";
      if (formData.isNonHafiz) amountText = "غير حافظ";
      else if (formData.isNotReviewed) amountText = "لم يراجع";
      else {
        amountText = formData.fromSurah === formData.toSurah 
          ? `${formData.fromSurah} (${formData.fromVerse}-${formData.toVerse})`
          : `${formData.fromSurah} (${formData.fromVerse}) - ${formData.toSurah} (${formData.toVerse})`;
      }

      const data = injectMetadata({
        type: formData.type,
        amount: amountText,
        surah: formData.isNonHafiz || formData.isNotReviewed ? "" : formData.fromSurah,
        to_surah: formData.isNonHafiz || formData.isNotReviewed ? "" : formData.toSurah,
        verses: formData.fromVerse,
        to_verses: formData.toVerse,
        rating: formData.rating,
        grade_enum: formData.rating,
        grade_text: getRatingLabel(formData.rating),
        mistakes_count: parseInt(formData.mistakes_count) || 0,
        notes: formData.notes,
        date: today,
        user_id: selectedStudent.id,
        student_name: selectedStudent.displayName,
        halaqa_id: selectedStudent.halaqaId || '',
        status_type: formData.isNonHafiz ? 'not_memorized' : (formData.isNotReviewed ? 'not_reviewed' : 'normal')
      });
      
      await setDoc(docRef, data);

      // AUTOMATIC ATTENDANCE LINKAGE
      const attColRef = getStudentSubCollection('tracking', selectedStudent.id);
      const attDocRef = doc(attColRef, `${today}_attendance`);
      await setDoc(attDocRef, injectMetadata({
        type: 'attendance',
        status: 'present',
        date: today,
        user_id: selectedStudent.id,
        student_name: selectedStudent.displayName,
        notes: 'حضور تلقائي عبر سجل التسميع',
        method: 'auto_from_recitation'
      }));

      setFeedbackMessage(UI_TEXT.messages.recitationSaved);
      
      fetchStudentHistory(selectedStudent.id);
      setSelectedStudent(null);
      setFormData({ 
        type: 'memorization', fromSurah: 'الفاتحة', toSurah: 'الفاتحة', fromVerse: '1', toVerse: '7', 
        rating: 1, mistakes_count: '0', notes: '', isNonHafiz: false, isNotReviewed: false
      });
    } catch (e) {
      console.error(e);
      setFeedbackMessage(UI_TEXT.messages.recitationSaveError);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHalaqa = !selectedHalaqaId || s.halaqaId === selectedHalaqaId;
      return matchesSearch && matchesHalaqa;
    });
  }, [students, searchQuery, selectedHalaqaId]);

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16" dir="rtl">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-8 md:p-10 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12 lg:gap-20">
            <div className="space-y-4">
              <Badge variant="info" className="px-3 py-1 rounded-lg border-blue-100/50 text-[10px] font-black uppercase tracking-widest leading-none">
                <Sparkles className="w-3.5 h-3.5" />
                وحدة المتابعة التعليمية الموحدة
              </Badge>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white family-cairo tracking-tight">
                سجل التسميع والمتابعة اليومية
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                توثيق الحفظ الجديد والمراجعات اليومية للطلاب مع نظام تقييم متطور يدعم تقارير الأداء السحابية الموحدة.
              </p>
            </div>
            
            <div className="flex items-center gap-4 px-6 py-3 bg-white/50 backdrop-blur-md dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
               <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">المزامنة نشطة</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
           
           {/* Sidebar: Student Selection */}
           <div className="xl:col-span-4 xl:sticky xl:top-28 space-y-6">
              <Card className="p-6 space-y-6 border-slate-200/70 dark:border-slate-800 h-[780px] flex flex-col overflow-hidden rounded-2xl shadow-sm">
                <div className="space-y-5">
                   <div className="flex items-center justify-between px-1">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                         <List className="w-4 h-4" />
                         قائمة طلاب الحلقة
                      </h3>
                   </div>
                   
                   <HalaqaFilter 
                    selectedId={selectedHalaqaId}
                    onSelect={setSelectedHalaqaId}
                   />

                   <Input 
                      placeholder="ابحث عن طالب..." 
                      icon={Search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800"
                   />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1 ml-[-8px]">
                   {isLoading ? (
                     Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-[2rem]" />)
                   ) : filteredStudents.length === 0 ? (
                      <div className="text-center py-24 opacity-30">
                         <Database size={48} className="mx-auto mb-4 text-slate-200" />
                         <p className="text-xs font-black uppercase tracking-widest">لا توجد نتائج</p>
                      </div>
                   ) : filteredStudents.map(s => (
                     <button 
                       key={s.id} 
                       onClick={() => setSelectedStudent(s)}
                       className={`w-full p-5 rounded-[2rem] text-right flex items-center justify-between transition-all duration-500 group relative overflow-hidden ${selectedStudent?.id === s.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1' : 'bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-transparent hover:border-slate-100 dark:hover:border-slate-700'}`}
                     >
                        <div className="flex items-center gap-4 min-w-0 relative z-10">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 transition-all duration-500 ${selectedStudent?.id === s.id ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110'}`}>
                              {s.displayName[0]}
                           </div>
                           <div className="min-w-0">
                              <p className="text-base font-bold truncate tracking-tight family-cairo">{s.displayName}</p>
                              <span className={`text-[10px] font-black block mt-1 uppercase tracking-widest ${selectedStudent?.id === s.id ? 'text-blue-100' : 'text-slate-400'}`}>المعرف: #{s.number}</span>
                           </div>
                        </div>
                        <ChevronLeft className={`w-5 h-5 transition-transform duration-500 relative z-10 ${selectedStudent?.id === s.id ? 'translate-x-1' : 'text-slate-300 group-hover:translate-x-1'}`} />
                     </button>
                   ))}
                </div>
              </Card>
           </div>

           {/* Main Panel: Recording Form */}
           <div className="xl:col-span-8">
              <AnimatePresence mode="wait">
                {selectedStudent ? (
                  <motion.form 
                    key={selectedStudent.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    onSubmit={handleSave} 
                    className="flex flex-col gap-8"
                  >
                    <Card className="p-8 md:p-10 border-slate-200/70 dark:border-slate-800 min-h-[780px] relative overflow-hidden flex flex-col rounded-2xl shadow-sm">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                       
                       {/* Form Header */}
                       <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-10 mb-10 relative z-10">
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 shadow-inner group transition-transform hover:scale-110">
                                <BookMarked className="w-8 h-8 transition-transform group-hover:rotate-12" />
                             </div>
                             <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight family-cairo">رصد الحفظ والمراجعة</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">المستهدف: {selectedStudent.displayName}</p>
                             </div>
                          </div>
                          <Button variant="ghost" size="icon" type="button" onClick={() => setSelectedStudent(null)} className="h-12 w-12 rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                             <X size={24} />
                          </Button>
                       </div>

                       <div className="flex-1 space-y-12 relative z-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-4">
                                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">نوع النشاط التعليمي</label>
                                  <SearchableSelect
                                    value={formData.type}
                                    onChange={(value) => setFormData({ ...formData, type: value })}
                                    options={[
                                      { value: 'memorization', label: 'حفظ جديد' },
                                      { value: 'revision', label: 'مراجعة صغرى' },
                                      { value: 'tathbeet', label: 'مراجعة كبرى' },
                                      { value: 'tashih_tilawah', label: 'تلاوة وتصحيح' },
                                    ]}
                                    placeholder="اختر نوع النشاط"
                                    searchPlaceholder="ابحث عن النوع..."
                                    className="h-14"
                                  />
                              </div>

                              <div className="space-y-4">
                                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">رصد الأخطاء (عداد تكتيكي سريع)</label>
                                 <div className="flex items-center gap-3">
                                    <div className="flex-1 flex items-center bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border-2 border-slate-100 dark:border-slate-800 p-1">
                                       <button 
                                         type="button"
                                         onClick={() => {
                                            const val = Math.max(0, parseInt(formData.mistakes_count) - 1);
                                            setFormData({...formData, mistakes_count: val.toString()});
                                         }}
                                         className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-400 transition-all active:scale-90"
                                       >
                                          <X size={18} />
                                       </button>
                                       <input 
                                          type="number" 
                                          className="flex-1 bg-transparent border-none text-center font-black text-lg family-mono outline-none" 
                                          value={formData.mistakes_count} 
                                          onChange={(e) => setFormData({...formData, mistakes_count: e.target.value})} 
                                       />
                                       <button 
                                         type="button"
                                         onClick={() => {
                                            const val = parseInt(formData.mistakes_count) + 1;
                                            setFormData({...formData, mistakes_count: val.toString()});
                                            // Auto-adjust rating logic (Parity with app logic)
                                            if (val > 5) setFormData(prev => ({...prev, mistakes_count: val.toString(), rating: 4}));
                                            else if (val > 2) setFormData(prev => ({...prev, mistakes_count: val.toString(), rating: 3}));
                                         }}
                                         className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-90 transition-all"
                                       >
                                          <Plus size={22} />
                                       </button>
                                    </div>
                                    <div className="flex gap-2">
                                       <label className="flex items-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-slate-900/40 px-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 transition-all hover:border-blue-500/20">
                                          <input 
                                             type="checkbox" 
                                             checked={formData.isNonHafiz}
                                             onChange={(e) => setFormData({...formData, isNonHafiz: e.target.checked})}
                                             className="w-4 h-4 rounded border-slate-300 text-blue-600"
                                          />
                                          <span className="text-[10px] font-black text-slate-500 uppercase">غير حافظ</span>
                                       </label>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-5">
                              <div className="flex items-center justify-between px-2">
                                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">مستوى الإتقان والتفاعل</label>
                                 <Badge variant="info" className="bg-blue-50 text-blue-600 border-none font-black text-[9px] px-3 py-1"></Badge>
                              </div>
                              <div className="grid grid-cols-5 gap-4">
                                  {[1, 2, 3, 4, 5].map(v => (
                                   <button 
                                     key={v} 
                                     type="button" 
                                     onClick={() => setFormData({...formData, rating: v})} 
                                     className={`py-5 rounded-[2rem] border-2 transition-all duration-500 flex flex-col items-center gap-2 group ${formData.rating === v ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20 scale-105 z-10' : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-blue-500/30'}`}
                                   >
                                      <Star size={18} className={`${formData.rating === v ? 'fill-white' : 'group-hover:text-blue-500'}`} />
                                      <span className="text-[10px] font-black uppercase tracking-tighter">{getRatingLabel(v)}</span>
                                   </button>
                                  ))}
                              </div>
                           </div>

                           {!formData.isNonHafiz && !formData.isNotReviewed && (
                              <div className="p-8 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-8 group/scope relative">
                                 
                                 {(formData.toSurah === 'البقرة' && formData.toVerse === '286') || (formData.toSurah === 'الناس' && formData.toVerse === '6') ? (
                                   <motion.div 
                                     initial={{ opacity: 0, x: 20 }}
                                     animate={{ opacity: 1, x: 0 }}
                                     className="absolute -top-4 left-10 py-2 px-6 bg-amber-500 text-white rounded-full shadow-2xl flex items-center gap-3 z-20"
                                   >
                                      <Sparkles size={16} className="animate-pulse" />
                                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">اكتمال جزء جديد</span>
                                   </motion.div>
                                 ) : null}

                                 <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-slate-100 dark:border-slate-700 transition-transform group-hover/scope:scale-110">
                                          <Target size={22} />
                                       </div>
                                       <div>
                                          <h4 className="text-lg font-bold text-slate-900 dark:text-white family-cairo tracking-tight">نطاق المدى التعليمي</h4>
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">تحديد بداية ونهاية المقدار المسموع</p>
                                       </div>
                                    </div>

                                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-2">
                                       <button 
                                         type="button" 
                                         onClick={() => setSurahOrder('asc')}
                                         className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${surahOrder === 'asc' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                       >الفاتحة أولاً</button>
                                       <button 
                                         type="button" 
                                         onClick={() => setSurahOrder('desc')}
                                         className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${surahOrder === 'desc' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                       >الناس أولاً</button>
                                    </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                                    <div className="lg:col-span-5">
                                       <SurahField 
                                         label="بداية المقطع" 
                                         surahValue={formData.fromSurah}
                                         verseValue={formData.fromVerse}
                                        surahOptions={surahOptions}
                                         onSurahChange={handleFromSurahChange}
                                         onVerseChange={(v: string) => setFormData({...formData, fromVerse: v})}
                                       />
                                    </div>
                                    <div className="lg:col-span-2 flex justify-center opacity-30">
                                       <ArrowRight size={28} />
                                    </div>
                                    <div className="lg:col-span-12 xl:col-span-5">
                                       <SurahField 
                                         label="نهاية المقطع" 
                                         surahValue={formData.toSurah}
                                         verseValue={formData.toVerse}
                                        surahOptions={surahOptions}
                                         onSurahChange={(s: string) => setFormData({...formData, toSurah: s})}
                                         onVerseChange={(v: string) => setFormData({...formData, toVerse: v})}
                                       />
                                    </div>
                                 </div>
                              </div>
                           )}

                           <div className="space-y-4">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">ملاحظات تربوية لولي الأمر</label>
                              <textarea 
                                 rows={4} 
                                 className="w-full p-8 bg-slate-50/50 dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-base font-bold outline-none focus:border-blue-600/40 focus:bg-white dark:focus:bg-slate-900 transition-all duration-500 resize-none placeholder:text-slate-300" 
                                 value={formData.notes} 
                                 onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                                 placeholder="اكتب ملاحظاتك وسيتم مزامنتها فوراً مع تطبيق الوالدين..." 
                              />
                           </div>
                       </div>

                       <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-slate-100 dark:border-slate-800 mt-10 relative z-10">
                          <div className="flex items-center gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                             <History className="w-4 h-4 text-blue-500" />
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">آخر إنجاز</span>
                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">{studentHistory[0]?.amount || 'لا توجد بيانات'}</span>
                             </div>
                          </div>
                          <Button 
                             type="submit" 
                             disabled={isSaving} 
                             isLoading={isSaving}
                             className="h-14 px-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 font-black text-base group gap-3"
                          >
                             اعتماد التقرير السحابي
                             <CheckCircle2 size={22} className="group-hover:scale-110 transition-transform duration-500" />
                          </Button>
                       </div>
                    </Card>
                  </motion.form>
                ) : (
                  <Card className="grow flex flex-col items-center justify-center p-16 min-h-[780px] text-center space-y-8 border-slate-200/70 dark:border-slate-800 relative overflow-hidden rounded-2xl shadow-sm">
                     <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                     <div className="w-28 h-28 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] flex items-center justify-center text-blue-500 border border-blue-100 dark:border-blue-800 shadow-inner group transition-all duration-700 hover:scale-110">
                        <BookOpen className="w-14 h-14 transition-transform group-hover:rotate-12 duration-700" />
                     </div>
                     <div className="space-y-5 relative z-10">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight family-cairo">المتابعة التعليمية الذكية</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-sm mx-auto leading-relaxed">قم باختيار الطالب من القائمة الجانبية للبدء في توثيق الحفظ والمراجعة ومزامنة البيانات للوالدين.</p>
                     </div>
                     <div className="flex flex-wrap justify-center gap-4 relative z-10">
                        <Badge variant="slate" className="px-5 py-2.5 rounded-2xl border-slate-100 dark:border-slate-800 gap-3 font-bold">
                            <Zap size={16} className="text-amber-500" />
                            مزامنة وتنبيه فوري
                        </Badge>
                        <Badge variant="slate" className="px-5 py-2.5 rounded-2xl border-slate-100 dark:border-slate-800 gap-3 font-bold">
                            <History size={16} className="text-blue-500" />
                            تتبع تاريخي تلقائي
                        </Badge>
                     </div>
                  </Card>
                )}
              </AnimatePresence>
           </div>

        </div>

      </div>
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
    </DashboardLayout>
  );
}

function SurahField({ label, surahValue, verseValue, surahOptions, onSurahChange, onVerseChange }: any) {
  return (
    <div className="space-y-4">
       <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">{label}</span>
       <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
             <SearchableSelect
               value={surahValue}
               onChange={onSurahChange}
               options={surahOptions}
               placeholder="اختر السورة"
               searchPlaceholder="ابحث عن السورة..."
             />
          </div>
          <div className="col-span-4">
             <input 
               type="number" 
               className="w-full h-24 px-5 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 text-2xl font-black shadow-sm focus:border-blue-500 transition-all outline-none text-center family-mono" 
               value={verseValue}
               onChange={(e) => onVerseChange(e.target.value)}
               min="1"
             />
          </div>
       </div>
    </div>
  );
}
