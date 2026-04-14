'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  collectionGroup,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import HalaqaFilter from '@/components/HalaqaFilter';
import { 
  TrendingUp, 
  Users, 
  Target,
  Download,
  Database,
  Calendar,
  Sparkles,
  Zap,
  ShieldCheck,
  ChevronLeft,
  Settings2,
  BarChart3,
  PieChart,
  Activity,
  Award,
  BookOpen,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { UI_TEXT } from '@/lib/ui-text';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedHalaqaId, setSelectedHalaqaId] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const [stats, setStats] = useState({
    recitations: [] as any[],
    attendance: [] as any[],
    tests: [] as any[],
    students: [] as any[]
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [dateRange, selectedHalaqaId, selectedStage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Students (for the total pool)
      let studentsQuery = query(collection(db, 'users'), where('type', '==', 'student'));
      if (selectedHalaqaId) {
        studentsQuery = query(collection(db, 'users'), where('type', '==', 'student'), where('halaqaId', '==', selectedHalaqaId));
      }
      const studentsSnap = await getDocs(studentsQuery);
      
      let studentsData = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Secondary filter by stage (Parity with general_reports_page.dart)
      if (selectedStage !== 'all') {
        studentsData = studentsData.filter((s: any) => s.educationalStage === selectedStage);
      }
      
      const studentIds = studentsData.map(s => s.id);
      
      // 2. Fetch Data using collectionGroup for the range
      // We use collectionGroup to get all records, then filter by studentIds in memory if a specific halaqa is selected
      // This is necessary because Firestore doesn't support whereIn for collectionGroup with range filters easily without indexing every path
      
      const [recSnap, attSnap, testSnap] = await Promise.all([
        getDocs(query(
          collectionGroup(db, 'dailyrecitations'), 
          where('date', '>=', dateRange.start),
          where('date', '<=', dateRange.end)
        )),
        getDocs(query(
          collectionGroup(db, 'tracking'), 
          where('type', '==', 'attendance'),
          where('date', '>=', dateRange.start),
          where('date', '<=', dateRange.end)
        )),
        getDocs(query(
          collectionGroup(db, 'testsessions'), 
          where('date', '>=', dateRange.start),
          where('date', '<=', dateRange.end)
        ))
      ]);

      const filterByHalaqa = (list: any[]) => {
        if (!selectedHalaqaId) return list;
        return list.filter(item => studentIds.includes(item.user_id || item.student_id));
      };

      setStats({
        students: studentsData,
        recitations: filterByHalaqa(recSnap.docs.map(d => ({ id: d.id, ...d.data() }))),
        attendance: filterByHalaqa(attSnap.docs.map(d => ({ id: d.id, ...d.data() }))),
        tests: filterByHalaqa(testSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      });

    } catch (e) {
      console.error("Reports Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const exportBriefReport = () => {
    // Parity with general_reports_page.dart (Brief Excel)
    const reportData = stats.students.map(student => {
      const sRecs = stats.recitations.filter(r => (r.user_id || r.student_id) === student.id);
      const sAtt = stats.attendance.filter(a => (a.user_id || a.student_id) === student.id);
      
      return {
        'الاسم': student.displayName,
        'المرحلة': student.educationalStage,
        'إجمالي الصفحات': sRecs.reduce((acc, r) => acc + (r.page_count || 1), 0),
        'نسبة الحضور': sAtt.length > 0 ? `${Math.round((sAtt.filter(a => a.status === 'present').length / sAtt.length) * 100)}%` : '0%',
        'آخر تقييم': sRecs[0]?.rating || sRecs[0]?.grade_enum || '---'
      };
    });
    
    console.log("Exporting Brief Report...", reportData);
    setFeedbackMessage(UI_TEXT.messages.reportExporting(reportData.length));
  };

  // Logic Selectors (Parity with GeneralReportsPage.dart)
  const analytics = useMemo(() => {
    const recs = stats.recitations;
    const atts = stats.attendance;
    const tests = stats.tests;

    // 1. Attendance Pct
    const presentCount = atts.filter(a => a.status === 'present').length;
    const attendancePct = atts.length > 0 ? Math.round((presentCount / atts.length) * 100) : 0;

    // 2. Memorization Quality (Rating Mapping: 1: Mutaqen, 2-3: VGood/Good, 4-5: Weak)
    const qualities = { mutaqen: 0, good: 0, weak: 0 };
    recs.forEach(r => {
      const rating = r.rating || r.grade_enum;
      if (rating === 1) qualities.mutaqen++;
      else if (rating <= 3) qualities.good++;
      else qualities.weak++;
    });

    // 3. Pages Summary
    const totalPages = recs.reduce((acc, r) => acc + (r.page_count || 1), 0);
    const avgPagesPerStudent = stats.students.length > 0 ? (totalPages / stats.students.length).toFixed(1) : 0;

    // 4. Honor Roll (لوحة الشرف) - Top 5 Students
    const studentPerformance: Record<string, { id: string, name: string, score: number, pages: number, quality: number }> = {};
    
    recs.forEach(r => {
       const sid = r.user_id || r.student_id;
       if (!sid) return;
       if (!studentPerformance[sid]) {
          studentPerformance[sid] = { id: sid, name: r.student_name, score: 0, pages: 0, quality: 0 };
       }
       
       const pages = r.page_count || 1;
       const rating = r.rating || r.grade_enum || 3;
       // High-Performance Weighting: Mutaqen (1) gets 2x bonus, Good (2-3) 1x, Weak (4-5) 0.5x
       const weight = rating === 1 ? 2.0 : (rating <= 3 ? 1.0 : 0.5);
       
       studentPerformance[sid].pages += pages;
       studentPerformance[sid].score += (pages * weight);
    });

    const honorRoll = Object.values(studentPerformance)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      attendancePct,
      qualities,
      totalPages,
      avgPagesPerStudent,
      activeStudents: stats.students.length,
      achievementCount: recs.length,
      testCount: tests.length,
      honorRoll
    };
  }, [stats]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12" dir="rtl">
        
        {/* Header */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-8 md:p-10 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
           
           <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-4">
                 <h1 className="text-2xl font-black text-slate-900 dark:text-white family-cairo tracking-tight">التقارير العامة للطلاب</h1>
                 <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                    استعراض شامل لسجلات التسميع، الاختبارات، والحضور لجميع طلاب الحلقات خلال الفترة المحددة.
                 </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                 <Button 
                   variant="outline" 
                   onClick={() => exportBriefReport()}
                   className="h-11 px-6 rounded-xl border-slate-200 bg-white dark:bg-slate-900 font-semibold gap-2 hover:bg-slate-50 transition-all active:scale-[0.98]"
                 >
                    <Download className="w-4 h-4" />
                    تصدير التقرير الموجز
                 </Button>
                 <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 bg-white dark:bg-slate-900 font-semibold gap-2">
                    <Download className="w-4 h-4" />
                    تصدير التقرير الكامل
                 </Button>
              </div>
           </div>
        </div>

        {/* Global Local Filters */}
        <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col lg:flex-row items-center gap-4">
           <div className="w-full lg:w-96">
              <HalaqaFilter 
                selectedId={selectedHalaqaId}
                onSelect={setSelectedHalaqaId}
              />
           </div>
           <div className="w-full lg:w-48">
              <SearchableSelect
                value={selectedStage}
                onChange={setSelectedStage}
                options={[
                  { value: 'all', label: 'كل المراحل' },
                  { value: 'ابتدائي', label: 'ابتدائي' },
                  { value: 'متوسط', label: 'متوسط' },
                  { value: 'ثانوي', label: 'ثانوي' },
                  { value: 'جامعي', label: 'جامعي' },
                ]}
                searchPlaceholder="ابحث عن المرحلة..."
                className="h-11"
              />
           </div>
           <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="relative">
                 <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                 <Input 
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="h-11 pr-10 rounded-xl bg-white dark:bg-slate-900"
                 />
              </div>
              <div className="relative">
                 <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                 <Input 
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="h-11 pr-10 rounded-xl bg-white dark:bg-slate-900"
                 />
              </div>
           </div>
           <Button variant="ghost" className="h-11 w-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <Filter className="w-5 h-5 text-slate-400" />
           </Button>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <AnalyticsMiniStat label="إحصائيات الحفظ" value={analytics.achievementCount} sub="عملية تسميع مسجلة" icon={BookOpen} color="blue" />
           <AnalyticsMiniStat label="نسبة الانضباط" value={`${analytics.attendancePct}%`} sub="متوسط الحضور العام" icon={ShieldCheck} color="emerald" />
           <AnalyticsMiniStat label="إجمالي الصفحات" value={analytics.totalPages} sub="إنجاز تراكمي للفترة" icon={Database} color="indigo" />
           <AnalyticsMiniStat label="مؤشر الطالب" value={analytics.avgPagesPerStudent} sub="صفحة / لكل طالب" icon={TrendingUp} color="rose" />
        </div>

        {/* Main Analytics Content */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
           {/* Recitation Quality Ticker */}
           <Card className="xl:col-span-4 p-6 rounded-2xl border-slate-200/70 dark:border-slate-800 flex flex-col gap-6">
              <div className="space-y-2">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">توزيع جودة الأداء</h3>
                 <p className="text-sm font-bold text-slate-500">تحليل مستويات الإتقان بناءً على التقييم الفني للمدرسين.</p>
              </div>

              <div className="space-y-8">
                 <QualityBar label="متقن (ممتاز)" value={analytics.qualities.mutaqen} total={analytics.achievementCount} color="bg-emerald-500" />
                 <QualityBar label="جيد جداً / جيد" value={analytics.qualities.good} total={analytics.achievementCount} color="bg-blue-500" />
                 <QualityBar label="بحاجة لمتابعة" value={analytics.qualities.weak} total={analytics.achievementCount} color="bg-rose-500" />
              </div>

              <div className="mt-2 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">كفاءة الحفظ</span>
                    <p className="text-2xl font-black text-slate-900 dark:text-white family-mono">
                      {analytics.achievementCount > 0 ? Math.round((analytics.qualities.mutaqen / analytics.achievementCount) * 100) : 0}%
                    </p>
                 </div>
                 <Badge variant="success" className="h-10 px-4 rounded-xl flex items-center gap-2">
                    <Award size={14} />
                    ممتاز
                 </Badge>
              </div>
           </Card>

            {/* Honor Roll (لوحة الشرف) - Strategic Parity */}
            <Card className="xl:col-span-8 p-6 rounded-2xl border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
               
               <div className="flex items-center justify-between relative z-10 mb-10">
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <Award className="text-amber-500 w-6 h-6 animate-bounce" />
                        <h3 className="text-xl font-black text-slate-900 dark:text-white family-cairo">لوحة الشرف المؤسسية للمتميزين</h3>
                     </div>
                     <p className="text-sm font-bold text-slate-500">الفرسان الخمسة الأعلى إنجازاً وإتقاناً خلال الفترة المحددة.</p>
                  </div>
                  <Badge variant="warning" className="h-10 px-6 rounded-2xl bg-amber-50 text-amber-600 border-amber-100 font-black text-[10px] uppercase tracking-widest">TOP PERFORMANCE</Badge>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
                  {analytics.honorRoll.map((student, idx) => (
                    <motion.div 
                      key={student.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm"
                    >
                       <div className="relative mb-4">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border-2 transition-all duration-500 ${idx === 0 ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                             {idx + 1}
                          </div>
                          {idx === 0 && <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-pulse" />}
                       </div>
                       <h4 className="font-bold text-center text-slate-900 dark:text-white text-sm family-cairo tracking-tight mb-2 line-clamp-1">{student.name}</h4>
                       <div className="space-y-1 text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.pages} صفحة</p>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                             <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (student.score / (analytics.honorRoll[0]?.score || 1)) * 100)}%` }}></div>
                          </div>
                       </div>
                    </motion.div>
                  ))}
               </div>

               <div className="mt-10 flex items-center justify-center">
                  <Button variant="ghost" className="text-blue-500 font-black text-[10px] tracking-widest uppercase hover:bg-blue-50 rounded-2xl px-10 gap-3">
                     عرض قائمة التميز الكاملة
                     <ChevronLeft size={16} />
                  </Button>
               </div>
            </Card>

            {/* Detailed Activity Feed */}
           <Card className="xl:col-span-12 p-6 rounded-2xl border-slate-200/70 dark:border-slate-800 space-y-6">
               <div className="flex items-center justify-between">
                  <div className="space-y-2">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">سجل النشاط الإحصائي التفصيلي</h3>
                     <p className="text-sm font-bold text-slate-500">استعراض تفصيلي لأحدث العمليات المسجلة في الفترة المحددة.</p>
                  </div>
                  <Button variant="ghost" className="text-blue-600 font-bold text-xs uppercase tracking-widest">تصفية متقدمة</Button>
               </div>

              <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full text-right border-collapse">
                    <thead>
                       <tr className="border-b border-slate-50 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          <th className="px-4 py-6 text-right">التاريخ</th>
                          <th className="px-4 py-6 text-right">الطالب</th>
                          <th className="px-4 py-6 text-right">النوع</th>
                          <th className="px-4 py-6 text-right">المقدار</th>
                          <th className="px-4 py-6 text-center">التقييم</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                       {loading ? (
                         Array(5).fill(0).map((_, i) => (
                           <tr key={i}><td colSpan={5} className="py-8"><Skeleton className="h-4 w-full" /></td></tr>
                         ))
                       ) : stats.recitations.length === 0 ? (
                         <tr><td colSpan={5} className="py-24 text-center text-slate-300 font-bold family-cairo">لا توجد بيانات مسجلة في هذا النطاق الزمني</td></tr>
                       ) : stats.recitations.slice(0, 10).map((r, i) => (
                         <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group">
                            <td className="px-4 py-5 text-[11px] font-black text-slate-400 family-mono tracking-widest">{r.date}</td>
                            <td className="px-4 py-5 font-bold text-slate-900 dark:text-white text-sm tracking-tight">{r.student_name}</td>
                            <td className="px-4 py-5">
                               <Badge variant={r.type === 'memorization' ? 'info' : 'slate'} className="text-[10px] px-2 py-0.5 rounded-lg border-none uppercase font-black tracking-widest">
                                  {r.type === 'memorization' ? 'حفظ' : 'مراجعة'}
                               </Badge>
                            </td>
                            <td className="px-4 py-5 text-sm font-bold text-slate-600 dark:text-slate-400">{r.amount}</td>
                            <td className="px-4 py-5 text-center transition-transform group-hover:scale-110">
                               <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 mx-auto flex items-center justify-center font-black text-xs text-blue-600">
                                  {r.rating || r.grade_enum || '-'}
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>

      </div>
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
    </DashboardLayout>
  );
}

function AnalyticsMiniStat({ label, value, sub, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'from-blue-600 to-indigo-600 shadow-blue-500/10',
    emerald: 'from-emerald-600 to-teal-600 shadow-emerald-500/10',
    indigo: 'from-indigo-600 to-violet-600 shadow-indigo-500/10',
    rose: 'from-rose-500 to-pink-600 shadow-rose-500/10'
  };

  return (
    <Card className="p-8 border-slate-200/60 dark:border-slate-800 flex flex-col gap-6 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
       <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors[color]} opacity-0 group-hover:opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl transition-opacity duration-700`}></div>
       
       <div className="flex items-start justify-between relative z-10">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[color]} text-white flex items-center justify-center shadow-xl shadow-black/5 group-hover:scale-110 transition-transform duration-500`}>
             <Icon size={28} />
          </div>
          <div className="text-left font-black text-slate-900 dark:text-white text-3xl family-mono tracking-tighter">
             {value}
          </div>
       </div>
       <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-xs font-bold text-slate-500">{sub}</p>
       </div>
    </Card>
  );
}

function QualityBar({ label, value, total, color }: any) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-3">
       <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
          <span className="text-slate-500">{label}</span>
          <span className="text-slate-900 dark:text-white family-mono">{pct}% ({value})</span>
       </div>
       <div className="w-full h-2.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-100 dark:border-slate-800">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full ${color} rounded-full shadow-lg`}
          />
       </div>
    </div>
  );
}
