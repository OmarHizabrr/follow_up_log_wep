'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
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
  halaqaId?: string;
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

  // Form states
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
  const [uploadProgress, setUploadProgress] = useState(0);

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
      const role = userData.role;
      const type = userData.type;
      const uid = userData.uid;

      // 1. Fetch Circles for dropdown
      const circlesSnap = await getDocs(query(collection(db, 'users'), where('type', '==', 'halaqa')));
      const circlesList = circlesSnap.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => ({ id: docSnap.id, ...docSnap.data() } as Circle));
      setCircles(circlesList);

      // 2. Fetch Students based on role
      let studentList: Student[] = [];
      if (role === 'admin' || role === 'mentor' || type === 'mentor') {
        const q = query(collection(db, 'users'), where('type', '==', 'student'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        studentList = snap.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => ({ id: docSnap.id, ...docSnap.data() } as Student));
      } else if (type === 'teacher' && uid) {
        const assignedSnap = await getDocs(collection(db, 'mumber', uid, 'member'));
        const assignedIds = assignedSnap.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => docSnap.id);
        
        if (assignedIds.length > 0) {
          const q = query(
            collection(db, 'users'), 
            where('type', '==', 'student'), 
            where('halaqaId', 'in', assignedIds.slice(0, 30))
          );
          const snap = await getDocs(q);
          studentList = snap.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => ({ id: docSnap.id, ...docSnap.data() } as Student));
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
      setFormData((prev: StudentFormData) => ({ ...prev, photoURL: url }));
      alert('تم رفع الصورة بنجاح');
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
      alert('Error saving student: ' + error);
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

  const filteredStudents = students.filter((s: Student) => 
    s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number?.toString().includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8">
      <Head>
        <title>إدارة الطلاب | منصة المتابعة</title>
      </Head>

      {/* Floating Shapes background */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>

      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-[#10B981]">إدارة الطلاب</h1>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:w-64">
              <input 
                type="text" 
                placeholder="بحث بالاسم أو الرقم..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-[#10B981] outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="px-6 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl transition-all shadow-lg"
            >
              إضافة طالب
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10B981]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <div key={student.id} className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 hover:border-[#10B981]/50 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                      {student.photoURL ? (
                        <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{student.displayName}</h3>
                      <p className="text-sm text-slate-400">رقم: {student.number}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(student)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(student.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">الحلقة:</span>
                    <span>{circles.find(c => c.id === student.halaqaId)?.displayName || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">المرحلة:</span>
                    <span>{student.educationalStage}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">الجنس:</span>
                    <span>{student.gender}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold mb-6 text-[#10B981]">
              {currentStudent ? 'تعديل بيانات طالب' : 'إضافة طالب جديد'}
            </h2>
            
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex flex-col items-center gap-4 mb-4">
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center relative overflow-hidden group">
                  {formData.photoURL ? (
                    <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs">تغيير الصورة</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">انقر لرفع صورة الطالب</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400">الاسم الكامل</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#10B981] outline-none"
                  value={formData.displayName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, displayName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">رقم القيد</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#10B981] outline-none"
                  value={formData.number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">رقم الهاتف</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#10B981] outline-none"
                  value={formData.phoneNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">رقم ولي الأمر</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#10B981] outline-none"
                  value={formData.guardianPhoneNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, guardianPhoneNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">رقم الهوية</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#10B981] outline-none"
                  value={formData.identityNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, identityNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">الجنسية</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#10B981] outline-none"
                  value={formData.nationality}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, nationality: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">الحلقة</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#10B981] outline-none"
                  value={formData.halaqaId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, halaqaId: e.target.value})}
                >
                  <option value="">اختر الحلقة</option>
                  {circles.map((c: Circle) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">المرحلة الدراسية</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#10B981] outline-none"
                  value={formData.educationalStage}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, educationalStage: e.target.value})}
                >
                  <option value="الروضة">الروضة</option>
                  <option value="ابتدائي">ابتدائي</option>
                  <option value="متوسط">متوسط</option>
                  <option value="ثانوي">ثانوي</option>
                  <option value="جامعي">جامعي</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">مقدار الحفظ</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#10B981] outline-none"
                  value={formData.memorizationAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, memorizationAmount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">منطقة السكن</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#10B981] outline-none"
                  value={formData.residenceArea}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, residenceArea: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">كلمة المرور (اختياري)</label>
                <input 
                  type="password" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#10B981] outline-none"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">الجنس</label>
                <div className="flex gap-4 p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.gender === 'ذكر'} onChange={() => setFormData({...formData, gender: 'ذكر'})} className="accent-[#10B981]" /> ذكر
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.gender === 'أنثى'} onChange={() => setFormData({...formData, gender: 'أنثى'})} className="accent-[#10B981]" /> أنثى
                  </label>
                </div>
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm text-slate-400">ملاحظات إضافية</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#10B981] outline-none h-24"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">إلغاء</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-10 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
