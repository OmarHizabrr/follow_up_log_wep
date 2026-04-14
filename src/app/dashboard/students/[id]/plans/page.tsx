'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  orderBy, 
  doc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Target, 
  Plus, 
  History, 
  CheckCircle2, 
  X, 
  LayoutGrid, 
  BookOpen, 
  Activity, 
  ArrowRight, 
  ChevronLeft,
  Calendar,
  Zap,
  Clock,
  Briefcase,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { format, differenceInDays, parseISO, isAfter, isBefore, addDays, subDays } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { UI_TEXT } from '@/lib/ui-text';

interface PlanTemplate {
  id: string;
  name: string;
  type: string;
  amount: string;
  value: number;
  unit: string;
}

interface StudentPlan {
  id: string;
  plan_id: string;
  plan_name: string;
  plan_type: string;
  amount: string;
  start_date: string;
  end_date?: string;
  value: number;
  unit: string;
  is_active: number;
  accomplished_value?: number;
  calculated_target?: number;
}

const TYPE_LABELS: any = {
  memorization: 'حفظ جديد',
  revision: 'مراجعة',
  tathbeet: 'تثبيت',
  tashih_tilawah: 'تصحيح تلاوة'
};

const UNIT_LABELS: any = {
  pages: 'صفحة',
  juz: 'جزء',
  faces: 'وجه',
  lines: 'سطر',
  verses: 'آية'
};

