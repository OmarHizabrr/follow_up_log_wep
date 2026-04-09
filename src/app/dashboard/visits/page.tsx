'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
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
      alert('Error saving evaluation');
    } finally {
      setIsSaving(false);
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
              <span className="text-primary/80">نظام الرقابة والتطوير</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gradient tracking-tight">
              الزيارات الإدارية
            </h1>
            <p className="text-slate-500 mt-2 font-medium">توثيق تقييم الحلقات والأداء الفني للمعلمين</p>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="primary-gradient px-8 py-3 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-primary-glow"
          >
            تسجيل زيارة جديدة
          </button>
        </div>

        {/* Evaluations List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="py-20 text-center glass-panel rounded-[2rem]">
               <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">جاري تحميل سجل الزيارات...</p>
            </div>
          ) : (
            evaluations.map(ev => (
              <div key={ev.id} className="glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl ${ev.visit_type === 'regulatory' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {ev.visit_type === 'regulatory' ? '📏' : '🔭'}
                   </div>
                   <div>
                      <h3 className="font-black text-lg">{ev.halaqa_name}</h3>
                      <p className="text-xs font-bold text-slate-500">المعلم: {ev.teacher_name}</p>
                   </div>
                </div>

                <div className="flex items-center gap-8">
                   <div className="text-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">التقييم</p>
                      <p className="text-xl font-black text-primary">%{ev.total_score}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">التاريخ</p>
                      <p className="text-sm font-bold">{ev.visit_date}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">الموجه</p>
                      <p className="text-sm font-bold">{ev.visitor_name}</p>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md animate-fade" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative glass-panel rounded-[2.5rem] w-full max-w-lg p-8 border-white/10 shadow-2xl animate-snappy overflow-y-auto max-h-[90vh]">
              <h2 className="text-2xl font-black text-gradient mb-8">تسجيل تقييم زيارة</h2>
              
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">نوع الزيارة</label>
                    <select className="w-full elite-input font-bold text-sm" value={formData.visit_type} onChange={(e) => setFormData({...formData, visit_type: e.target.value as any})}>
                      <option value="regulatory" className="bg-black">رقابية (إدارية)</option>
                      <option value="supervisory" className="bg-black">توجيهية (فنية)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">تاريخ الزيارة</label>
                    <input type="date" className="w-full elite-input font-bold text-sm" value={formData.visit_date} onChange={(e) => setFormData({...formData, visit_date: e.target.value})} />
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">اسم الحلقة</label>
                   <input required className="w-full elite-input font-bold text-sm" value={formData.halaqa_name} onChange={(e) => setFormData({...formData, halaqa_name: e.target.value})} placeholder="مثال: حلقة عاصم" />
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">اسم المعلم</label>
                   <select required className="w-full elite-input font-bold text-sm" value={formData.teacher_name} onChange={(e) => setFormData({...formData, teacher_name: e.target.value})}>
                      <option value="" className="bg-black">اختيار المعلم...</option>
                      {teachers.map(t => <option key={t.id} value={t.displayName} className="bg-black">{t.displayName}</option>)}
                   </select>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">الدرجة الإجمالية (100)</label>
                   <input type="number" className="w-full elite-input font-bold text-sm" value={formData.total_score} onChange={(e) => setFormData({...formData, total_score: Number(e.target.value)})} />
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">ملاحظات الزيارة</label>
                   <textarea className="w-full elite-input min-h-[100px] font-bold text-sm" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="submit" disabled={isSaving} className="flex-1 primary-gradient py-4 rounded-2xl font-black text-xs uppercase tracking-widest">
                    {isSaving ? 'جاري الحفظ...' : 'اعتماد التقييم'}
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
