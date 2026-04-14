'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import HalaqaFilter from '@/components/HalaqaFilter';
import { 
  ShieldCheck, 
  Calendar, 
  User, 
  Plus, 
  X, 
  Save, 
  Activity, 
  Eye,
  Search,
  CheckCircle2,
  Sparkles,
  Zap,
  ChevronLeft,
  Database,
  MapPin,
  CheckSquare,
  ClipboardCheck,
  Building2,
  Users,
  Target,
  Clock,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { injectMetadata } from '@/lib/firebaseUtils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { UI_TEXT } from '@/lib/ui-text';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface Evaluation {
  id: string;
  halaqa_id: string;
  halaqa_name: string;
  teacher_name: string;
  visitor_name: string;
  visit_date: string;
  total_score: number;
  notes: string;
  visit_type: 'supervisory' | 'regulatory';
  status?: string;
  remarks?: string;
}

export default function VisitsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [halaqas, setHalaqas] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalaqaId, setSelectedHalaqaId] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<'all' | 'regulatory' | 'supervisory'>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    halaqa_id: '',
    halaqa_name: '',
    teacher_name: '',
    visit_type: 'regulatory',
    visit_date: new Date().toISOString().split('T')[0],
    scores: {},
    total_score: 100,
    remarks: ''
  });

  const visitRubrics = {
    regulatory: [
      { category: 'البيئة والوسائل', items: ['نظافة المقرأة وترتيبها', 'وجود لوحة توضح اسم المقرأة', 'تهيئة البيئة التعليمية'] },
      { category: 'الانضباط الزمني', items: ['حضور المعلم في الوقت المحدد', 'انصراف المعلم في الوقت المحدد', 'التزام الطلاب بالوقت'] },
      { category: 'التوثيق الإداري', items: ['وجود سجل متابعة يومي', 'التدوين في السجل بانتظام', 'التقيد بالمنهاج المعتمد'] },
    ],
    supervisory: [
      { category: 'أداء المعلم', items: ['القدرة على حل مشكلات الطلاب', 'المظهر العام والقدوة الصالحة', 'علاقة المعلم بالطلاب'] },
      { category: 'الأداء الفني', items: ['مستوى الحفظ والمراجعة', 'تفاعل الطلاب ومشاركتهم', 'استخدام الوسائل المساعدة'] },
      { category: 'الإدارة الصفية', items: ['الانتظام والانضباط بالحساب', 'التقيد بالخطة الدراسية', 'جودة التسميع والمتابعة'] },
    ]
  };

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(storedUser);
    setUser(userData);
    fetchData();
    fetchHalaqas();
    fetchTeachers();
  }, [router]);

  useEffect(() => {
    const categories = formData.visit_type === 'regulatory' ? visitRubrics.regulatory : visitRubrics.supervisory;
    const initialScores: any = {};
    categories.forEach((cat, cIdx) => {
       cat.items.forEach((_, iIdx) => {
          initialScores[`${cIdx}_${iIdx}`] = 10;
       });
    });
    setFormData((prev: any) => ({ ...prev, scores: initialScores, total_score: 100 }));
  }, [formData.visit_type]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'halaqa_evaluations'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      setEvaluations(snap.docs.map(ds => ({ id: ds.id, ...ds.data(), visit_date: ds.data().date } as Evaluation)));
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchHalaqas = async () => {
    const q = query(collection(db, 'users'), where('type', '==', 'halaqa'));
    const snap = await getDocs(q);
    setHalaqas(snap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
  };

  const fetchTeachers = async () => {
    const q = query(collection(db, 'users'), where('type', '==', 'teacher'));
    const snap = await getDocs(q);
    setTeachers(snap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
  };

  const resolveTeacherForHalaqa = (halaqaId: string) => {
    const teacher = teachers.find(t => t.halaqaId === halaqaId);
    return teacher ? teacher.displayName : "لم يتم تحديد معلم";
  };

  const handleScoreChange = (id: string, val: number) => {
    const newScores = { ...formData.scores, [id]: val };
    const values: any[] = Object.values(newScores);
    const total = values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / (values.length * 10)) * 100) : 100;
    setFormData({ ...formData, scores: newScores, total_score: total });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const docRef = doc(collection(db, 'halaqa_evaluations'));
      const evaluationData = injectMetadata({
        ...formData,
        id: docRef.id,
        date: formData.visit_date,
        visitor_name: user?.displayName || 'مشرف النظام',
        visitor_id: user?.uid || '',
      });
      await setDoc(docRef, evaluationData);
      setIsModalOpen(false);
      resetForm();
      fetchData();
      setFeedbackMessage(UI_TEXT.messages.visitsSaved);
    } catch (e) {
      console.error(e);
      setFeedbackMessage(UI_TEXT.messages.visitsSaveError);
    } finally { setIsSaving(false); }
  };

  const resetForm = () => {
    setFormData({
      halaqa_id: '',
      halaqa_name: '',
      teacher_name: '',
      visit_type: 'regulatory',
      visit_date: new Date().toISOString().split('T')[0],
      scores: {},
      total_score: 100,
      remarks: ''
    });
  };

  const filteredVisits = useMemo(() => {
    return evaluations.filter(ev => {
      const matchesSearch = ev.halaqa_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            ev.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHalaqa = !selectedHalaqaId || ev.halaqa_id === selectedHalaqaId;
      const matchesRoute = activeRoute === 'all' || ev.visit_type === activeRoute;
      return matchesSearch && matchesHalaqa && matchesRoute;
    });
  }, [evaluations, searchQuery, selectedHalaqaId, activeRoute]);

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16" dir="rtl">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-8 md:p-10 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12 text-right">
            <div className="space-y-4">
              <Badge variant="info" className="px-3 py-1 rounded-lg border-blue-100/50 text-[10px] font-black uppercase tracking-widest text-blue-600">
                <ShieldCheck className="w-4 h-4" />
                وحدة الرقابة الإستراتيجية والمتابعة الميدانية
              </Badge>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white family-cairo tracking-tight">سجل الزيارات والتقارير الميدانية</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                 توثيق لحظي لجودة الأداء التعليمي والإداري، مع نظام معالجة ذكي لنتائج الزيارات الميدانية ومزامنته فوراً مع التطبيق.
              </p>
            </div>
            
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 h-14 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-black gap-3 group"
            >
              إرسال لجنة تقييم جديدة
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
            </Button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col xl:flex-row items-center gap-4">
           <div className="w-full xl:w-96">
              <HalaqaFilter 
                selectedId={selectedHalaqaId}
                onSelect={setSelectedHalaqaId}
              />
           </div>
           <div className="flex-1 relative group w-full">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              <input 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="البحث في الأرشيف (باسم المعلم أو المشرف)..." 
                 className="w-full h-14 pr-14 pl-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 font-bold text-sm outline-none focus:border-blue-500/20 shadow-sm transition-all"
              />
           </div>
           <Card className="h-14 px-8 flex items-center justify-between min-w-[200px] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي السجلات</span>
              <span className="text-xl font-black text-slate-900 dark:text-white family-mono">{filteredVisits.length}</span>
           </Card>
        </div>

        {/* Path Switcher */}
        <div className="flex gap-4">
            <button 
               onClick={() => setActiveRoute('all')}
               className={`px-8 h-12 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeRoute === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'}`}
            >
               الكل
            </button>
            <button 
               onClick={() => setActiveRoute('regulatory')}
               className={`px-8 h-12 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeRoute === 'regulatory' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'}`}
            >
               <CheckSquare size={14} />
               الزيارات الإدارية
            </button>
            <button 
               onClick={() => setActiveRoute('supervisory')}
               className={`px-8 h-12 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeRoute === 'supervisory' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'}`}
            >
               <Activity size={14} />
               التوجيه الفني
            </button>
         </div>

        {/* Visits Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {isLoading ? (
             Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)
           ) : filteredVisits.length === 0 ? (
             <Card className="col-span-full py-32 text-center rounded-2xl border-slate-200/70 dark:border-slate-800 relative overflow-hidden">
                <Database size={64} className="mx-auto mb-6 text-slate-100" />
                <h3 className="text-xl font-black text-slate-400 family-cairo">لا توجد سجلات مطابقة في هذا النطاق</h3>
                <Button variant="ghost" className="mt-4 text-blue-600 font-bold" onClick={() => { setSelectedHalaqaId(null); setSearchQuery(''); }}>إعادة ضبط الفلاتر</Button>
             </Card>
           ) : (
             filteredVisits.map((ev, idx) => (
               <motion.div 
                 key={ev.id} 
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
               >
                 <Card className="p-8 border-slate-200/70 dark:border-slate-800 hover:shadow-md transition-all duration-300 group relative overflow-hidden rounded-2xl">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-all duration-700"></div>
                    
                    <div className="flex items-start justify-between relative z-10">
                       <div className="flex items-center gap-6">
                          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110 duration-700 ${ev.visit_type === 'regulatory' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20' : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20'}`}>
                             {ev.visit_type === 'regulatory' ? <CheckSquare size={36} /> : <Activity size={36} />}
                          </div>
                          <div className="space-y-2">
                             <h3 className="font-black text-2xl text-slate-900 dark:text-white family-cairo tracking-tight">{ev.halaqa_name}</h3>
                             <div className="flex flex-wrap items-center gap-3">
                                <Badge variant="slate" className="bg-slate-50 dark:bg-slate-800 border-none px-4 py-1.5 font-bold text-[10px] rounded-xl flex items-center gap-2">
                                   <Calendar size={14} className="text-slate-400" />
                                   {ev.visit_date}
                                </Badge>
                                <Badge variant={ev.visit_type === 'regulatory' ? 'warning' : 'info'} className="px-4 py-1.5 font-black uppercase text-[9px] rounded-xl">
                                   {ev.visit_type === 'regulatory' ? 'زيارة إدارية' : 'توجيه فني'}
                                </Badge>
                             </div>
                          </div>
                       </div>
                       
                       <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center min-w-[90px] shadow-sm">
                          <span className={`text-4xl font-black family-mono tracking-tighter ${ev.total_score >= 85 ? 'text-emerald-500' : ev.total_score >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>
                             {ev.total_score}%
                          </span>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">SCORE</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 my-10 py-8 border-y border-slate-50 dark:border-slate-800">
                       <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-300 block uppercase tracking-widest">المعلم القائم</span>
                          <p className="text-base font-bold text-slate-800 dark:text-slate-200 family-cairo">{ev.teacher_name}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-300 block uppercase tracking-widest">المشرف المقيم</span>
                          <p className="text-base font-bold text-slate-800 dark:text-slate-200 family-cairo">{ev.visitor_name}</p>
                       </div>
                    </div>

                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 group-hover:scale-110 transition-transform origin-right">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 shadow-sm">
                             <CheckCircle2 size={18} />
                          </div>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">سجل معتمد</span>
                       </div>
                       <Button variant="ghost" className="h-12 px-6 rounded-2xl gap-3 text-[11px] font-black text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all uppercase tracking-widest">
                          تحميل التقرير الفني
                          <ChevronLeft size={16} />
                       </Button>
                    </div>
                 </Card>
               </motion.div>
             ))
           )}
        </div>

        {/* Evaluation Modal  */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative bg-white dark:bg-[#0f172a] rounded-2xl shadow-lg w-full max-w-5xl max-h-[92vh] overflow-hidden border border-slate-200/70 dark:border-slate-800 flex flex-col"
              >
                <div className="px-12 py-10 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center relative z-10 shadow-sm">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                         <Award size={28} />
                      </div>
                      <div>
                         <h2 className="text-2xl font-black text-slate-900 dark:text-white family-cairo tracking-tight">إضافة تقرير زيارة ميدانية</h2>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">رصد أداء الحلقة والمستوى التعليمي</p>
                      </div>
                   </div>
                   <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="h-14 w-14 rounded-3xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                      <X size={28} />
                   </Button>
                </div>
                
                <div className="flex-1 p-12 overflow-y-auto custom-scrollbar" dir="rtl">
                   <form onSubmit={handleSave} className="space-y-12">
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                         <div className="space-y-2 col-span-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2 leading-none">فئة التقييم</label>
                            <SearchableSelect
                              value={formData.visit_type}
                              onChange={(value) => setFormData({ ...formData, visit_type: value })}
                              options={[
                                { value: 'regulatory', label: 'إداري / تنظيمي' },
                                { value: 'supervisory', label: 'فني / تعليمي' },
                              ]}
                              searchPlaceholder="ابحث عن الفئة..."
                              className="h-14"
                            />
                         </div>
                         <div className="space-y-2 col-span-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2 leading-none">الحلقة المستهدفة</label>
                            <SearchableSelect
                              value={formData.halaqa_id}
                              onChange={(value) => {
                                const halaqa = halaqas.find((item) => item.id === value);
                                setFormData({
                                  ...formData,
                                  halaqa_id: value,
                                  halaqa_name: halaqa?.displayName || '',
                                  teacher_name: resolveTeacherForHalaqa(value),
                                });
                              }}
                              options={halaqas.map((halaqa) => ({
                                value: halaqa.id,
                                label: halaqa.displayName || 'حلقة',
                              }))}
                              placeholder="-- حدد الحلقة للتعرف على المعلم تلقائيا --"
                              searchPlaceholder="ابحث عن الحلقة..."
                              className="h-14"
                            />
                         </div>
                         <div className="space-y-2 col-span-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2 leading-none">تاريخ الزيارة</label>
                            <Input 
                               type="date"
                               className="h-14 bg-white dark:bg-slate-900 border-2 border-slate-100 font-bold"
                               value={formData.visit_date}
                               onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
                            />
                         </div>
                      </div>

                      <div className="p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2.5rem] border-2 border-dashed border-blue-200 dark:border-blue-800/50 flex flex-col md:flex-row items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                               <User size={28} />
                            </div>
                            <div>
                               <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">المعلم المسؤول (المستهدف)</span>
                               <h4 className="text-xl font-black text-slate-900 dark:text-white family-cairo">{formData.teacher_name || 'يرجى تحديد الحلقة أولاً'}</h4>
                            </div>
                         </div>
                         <div className="bg-white dark:bg-slate-900 px-10 py-4 rounded-[2rem] border border-blue-100 dark:border-blue-800 flex flex-col items-center shadow-lg shadow-blue-500/5">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">النتيجة الإجمالية</span>
                             <div className="text-4xl font-black text-blue-600 family-mono">{formData.total_score}%</div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                         <div className="space-y-6">
                            <h5 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                               <CheckSquare className="text-blue-500" size={18} />
                               بنود التفتيش والتقييم
                             </h5>
                             <div className="space-y-8">
                               {(formData.visit_type === 'regulatory' ? visitRubrics.regulatory : visitRubrics.supervisory).map((cat, catIdx) => (
                                 <div key={catIdx} className="space-y-4">
                                    <h6 className="text-[10px] font-bold text-slate-400 border-r-2 border-blue-500 pr-2">{cat.category}</h6>
                                    {cat.items.map((item, itemIdx) => {
                                      const key = `${catIdx}_${itemIdx}`;
                                      return (
                                        <div key={itemIdx} className="space-y-2 pb-2 border-b border-slate-50 dark:border-slate-800">
                                           <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                              <span>{item}</span>
                                              <span className="text-blue-600 dark:text-blue-400">{formData.scores[key] ?? 10}/10</span>
                                           </div>
                                           <input 
                                              type="range"
                                              min="0"
                                              max="10"
                                              step="1"
                                              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none accent-blue-600 cursor-pointer shadow-inner"
                                              value={formData.scores[key] ?? 10}
                                              onChange={(e) => handleScoreChange(key, Number(e.target.value))}
                                           />
                                        </div>
                                      );
                                    })}
                                 </div>
                               ))}
                             </div>
                         </div>
                         
                         <div className="space-y-8">
                            <h5 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                               <ClipboardCheck className="text-blue-500" size={18} />
                               التقرير الختامي للمشرف
                            </h5>
                            <div className="space-y-6">
                               <textarea 
                                  className="w-full min-h-[300px] p-8 bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] text-base font-bold outline-none focus:border-blue-500/40 focus:bg-white transition-all shadow-inner placeholder:text-slate-300"
                                  placeholder="سجل نقاط القوة، فرص التحسين، والتوصيات المقترحة للمعلم وللإدارة..."
                                  value={formData.remarks}
                                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                               />
                               <div className="p-8 bg-slate-50/50 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 flex items-center gap-4">
                                  <Clock className="text-slate-400" size={20} />
                                  <div className="space-y-1">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">وقت التسجيل</p>
                                     <p className="text-sm font-black text-slate-700 dark:text-slate-200">{new Date().toLocaleTimeString('ar-SA')}</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="pt-10 flex gap-6 items-center justify-end border-t border-slate-100 dark:border-slate-800">
                         <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} className="h-16 px-10 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all">إلغاء التقييم</Button>
                         <Button 
                            type="submit" 
                            disabled={isSaving}
                            className="h-16 px-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 font-black text-lg gap-4 shadow-2xl shadow-blue-500/30 group"
                         >
                            {isSaving ? 'جاري المزامنة...' : 'اعتماد ونشر التقرير'}
                            {!isSaving && <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform duration-500" />}
                         </Button>
                      </div>
                   </form>
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
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{feedbackMessage || ''}</p>
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