export default function StudentPlansPage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<PlanTemplate[]>([]);
  const [activePlans, setActivePlans] = useState<StudentPlan[]>([]);
  const [historyPlans, setHistoryPlans] = useState<StudentPlan[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [finishTarget, setFinishTarget] = useState<StudentPlan | null>(null);

  // Form State
  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(null);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get Student
      const sSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', id)));
      if (sSnap.empty) { router.push('/dashboard/students'); return; }
      const sData = { id: sSnap.docs[0].id, ...sSnap.docs[0].data() };
      setStudent(sData);

      // 2. Get Templates
      const tSnap = await getDocs(query(collection(db, 'plans'), where('is_active', '==', 1)));
      setTemplates(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as PlanTemplate)));

      // 3. Get Student Plans
      const pSnap = await getDocs(query(collection(db, 'users', id as string, 'studentplans'), orderBy('created_at', 'desc')));
      const allPlans = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentPlan));

      // 4. Get Recitations for Progress Calculation
      const rSnap = await getDocs(collection(db, 'dailyrecitations', id as string, 'dailyrecitations'));
      const recitations = rSnap.docs.map(d => d.data());

      // Calculate Progress for each plan
      const processedPlans = allPlans.map(plan => {
        const type = plan.plan_type || 'memorization';
        const start = parseISO(plan.start_date);
        const end = plan.is_active === 1 ? new Date() : (plan.end_date ? parseISO(plan.end_date) : new Date());
        
        // Sum total page_count in range
        let accomplished = 0;
        recitations.forEach((r: any) => {
          if (r.type !== type) return;
          const rDate = parseISO(r.date);
          if (rDate >= start && rDate <= end) {
            accomplished += (r.page_count || 0);
          }
        });

        // Calculate Target
        const days = differenceInDays(end, start) + 1;
        const target = plan.value * days;

        return { ...plan, accomplished_value: accomplished, calculated_target: target };
      });

      setActivePlans(processedPlans.filter(p => p.is_active === 1));
      setHistoryPlans(processedPlans.filter(p => !p.is_active));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      
      // Deactivate old plans of same type
      activePlans.filter(p => p.plan_type === selectedTemplate.type).forEach(p => {
        batch.update(doc(db, 'users', id as string, 'studentplans', p.id), {
          is_active: 0,
          end_date: startDate,
          updated_at: serverTimestamp()
        });
      });

      // Add new plan
      const newPlanRef = doc(collection(db, 'users', id as string, 'studentplans'));
      batch.set(newPlanRef, {
        plan_id: selectedTemplate.id,
        plan_name: selectedTemplate.name,
        plan_type: selectedTemplate.type,
        amount: selectedTemplate.amount,
        start_date: startDate,
        value: selectedTemplate.value,
        unit: selectedTemplate.unit,
        is_active: 1,
        user_id: id,
        student_name: student.displayName,
        created_at: serverTimestamp()
      });

      await batch.commit();
      setIsAssignModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      setFeedbackMessage(UI_TEXT.messages.studentPlanAssignError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinishPlan = async () => {
    if (!finishTarget) return;
    try {
      await updateDoc(doc(db, 'users', id as string, 'studentplans', finishTarget.id), {
        is_active: 0,
        end_date: format(new Date(), 'yyyy-MM-dd'),
        updated_at: serverTimestamp()
      });
      setFinishTarget(null);
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading || !student) return <LoadingSpinner />;

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-16" dir="rtl">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/students/${id}`)} className="w-10 h-10 rounded-2xl border border-slate-100 dark:border-slate-800">
             <ArrowRight className="w-4 h-4" />
           </Button>
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest family-cairo">
              <span>ملف الطالب</span>
              <ChevronLeft className="w-3 h-3" />
              <span className="text-blue-600">إدارة الخطط التعليمية</span>
           </div>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-10 md:p-14 rounded-[3rem] border border-slate-200/60 dark:border-slate-800 shadow-sm group">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
           <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="space-y-4">
                 <Badge variant="info" className="px-3 py-1 rounded-lg border-blue-100 dark:border-blue-900/30 text-[10px] font-black uppercase">
                    <Target className="w-3.5 h-3.5" />
                    النظام الذكي لإدارة المسارات
                 </Badge>
                 <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight family-cairo">خطط: {student.displayName}</h1>
                 <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-xl">
                    قم بتخصيص الأهداف اليومية للحفظ والمراجعة وتابع تقدم الطالب رقمياً بناءً على تقارير الإنجاز المسجلة في النظام.
                 </p>
              </div>
              <Button onClick={() => setIsAssignModalOpen(true)} className="h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 text-sm font-bold gap-3 group">
                 <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                 تعيين مسار تعليمي جديد
              </Button>
           </div>
        </div>

        {/* Active Plans Section */}
        <div className="space-y-8">
           <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">المسارات التعليمية النشطة</h3>
              <div className="flex-1 border-b border-slate-100 dark:border-slate-800"></div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activePlans.length === 0 ? (
                <EmptyPlansState message="لا توجد خطط نشطة حالياً. ابدأ بتعيين مسار للطالب." />
              ) : activePlans.map((plan) => (
                <ActivePlanCard key={plan.id} plan={plan} onFinish={() => setFinishTarget(plan)} />
              ))}
           </div>
        </div>

        {/* History Section */}
        <div className="space-y-8">
           <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-slate-400" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest family-cairo">سجل المسارات المكتملة</h3>
              <div className="flex-1 border-b border-slate-100 dark:border-slate-800"></div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {historyPlans.map((plan) => (
                <HistoryPlanCard key={plan.id} plan={plan} />
              ))}
           </div>
        </div>

        {/* Assign Plan Modal */}
        <Modal 
          isOpen={isAssignModalOpen} 
          onClose={() => setIsAssignModalOpen(false)}
          title="تعيين مسار تعليمي جديد"
        >
          <div className="space-y-8 pt-4">
             <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                   <LayoutGrid size={14} className="text-blue-500" />
                   اختر نموذج الخطة (Template)
                </label>
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                   {templates.map(t => (
                     <button
                       key={t.id}
                       onClick={() => setSelectedTemplate(t)}
                       className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-right ${selectedTemplate?.id === t.id ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-lg shadow-blue-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-blue-100 hover:bg-slate-50'}`}
                     >
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedTemplate?.id === t.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                              <BookOpen size={18} />
                           </div>
                           <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{t.name}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{TYPE_LABELS[t.type]} • {t.amount}</p>
                           </div>
                        </div>
                        {selectedTemplate?.id === t.id && <CheckCircle2 className="w-5 h-5" />}
                     </button>
                   ))}
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                   <Calendar size={14} className="text-blue-500" />
                   تاريخ تفعيل المسار
                </label>
                <Input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-slate-100"
                />
             </div>

             <div className="flex gap-4 pt-6">
                <Button 
                   onClick={handleAssignPlan}
                   disabled={isSaving || !selectedTemplate}
                   className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-base shadow-xl shadow-blue-500/20"
                >
                   {isSaving ? 'جاري الاعتماد...' : 'تفعيل المسار للطالب'}
                </Button>
                <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)} className="h-14 px-8 rounded-2xl font-bold">إلغاء</Button>
             </div>
          </div>
        </Modal>
        <Modal
          isOpen={Boolean(finishTarget)}
          onClose={() => setFinishTarget(null)}
          title={UI_TEXT.dialogs.deleteTitle}
        >
          <div className="space-y-6 text-right">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {finishTarget ? UI_TEXT.messages.studentPlanFinish(finishTarget.plan_name) : ''}
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" className="h-11 px-6" onClick={() => setFinishTarget(null)}>
                {UI_TEXT.actions.cancel}
              </Button>
              <Button variant="danger" className="h-11 px-6" onClick={handleFinishPlan}>
                {UI_TEXT.actions.confirmDelete}
              </Button>
            </div>
          </div>
        </Modal>
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

