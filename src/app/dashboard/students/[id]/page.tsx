'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  getDocs, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  UserCircle2, 
  Calendar, 
  GraduationCap, 
  MapPin, 
  Phone, 
  Clock, 
  BookOpen, 
  Award, 
  PieChart, 
  Activity, 
  ChevronLeft, 
  ArrowRight, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Info, 
  MessageSquare,
  Users,
  TrendingUp,
  Zap,
  Fingerprint,
  ShieldCheck,
  Briefcase,
  Target
} from 'lucide-react';
import { getRatingLabel } from '@/lib/firebaseUtils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import StudentPlansPanel from '@/components/StudentPlansPanel';

export default function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [recits, setRecits] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [guardian, setGuardian] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sDoc = await getDoc(doc(db, 'users', id as string));
      if (!sDoc.exists()) { router.push('/dashboard/students'); return; }
      const sData: any = { id: sDoc.id, ...sDoc.data() };
      setStudent(sData);

      // Parallel fetching for performance
      const [rSnap, aSnap, tSnap] = await Promise.all([
        getDocs(query(collection(db, 'dailyrecitations', id as string, 'dailyrecitations'), orderBy('date', 'desc'), limit(20))),
        getDocs(query(collection(db, 'tracking', id as string, 'tracking'), where('type', '==', 'attendance'), orderBy('date', 'desc'), limit(20))),
        getDocs(query(collection(db, 'testsessions', id as string, 'testsessions'), orderBy('date', 'desc'), limit(15)))
      ]);

      setRecits(rSnap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
      setAttendance(aSnap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
      setTests(tSnap.docs.map(ds => ({ id: ds.id, ...ds.data() })));

      // Fetch Guardian Info (Parity with mobile profile)
      if (sData.guardianUserId) {
        const gDoc = await getDoc(doc(db, 'users', sData.guardianUserId));
        if (gDoc.exists()) setGuardian({ id: gDoc.id, ...gDoc.data() });
      }
    } catch (e) {
      console.error("Error fetching profile data:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !student) return (
    <DashboardLayout>
       <div className="min-h-[60vh] flex flex-col items-center justify-center p-12">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600 animate-pulse" />
             </div>
          </div>
          <p className="mt-8 text-xs font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse family-cairo">تحميل بيانات الطالب...</p>
       </div>
    </DashboardLayout>
  );

  const tabs = [
    { id: 'overview', label: 'الإحصائيات العامة', icon: PieChart },
    { id: 'recitation', label: 'سجل التسميع', icon: BookOpen },
    { id: 'plans', label: 'المسارات والخطط', icon: Target },
    { id: 'attendance', label: 'الانضباط والحضور', icon: Clock },
    { id: 'tests', label: 'سجل الاختبارات', icon: Award }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-16" dir="rtl">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-4">
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => router.push('/dashboard/students')}
             className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
           >
             <ArrowRight className="w-5 h-5" />
           </Button>
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] family-cairo">
              <span>الأرشيف الإداري</span>
              <ChevronLeft className="w-3 h-3" />
              <span>إدارة الطلاب</span>
              <ChevronLeft className="w-3 h-3" />
              <span className="text-blue-600 dark:text-blue-400">سجل الطالب</span>
           </div>
        </div>

        {/* Profile Hero Card */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-10 md:p-14 rounded-[3rem] border border-slate-200/60 dark:border-slate-800 shadow-sm group">
           <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
           
           <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
              <div className="relative">
                 <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl transition-transform duration-700 group-hover:scale-105">
                    <div className="w-full h-full rounded-[2.2rem] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                       {student.photoURL ? (
                         <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-6xl font-black text-slate-200 dark:text-slate-800">{student.displayName?.[0]}</span>
                       )}
                    </div>
                 </div>
                 {student.status !== 'inactive' && (
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 border-4 border-white dark:border-[#0f172a] rounded-2xl flex items-center justify-center shadow-lg">
                       <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                 )}
              </div>

              <div className="flex-1 space-y-6 text-center lg:text-right">
                 <div className="space-y-2">
                    <Badge variant="info" className="px-3 py-1 rounded-lg border-blue-100 dark:border-blue-900/30 text-[10px] font-black uppercase tracking-widest">
                       عضوية الطالب رقم: #{student.number || '---'}
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight family-cairo">{student.displayName}</h1>
                 </div>

                 <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                    <HeroInfo icon={GraduationCap} label={student.educationalStage} color="blue" />
                    <HeroInfo icon={MapPin} label={student.residenceArea || 'غير محدد'} color="slate" />
                    <HeroInfo icon={Phone} label={student.phoneNumber || 'لا يوجد هاتف'} color="emerald" />
                 </div>
              </div>

              <div className="flex flex-col gap-4 min-w-[240px] lg:border-r border-slate-100 dark:border-slate-800 lg:pr-10">
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center justify-between mb-4">
                       <Target className="w-5 h-5 text-blue-500" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المعدل العام</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <span className="text-3xl font-black text-slate-900 dark:text-white">94.2</span>
                       <span className="text-xs font-bold text-emerald-500 tracking-tighter">% مؤشر تراكمي</span>
                    </div>
                 </div>
                 <Button className="h-14 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 font-bold text-sm gap-2">
                    <Download className="w-4 h-4" />
                    تصدير ملف الطالب الموحد
                 </Button>
                 <Button
                   variant="outline"
                   className="h-12 rounded-2xl font-bold text-sm gap-2"
                   onClick={() => router.push(`/dashboard/students/${id as string}/edit`)}
                 >
                   <Briefcase className="w-4 h-4" />
                   تعديل بيانات الطالب
                 </Button>
              </div>
           </div>
        </div>

        {/* Tab System UI */}
        <div className="space-y-8">
           <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 overflow-x-auto no-scrollbar">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-sm font-bold transition-all duration-500 relative whitespace-nowrap ${
                      isActive ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl shadow-blue-500/5' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'text-slate-300'}`} />
                    {tab.label}
                    {isActive && <motion.div layoutId="activeTab" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />}
                  </button>
                );
              })}
           </div>

           <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                  {/* OVERVIEW CONTENT */}
                  {activeTab === 'overview' && (
                    <div className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <AnalyticsCard title="إنجاز الحفظ" value={recits.filter(r => r.type === 'memorization').length} icon={BookOpen} color="blue" description="سجل تسميع معتمد" />
                          <AnalyticsCard title="سجل المراجعة" value={recits.filter(r => r.type === 'revision').length} icon={Activity} color="amber" description="جلسة مراجعة دورية" />
                          <AnalyticsCard title="متوسط الاختبارات" value={tests.length > 0 ? `${Math.round(tests.reduce((acc, curr) => acc + (curr.score || curr.total_score || 0), 0) / tests.length)}%` : '---'} icon={Award} color="emerald" description="بناءً على 15 اختبار أخير" />
                          <AnalyticsCard title="تاريخ النظام" value={calculateDaysJoined(student.createdAt)} icon={Calendar} color="rose" description="يوم منذ الانضمام للمنصة" />
                       </div>

                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* BIOMETRICS & IDENTITY */}
                          <div className="lg:col-span-1 space-y-6">
                             <div className="p-8 bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-8">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                   <Fingerprint className="w-4 h-4 text-blue-500" />
                                   البيانات الشخصية والتعريفية
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <IdentityItem label="السجل المدني" value={student.civilId || 'نقص في البيانات'} icon={Fingerprint} />
                                    <IdentityItem label="اسم ولي الأمر" value={student.guardianName || 'غير مسجل'} icon={UserCircle2} />
                                    <IdentityItem label="رقم هاتف ولي الأمر" value={student.guardianPhoneNumber || 'غير مسجل'} icon={Phone} />
                                    <IdentityItem label="تاريخ الولادة" value={student.dateOfBirth || 'غير محدد'} icon={Calendar} />
                                    <IdentityItem label="الجنسية" value={student.nationality || 'غير محدد'} icon={ShieldCheck} />
                                    <IdentityItem label="الحلقة المسندة" value={student.halaqaName || 'غير ملتحق'} icon={Users} />
                                    <IdentityItem label="عنوان السكن" value={student.permanentAddress || 'غير محدد'} icon={MapPin} />
                                 </div>
                             </div>
                             
                             {student.notes && (
                               <div className="p-8 bg-amber-50/50 dark:bg-amber-900/10 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/20">
                                  <div className="flex items-center gap-3 mb-4">
                                     <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                        <Info className="w-4 h-4" />
                                     </div>
                                     <span className="text-xs font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest">توجيهات إدارية</span>
                                  </div>
                                  <p className="text-sm font-medium text-amber-800 dark:text-amber-400 leading-relaxed italic">{student.notes}</p>
                               </div>
                             )}
                          </div>

                          {/* RECENT ACTIVITY TICKER */}
                          <div className="lg:col-span-2 p-8 bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm">
                             <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                                      نبض الإنجاز الفني (آخر 15 جلسة)
                                   </h3>
                                   <p className="text-[10px] font-bold text-slate-400">تحليل مسار الإنجاز مقابل الجودة</p>
                                </div>
                                <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] px-3 py-1">STABLE TREND</Badge>
                             </div>

                             <div className="h-48 w-full relative pt-4 px-2 mb-10">
                                <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                                   <defs>
                                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                         <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                         <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                      </linearGradient>
                                   </defs>
                                   <line x1="0" y1="20" x2="400" y2="20" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="0.5" />
                                   <line x1="0" y1="50" x2="400" y2="50" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="0.5" />
                                   <line x1="0" y1="80" x2="400" y2="80" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="0.5" />
                                   
                                   {recits.length > 1 && (
                                     <path 
                                       d={`M 0 100 ${recits.slice(0, 15).reverse().map((r, i) => {
                                          const x = (i / (Math.min(15, recits.length) - 1)) * 400;
                                          const val = r.page_count || 1;
                                          const y = 100 - (Math.min(val, 10) * 10);
                                          return `L ${x} ${y}`;
                                       }).join(' ')} L 400 100 Z`}
                                       fill="url(#chartGradient)"
                                     />
                                   )}

                                   {recits.length > 1 && (
                                     <path 
                                       d={recits.slice(0, 15).reverse().map((r, i) => {
                                          const x = (i / (Math.min(15, recits.length) - 1)) * 400;
                                          const val = r.page_count || 1;
                                          const y = 100 - (Math.min(val, 10) * 10);
                                          return i === 0 ? `M 0 ${y}` : `L ${x} ${y}`;
                                       }).join(' ')}
                                       fill="none"
                                       stroke="#3b82f6"
                                       strokeWidth="2.5"
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       className="drop-shadow-[0_2px_4px_rgba(59,130,246,0.3)]"
                                     />
                                   )}

                                   {recits.slice(0, 15).reverse().map((r, i) => {
                                      const x = (i / (Math.min(15, recits.length) - 1)) * 400;
                                      const val = r.page_count || 1;
                                      const y = 100 - (Math.min(val, 10) * 10);
                                      const isMutaqen = (r.rating || r.grade_enum) === 1;
                                      return (
                                        <circle 
                                          key={i}
                                          cx={x} cy={y} r="3" 
                                          className={`${isMutaqen ? 'fill-emerald-500' : 'fill-blue-500'} transition-all`} 
                                        />
                                      );
                                   })}
                                </svg>
                             </div>

                             <div className="flex items-center justify-between mb-8 border-t border-slate-50 dark:border-slate-800 pt-8">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                   <Activity className="w-4 h-4 text-blue-500" />
                                   آخر النشاطات التقنية
                                </h3>
                                <Button variant="ghost" onClick={() => setActiveTab('recitation')} className="text-[10px] font-black uppercase tracking-widest text-blue-500">عرض الأرشيف</Button>
                             </div>
                             
                             <div className="space-y-4">
                                {recits.slice(0, 5).map((r, i) => (
                                  <div key={i} className="flex items-center gap-5 p-5 rounded-3xl border border-slate-50 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/20 hover:border-blue-100 dark:hover:border-blue-900/20 transition-colors">
                                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${r.type === 'memorization' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                        <BookOpen className="w-6 h-6" />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                           <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{r.type === 'memorization' ? 'تسميع حفظ جديد' : 'مراجعة دورية'}</p>
                                           <span className="text-[10px] font-black text-slate-300 family-mono">{r.date}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 truncate tracking-tight">{r.amount}</p>
                                     </div>
                                     <div className="text-left font-black text-sm text-slate-700 dark:text-slate-300">{r.grade_text || getRatingLabel(r.rating || r.grade_enum)}</div>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                   {/* EDUCATIONAL PATHS CONTENT */}
                   {activeTab === 'plans' && (
                     <StudentPlansPanel studentId={id as string} studentName={student.displayName} />
                   )}

                  {/* RECITATION TABLE */}
                  {activeTab === 'recitation' && (
                    <div className="bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
                       <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-right border-collapse">
                             <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                                   <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">تاريخ الجلسة</th>
                                   <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">التصنيف الفني</th>
                                   <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">المقدار</th>
                                   <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">التقييم</th>
                                   <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">الملاحظات</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                {recits.length === 0 ? (
                                  <tr><td colSpan={5} className="px-8 py-24 text-center text-slate-300 font-bold family-cairo">لم يتم رصد أي عمليات تسميع لهذا الملف</td></tr>
                                ) : (
                                  recits.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group">
                                       <td className="px-8 py-6 text-[11px] font-black text-slate-500 family-mono tracking-widest">{r.date}</td>
                                       <td className="px-8 py-6">
                                          <Badge variant={r.type === 'memorization' ? 'info' : 'warning'} className="px-3 py-1 rounded-lg text-[10px]">
                                             {r.type === 'memorization' ? 'حفظ جديد' : 'مراجعة'}
                                          </Badge>
                                       </td>
                                       <td className="px-8 py-6 font-bold text-slate-900 dark:text-white text-sm tracking-tight">{r.amount}</td>
                                       <td className="px-8 py-6 text-center">
                                          <div className="flex flex-col items-center">
                                             <span className="text-xs font-black text-blue-600 dark:text-blue-400">{r.grade_text || getRatingLabel(r.rating || r.grade_enum)}</span>
                                             {r.mistakes_count > 0 && <span className="text-[9px] font-black text-rose-500 mt-1">تنبيهات: {r.mistakes_count}</span>}
                                          </div>
                                       </td>
                                       <td className="px-8 py-6">
                                          <p className="text-xs font-medium text-slate-400 max-w-xs leading-relaxed truncate group-hover:whitespace-normal transition-all">{r.notes || '---'}</p>
                                       </td>
                                    </tr>
                                  ))
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  )}

                  {/* ATTENDANCE TABLE */}
                  {activeTab === 'attendance' && (
                    <div className="bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
                       <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-right border-collapse">
                             <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                                   <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">تاريخ اليوم</th>
                                   <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">حالة الحضور</th>
                                   <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">المسوغات / الملاحظات</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                {attendance.length === 0 ? (
                                  <tr><td colSpan={3} className="px-8 py-24 text-center text-slate-300 font-bold family-cairo">سجل الحضور والغياب فارغ حالياً</td></tr>
                                ) : (
                                  attendance.map(a => (
                                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                       <td className="px-8 py-6 text-[11px] font-black text-slate-500 family-mono tracking-widest">{a.date}</td>
                                       <td className="px-8 py-6">
                                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusStyle(a.status)}`}>
                                             {getStatusIcon(a.status)}
                                             {getStatusLabel(a.status)}
                                          </div>
                                       </td>
                                       <td className="px-8 py-6">
                                          {a.note ? (
                                             <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                                <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
                                                {a.note}
                                             </div>
                                          ) : <span className="text-slate-200">---</span>}
                                       </td>
                                    </tr>
                                  ))
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  )}

                  {/* TESTS TABLE */}
                  {activeTab === 'tests' && (
                    <div className="bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
                       <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-right border-collapse">
                             <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                                   <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">تاريخ الاختبار</th>
                                   <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">اسم الاختبار / اللجنة</th>
                                   <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">الدرجة النهائية</th>
                                   <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">الرصد</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                {tests.length === 0 ? (
                                  <tr><td colSpan={4} className="px-8 py-24 text-center text-slate-300 font-bold family-cairo">لا توجد اختبارات مسجلة في الأرشيف المركزي</td></tr>
                                ) : (
                                  tests.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                       <td className="px-8 py-6 text-[11px] font-black text-slate-500 family-mono tracking-widest">{t.date}</td>
                                       <td className="px-8 py-6 font-bold text-slate-900 dark:text-white text-sm tracking-tight">{t.test_name || 'اختبار نهائي مركزي'}</td>
                                       <td className="px-8 py-6 text-center">
                                          <div className="inline-flex px-4 py-2 rounded-2xl bg-blue-600 text-white font-black text-base family-mono shadow-lg shadow-blue-500/10">
                                             {t.score || t.total_score || 0}%
                                          </div>
                                       </td>
                                       <td className="px-8 py-6 text-center">
                                          <Badge variant="info" className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest">
                                             {t.grade || 'رصد آلي'}
                                          </Badge>
                                       </td>
                                    </tr>
                                  ))
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  )}
              </motion.div>
           </AnimatePresence>
        </div>

      </div>
    </DashboardLayout>
  );
}

function HeroInfo({ icon: Icon, label, color }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-50/50 dark:bg-blue-900/20 border-blue-100/50 dark:border-blue-800/50',
    slate: 'text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 border-slate-100/50 dark:border-slate-800/50',
    emerald: 'text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100/50 dark:border-emerald-800/50'
  };

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border backdrop-blur-sm shadow-sm transition-all hover:translate-y-[-2px] ${colors[color]}`}>
       <Icon className="w-4 h-4" />
       <span className="text-xs font-black tracking-tight">{label || '---'}</span>
    </div>
  );
}

function AnalyticsCard({ title, value, icon: Icon, color, description }: any) {
  const colors: any = {
    blue: 'from-blue-600 to-indigo-600 shadow-blue-500/10',
    amber: 'from-amber-500 to-orange-400 shadow-amber-500/10',
    emerald: 'from-emerald-500 to-teal-400 shadow-emerald-500/10',
    rose: 'from-rose-500 to-pink-500 shadow-rose-500/10'
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden group">
       <div className={`absolute top-0 left-0 w-24 h-24 bg-gradient-to-br ${colors[color]} opacity-0 group-hover:opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl transition-opacity`}></div>
       <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
             <h4 className="text-3xl font-black text-slate-900 dark:text-white family-mono tracking-tighter">{value}</h4>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${colors[color]} text-white shadow-xl`}>
             <Icon className="w-6 h-6" />
          </div>
       </div>
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{description}</p>
    </div>
  );
}

function IdentityItem({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-center gap-4">
       <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 shrink-0">
          <Icon className="w-5 h-5" />
       </div>
       <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
          <p className="text-sm font-black text-slate-700 dark:text-slate-300 truncate tracking-tight">{value || '---'}</p>
       </div>
    </div>
  );
}

function getStatusLabel(status: string) {
  const labels: any = { present: 'حاضر', absent: 'غائب', late: 'متأخر', excused: 'مستأذن', dropped: 'منقطع' };
  return labels[status] || status;
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'present': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30';
    case 'absent': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30';
    case 'late': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30';
    case 'excused': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30';
    case 'dropped': return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
    default: return 'bg-slate-50 text-slate-400';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'present': return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'absent': return <XCircle className="w-3.5 h-3.5" />;
    case 'late': return <Clock className="w-3.5 h-3.5" />;
    case 'excused': return <Info className="w-3.5 h-3.5" />;
    default: return null;
  }
}

function calculateDaysJoined(createdAt: any) {
  if (!createdAt) return '---';
  const joinDate = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
  const diffTime = Math.abs(new Date().getTime() - joinDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
