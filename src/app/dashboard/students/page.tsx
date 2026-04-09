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
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

interface Student {
  id: string;
  displayName: string;
  phoneNumber?: string;
  password?: string;
  gender: 'ذكر' | 'أنثى';
  educationalStage: string;
  halaqaId: string;
  notes?: string;
  number: string | number;
  nationality?: string;
  identityNumber?: string;
  guardianPhoneNumber?: string;
  memorizationAmount?: string;
  residenceArea?: string;
  photoURL?: string;
  createdAt?: { seconds: number; nanoseconds: number };
  updatedAt?: any;
}

interface Circle {
  id: string;
  displayName: string;
}

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  type: string;
}

interface StudentFormData {
  displayName: string;
  phoneNumber: string;
  password?: string;
  gender: 'ذكر' | 'أنثى';
  educationalStage: string;
  halaqaId: string;
  notes: string;
  number: string;
  nationality: string;
  identityNumber: string;
  guardianPhoneNumber: string;
  memorizationAmount: string;
  residenceArea: string;
  photoURL: string;
}

export default function StudentsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const router = useRouter();

  const [formData, setFormData] = useState<StudentFormData>({
    displayName: '',
    phoneNumber: '',
    password: '',
    gender: 'ذكر',
    educationalStage: 'ابتدائي',
    halaqaId: '',
    notes: '',
    number: '',
    nationality: 'سعودي',
    identityNumber: '',
    guardianPhoneNumber: '',
    memorizationAmount: '',
    residenceArea: '',
    photoURL: ''
  });
  const [isSaving, setIsSaving] = useState(false);

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

  const fetchData = async (userData: UserData) => {
    setIsLoading(true);
    try {
      const { role, type, uid } = userData;
      
      const circlesSnap = await getDocs(query(collection(db, 'users'), where('type', '==', 'halaqa')));
      const circlesList = circlesSnap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Circle));
      setCircles(circlesList);

      let studentList: Student[] = [];
      if (role === 'admin' || role === 'mentor' || type === 'mentor') {
        const q = query(collection(db, 'users'), where('type', '==', 'student'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        studentList = snap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Student));
      } else if (type === 'teacher' && uid) {
        const assignedSnap = await getDocs(collection(db, 'mumber', uid, 'member'));
        const assignedIds = assignedSnap.docs.map(ds => ds.id);
        
        if (assignedIds.length > 0) {
          const q = query(
            collection(db, 'users'), 
            where('type', '==', 'student'), 
            where('halaqaId', 'in', assignedIds.slice(0, 30))
          );
          const snap = await getDocs(q);
          studentList = snap.docs.map(ds => ({ id: ds.id, ...ds.data() } as Student));
          studentList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        }
      }
      setStudents(studentList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `profile_photos/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, photoURL: url }));
    } catch (error) {
      console.error('Upload error:', error);
      alert('خطأ في رفع الصورة');
    }
  };

  const handleOpenModal = (student: Student | null = null) => {
    if (student) {
      setCurrentStudent(student);
      setFormData({
        displayName: student.displayName || '',
        phoneNumber: student.phoneNumber || '',
        password: student.password || '',
        gender: student.gender || 'ذكر',
        educationalStage: student.educationalStage || 'ابتدائي',
        halaqaId: student.halaqaId || '',
        notes: student.notes || '',
        number: student.number?.toString() || '',
        nationality: student.nationality || 'سعودي',
        identityNumber: student.identityNumber || '',
        guardianPhoneNumber: student.guardianPhoneNumber || '',
        memorizationAmount: student.memorizationAmount || '',
        residenceArea: student.residenceArea || '',
        photoURL: student.photoURL || ''
      });
    } else {
      setCurrentStudent(null);
      setFormData({
        displayName: '', phoneNumber: '', password: '', gender: 'ذكر', 
        educationalStage: 'ابتدائي', halaqaId: '', notes: '', number: '', 
        nationality: 'سعودي', identityNumber: '', guardianPhoneNumber: '', 
        memorizationAmount: '', residenceArea: '', photoURL: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        type: 'student',
        role: 'user',
        updatedAt: serverTimestamp(),
        isActive: true
      };

      if (currentStudent) {
        await updateDoc(doc(db, 'users', currentStudent.id), dataToSave);
      } else {
        await addDoc(collection(db, 'users'), {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      fetchData(user);
    } catch (error) {
      alert('Error: ' + error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        if (user) fetchData(user);
      } catch (error) {
        alert('Error deleting student');
      }
    }
  };

  const filteredStudents = students.filter(s => 
    s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number?.toString().includes(searchQuery)
  );

  return (
    <DashboardLayout>
      <div className="animate-snappy">
        {/* Elite Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold mb-3 uppercase tracking-widest">
              <Link href="/dashboard" className="hover:text-primary transition-colors">لوحة التحكم</Link>
              <span>/</span>
              <span className="text-primary/80">إدارة قاعدة بيانات الطلاب</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gradient tracking-tight">
              شؤون الطلاب
            </h1>
            <p className="text-slate-500 mt-2 font-medium">إدارة شاملة لبيانات الطلاب والحلقات والملفات الشخصية</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative glass-panel rounded-2xl border-white/5 overflow-hidden">
               <input 
                 type="text" 
                 placeholder="بحث سريع..." 
                 className="bg-transparent px-6 py-3 text-sm font-bold outline-none w-48 focus:w-64 transition-all"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="primary-gradient hover:scale-[1.02] active:scale-95 px-8 py-3 rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg shadow-primary-glow"
            >
              إضافة طالب جديد
            </button>
          </div>
        </div>

        {/* Students Cards Grid */}
        <div className="grid gap-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 glass-panel rounded-[2rem]">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-primary-glow"></div>
              <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">جاري سحب بيانات الطلاب من السحابة...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="glass-panel rounded-[2rem] p-20 text-center border-dashed border-white/10">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <p className="text-slate-400 font-bold text-lg">لم يتم العثور على أي طلاب مسجلين</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <div key={student.id} className="glass-card rounded-[2rem] p-6 group animate-fade relative overflow-hidden">
                   {/* Gender/Stage Floating Badge */}
                  <div className="absolute top-4 right-4 flex gap-2">
                     <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/5 ${student.gender === 'ذكر' ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {student.gender}
                     </span>
                     <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 backdrop-blur-md border border-white/5">
                        {student.educationalStage}
                     </span>
                  </div>

                  <div className="flex justify-between items-start mb-6 mt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/5 font-black text-3xl overflow-hidden shadow-2xl group-hover:border-primary/50 transition-colors">
                        {student.photoURL ? (
                          <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gradient">{student.displayName[0]}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-black group-hover:text-primary transition-colors">{student.displayName}</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">ID CARD: {student.number}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 bg-white/[0.02] p-5 rounded-[1.5rem] border border-white/5">
                    <DataRow label="الحلقة" value={circles.find(c => c.id === student.halaqaId)?.displayName || 'غير محدد'} />
                    <DataRow label="رقم الهوية" value={student.identityNumber || 'غير مسجل'} />
                    <DataRow label="الجنسية" value={student.nationality || 'غير محدد'} />
                    <DataRow label="منطقة السكن" value={student.residenceArea || 'غير محدد'} />
                  </div>

                  <div className="flex gap-2 mt-4 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => handleOpenModal(student)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-primary/20 hover:text-primary text-slate-400 rounded-xl transition-all border border-white/5 font-bold text-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        تعديل الطالب
                     </button>
                     <button onClick={() => handleDelete(student.id)} className="p-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 text-slate-400 rounded-xl transition-all border border-white/5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Elite Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md animate-fade" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative glass-panel rounded-[2.5rem] w-full max-w-2xl p-8 border-white/10 shadow-2xl animate-snappy overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-gradient">
                  {currentStudent ? 'تعديل ملف الطالب' : 'تسجيل طالب جديد'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 rounded-2xl transition-all border border-white/5">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                <div className="md:col-span-2 flex flex-col items-center gap-4 mb-6">
                  <div className="w-32 h-32 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-all">
                    {formData.photoURL ? (
                      <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-black uppercase text-white bg-black/50 px-3 py-1.5 rounded-full">رفع صورة</span>
                    </div>
                  </div>
                </div>

                <InputField label="الاسم الكامل" value={formData.displayName} onChange={(v: string) => setFormData({...formData, displayName: v})} required />
                <InputField label="رقم القيد" value={formData.number} onChange={(v: string) => setFormData({...formData, number: v})} />
                <InputField label="رقم الهاتف" value={formData.phoneNumber} onChange={(v: string) => setFormData({...formData, phoneNumber: v})} />
                <InputField label="رقم الهوية" value={formData.identityNumber} onChange={(v: string) => setFormData({...formData, identityNumber: v})} />
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">الحلقة المسجل بها</label>
                  <select 
                    className="w-full elite-input font-bold text-sm"
                    value={formData.halaqaId}
                    onChange={(e) => setFormData({...formData, halaqaId: e.target.value})}
                  >
                    <option value="" className="bg-[#111]">اختيار الحلقة...</option>
                    {circles.map(c => <option key={c.id} value={c.id} className="bg-[#111]">{c.displayName}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">المرحلة الدراسية</label>
                  <select 
                    className="w-full elite-input font-bold text-sm"
                    value={formData.educationalStage}
                    onChange={(e) => setFormData({...formData, educationalStage: e.target.value})}
                  >
                    {['الروضة', 'ابتدائي', 'متوسط', 'ثانوي', 'جامعي'].map(s => <option key={s} value={s} className="bg-[#111]">{s}</option>)}
                  </select>
                </div>

                <InputField label="الجنسية" value={formData.nationality} onChange={(v: string) => setFormData({...formData, nationality: v})} />
                <InputField label="مقدار الحفظ" value={formData.memorizationAmount} onChange={(v: string) => setFormData({...formData, memorizationAmount: v})} />
                <InputField label="منطقة السكن" value={formData.residenceArea} onChange={(v: string) => setFormData({...formData, residenceArea: v})} />
                
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">ملاحظات إضافية</label>
                  <textarea 
                    className="w-full elite-input min-h-[100px] font-bold text-sm"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>

                <div className="md:col-span-2 flex gap-4 pt-6 border-t border-white/5 mt-4">
                  <button type="submit" disabled={isSaving} className="flex-1 primary-gradient py-4 rounded-2xl font-black text-sm tracking-widest hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary-glow">
                    {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 glass-card py-4 rounded-2xl font-black text-xs text-slate-400 hover:text-white uppercase tracking-widest">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function DataRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
      <span className="font-black text-slate-300">{value}</span>
    </div>
  );
}

function InputField({ label, value, onChange, required, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{label}</label>
      <input 
        required={required}
        type={type} 
        className="w-full elite-input font-bold text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