function ActivePlanCard({ plan, onFinish }: { plan: StudentPlan, onFinish: () => void }) {
  const percentage = Math.min(100, Math.round((plan.accomplished_value || 0) / (plan.calculated_target || 1) * 100));
  
  return (
    <div className="bg-white dark:bg-[#0f172a] p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-lg relative overflow-hidden group">
       <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
       
       <div className="relative z-10 space-y-8">
          <div className="flex items-start justify-between">
             <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${plan.plan_type === 'memorization' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                   {plan.plan_type === 'memorization' ? <BookOpen size={28} /> : <TrendingUp size={28} />}
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{TYPE_LABELS[plan.plan_type]}</p>
                   <h4 className="text-xl font-black text-slate-900 dark:text-white family-cairo">{plan.plan_name}</h4>
                </div>
             </div>
             <Button variant="ghost" size="icon" onClick={onFinish} className="w-10 h-10 rounded-xl text-rose-500 hover:bg-rose-50 border border-slate-50 dark:border-slate-800">
                <CheckCircle2 size={20} />
             </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 gap-y-6">
             <MetricBox label="المستهدف حالياً" value={`${plan.calculated_target?.toFixed(1) || 0} ${UNIT_LABELS[plan.unit]}`} icon={Target} />
             <MetricBox label="الإنجاز السحابي" value={`${plan.accomplished_value?.toFixed(1) || 0} ${UNIT_LABELS[plan.unit]}`} icon={Zap} />
             <MetricBox label="تاريخ الانطلاقة" value={plan.start_date} icon={Calendar} />
             <MetricBox label="الحصة اليومية" value={plan.amount} icon={Clock} />
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مؤشر التقدم نحو الهدف</span>
                <span className={`text-xs font-black family-mono ${percentage >= 100 ? 'text-emerald-500' : 'text-blue-500'}`}>{percentage}%</span>
             </div>
             <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${percentage}%` }}
                   className={`h-full bg-gradient-to-l ${percentage >= 100 ? 'from-emerald-500 to-teal-600' : 'from-blue-600 to-indigo-700'}`}
                />
             </div>
          </div>
       </div>
    </div>
  );
}

function HistoryPlanCard({ plan }: { plan: StudentPlan }) {
  return (
    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-slate-100 dark:border-slate-800/60 opacity-60 hover:opacity-100 transition-opacity">
       <div className="flex items-center gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
             <History size={18} />
          </div>
          <div className="min-w-0">
             <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">{plan.plan_name}</h5>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{plan.start_date} ← {plan.end_date || '---'}</p>
          </div>
       </div>
       <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase">
          <span>{TYPE_LABELS[plan.plan_type]}</span>
          <span>{plan.amount}</span>
       </div>
    </div>
  );
}

function MetricBox({ label, value, icon: Icon }: any) {
  return (
    <div className="space-y-2">
       <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <Icon size={12} className="text-blue-400" />
          {label}
       </div>
       <p className="text-sm font-black text-slate-700 dark:text-slate-300 family-mono">{value}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <DashboardLayout>
       <div className="min-h-[60vh] flex flex-col items-center justify-center p-12">
          <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">توليد المسارات التعليمية...</p>
       </div>
    </DashboardLayout>
  );
}

function EmptyPlansState({ message }: { message: string }) {
  return (
    <div className="col-span-full py-20 bg-slate-50/50 dark:bg-slate-900/40 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center p-8">
       <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center text-slate-200 mb-6 shadow-sm border border-slate-100">
          <Briefcase size={32} />
       </div>
       <p className="text-sm font-bold text-slate-500 family-cairo max-w-xs leading-relaxed">{message}</p>
    </div>
  );
}
