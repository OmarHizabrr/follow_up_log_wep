'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  BookOpen, 
  Search, 
  ChevronLeft, 
  CheckCircle2,
  List
} from 'lucide-react';

export default function RecitationPage() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
    fetchData();
  }, [router]);

  const fetchData = async () => {
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
      alert('تم حفظ السجل بنجاح');
      setSelectedStudent(null);
      setFormData({ type: 'memorization', amount: '', rating: 5, notes: '' });
    } catch (e) {
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number?.toString().includes(searchQuery)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">متابعة الحفظ</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">سجل إنجازات الطلاب في الحفظ والمراجعة.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
           
           {/* Sidebar Selection List */}
           <div className="lg:col-span-4 enterprise-card bg-white dark:bg-gray-800 overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                 <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <List className="w-4 h-4 text-gray-500" />
                    قائمة الطلاب
                 </h3>
                 <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="ابحث هنا..." 
                      className="enterprise-input py-2 pr-9 bg-white dark:bg-gray-900"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                 {isLoading ? (
                   Array(6).fill(0).map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg mb-2 animate-pulse"></div>)
                 ) : filteredStudents.map(s => (
                   <button 
                     key={s.id} 
                     onClick={() => setSelectedStudent(s)}
                     className={`w-full p-3 rounded-lg text-right flex items-center justify-between mb-1 transition-colors ${selectedStudent?.id === s.id ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'}`}
                   >
                      <div className="flex items-center gap-3 min-w-0">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${selectedStudent?.id === s.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                            {s.displayName[0]}
                         </div>
                         <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${selectedStudent?.id === s.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{s.displayName}</p>
                            <p className="text-xs text-gray-500 truncate">
                              رقم: {s.number}
                            </p>
                         </div>
                      </div>
                      {selectedStudent?.id === s.id && <ChevronLeft className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                   </button>
                 ))}
              </div>
           </div>

           {/* Input Form Panel */}
           <div className="lg:col-span-8">
              {selectedStudent ? (
                <form 
                  onSubmit={handleSave} 
                  className="enterprise-card bg-white dark:bg-gray-800 p-6 flex flex-col min-h-[600px]"
                >
                   <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6 flex items-center justify-between">
                      <div>
                         <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                           تسجيل إنجاز: <span className="text-blue-600 dark:text-blue-400">{selectedStudent.displayName}</span>
                         </h2>
                         <p className="text-sm text-gray-500 mt-1">المرحلة: {selectedStudent.educationalStage}</p>
                      </div>
                      <button type="button" onClick={() => setSelectedStudent(null)} className="text-sm text-gray-500 hover:text-gray-900 hover:underline">
                         إلغاء التحديد
                     </button>
                   </div>

                   <div className="space-y-6 flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                               نوع الإنجاز
                            </label>
                            <select className="enterprise-input" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                               <option value="memorization">حفظ جديد</option>
                               <option value="revision">مراجعة</option>
                               <option value="tathbeet">تثبيت</option>
                               <option value="tashih_tilawah">تصحيح تلاوة</option>
                            </select>
                         </div>
                         
                         <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                               المقدار المنجز
                            </label>
                            <input type="text" className="enterprise-input" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="مثال: سورة البقرة صفحة 5" required />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                            تقييم الأداء (من 5)
                         </label>
                         <div className="flex gap-3">
                            {[1, 2, 3, 4, 5].map(v => (
                              <button 
                                key={v} 
                                type="button" 
                                onClick={() => setFormData({...formData, rating: v})} 
                                className={`flex-1 py-3 border rounded-lg text-lg font-bold transition-colors ${formData.rating === v ? 'bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                              >
                                 {v}
                              </button>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                         <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                            الملاحظات (اختياري)
                         </label>
                         <textarea rows={4} className="enterprise-input resize-none" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="اكتب التعليمات أو الملاحظات هنا..." />
                      </div>
                   </div>

                   <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                      <button 
                         type="submit" 
                         disabled={isSaving} 
                         className="enterprise-button min-w-[150px]"
                      >
                         {isSaving ? 'لحظات...' : 'حفظ السجل'}
                         {!isSaving && <CheckCircle2 className="w-4 h-4 ml-2" />}
                      </button>
                   </div>
                </form>
              ) : (
                <div className="enterprise-card bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center text-center h-[600px] border-dashed border-2">
                   <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 mb-4">
                      <BookOpen className="w-8 h-8" />
                   </div>
                   <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">الرجاء تحديد طالب للاستمرار</h2>
                   <p className="text-sm text-gray-500 max-w-sm">اختر إسماً من القائمة الجانبية لإدخال بيانات الحفظ والمراجعة لهذا السجل.</p>
                </div>
              )}
           </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
