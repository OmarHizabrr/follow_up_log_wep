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
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

interface Plan {
  id: string;
  name: string;
  type: string; // memorization, revision, etc.
  amount: string;
  value: number;
  unit: string; // pages, juz, lines
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
      alert('Error saving plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الخطة؟')) {
      await deleteDoc(doc(db, 'plans', id));
      fetchPlans();
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-snappy max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold mb-3 uppercase tracking-widest">
              <Link href="/dashboard" className="hover:text-primary transition-colors">لوحة التحكم</Link>
              <span>/</span>
              <span className="text-primary/80">إدارة المناهج والخطط</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gradient tracking-tight">
              خطط الحفظ والمراجعة
            </h1>
            <p className="text-slate-500 mt-2 font-medium">تحديد المعايير الموحدة للكميات اليومية لكل برنامج</p>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="primary-gradient px-8 py-3 rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg shadow-primary-glow"
          >
            إضافة خطة جديدة
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 text-center">
               <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">جاري تحميل الخطط...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="col-span-full glass-panel p-20 text-center rounded-[2rem]">
               <p className="text-slate-400 font-bold">لا يوجد خطط مضافة حالياً</p>
            </div>
          ) : (
            plans.map(plan => (
              <div key={plan.id} className="glass-card rounded-[2rem] p-6 group transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-white/5 border border-white/10`}>
                    {plan.type === 'memorization' ? '✨' : '🔄'}
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{plan.name}</h3>
                    <span className="text-[10px] font-black uppercase text-primary tracking-tighter">{TYPE_LABELS[plan.type]}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8 bg-white/5 p-4 rounded-2xl border border-white/5">
                   <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-500">المقدار:</span>
                      <span className="font-black text-slate-200">{plan.amount}</span>
                   </div>
                   <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-500">القيمة:</span>
                      <span className="font-black text-slate-200">{plan.value} {UNIT_LABELS[plan.unit]}</span>
                   </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(plan)} className="flex-1 py-3 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl text-xs font-bold transition-all">تعديل</button>
                  <button onClick={() => handleDelete(plan.id)} className="p-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 rounded-xl transition-all">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md animate-fade" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative glass-panel rounded-[2.5rem] w-full max-w-md p-8 border-white/10 shadow-2xl animate-snappy">
              <h2 className="text-2xl font-black text-gradient mb-8">{currentPlan ? 'تعديل الخطة' : 'خطة جديدة'}</h2>
              
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">اسم الخطة</label>
                  <input 
                    required 
                    className="w-full elite-input font-bold text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">النوع</label>
                    <select className="w-full elite-input font-bold text-sm" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k} className="bg-black">{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">وحدة القياس</label>
                    <select className="w-full elite-input font-bold text-sm" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}>
                      {Object.entries(UNIT_LABELS).map(([k, v]) => <option key={k} value={k} className="bg-black">{v}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">المقدار (نص)</label>
                    <input className="w-full elite-input font-bold text-sm" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="مثال: وجهين" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">القيمة الرقمية</label>
                    <input type="number" className="w-full elite-input font-bold text-sm" value={formData.value} onChange={(e) => setFormData({...formData, value: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="submit" disabled={isSaving} className="flex-1 primary-gradient py-4 rounded-2xl font-black text-xs uppercase tracking-widest">
                    {isSaving ? 'انتظر...' : 'حفظ الخطة'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 glass-card py-4 rounded-2xl font-black text-xs text-slate-400 uppercase tracking-widest">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
