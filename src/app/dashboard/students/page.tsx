'use client';

import React, { useState, useEffect } from 'react';
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
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  ChevronLeft,
  MoreVertical,
  UserCircle2
} from 'lucide-react';

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
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [circles, setCircles] = useState<any[]>([]);
  
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

      let q = query(collection(db, 'users'), where('type', '==', 'student'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setStudents(snap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Student)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الطالب ${name}؟ لا يمكن التراجع عن هذا الإجراء.`)) {
       try {
         await deleteDoc(doc(db, 'users', id));
         setStudents(prev => prev.filter(s => s.id !== id));
       } catch (error) {
         console.error("Error deleting student:", error);
       }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">إدارة الطلاب</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">التحكم في سجل المعرفات، الحلقات، والمستويات التعليمية.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <div className="relative">
                <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="البحث بالاسم أو الرقم..." 
                  className="enterprise-input pr-10 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <button 
               onClick={() => router.push('/dashboard/students/add')} 
               className="enterprise-button"
             >
                <UserPlus className="w-4 h-4" />
                طالب جديد
             </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="enterprise-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#f8fafc] dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-5 font-bold whitespace-nowrap">الطالب</th>
                  <th className="px-6 py-5 font-bold whitespace-nowrap">الرقم التعريفي</th>
                  <th className="px-6 py-5 font-bold whitespace-nowrap">المرحلة / الحلقة</th>
                  <th className="px-6 py-5 font-bold whitespace-nowrap">الحالة</th>
                  <th className="px-6 py-5 font-bold whitespace-nowrap text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                      <td className="px-6 py-5"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      لا توجد بيانات مطابقة للبحث.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {student.photoURL ? (
                            <img src={student.photoURL} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                              {student.displayName[0]}
                            </div>
                          )}
                          <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                             {student.displayName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-xs">
                        #{student.number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{student.educationalStage}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          student.isActive 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {student.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                           <Link 
                             href={`/dashboard/students/${student.id}`}
                             className="p-1.5 text-gray-500hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                             title="عرض الملف"
                           >
                             <ChevronLeft className="w-4 h-4" />
                           </Link>
                           <button 
                             className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                             title="تعديل"
                           >
                             <Edit3 className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDelete(student.id, student.displayName)}
                             className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                             title="حذف"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Area (Mock) */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
             <span>يعرض {filteredStudents.length} من السجلات</span>
             <div className="flex gap-1">
                <button className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded disabled:opacity-50" disabled>السابق</button>
                <button className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded disabled:opacity-50" disabled>التالي</button>
             </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
