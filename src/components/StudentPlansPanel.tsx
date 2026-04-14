'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  orderBy,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Calendar, 
  Trophy, 
  Plus, 
  CheckCircle2, 
  History, 
  Target, 
  Activity, 
  X,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Modal } from '@/components/ui/Modal';
import { format, differenceInDays, parseISO } from 'date-fns';
import { injectMetadata } from '@/lib/firebaseUtils';
import { UI_TEXT } from '@/lib/ui-text';

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

interface PlanTemplate {
  id: string;
  name: string;
  type: string;
  amount: string;
  value: number;
  unit: string;
}

export default function StudentPlansPanel({ studentId, studentName }: { studentId: string, studentName: string }) {
  const [activePlans, setActivePlans] = useState<StudentPlan[]>([]);
  const [planHistory, setPlanHistory] = useState<StudentPlan[]>([]);
  const [templates, setTemplates] = useState<PlanTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [finishTarget, setFinishTarget] = useState<StudentPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentPlan | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    planId: '',
    startDate: format(new Date(), 'yyyy-MM-dd')
  });

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Plan Templates
      const templatesSnap = await getDocs(query(collection(db, 'plans'), where('is_active', '==', 1)));
      const templateList = templatesSnap.docs.map(d => ({ id: d.id, ...d.data() } as PlanTemplate));
      setTemplates(templateList);

      // 2. Fetch Student Plans
      const studentPlansSnap = await getDocs(query(
        collection(db, 'users', studentId, 'studentplans'), 
        orderBy('created_at', 'desc')
      ));
      
      const allStudentPlans = studentPlansSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentPlan));

      // 3. Fetch Recitations for Aggregation
      const recSnap = await getDocs(collection(db, 'users', studentId, 'dailyrecitations'));
      const recitations = recSnap.docs.map(d => d.data());

      // 4. Calculate Quotas and Accomplishments (Mobile Parity Logic)
      const processedPlans = allStudentPlans.map(plan => {
        const start = plan.start_date;
        const end = (plan.is_active === 0) ? (plan.end_date || format(new Date(), 'yyyy-MM-dd')) : format(new Date(), 'yyyy-MM-dd');
        
        // Sum values in range
        let accomplished = 0;
        const startDate = parseISO(start);
        const endDate = parseISO(end);

        // Multi-Unit Conversion Logic (Mobile Logic Parity)
        let multiplier = 1.0;
        if (plan.unit === 'faces') multiplier = 2.0;
        else if (plan.unit === 'juz') multiplier = 1.0 / 20.0;
        else if (plan.unit === 'lines') multiplier = 15.0;

        recitations.forEach(r => {
           if (r.type !== plan.plan_type) return;
           const rDateStr = r.date?.toString();
           if (!rDateStr) return;
           const rDate = parseISO(rDateStr);
           
           if (rDate >= startDate && rDate <= endDate) {
             const val = Number(r.page_count || 0);
             accomplished += val * multiplier;
           }
        });

        // Calculate Target (DailyValue * Days)
        const days = differenceInDays(endDate, startDate) + 1;
        const target = (plan.value || 0) * days;

        return { ...plan, accomplished_value: accomplished, calculated_target: target };
      });

      setActivePlans(processedPlans.filter(p => p.is_active === 1));
      setPlanHistory(processedPlans.filter(p => p.is_active === 0));

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const template = templates.find(t => t.id === formData.planId);
      if (!template) return;

      const newPlanId = Date.now().toString();
      const planData = injectMetadata({
        plan_id: template.id,
        plan_name: template.name,
        plan_type: template.type,
        amount: template.amount,
        start_date: formData.startDate,
        value: template.value,
        unit: template.unit,
        is_active: 1,
        user_id: studentId,
        student_name: studentName,
        created_at: serverTimestamp()
      });

      // Deactivate old plans of same type
      const sameType = activePlans.filter(p => p.plan_type === template.type);
      for (const p of sameType) {
        await updateDoc(doc(db, 'users', studentId, 'studentplans', p.id), {
          is_active: 0,
          end_date: formData.startDate,
          updated_at: serverTimestamp()
        });
      }

      await setDoc(doc(db, 'users', studentId, 'studentplans', newPlanId), planData);
      
      setIsModalOpen(false);
      loadAllData();
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
      await updateDoc(doc(db, 'users', studentId, 'studentplans', finishTarget.id), {
        is_active: 0,
        end_date: format(new Date(), 'yyyy-MM-dd'),
        updated_at: serverTimestamp(),
      });
      setFinishTarget(null);
      loadAllData();
    } catch (error) {
      console.error(error);
      setFeedbackMessage('حدث خطأ أثناء إنهاء الخطة.');
    }
  };

  const deletePlanRecord = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'users', studentId, 'studentplans', deleteTarget.id));
      setDeleteTarget(null);
      loadAllData();
    } catch (error) {
      console.error(error);
      setFeedbackMessage('تعذر حذف سجل الخطة.');
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
       <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
             <h3 className="text-xl font-black text-slate-900 dark:text-white family-cairo">المسارات التعليمية المخصصة</h3>
             <p className="text-xs font-bold text-slate-500">إدارة الخطط الفردية ومتابعة الامتثال بالمقادير اليومية.</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 gap-3"
          >
             <Plus size={18} />
             تعيين مسار جديد
          </Button>
       </div>

       {isLoading ? (
         <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-48 bg-slate-50 dark:bg-slate-900 animate-pulse rounded-[2.5rem]" />)}
         </div>
       ) : activePlans.length === 0 ? (
         <Card className="py-20 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
            <Target className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400 family-cairo">لا توجد خطط نشطة حالياً لهذا الطالب</p>
         </Card>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activePlans.map(plan => (
              <PlanProgressCard 
                key={plan.id} 
                plan={plan} 
                onFinish={() => setFinishTarget(plan)} 
              />
            ))}
         </div>
       )}

       {planHistory.length > 0 && (
         <section className="space-y-4 pt-10 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <History size={14} />
               سجل الخطط المكتملة
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70 hover:opacity-100 transition-opacity">
               {planHistory.map(plan => (
                 <div key={plan.id} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <BookOpen size={18} />
                       </div>
                       <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{plan.plan_name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{plan.start_date} → {plan.end_date}</p>
                       </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(plan)} className="w-8 h-8 rounded-lg text-rose-500 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                       <X size={14} />
                    </Button>
                 </div>
               ))}
            </div>
         </section>
       )}

       {/* New Plan Modal */}
       <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
               <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 50 }} className="relative bg-white dark:bg-[#0f172a] rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="p-10 space-y-8">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center">
                              <Trophy size={28} />
                           </div>
                           <div>
                              <h3 className="text-xl font-bold text-slate-900 dark:text-white family-cairo">تعيين مسار تعليمي</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 tracking-tighter">تخصيص الخطة الفردية للطالب</p>
                           </div>
                        </div>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="w-10 h-10 p-0 rounded-2xl text-slate-400">
                           <X size={20} />
                        </Button>
                     </div>

                     <form onSubmit={handleAssignPlan} className="space-y-6">
                        <div className="space-y-3">
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">اختر الخطة القياسية</label>
                           <SearchableSelect
                             value={formData.planId}
                             onChange={(value) => setFormData({ ...formData, planId: value })}
                             options={templates.map((template) => ({
                               value: template.id,
                               label: `${template.name} (${template.amount})`,
                             }))}
                             placeholder="اختر من المناهج المعتمدة..."
                             searchPlaceholder="ابحث عن الخطة..."
                             className="h-14"
                           />
                        </div>

                        <div className="space-y-3">
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">تاريخ تفعيل المسار</label>
                           <Input 
                             type="date"
                             required
                             className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800"
                             value={formData.startDate}
                             onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                           />
                        </div>

                        <div className="pt-6 flex gap-4">
                           <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-14 px-8 rounded-2xl font-bold">إلغاء</Button>
                           <Button 
                             type="submit" 
                             disabled={isSaving || !formData.planId}
                             className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 font-black text-base"
                           >
                              {isSaving ? 'جاري الحفظ...' : 'اعتماد وتفعيل المسار'}
                           </Button>
                        </div>
                     </form>
                  </div>
               </motion.div>
            </div>
          )}
       </AnimatePresence>
      <Modal
        isOpen={Boolean(finishTarget)}
        onClose={() => setFinishTarget(null)}
        title="إنهاء الخطة التعليمية"
      >
        <div className="space-y-6 text-right">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {finishTarget ? UI_TEXT.messages.studentPlanFinish(finishTarget.plan_name) : ''}
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" className="h-11 px-6" onClick={() => setFinishTarget(null)}>
              {UI_TEXT.actions.cancel}
            </Button>
            <Button variant="primary" className="h-11 px-6" onClick={handleFinishPlan}>
              تأكيد الإنهاء
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={UI_TEXT.dialogs.deleteTitle}
      >
        <div className="space-y-6 text-right">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            سيتم حذف سجل الخطة "{deleteTarget?.plan_name || ''}" نهائيا. لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" className="h-11 px-6" onClick={() => setDeleteTarget(null)}>
              {UI_TEXT.actions.cancel}
            </Button>
            <Button variant="danger" className="h-11 px-6" onClick={deletePlanRecord}>
              {UI_TEXT.actions.confirmDelete}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={Boolean(feedbackMessage)} onClose={() => setFeedbackMessage(null)} title="تنبيه النظام">
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
  );
}

