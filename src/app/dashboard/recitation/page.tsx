'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

export default function RecitationPage() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: 'memorization',
    amount: '',
    rating: 5,
    notes: ''
  });

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchData(parsedUser);
  }, [router]);

  const fetchData = async (userData: any) => {
    setIsLoading(true);
    try {
      const hSnap = await getDocs(query(collection(db, 'users'), where('type', '==', 'halaqa')));
      setCircles(hSnap.docs.map(ds => ({ id: ds.id, ...ds.data() })));

      const sSnap = await getDocs(query(collection(db, 'users'), where('type', '==', 'student')));
      setStudents(sSnap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = {
        ...formData,
        date: today,
        student_id: selectedStudent.id,
        student_name: selectedStudent.displayName,
        halaqa_id: selectedStudent.halaqaId || '',
        halaqa_name: circles.find(c => c.id === selectedStudent.halaqaId)?.displayName || '',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.displayName
      };
      
      await addDoc(collection(db, 'dailyrecitations', selectedStudent.id, 'dailyrecitations'), data);
      alert('تم حفظ التسميع بنجاح في المنصة الموحدة');
      setSelectedStudent(null);
      setFormData({ type: 'memorization', amount: '', rating: 5, notes: '' });
    } catch (e) {
      alert('خطأ في المزامنة');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-snappy space-y-10">
        
        {/* Elite Module Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.4em]">
              <span className="w-12 h-[2px] bg-primary"></span>
              Recitation & Achievement Engine
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gradient tracking-tight">متابعة الحفظ</h1>
            <p className="text-slate-500 font-bold max-w-lg text-sm leading-relaxed">
               تسجيل ذكي لمعدلات الحفظ والمراجعة مع ممانعة كاملة للبيانات بين الويب والموبايل.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           
           {/* Selection List - Bento Left */}
           <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-10 rounded-[3rem] border-white/5 bg-gradient-to-b from-primary/5 to-transparent">
                 <h3 className="text-xl font-black mb-8 leading-none">اختيار الطالب</h3>
                 <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {students.map(s => (
                      <button 
                        key={s.id} 
                        onClick={() => setSelectedStudent(s)}
                        className={`w-full p-6 rounded-3xl text-right transition-all group border ${selectedStudent?.id === s.id ? 'bg-primary text-white border-primary/20 shadow-xl shadow-primary/20' : 'glass-card border-white/5 hover:bg-white/5'}`}
                      >
                         <p className="font-black text-sm mb-1">{s.displayName}</p>
                         <p className={`text-[9px] font-black uppercase tracking-widest ${selectedStudent?.id === s.id ? 'text-white/60' : 'text-slate-500'}`}>
                           ID: {s.number} • {s.educationalStage}
                         </p>
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* Input Terminal - Bento Right */}
           <div className="lg:col-span-8">
              {selectedStudent ? (
                <form onSubmit={handleSave} className="glass-panel p-10 md:p-14 rounded-[3.5rem] border-white/5 relative overflow-hidden animate-fade">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[150px] -mr-48 -mt-48 transition-all"></div>
                   
                   <div className="relative z-10">
                      <div className="flex items-center justify-between mb-12">
                         <div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 block">Data Entry Terminal</span>
                            <h2 className="text-3xl font-black tracking-tight leading-none text-gradient">رصد الإنجاز لـ: {selectedStudent.displayName}</h2>
                         </div>
                         <button type="button" onClick={() => setSelectedStudent(null)} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-rose-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-2">نوع الإنجاز</label>
                            <select className="w-full elite-input font-bold" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                               <option value="memorization" className="bg-black">حفظ جديد ✨</option>
                               <option value="revision" className="bg-black">مراجعة 🔄</option>
                               <option value="tathbeet" className="bg-black">تثبيت 💎</option>
                               <option value="tashih_tilawah" className="bg-black">تصحيح تلاوة 📖</option>
                            </select>
                         </div>
                         
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-2">المقدار (سورة/صفحة)</label>
                            <input type="text" className="w-full elite-input font-bold" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="مثال: سورة البقرة من 1-20" required />
                         </div>

                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-2">التقييم الفني</label>
                            <div className="flex gap-3">
                               {[1, 2, 3, 4, 5].map(v => (
                                 <button key={v} type="button" onClick={() => setFormData({...formData, rating: v})} className={`flex-1 py-4 rounded-2xl font-black text-sm border transition-all ${formData.rating === v ? 'bg-primary border-primary/20 text-white shadow-lg' : 'glass-card border-white/5 text-slate-500'}`}>
                                    {v}
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-2">ملاحظات المعلم</label>
                            <input type="text" className="w-full elite-input font-bold" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="أضف أي ملاحظات تربوية..." />
                         </div>
                      </div>

                      <button type="submit" disabled={isSaving} className="w-full mt-12 primary-gradient py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary-glow/20">
                         {isSaving ? 'Directing to Cloud Hub...' : 'مزامنة وحفظ الإنجاز الموحد'}
                      </button>
                   </div>
                </form>
              ) : (
                <div className="glass-panel p-32 rounded-[3.5rem] border-white/5 flex flex-col items-center text-center">
                   <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-4xl mb-8 shadow-inner ring-1 ring-white/10">🪄</div>
                   <h2 className="text-2xl font-black mb-4">اختيار الطالب للبدء</h2>
                   <p className="text-sm font-bold text-slate-600 max-w-sm">قم باختيار الطالب من القائمة الجانبية للوصول إلى وحدة التحكم برصد الإنجازات اليومية.</p>
                </div>
              )}
           </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
