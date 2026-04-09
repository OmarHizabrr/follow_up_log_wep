'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Save, 
  AlertCircle
} from 'lucide-react';

export default function AttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});

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
      const snap = await getDocs(query(collection(db, 'users'), where('type', '==', 'student')));
      setStudents(snap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(attendanceData).map(([studentId, status]) => {
        const student = students.find(s => s.id === studentId);
        return addDoc(collection(db, 'tracking', studentId, 'tracking'), {
          type: 'attendance',
          status,
          date: attendanceDate,
          student_id: studentId,
          student_name: student?.displayName || '',
          halaqa_id: student?.halaqaId || '',
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.displayName
        });
      });
      await Promise.all(promises);
      alert('تم حفظ البيانات بنجاح');
      setAttendanceData({});
    } catch (e) {
      alert('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">تحضير الطلاب</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">كشف الحضور والغياب اليومي للطلاب.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <div className="relative">
                <Calendar className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="date" 
                  value={attendanceDate} 
                  onChange={(e) => setAttendanceDate(e.target.value)} 
                  className="enterprise-input pr-10 w-48 text-left"
                  dir="ltr"
                />
             </div>
             
             <button 
               onClick={handleSaveAll} 
               disabled={isSaving || Object.keys(attendanceData).length === 0} 
               className="enterprise-button disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isSaving ? 'جاري الحفظ...' : 'حفظ الكشف'}
                {!isSaving && <Save className="w-4 h-4 ml-1" />}
             </button>
          </div>
        </div>

        {/* Global Student Presence List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {isLoading ? (
             Array(8).fill(0).map((_, i) => <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl border border-gray-200 dark:border-gray-700"></div>)
           ) : (
             students.map(student => (
               <div 
                 key={student.id} 
                 className={`enterprise-card p-4 transition-colors flex flex-col justify-between h-full ${
                  attendanceData[student.id] === 'present' ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/10' :
                  attendanceData[student.id] === 'absent' ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/10' : ''
                 }`}
               >
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                        {student.photoURL ? <img src={student.photoURL} alt="" className="w-full h-full object-cover" /> : student.displayName[0]}
                     </div>
                     <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate w-full">{student.displayName}</h3>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                           <span>الرقم: {student.number}</span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                     <button 
                       onClick={() => handleStatusChange(student.id, 'present')}
                       className={`flex items-center justify-center gap-1.5 py-2 rounded-md border text-sm font-semibold transition-colors ${attendanceData[student.id] === 'present' ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                     >
                        <CheckCircle2 className="w-4 h-4" />
                        حاضر
                     </button>
                     <button 
                       onClick={() => handleStatusChange(student.id, 'absent')}
                       className={`flex items-center justify-center gap-1.5 py-2 rounded-md border text-sm font-semibold transition-colors ${attendanceData[student.id] === 'absent' ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                     >
                        <XCircle className="w-4 h-4" />
                        غائب
                     </button>
                  </div>
               </div>
             ))
           )}
        </div>

      </div>
    </DashboardLayout>
  );
}
