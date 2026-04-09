'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  User, 
  Star, 
  Plus, 
  X, 
  Save, 
  Activity, 
  Eye,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export default function VisitsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    halaqa_name: '',
    teacher_name: '',
    visit_type: 'regulatory',
    total_score: 0,
    notes: '',
    visit_date: new Date().toISOString().split('T')[0]
  });

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
    fetchTeachers();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'halaqa_evaluations'), orderBy('visit_date', 'desc'));
      const snap = await getDocs(q);
      setEvaluations(snap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Evaluation)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeachers = async () => {
    const q = query(collection(db, 'users'), where('type', '==', 'teacher'));
    const snap = await getDocs(q);
    setTeachers(snap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        ...formData,
        visitor_name: user.displayName,
        visitor_id: user.uid,
        total_score: Number(formData.total_score),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'halaqa_evaluations'), data);
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      alert('خطأ فـي حفظ بيانات التقييم');
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">الزيارات الميدانية</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">سجل التقييمات الإدارية والفنية للحلقات والمشرفين.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="enterprise-button"
          >
            <Plus className="w-4 h-4" />
            تسجيل تقييم جديد
          </button>
        </div>

        {/* Global Visits List (Enterprise Card List) */}
        <div className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl border border-gray-200 dark:border-gray-700"></div>)
          ) : evaluations.length === 0 ? (
            <div className="enterprise-card p-12 text-center text-gray-500">
               لا توجد زيارات مسجلة.
            </div>
          ) : (
            evaluations.map(ev => (
              <div 
                key={ev.id} 
                className="enterprise-card p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-[250px]">
                   <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${ev.visit_type === 'regulatory' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {ev.visit_type === 'regulatory' ? <ShieldCheck className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                   </div>
                   <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">{ev.halaqa_name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                         <User className="w-3.5 h-3.5" />
                         <span>المعلم: {ev.teacher_name}</span>
                      </div>
                   </div>
                </div>

                <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4">
                   <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">تاريخ الزيارة</span>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                         <Calendar className="w-4 h-4 text-gray-400" />
                         {ev.visit_date}
                      </div>
                   </div>
                   
                   <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">المكلف بالزيارة</span>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                         <MapPin className="w-4 h-4 text-gray-400" />
                         {ev.visitor_name}
                      </div>
                   </div>

                   <div className="flex flex-col col-span-2 lg:col-span-1 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100 dark:border-gray-700">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">النتيجة</span>
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                         <span className={ev.total_score >= 85 ? 'text-green-600' : ev.total_score >= 65 ? 'text-orange-500' : 'text-red-500'}>
                           {ev.total_score}%
                         </span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-end shrink-0 pt-3 md:pt-0">
                   <button className="enterprise-button-secondary py-1.5 px-3 text-xs">
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      عرض التقرير
                   </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Standard Modal Dialog */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
                onClick={() => setIsModalOpen(false)}
              ></motion.div>
              
              {/* Dialog Content */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                         <ClipboardList className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">تسجيل تقييم زيارة</h2>
                   </div>
                   <button 
                     onClick={() => setIsModalOpen(false)} 
                     className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                   >
                     <X className="w-5 h-5" />
                   </button>
                </div>
                
                {/* Body */}
                <div className="px-6 py-6 overflow-y-auto custom-scrollbar">
                   <form id="visit-form" onSubmit={handleSave} className="space-y-5">
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1.5">
                         <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">نوع الزيارة</label>
                         <select required className="enterprise-input cursor-pointer" value={formData.visit_type} onChange={(e) => setFormData({...formData, visit_type: e.target.value as any})}>
                           <option value="regulatory">إدارية (رقابية)</option>
                           <option value="supervisory">فنية (توجيهية)</option>
                         </select>
                       </div>
                       
                       <div className="space-y-1.5">
                         <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">تاريخ الزيارة</label>
                         <input required type="date" className="enterprise-input" value={formData.visit_date} onChange={(e) => setFormData({...formData, visit_date: e.target.value})} />
                       </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">اسم الحلقة الميدانية</label>
                        <input required className="enterprise-input" value={formData.halaqa_name} onChange={(e) => setFormData({...formData, halaqa_name: e.target.value})} placeholder="مثال: حلقة عاصم بن أبي النجود" />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">المعلم المسؤول</label>
                        <select required className="enterprise-input cursor-pointer" value={formData.teacher_name} onChange={(e) => setFormData({...formData, teacher_name: e.target.value})}>
                           <option value="">اختيار المعلم من القائمة...</option>
                           {teachers.map(t => <option key={t.id} value={t.displayName}>{t.displayName}</option>)}
                        </select>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">درجة التقييم (من 100)</label>
                        <input required type="number" min="0" max="100" className="enterprise-input w-32 text-center" value={formData.total_score} onChange={(e) => setFormData({...formData, total_score: Number(e.target.value)})} />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">التقرير الفني والملاحظات</label>
                        <textarea required rows={4} className="enterprise-input resize-none py-3" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="ملخص الزيارة والتوصيات..." />
                     </div>
                   </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3 shrink-0">
                   <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)} 
                      className="enterprise-button-secondary"
                   >
                      إلغاء
                   </button>
                   <button 
                      type="submit" 
                      form="visit-form"
                      disabled={isSaving} 
                      className="enterprise-button min-w-[120px]"
                   >
                      {isSaving ? (
                        <>جاري الحفظ<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span></>
                      ) : (
                        <>حفظ التقرير <Save className="w-4 h-4" /></>
                      )}
                   </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
