'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc,
  collectionGroup,
  limit,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import HalaqaFilter from '@/components/HalaqaFilter';
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Save, 
  Clock,
  Info,
  MessageSquare,
  Search,
  CheckSquare,
  Users,
  Sparkles,
  Zap,
  ArrowRightLeft,
  History,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { getStudentSubCollection, injectMetadata } from '@/lib/firebaseUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { UI_TEXT } from '@/lib/ui-text';
import { subDays, format, eachDayOfInterval, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Student {
  id: string;
  displayName: string;
  number?: string | number;
  photoURL?: string;
  halaqaId?: string;
}

export default function AttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'matrix'>('daily');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalaqaId, setSelectedHalaqaId] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState<Record<string, { status: string, note: string }>>({});
  const [yesterdayAttendance, setYesterdayAttendance] = useState<Record<string, string>>({});
  
  // Matrix State
  const [matrixData, setMatrixData] = useState<Record<string, Record<string, string>>>({});
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (students.length > 0) {
      fetchYesterdayStatus();
    }
  }, [students, attendanceDate]);

  useEffect(() => {
    if (viewMode === 'matrix' && selectedHalaqaId) {
      fetchMatrixData();
    }
  }, [viewMode, selectedHalaqaId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('type', '==', 'student')));
      const studentList = snap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Student));
      studentList.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setStudents(studentList);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchYesterdayStatus = async () => {
    try {
      const yesterday = format(subDays(new Date(attendanceDate), 1), 'yyyy-MM-dd');
      const q = query(
        collectionGroup(db, 'tracking'), 
        where('type', '==', 'attendance'), 
        where('date', '==', yesterday)
      );
      const snap = await getDocs(q);
      const statusMap: Record<string, string> = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.user_id) statusMap[data.user_id] = data.status;
      });
      setYesterdayAttendance(statusMap);
    } catch (e) {
      console.error("Error fetching history:", e);
    }
  };

  const fetchMatrixData = async () => {
    setMatrixLoading(true);
    try {
      const days = eachDayOfInterval({
        start: subDays(new Date(), 13),
        end: new Date()
      });
      const dateStrings = days.map(d => format(d, 'yyyy-MM-dd'));

      // Fetch all attendance for the circle in range
      const q = query(
        collectionGroup(db, 'tracking'),
        where('type', '==', 'attendance'),
        where('halaqa_id', '==', selectedHalaqaId),
        where('date', '>=', dateStrings[0]),
        where('date', '<=', dateStrings[dateStrings.length - 1])
      );

      const snap = await getDocs(q);
      const fullMap: Record<string, Record<string, string>> = {};
      
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (!fullMap[d.user_id]) fullMap[d.user_id] = {};
        fullMap[d.user_id][d.date] = d.status;
      });
      setMatrixData(fullMap);
    } catch (e) { console.error("Matrix error:", e); }
    finally { setMatrixLoading(false); }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({ 
      ...prev, 
      [studentId]: { ...prev[studentId], status } 
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceData(prev => ({ 
      ...prev, 
      [studentId]: { ...prev[studentId], note } 
    }));
  };

  const handleMarkAllPresent = () => {
    const newData = { ...attendanceData };
    filteredStudents.forEach(s => {
      if (!newData[s.id]?.status) {
        newData[s.id] = { status: 'present', note: '' };
      }
    });
    setAttendanceData(newData);
  };

  const handleSaveAll = async () => {
    if (Object.keys(attendanceData).length === 0) return;
    setIsSaving(true);
    try {
      const promises = Object.entries(attendanceData).map(([studentId, data]) => {
        const student = students.find(s => s.id === studentId);
        const colRef = getStudentSubCollection('tracking', studentId);
        const docRef = doc(colRef); 

        const recordData = injectMetadata({
          type: 'attendance',
          status: data.status,
          date: attendanceDate,
          user_id: studentId,
          student_name: student?.displayName || '',
          halaqa_id: student?.halaqaId || '',
          note: data.note || ''
        });

        return setDoc(docRef, recordData);
      });

      await Promise.all(promises);
      setAttendanceData({});
      setFeedbackMessage(UI_TEXT.messages.attendanceSaved);
      if (viewMode === 'matrix') fetchMatrixData();
    } catch (e) {
      console.error(e);
      setFeedbackMessage(UI_TEXT.messages.attendanceSaveError);
    } finally {
      setIsSaving(false);
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

  const matrixDays = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date()
    }).map(d => ({
      str: format(d, 'yyyy-MM-dd'),
      short: format(d, 'dd/MM'),
      dayName: format(d, 'EEEE', { locale: ar }).slice(0, 3)
    })).reverse();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16" dir="rtl">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-8 md:p-10 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12 lg:gap-20 text-right">
            <div className="space-y-4">
              <Badge variant="success" className="px-3 py-1 rounded-lg border-emerald-100/50 text-[10px] font-black uppercase tracking-widest">
                <CheckSquare className="w-3.5 h-3.5" />
                وحدة التحضير والرقابة المركزية
              </Badge>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight family-cairo">
                إدارة وسجل الحضور اليومي
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-2xl">
                نظام رصد الحضور الذكي مع خاصية "المصفوفة التاريخية" لاكتشاف أنماط الغياب وتحسين كفاءة المتابعة.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
               {viewMode === 'daily' && (
                 <Button 
                   onClick={handleMarkAllPresent}
                   variant="outline"
                   className="h-16 px-8 rounded-2xl border-2 border-emerald-100 text-emerald-600 font-black text-sm active:scale-95"
                 >
                   تحضير جميع طلاب القائمة
                 </Button>
               )}
               <Button 
                onClick={handleSaveAll} 
                disabled={isSaving || Object.keys(attendanceData).length === 0} 
                className="h-14 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-sm group gap-3 active:scale-95"
               >
                 {isSaving ? 'جاري الحفظ...' : 'اعتماد السجل النهائي'}
                 {!isSaving && <Save size={24} className="group-hover:scale-110 transition-transform duration-500" />}
               </Button>
            </div>
          </div>
        </div>

        {/* شريط التحكم والفرز */}
        <div className="flex flex-col xl:flex-row items-center gap-4 bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
           <div className="w-full xl:w-96">
              <HalaqaFilter 
                selectedId={selectedHalaqaId}
                onSelect={setSelectedHalaqaId}
              />
           </div>
           
           <div className="flex-1 w-full relative group">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                 placeholder="البحث بالاسم أو المعرف الرقمي..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full h-14 pr-14 pl-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 font-bold text-sm outline-none focus:border-emerald-500/20 shadow-sm transition-all"
              />
           </div>

           <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setViewMode('daily')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'daily' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              >
                 <LayoutGrid size={16} />
                 التدوين اليومي
              </button>
              <button 
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'matrix' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              >
                 <History size={16} />
                 مصفوفة المتابعة
              </button>
           </div>
           
           {viewMode === 'daily' && (
             <div className="w-full xl:w-56">
                <input 
                  type="date" 
                  value={attendanceDate} 
                  onChange={(e) => setAttendanceDate(e.target.value)} 
                  className="w-full h-14 px-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 font-bold text-sm outline-none family-mono"
                />
             </div>
           )}
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'daily' ? (
            <motion.div 
              key="daily"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-10"
            >
               {/* Quick Stats Overlay */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <CounterCard label="إجمالي الطلاب" value={filteredStudents.length} icon={Users} color="bg-blue-600" />
                  <CounterCard label="تم تحضيرهم" value={Object.keys(attendanceData).length} icon={CheckSquare} color="bg-emerald-600" />
                  <CounterCard label="بانتظار الرصد" value={Math.max(0, filteredStudents.length - Object.keys(attendanceData).length)} icon={Clock} color="bg-amber-500" />
                  <CounterCard label="اكتمال المهمة" value={`${filteredStudents.length > 0 ? Math.round((Object.keys(attendanceData).length / filteredStudents.length) * 100) : 0}%`} icon={Zap} color="bg-indigo-600" />
               </div>

               {/* Presence Grid */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {isLoading ? (
                    Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)
                  ) : filteredStudents.length === 0 ? (
                    <EmptyState />
                  ) : (
                    filteredStudents.map(student => {
                      const selection = attendanceData[student.id]?.status;
                      const yesterdayStatus = yesterdayAttendance[student.id];
                      return (
                        <Card key={student.id} className={`p-8 rounded-2xl transition-all duration-500 border-2 relative overflow-hidden group hover:shadow-md ${
                          selection === 'present' ? 'border-emerald-500/30 bg-emerald-500/[0.02]' :
                          selection === 'absent' ? 'border-rose-500/30 bg-rose-500/[0.02]' :
                          selection === 'late' ? 'border-amber-500/30 bg-amber-500/[0.02]' :
                          selection === 'excused' ? 'border-blue-500/30 bg-blue-500/[0.02]' : 'border-slate-100 dark:border-slate-800'
                        }`}>
                           <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                           
                           <div className="space-y-8 relative z-10">
                              <div className="flex items-start justify-between">
                                 <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[1.8rem] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-2xl text-slate-400 group-hover:scale-110 shadow-inner overflow-hidden shrink-0">
                                       {student.photoURL ? <img src={student.photoURL} className="w-full h-full object-cover" /> : student.displayName[0]}
                                    </div>
                                    <div className="space-y-1">
                                       <h3 className="font-black text-lg text-slate-900 dark:text-white family-cairo tracking-tight">{student.displayName}</h3>
                                       <Badge variant="slate" className="bg-slate-50 dark:bg-slate-800 border-none font-bold text-[8px] uppercase tracking-widest">#{student.number}</Badge>
                                    </div>
                                 </div>
                                 
                                 {yesterdayStatus && (
                                   <div className="text-left group/yesterday">
                                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-1">الأمس</span>
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover/yesterday:scale-110 ${getYesterdayColor(yesterdayStatus)}`}>
                                         {getYesterdayIcon(yesterdayStatus)}
                                      </div>
                                   </div>
                                 )}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                 <StatusToggle active={selection === 'present'} color="emerald" icon={CheckCircle2} label="حاضر" onClick={() => handleStatusChange(student.id, 'present')} />
                                 <StatusToggle active={selection === 'absent'} color="rose" icon={XCircle} label="غائب" onClick={() => handleStatusChange(student.id, 'absent')} />
                                 <StatusToggle active={selection === 'late'} color="amber" icon={Clock} label="متأخر" onClick={() => handleStatusChange(student.id, 'late')} />
                                 <StatusToggle active={selection === 'excused'} color="blue" icon={Info} label="مستأذن" onClick={() => handleStatusChange(student.id, 'excused')} />
                              </div>

                              <div className="relative group/note">
                                 <MessageSquare className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/note:text-emerald-500 transition-colors" size={16} />
                                 <input 
                                    placeholder="تدوين ملاحظة تربوية..."
                                    className="w-full h-12 pr-12 pl-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] font-bold outline-none focus:border-emerald-500/20 transition-all"
                                    value={attendanceData[student.id]?.note || ''}
                                    onChange={(e) => handleNoteChange(student.id, e.target.value)}
                                 />
                              </div>
                           </div>
                        </Card>
                      );
                    })
                  )}
               </div>
            </motion.div>
          ) : (
            <motion.div 
               key="matrix"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.98 }}
               className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm overflow-hidden"
            >
               {!selectedHalaqaId ? (
                 <div className="py-40 text-center space-y-4">
                    <AlertCircle size={64} className="mx-auto text-slate-100" />
                    <h3 className="text-xl font-bold text-slate-400 family-cairo">يرجى تحديد الحلقة لمشاهدة المصفوفة</h3>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Select a circle to activate matrix oversight</p>
                 </div>
               ) : matrixLoading ? (
                 <div className="py-40 flex flex-col items-center justify-center gap-6">
                    <RefreshCw size={48} className="text-emerald-500 animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">جاري تحليل البيانات التاريخية...</p>
                 </div>
               ) : (
                 <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-right border-collapse">
                       <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                             <th className="px-10 py-8 min-w-[280px] sticky right-0 bg-slate-50 dark:bg-slate-900 z-10 border-l border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-4">
                                   <Users size={20} className="text-slate-400" />
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">اسم الطالب / سجل الحضور</span>
                                </div>
                             </th>
                             {matrixDays.map(day => (
                               <th key={day.str} className="px-4 py-8 text-center min-w-[90px] group">
                                  <div className="space-y-1 group-hover:scale-110 transition-transform">
                                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{day.dayName}</p>
                                     <p className="text-sm font-black text-slate-900 dark:text-white family-mono">{day.short}</p>
                                  </div>
                               </th>
                             ))}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                          {filteredStudents.map(student => (
                            <tr key={student.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors group">
                               <td className="px-10 py-6 sticky right-0 bg-white dark:bg-[#0f172a] group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10 border-l border-slate-50 dark:border-slate-800 border-r-4 border-r-transparent group-hover:border-r-emerald-500 transition-all">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400">
                                        {student.displayName[0]}
                                     </div>
                                     <div>
                                        <p className="font-bold text-sm text-slate-800 dark:text-white family-cairo">{student.displayName}</p>
                                        <p className="text-[9px] font-bold text-slate-400 family-mono">#{student.number}</p>
                                     </div>
                                  </div>
                               </td>
                               {matrixDays.map(day => {
                                 const status = matrixData[student.id]?.[day.str];
                                 return (
                                   <td key={day.str} className="px-4 py-6 text-center">
                                      <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center border transition-all ${getCellStyle(status)}`}>
                                         {getCellIcon(status)}
                                      </div>
                                   </td>
                                 );
                               })}
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      <Modal
        isOpen={Boolean(feedbackMessage)}
        onClose={() => setFeedbackMessage(null)}
        title="تنبيه النظام"
      >
        <div className="space-y-6 text-right">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {feedbackMessage || ''}
          </p>
          <div className="flex justify-end">
            <Button className="h-10 px-6" onClick={() => setFeedbackMessage(null)}>
              {UI_TEXT.actions.close}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

function CounterCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="p-8 border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all duration-500 group relative overflow-hidden rounded-[2.5rem]">
       <div className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-0 group-hover:opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl transition-opacity`}></div>
       <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 shrink-0`}>
             <Icon size={28} />
          </div>
          <div className="space-y-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</span>
             <span className="text-3xl font-black text-slate-900 dark:text-white family-mono tracking-tighter">{value}</span>
          </div>
       </div>
    </Card>
  );
}

function StatusToggle({ active, color, icon: Icon, label, onClick }: any) {
  const themes: any = {
    emerald: active ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-500/20 scale-105' : 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 hover:text-slate-600 hover:bg-white',
    rose: active ? 'bg-rose-600 text-white border-rose-600 shadow-xl shadow-rose-500/20 scale-105' : 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 border-slate-100 dark:border-slate-800 hover:border-rose-500/30 hover:text-slate-600 hover:bg-white',
    amber: active ? 'bg-amber-500 text-white border-amber-500 shadow-xl shadow-amber-500/20 scale-105' : 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 border-slate-100 dark:border-slate-800 hover:border-amber-500/30 hover:text-slate-600 hover:bg-white',
    blue: active ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20 scale-105' : 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 border-slate-100 dark:border-slate-800 hover:border-blue-500/30 hover:text-slate-600 hover:bg-white',
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 h-20 rounded-[1.8rem] border transition-all active:scale-95 ${themes[color]}`}
    >
       <Icon size={20} className={active ? 'animate-bounce-short' : ''} />
       <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}

function getYesterdayColor(status: string) {
  switch (status) {
    case 'present': return 'bg-emerald-50 text-emerald-500 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30';
    case 'absent': return 'bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30';
    case 'late': return 'bg-amber-50 text-amber-500 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30';
    default: return 'bg-slate-50 text-slate-300 border-slate-100 dark:bg-slate-800 dark:border-slate-700';
  }
}

function getYesterdayIcon(status: string) {
  switch (status) {
    case 'present': return <CheckCircle2 size={16} />;
    case 'absent': return <XCircle size={16} />;
    case 'late': return <Clock size={16} />;
    default: return <Info size={16} />;
  }
}

function getCellStyle(status?: string) {
  if (!status) return 'border-slate-50 dark:border-slate-900 text-slate-100';
  switch (status) {
     case 'present': return 'bg-emerald-50 text-emerald-500 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/20';
     case 'absent': return 'bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/20';
     case 'late': return 'bg-amber-50 text-amber-500 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/20';
     case 'excused': return 'bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/20';
     default: return 'bg-slate-50 text-slate-300';
  }
}

function getCellIcon(status?: string) {
  if (!status) return null;
  switch (status) {
     case 'present': return <CheckCircle2 size={18} />;
     case 'absent': return <XCircle size={18} />;
     case 'late': return <Clock size={18} />;
     case 'excused': return <Info size={18} />;
     default: return <History size={18} />;
  }
}

function EmptyState() {
  return (
    <div className="col-span-full py-32 bg-white dark:bg-[#0f172a] rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center p-10 opacity-60">
        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-8 border border-slate-100">
            <Users size={48} className="text-slate-200" />
        </div>
        <h3 className="text-2xl font-black text-slate-500 family-cairo">لا توجد سجلات مطابقة في دائرة البحث الحالية</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Adjust filters or select a different circle</p>
    </div>
  );
}
