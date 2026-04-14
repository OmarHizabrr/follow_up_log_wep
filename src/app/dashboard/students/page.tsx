'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import HalaqaFilter from '@/components/HalaqaFilter';
import { 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  ChevronLeft,
  Users,
  Download,
  ChevronRight,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { UI_TEXT } from '@/lib/ui-text';

interface Student {
  id: string;
  displayName: string;
  educationalStage: string;
  halaqaId: string;
  number: string | number;
  photoURL?: string;
  isActive: boolean;
  createdAt?: Timestamp;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalaqaId, setSelectedHalaqaId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'users'), where('type', '==', 'student'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setStudents(snap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Student)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteStudent = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'users', deleteTarget.id));
      setStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.number?.toString().includes(searchQuery);
      const matchesHalaqa = !selectedHalaqaId || s.halaqaId === selectedHalaqaId;
      return matchesSearch && matchesHalaqa;
    });
  }, [students, searchQuery, selectedHalaqaId]);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-8 sm:pb-12" dir="rtl">
        
        {/* Modern Header Section */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-5 sm:p-8 md:p-10 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-10 lg:gap-16 text-right">
            <div className="space-y-4">
              <Badge variant="info" className="px-3 py-1 rounded-lg border-blue-100/50 text-[10px] font-black uppercase tracking-widest">
                <Users className="w-3.5 h-3.5" />
                قاعدة البيانات المؤسسية الموحدة
              </Badge>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white family-cairo tracking-tight">
                إدارة وسجلات الطلاب
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                إدارة شاملة لملفات الطلاب، متابعة المستويات التعليمية، والتحكم في صلاحيات الوصول والحالة النشطة.
              </p>
            </div>
            
            <Button 
              onClick={() => router.push('/dashboard/students/add')} 
              className="w-full sm:w-auto shrink-0 group gap-2"
            >
              إضافة طالب جديد
              <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
           <div className="lg:col-span-4">
               <HalaqaFilter 
                selectedId={selectedHalaqaId}
                onSelect={setSelectedHalaqaId}
               />
           </div>
           <div className="lg:col-span-6">
              <Input
                type="text"
                placeholder="بحث بالاسم، الرقم، أو المستوى..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
                className="h-11 bg-white dark:bg-[#0f172a] border-slate-200/70 dark:border-slate-800"
              />
           </div>
           <div className="lg:col-span-2">
              <Button variant="outline" className="w-full h-11 px-5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold gap-2">
                <Download className="w-5 h-5" />
                تصدير
              </Button>
           </div>
        </div>

        {/* Data Table */}
        <Card className="overflow-hidden border-slate-200/70 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto custom-scrollbar -mx-px">
            <table className="w-full min-w-[720px] text-right">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ملف الطالب</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">الرقم الأكاديمي</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">نبض الإنجاز</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">الحالة الإدارية</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">التفاعل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                <AnimatePresence mode="popLayout">
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td className="px-3 sm:px-6 py-3 sm:py-4"><div className="flex items-center gap-4"><Skeleton className="w-12 h-12 rounded-xl" /><div className="space-y-2"><Skeleton className="h-4 w-32 rounded" /><Skeleton className="h-3 w-20 rounded" /></div></div></td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4"><Skeleton className="h-9 w-24 rounded-xl" /></td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4"><Skeleton className="h-9 w-28 rounded-xl" /></td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4"><Skeleton className="h-9 w-9 rounded-xl mr-auto" /></td>
                      </tr>
                    ))
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 sm:px-8 py-20 sm:py-32 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                           <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                              <Database size={48} className="text-slate-200" />
                           </div>
                           <p className="text-lg font-black text-slate-400 family-cairo">لا توجد سجلات مطابقة للمعايير</p>
                           <Button variant="ghost" onClick={() => { setSearchQuery(''); setSelectedHalaqaId(null); }} className="text-blue-600 font-bold">إعادة تعيين الفلاتر</Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <motion.tr 
                        key={student.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer border-r-4 border-transparent hover:border-blue-600/40"
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4" onClick={() => router.push(`/dashboard/students/${student.id}`)}>
                          <div className="flex items-center gap-5">
                            <div className="relative shrink-0">
                               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-xl text-slate-400 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                  {student.photoURL ? (
                                    <img src={student.photoURL} alt={student.displayName} className="w-full h-full object-cover rounded-2xl" />
                                  ) : student.displayName[0]}
                               </div>
                               {student.isActive && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></div>}
                            </div>
                            <div className="min-w-0">
                               <p className="font-bold text-slate-900 dark:text-white truncate text-base tracking-tight family-cairo">{student.displayName}</p>
                               <span className="text-[10px] font-bold text-slate-400 block mt-1 tracking-widest uppercase">تاريخ الانضمام: {student.createdAt?.toDate().toLocaleDateString('ar-SA')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span className="text-[13px] font-black text-slate-600 dark:text-slate-400 family-mono border border-slate-100 dark:border-slate-800 px-4 py-2 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40">#{student.number}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex flex-col gap-1">
                             <Badge variant="slate" className="px-3 py-1 rounded-lg border-none bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest w-fit">
                               {student.educationalStage || 'غير محدد'}
                             </Badge>
                             <div className="flex items-center gap-2 mt-1 px-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">نشط اليوم</span>
                             </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                           <Badge variant={student.isActive ? 'success' : 'slate'} className="px-5 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2 bg-white dark:bg-slate-900 border-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${student.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
                              {student.isActive ? 'مفعل' : 'معطل'}
                           </Badge>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                           <div className="flex items-center justify-end gap-2 sm:gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => router.push(`/dashboard/students/${student.id}`)}
                                className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600"
                              >
                                <ChevronLeft size={18} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => router.push(`/dashboard/students/${student.id}/edit`)}
                                className="w-10 h-10 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <Edit3 size={16} />
                              </Button>
                              <Button
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(student);
                                }}
                                className="w-10 h-10 rounded-2xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </Button>
                           </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-blue-500/20">
                   {filteredStudents.length}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{selectedHalaqaId ? 'طالب من الحلقة المختارة' : 'إجمالي السجلات النشطة'}</span>
             </div>
             
             <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" disabled className="w-12 h-12 rounded-2xl opacity-40 border-slate-200">
                   <ChevronRight size={20} />
                </Button>
                <div className="px-6 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-black text-slate-500 tracking-widest uppercase">
                   الصفحة 01 من 01
                </div>
                <Button variant="outline" size="icon" disabled className="w-12 h-12 rounded-2xl opacity-40 border-slate-200">
                   <ChevronLeft size={20} />
                </Button>
             </div>
          </div>
        </Card>

      </div>
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={UI_TEXT.dialogs.deleteTitle}
      >
        <div className="space-y-6 text-right">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {deleteTarget ? UI_TEXT.messages.deleteStudent(deleteTarget.displayName) : ''}
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" className="h-11 px-6" onClick={() => setDeleteTarget(null)}>
              {UI_TEXT.actions.cancel}
            </Button>
            <Button variant="danger" className="h-11 px-6" onClick={confirmDeleteStudent}>
              {UI_TEXT.actions.confirmDelete}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
