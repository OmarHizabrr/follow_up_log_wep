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
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [circles, setCircles] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<any>({
    displayName: '', educationalStage: 'ابتدائي', halaqaId: '', number: '', isActive: true
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

      let q = query(collection(db, 'users'), where('type', '==', 'student'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setStudents(snap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Student)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number?.toString().includes(searchQuery)
  );

  return (
    <DashboardLayout>
      <div className="animate-snappy space-y-10">
        
        {/* Elite Secondary Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.4em]">
              <span className="w-12 h-[2px] bg-primary"></span>
              Student Information System
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gradient tracking-tight">إدارة شؤون الطلاب</h1>
            <p className="text-slate-500 font-bold max-w-lg text-sm leading-relaxed">
               نظام موحد وشامل للتحكم في كافة بيانات الطلاب وملفاتهم التعليمية عبر المنصة.
            </p>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative glass-panel rounded-2xl border-white/5 overflow-hidden group">
                <input 
                  type="text" placeholder="بحث بالاسم أو الرقم..." 
                  className="bg-transparent px-8 py-3.5 text-sm font-bold outline-none w-48 focus:w-80 transition-all placeholder:text-slate-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <button onClick={() => { setIsModalOpen(true); setCurrentStudent(null); }} className="primary-gradient px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-glow/20">
                طالب جديد
             </button>
          </div>
        </div>

        {/* Student Grid - Bento-ish Compact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {isLoading ? (
             Array(9).fill(0).map((_, i) => <div key={i} className="h-40 glass-panel animate-pulse rounded-[2.5rem]"></div>)
           ) : filteredStudents.length === 0 ? (
             <div className="col-span-full py-40 text-center glass-panel rounded-[3rem] opacity-40 font-black uppercase text-xs tracking-widest">Global student database is empty or no match</div>
           ) : (
             filteredStudents.map(student => (
               <div key={student.id} className="glass-card rounded-[2.5rem] p-8 border-white/5 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
                  
                  <div className="flex items-center gap-6 mb-8 relative z-10">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 p-1 group-hover:scale-110 transition-transform duration-500 shadow-xl overflow-hidden">
                        {student.photoURL ? (
                           <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center text-xl font-black text-gradient">
                              {student.displayName[0]}
                           </div>
                        )}
                     </div>
                     <div className="min-w-0">
                        <h3 className="font-black text-xl truncate group-hover:text-primary transition-colors">{student.displayName}</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Student ID: {student.number}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 mb-10">
                     <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase text-slate-400">{student.educationalStage}</span>
                     <span className={`px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase ${student.isActive ? 'text-primary' : 'text-rose-500'}`}>
                        {student.isActive ? 'Active' : 'Archived'}
                     </span>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                     <Link href={`/dashboard/students/${student.id}`} className="flex-1 py-3.5 bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-500 border border-white/5 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest transition-all">
                        الملف الموحد
                     </Link>
                     <button className="p-3.5 bg-white/5 hover:bg-primary/20 hover:text-primary border border-white/5 rounded-2xl transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                     </button>
                     <button onClick={() => handleDelete(student.id)} className="p-3.5 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 border border-white/5 rounded-2xl transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

const handleDelete = async (id: string) => {
  if (confirm('هل أنت متأكد؟')) {
     await deleteDoc(doc(db, 'users', id));
     window.location.reload();
  }
}
