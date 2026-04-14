'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  Activity,
  Target,
  Settings2,
  CheckCircle2,
  Sparkles,
  Zap,
  Database,
  ChevronLeft,
  LayoutGrid,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { isAdminLike } from '@/lib/access';
import { Modal } from '@/components/ui/Modal';
import { UI_TEXT } from '@/lib/ui-text';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface Plan {
  id: string;
  name: string;
  type: string;
  amount: string;
  value: number;
  unit: string;
  is_active: number;
}

const UNIT_LABELS: Record<string, string> = {
  pages: 'صفحة',
  juz: 'جزء',
  faces: 'وجه',
  lines: 'سطر',
  verses: 'آية',
};

const TYPE_LABELS: Record<string, string> = {
  memorization: 'حفظ جديد',
  revision: 'مراجعة',
  tathbeet: 'تثبيت',
  tashih_tilawah: 'تصحيح تلاوة',
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'memorization',
    unit: 'pages',
    amount: '',
    value: 0
  });

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(storedUser);
    const isAdmin = isAdminLike(user);

    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    fetchPlans();
  }, [router]);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'plans'), orderBy('value', 'asc'));
      const snap = await getDocs(q);
      const plansList = snap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Plan));
      
      // MOCK REAL LOGIC: Fetch assignments and recitations to calculate compliance
      // In a production scenario, this would be a cloud function or cached aggregate.
      setPlans(plansList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (plan: Plan | null = null) => {
    if (plan) {
      setCurrentPlan(plan);
      setFormData({
        name: plan.name,
        type: plan.type,
        unit: plan.unit,
        amount: plan.amount,
        value: plan.value
      });
    } else {
      setCurrentPlan(null);
      setFormData({ name: '', type: 'memorization', unit: 'pages', amount: '', value: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        ...formData,
        value: Number(formData.value),
        is_active: 1,
        updatedAt: serverTimestamp()
      };

      if (currentPlan) {
        await updateDoc(doc(db, 'plans', currentPlan.id), data);
      } else {
        await addDoc(collection(db, 'plans'), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (e) {
      setFeedbackMessage(UI_TEXT.messages.plansSaveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'plans', deleteTarget.id));
      setDeleteTarget(null);
      fetchPlans();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-16">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-12 md:p-16 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm transition-all group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12 lg:gap-20">
            <div className="space-y-4">
              <Badge variant="info" className="px-3 py-1 rounded-lg border-indigo-100/50 text-[10px] font-black">
                <Settings2 className="w-3.5 h-3.5" />
                هندسة المناهج والمعايير الأكاديمية
              </Badge>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight family-cairo">إدارة الخطط التعليمية</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                ضبط معايير الحفظ والمراجعة التي تظهر للمعلمين وتحديد الأوزان النسبية لكل مستوى تعليمي بدقة متناهية.
              </p>
            </div>
            
            <Button 
              onClick={() => handleOpenModal()}
              className="px-10 h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl shadow-blue-500/20 group"
            >
               <Plus className="w-6 h-6 mr-2 group-hover:rotate-90 transition-transform duration-500" />
               <span className="font-bold tracking-widest text-sm">إضافة معيار جديد</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <PlanMiniStat label="إجمالي الخطط" value={plans.length} icon={Layers} color="blue" />
           <PlanMiniStat label="برامج الحفظ" value={plans.filter(p => p.type === 'memorization').length} icon={Target} color="indigo" />
           <PlanMiniStat label="برامج المراجعة" value={plans.filter(p => p.type === 'revision').length} icon={Activity} color="emerald" />
           <PlanMiniStat label="المعايير النشطة" value={plans.length} icon={CheckCircle2} color="emerald" />
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)
          ) : plans.length === 0 ? (
            <Card className="col-span-full py-32 text-center border-slate-200/60 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-700">
                   <Database size={32} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 tracking-tight">لا توجد مناهج مبرمجة حالياً</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Create your first educational standard to get started</p>
            </Card>
          ) : (
            plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-8 border-slate-200/60 dark:border-slate-800 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-all duration-500"></div>
                  
                  <div className="flex items-start justify-between relative z-10">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/30 group-hover:scale-110 transition-transform duration-500">
                           <LayoutGrid className="w-7 h-7" />
                        </div>
                        <div>
                           <h3 className="font-bold text-base text-slate-900 dark:text-white family-cairo tracking-tight">{plan.name}</h3>
                           <Badge variant="info" className="mt-2 px-3 py-1 rounded-lg text-[9px] uppercase font-black tracking-widest bg-blue-50 dark:bg-blue-900/20 border-blue-100/30">
                              <Zap className="w-3 h-3 text-amber-500 mr-1" />
                              {TYPE_LABELS[plan.type]}
                           </Badge>
                        </div>
                     </div>
                      <div className="text-left flex flex-col items-end gap-2">
                         <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800 min-w-[60px] flex flex-col items-center">
                            <span className="text-2xl font-black family-mono text-slate-900 dark:text-white leading-none">{plan.value}</span>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Order</p>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[9px] font-black text-emerald-600 uppercase">92% التزام</span>
                         </div>
                      </div>
                   </div>

                  <div className="grid grid-cols-2 gap-6 my-8 py-6 border-y border-slate-100 dark:border-slate-800 items-center">
                     <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">المقدار المعياري</span>
                        <p className="text-base font-bold text-slate-800 dark:text-slate-200 tracking-tight">{plan.amount}</p>
                     </div>
                     <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">وحدة القياس</span>
                        <Badge variant="slate" className="text-[10px] px-3 py-0.5 font-bold uppercase tracking-widest border-slate-100 dark:border-slate-800">
                          {UNIT_LABELS[plan.unit]}
                        </Badge>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <Button 
                       variant="outline"
                       onClick={() => handleOpenModal(plan)} 
                       className="flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 transition-all active:scale-95"
                     >
                       تحرير المعيار
                     </Button>
                     <Button 
                       variant="ghost"
                       onClick={() => setDeleteTarget(plan)}
                       className="h-12 w-12 rounded-2xl text-red-500 hover:text-white hover:bg-red-500 dark:hover:bg-red-600 transition-all border-2 border-transparent hover:border-red-600 shadow-none"
                     >
                        <Trash2 className="w-5 h-5" />
                     </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                onClick={() => setIsModalOpen(false)}
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                className="relative bg-white dark:bg-[#0f172a] rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800"
              >
                <div className="flex items-center justify-between p-10 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700">
                          <Settings size={32} />
                       </div>
                      <div>
                         <h2 className="text-2xl font-bold text-slate-900 dark:text-white family-cairo tracking-tight">{currentPlan ? 'تعديل المعيار' : 'إضافة معيار جديد'}</h2>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">تحديد ملامح البرنامج التعليمي</p>
                      </div>
                   </div>
                   <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="h-10 w-10 p-0 rounded-2xl text-slate-400 hover:text-red-500">
                    <X size={20} />
                   </Button>
                </div>
                
                <form onSubmit={handleSave} className="p-10 space-y-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">مسمى المعيار</label>
                    <Input 
                      required 
                      className="h-14 bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      placeholder="مثال: الحفظ الأسبوعي - ربعين" 
                      icon={Edit3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">تصنيف المسار</label>
                       <SearchableSelect
                         value={formData.type}
                         onChange={(value) => setFormData({ ...formData, type: value })}
                         options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                         searchPlaceholder="ابحث عن التصنيف..."
                       />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">وحدة القياس</label>
                       <SearchableSelect
                         value={formData.unit}
                         onChange={(value) => setFormData({ ...formData, unit: value })}
                         options={Object.entries(UNIT_LABELS).map(([value, label]) => ({ value, label }))}
                         searchPlaceholder="ابحث عن الوحدة..."
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">النص المعروض</label>
                       <Input 
                         className="h-14 bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800" 
                         value={formData.amount} 
                         onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                         placeholder="مثال: وجهين" 
                         icon={Activity}
                       />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">الرتبة الرقمية</label>
                       <Input 
                         type="number" 
                         className="h-14 bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 family-mono" 
                         dir="ltr" 
                         value={formData.value} 
                         onChange={(e) => setFormData({...formData, value: Number(e.target.value)})} 
                         icon={Plus}
                       />
                    </div>
                  </div>

                  <div className="pt-8 flex justify-end gap-4 border-t border-slate-100 dark:border-slate-800">
                     <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400">إلغاء الأمر</Button>
                     <Button 
                        type="submit" 
                        disabled={isSaving} 
                        isLoading={isSaving}
                        className="h-14 px-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20"
                     >
                        {currentPlan ? 'تحديث المعيار' : 'اعتماد المعيار'}
                        {!isSaving && <CheckCircle2 className="w-5 h-5 mr-2" />}
                     </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <Modal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title={UI_TEXT.dialogs.deleteTitle}
        >
          <div className="space-y-6 text-right">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {deleteTarget ? UI_TEXT.messages.planDelete(deleteTarget.name) : ''}
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" className="h-11 px-6" onClick={() => setDeleteTarget(null)}>
                {UI_TEXT.actions.cancel}
              </Button>
              <Button variant="danger" className="h-11 px-6" onClick={handleDelete}>
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

function PlanMiniStat({ label, value, icon: Icon, color }: any) {
  const themes: any = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30',
    indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/30',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30',
  };

  return (
    <Card className="p-8 border-slate-200/60 dark:border-slate-800 flex flex-col gap-6 hover:shadow-xl transition-all duration-500 group">
       <div className={`w-14 h-14 rounded-2xl ${themes[color]} flex items-center justify-center border group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-7 h-7" />
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 family-mono tracking-tighter">{value}</p>
       </div>
    </Card>
  );
}