function PlanProgressCard({ plan, onFinish }: { plan: StudentPlan, onFinish: () => void }) {
  const target = plan.calculated_target || 1;
  const current = plan.accomplished_value || 0;
  const progress = Math.min(100, Math.round((current / target) * 100));

  return (
    <Card className="p-8 border-slate-200/60 dark:border-slate-800 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
       
       <div className="flex items-start justify-between relative z-10 mb-8">
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center border border-blue-100/30 group-hover:scale-110 transition-transform duration-500">
                <Activity size={28} />
             </div>
             <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white family-cairo tracking-tight">{plan.plan_name}</h4>
                <Badge variant="info" className="mt-2 px-3 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-widest bg-blue-50/50">
                   {plan.plan_type === 'memorization' ? 'حفظ' : 'مراجعة'}
                </Badge>
             </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onFinish} className="w-10 h-10 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50">
             <CheckCircle2 size={20} />
          </Button>
       </div>

       <div className="space-y-6 relative z-10">
          <div className="flex items-end justify-between">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">معدل الإنجاز التراكمي</p>
                <div className="flex items-baseline gap-2">
                   <span className="text-4xl font-black text-slate-900 dark:text-white family-mono tracking-tighter">{progress}%</span>
                   <span className="text-xs font-bold text-slate-400 truncate">من المستهدف المرحلي</span>
                </div>
             </div>
             <div className="text-left font-black text-[10px] uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl">
                {current.toFixed(1)} / {target.toFixed(1)} صفحة
             </div>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               transition={{ duration: 1.5, ease: 'easeOut' }}
               className={`h-full bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]`}
             />
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-3">
                <Calendar className="text-slate-300" size={16} />
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">تاريخ البدء</p>
                   <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{plan.start_date}</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <Target className="text-slate-300" size={16} />
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الحصيصة اليومية</p>
                   <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{plan.amount}</p>
                </div>
             </div>
          </div>
       </div>
    </Card>
  );
}
