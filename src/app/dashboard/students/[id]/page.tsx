'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { UserCircle, Calendar, GraduationCap, MapPin, Hash, Phone, Clock, FileText, CheckCircle2, ChevronRight, Download } from 'lucide-react';
import Link from 'next/link';

export default function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [recits, setRecits] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sDoc = await getDoc(doc(db, 'users', id as string));
      if (!sDoc.exists()) { router.push('/dashboard/students'); return; }
      setStudent({ id: sDoc.id, ...sDoc.data() });

      const [rSnap, aSnap, tSnap] = await Promise.all([
        getDocs(query(collection(db, 'dailyrecitations', id as string, 'dailyrecitations'), orderBy('date', 'desc'), limit(15))),
        getDocs(query(collection(db, 'tracking', id as string, 'tracking'), where('type', '==', 'attendance'), orderBy('date', 'desc'), limit(15))),
        getDocs(query(collection(db, 'testsessions', id as string, 'testsessions'), orderBy('date', 'desc'), limit(10)))
      ]);

      setRecits(rSnap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
      setAttendance(aSnap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
      setTests(tSnap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
       <div className="h-64 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500">جاري تحميل بيانات الطالب...</p>
       </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Breadcrumb / Back Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
           <Link href="/dashboard/students" className="hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
             <ChevronRight className="w-4 h-4" />
             قائمة الطلاب
           </Link>
           <span>/</span>
           <span className="text-gray-900 dark:text-white font-medium">الملف الشخصي: {student.displayName}</span>
        </div>

        {/* Profile Header Block */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 overflow-hidden relative">
           <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-bold shrink-0 shadow-inner overflow-hidden border border-blue-100">
                 {student.photoURL ? <img src={student.photoURL} alt="" className="w-full h-full object-cover" /> : student.displayName[0]}
              </div>
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-2">
                   <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{student.displayName}</h1>
                   {student.isActive && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Verified Account</span>}
                 </div>
                 <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><Hash className="w-4 h-4" /> {student.number}</span>
                    <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {student.educationalStage}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {student.residenceArea || 'غير محدد'}</span>
                    <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {student.phoneNumber || student.phone || 'غير محدد'}</span>
                 </div>
              </div>
              <div className="md:border-r md:border-gray-200 dark:border-gray-700 md:pr-6 md:ml-2">
                 <button className="enterprise-button bg-gray-900 hover:bg-gray-800 text-white shadow-none">
                    <Download className="w-4 h-4" />
                    تصدير ملف PDF
                 </button>
              </div>
           </div>
        </div>

        {/* Dense Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-2 overflow-x-auto">
          <div className="flex gap-6 min-w-max">
             <button onClick={() => setActiveTab('overview')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>نظرة عامة وإحصائيات</button>
             <button onClick={() => setActiveTab('recitation')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'recitation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>سجل الإنجاز والتسميع</button>
             <button onClick={() => setActiveTab('attendance')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'attendance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>المواظبة والغياب</button>
             <button onClick={() => setActiveTab('tests')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'tests' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>سجل الاختبارات</button>
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-2">
           {activeTab === 'overview' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="enterprise-card p-5">
                   <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">إجمالي الحفظ (سجلات)</h4>
                   <p className="text-2xl font-bold text-gray-900 dark:text-white">{recits.filter(r => r.type === 'memorization').length}</p>
                </div>
                <div className="enterprise-card p-5">
                   <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">سجلات المراجعة التراكمية</h4>
                   <p className="text-2xl font-bold text-gray-900 dark:text-white">{recits.filter(r => r.type === 'revision').length}</p>
                </div>
                <div className="enterprise-card p-5">
                   <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">معدل الاختبارات</h4>
                   <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tests.length > 0 ? `${Math.round(tests.reduce((acc, curr) => acc + curr.score, 0) / tests.length)}%` : 'N/A'}</p>
                </div>
                <div className="enterprise-card p-5 border-l-4 border-l-emerald-500">
                   <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">تاريخ التسجيل</h4>
                   <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">{student.createdAt?.toDate().toLocaleDateString('en-CA') || '---'}</p>
                </div>
             </div>
           )}

           {activeTab === 'recitation' && (
             <div className="enterprise-card overflow-hidden">
                <table className="w-full text-right text-sm">
                   <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-500">
                      <tr>
                         <th className="px-6 py-4 font-semibold">التاريخ</th>
                         <th className="px-6 py-4 font-semibold">المسار</th>
                         <th className="px-6 py-4 font-semibold">الكمية المسجلة</th>
                         <th className="px-6 py-4 font-semibold">التقييم الفني</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {recits.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">لا توجد سجلات مسجلة</td></tr>
                      ) : recits.map(r => (
                        <tr key={r.id}>
                           <td className="px-6 py-4 font-mono text-xs">{r.date}</td>
                           <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{getRecitLabel(r.type)}</td>
                           <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{r.amount}</td>
                           <td className="px-6 py-4">
                              <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-xs font-bold">{r.rating}/5</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}

           {activeTab === 'attendance' && (
             <div className="enterprise-card overflow-hidden">
                <table className="w-full text-right text-sm">
                   <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-500">
                      <tr>
                         <th className="px-6 py-4 font-semibold">التاريخ</th>
                         <th className="px-6 py-4 font-semibold">حالة الحضور</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {attendance.length === 0 ? (
                        <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500">لا توجد سجلات غياب/حضور</td></tr>
                      ) : attendance.map(a => (
                        <tr key={a.id}>
                           <td className="px-6 py-4 font-mono text-xs">{a.date}</td>
                           <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${a.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                 {a.status === 'present' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                 {a.status === 'present' ? 'حاضر' : 'غائب'}
                              </span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}

           {activeTab === 'tests' && (
             <div className="enterprise-card overflow-hidden">
                <table className="w-full text-right text-sm">
                   <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-500">
                      <tr>
                         <th className="px-6 py-4 font-semibold">تاريخ الاختبار</th>
                         <th className="px-6 py-4 font-semibold">اسم الاختبار / المنهج</th>
                         <th className="px-6 py-4 font-semibold">الدرجة المئوية</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {tests.length === 0 ? (
                        <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">لا توجد اختبارات مسجلة</td></tr>
                      ) : tests.map(t => (
                        <tr key={t.id}>
                           <td className="px-6 py-4 font-mono text-xs">{t.date}</td>
                           <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{t.test_name}</td>
                           <td className="px-6 py-4">
                              <span className="font-bold text-gray-800 dark:text-gray-200">{t.score}%</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}
        </div>

      </div>
    </DashboardLayout>
  );
}

function getRecitLabel(type: string) {
  const labels: any = { memorization: 'حفظ جديد', revision: 'مراجعة', tathbeet: 'تثبيت', tashih_tilawah: 'تصحيح تلاوة' };
  return labels[type] || type;
}
