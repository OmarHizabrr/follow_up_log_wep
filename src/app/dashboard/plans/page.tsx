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
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    fetchPlans();
  }, [router]);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'plans'), orderBy('value', 'asc'));
      const snap = await getDocs(q);
      setPlans(snap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Plan)));
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
      alert('خطأ فـي حفظ بيانات الخطة');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الخطة: ${name}؟`)) {
      try {
        await deleteDoc(doc(db, 'plans', id));
        fetchPlans();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">الخطط والمناهج</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إعداد قوالب الحفظ والمراجعة القياسية لبرامج المتابعة.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="enterprise-button"
          >
            <Plus className="w-4 h-4" />
            إضافة خطة جديدة
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl border border-gray-200 dark:border-gray-700"></div>)
          ) : plans.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-500 text-sm">
               لا توجد خطط مضافة حالياً.
            </div>
          ) : (
            plans.map(plan => (
              <div 
                key={plan.id} 
                className="enterprise-card p-5 group flex flex-col justify-between"
              >
                <div>
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                        <Layers className="w-5 h-5" />
                     </div>
                     <div>
                       <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-0.5">{plan.name}</h3>
                       <span className="text-xs font-semibold text-gray-500">{TYPE_LABELS[plan.type]}</span>
                     </div>
                   </div>

                 <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-600">
                         <span className="font-semibold text-gray-500">المقدار</span>
                         <span className="font-bold text-gray-900 dark:text-gray-200">{plan.amount}</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-600">
                         <span className="font-semibold text-gray-500">القيمة</span>
                         <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-gray-200">
                            <span>{plan.value}</span>
                            <span className="text-xs font-semibold text-gray-500">{UNIT_LABELS[plan.unit]}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex gap-2 pt-4 mt-5 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => handleOpenModal(plan)} className="flex-1 enterprise-button-secondary py-2 text-sm font-bold">
                     <Edit3 className="w-4 h-4" />
                     تعديل
                  </button>
                  <button onClick={() => handleDelete(plan.id, plan.name)} className="flex items-center justify-center px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-100 transition-colors">
                     <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal - Document Creation */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
                onClick={() => setIsModalOpen(false)}
              ></div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                   <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                     <Activity className="w-5 h-5 text-gray-400" />
                     {currentPlan ? 'تعديل المعيار' : 'تسجيل معيار خطة جديد'}
                   </h2>
                   <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-lg transition-colors">
                     <X className="w-5 h-5" />
                   </button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                       مسمى المعيار / البرنامج
                    </label>
                    <input 
                       required 
                       className="enterprise-input"
                       value={formData.name}
                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                       placeholder="مثال: الحفظ المكثف - المستوى الأول"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                         نوع المسار
                      </label>
                      <select className="enterprise-input cursor-pointer" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                        {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                         وحدة القياس
                      </label>
                      <select className="enterprise-input cursor-pointer" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}>
                        {Object.entries(UNIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">الوصف النصي</label>
                      <input className="enterprise-input" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="مثال: وجهين" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">القيمة الرقمية</label>
                      <input type="number" className="enterprise-input text-left" dir="ltr" value={formData.value} onChange={(e) => setFormData({...formData, value: Number(e.target.value)})} />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                     <button 
                        type="button" 
                        onClick={() => setIsModalOpen(false)} 
                        className="enterprise-button-secondary"
                     >
                        إلغاء
                     </button>
                     <button 
                        type="submit" 
                        disabled={isSaving} 
                        className="enterprise-button min-w-[120px]"
                     >
                        {isSaving ? 'لحظات...' : 'حفظ الخطة'}
                        {!isSaving && <Save className="w-4 h-4 ml-1" />}
                     </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
