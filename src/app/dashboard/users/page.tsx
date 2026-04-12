'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  UserPlus, 
  UserCheck, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ChevronDown,
  Download,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  GraduationCap,
  School,
  UserCog,
  ArrowRightLeft,
  FilterX,
  BadgeInfo,
  Briefcase,
  Fingerprint,
  Users2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  orderBy, 
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import { Modal } from '@/components/ui/Modal';

export default function UsersManagementPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState('all');
  const [activeRoleFilter, setActiveRoleFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [halaqas, setHalaqas] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    type: 'student',
    displayName: '',
    email: '',
    phoneNumber: '',
    number: '',
    gender: 'ذكر',
    status: 'active',
    halaqaId: '',
    halaqaName: '',
    educationalStage: 'ابتدائي',
    identityNumber: '',
    nationality: '',
    civilId: '',
    firstName: '',
    fatherName: '',
    grandfatherName: '',
    familyName: '',
    idSource: '',
    idDate: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhoneNumber: '',
    memorizationAmount: '',
    residenceArea: '',
    permanentAddress: '',
    dateOfBirth: '',
    notes: '',
    jobTitle: '',
    bio: '',
    role: 'user'
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    teachers: 0,
    halaqas: 0,
    parents: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchHalaqas();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, activeTypeFilter, activeRoleFilter, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(fetchedUsers);
      
      setStats({
        total: fetchedUsers.length,
        students: fetchedUsers.filter((u: any) => u.type === 'student').length,
        teachers: fetchedUsers.filter((u: any) => u.type === 'teacher').length,
        halaqas: fetchedUsers.filter((u: any) => u.type === 'halaqa').length,
        parents: fetchedUsers.filter((u: any) => u.type === 'parent').length
      });
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStudentCountForHalaqa = (halaqaId: string) => {
    return users.filter(u => u.type === 'student' && u.halaqaId === halaqaId).length;
  };

  const getTeacherForHalaqa = (halaqaId: string) => {
    return users.find(u => u.type === 'teacher' && u.halaqaId === halaqaId)?.displayName || 'غير محدد';
  };

  const fetchHalaqas = async () => {
    try {
      const q = query(collection(db, 'users'), where('type', '==', 'halaqa'), orderBy('displayName', 'asc'));
      const querySnapshot = await getDocs(q);
      setHalaqas(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching halaqas:", error);
    }
  };

  const getNextNumber = async (type: string) => {
    try {
      const q = query(collection(db, 'users'), where('type', '==', type));
      const snap = await getDocs(q);
      let max = 0;
      snap.docs.forEach(doc => {
        const num = parseInt(doc.data().number);
        if (!isNaN(num) && num > max) max = num;
      });
      setFormData((prev: any) => ({ ...prev, number: (max + 1).toString() }));
    } catch (error) {
      console.error("Error getting next number:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        ...formData,
        updatedAt: serverTimestamp(),
      };
      
      if (isEditMode && editingId) {
        await updateDoc(doc(db, 'users', editingId), data);
      } else {
        await addDoc(collection(db, 'users'), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }
      
      setIsAddModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (user: any) => {
    setFormData({
      type: user.type || 'student',
      displayName: user.displayName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      number: user.number || '',
      gender: user.gender || 'ذكر',
      status: user.status || 'active',
      halaqaId: user.halaqaId || '',
      halaqaName: user.halaqaName || '',
      educationalStage: user.educationalStage || 'ابتدائي',
      identityNumber: user.identityNumber || '',
      nationality: user.nationality || '',
      civilId: user.civilId || '',
      firstName: user.firstName || '',
      fatherName: user.fatherName || '',
      grandfatherName: user.grandfatherName || '',
      familyName: user.familyName || '',
      idSource: user.idSource || '',
      idDate: user.idDate || '',
      guardianName: user.guardianName || '',
      guardianRelation: user.guardianRelation || '',
      guardianPhoneNumber: user.guardianPhoneNumber || '',
      memorizationAmount: user.memorizationAmount || '',
      residenceArea: user.residenceArea || '',
      permanentAddress: user.permanentAddress || '',
      dateOfBirth: user.dateOfBirth || '',
      notes: user.notes || '',
      jobTitle: user.jobTitle || '',
      bio: user.bio || '',
      role: user.role || 'user'
    });
    setEditingId(user.id);
    setIsEditMode(true);
    setIsAddModalOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        fetchUsers();
      } catch (e) { console.error(e); }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'student',
      displayName: '',
      email: '',
      phoneNumber: '',
      number: '',
      gender: 'ذكر',
      status: 'active',
      halaqaId: '',
      halaqaName: '',
      educationalStage: 'ابتدائي',
      identityNumber: '',
      nationality: '',
      civilId: '',
      firstName: '',
      fatherName: '',
      grandfatherName: '',
      familyName: '',
      idSource: '',
      idDate: '',
      guardianName: '',
      guardianRelation: '',
      guardianPhoneNumber: '',
      memorizationAmount: '',
      residenceArea: '',
      permanentAddress: '',
      dateOfBirth: '',
      notes: '',
      jobTitle: '',
      bio: '',
      role: 'user'
    });
    setIsEditMode(false);
    setEditingId(null);
  };

  const filterData = () => {
    let result = [...users];
    if (activeTypeFilter !== 'all') result = result.filter(u => u.type === activeTypeFilter);
    if (activeRoleFilter !== 'all') result = result.filter(u => u.role === activeRoleFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.displayName?.toLowerCase().includes(term) ||
        u.phoneNumber?.toLowerCase().includes(term) ||
        u.number?.toString().includes(term)
      );
    }
    setFilteredUsers(result);
  };

  const getUserTypeBadge = (type: string) => {
    switch(type) {
      case 'student': return <Badge variant="info">طالب</Badge>;
      case 'teacher': return <Badge variant="success">معلم</Badge>;
      case 'halaqa': return <Badge variant="warning">حلقة</Badge>;
      case 'parent': return <Badge variant="slate" className="bg-indigo-50 text-indigo-600 border-indigo-100">ولي أمر</Badge>;
      case 'mentor': return <Badge variant="slate" className="bg-purple-50 text-purple-600 border-purple-100">موجه</Badge>;
      case 'admin': return <Badge variant="error">مدير</Badge>;
      default: return <Badge variant="slate">{type}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-16">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-10 md:p-14 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4">
              <Badge variant="slate" className="px-3 py-1 rounded-lg border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest">
                <Users className="w-3.5 h-3.5" />
                مركز إدارة حسابات المستخدمين الموحد
              </Badge>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight family-cairo">إدارة المستخدمين</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                تحكم كامل في صلاحيات المعلمين، حصر الطلاب، وإدارة حلقات التحفيظ عبر واجهة موحدة متزامنة مع التطبيق.
              </p>
            </div>
            
            <Button 
              onClick={() => { resetForm(); setIsAddModalOpen(true); getNextNumber('student'); }}
              className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 text-sm font-bold gap-3"
            >
              <UserPlus className="w-5 h-5" />
              إضافة مستخدم جديد
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard title="إجمالي المستخدمين" value={stats.total} icon={Users} color="blue" />
           <StatCard title="الطلاب المقيدين" value={stats.students} icon={GraduationCap} color="emerald" />
           <StatCard title="كادر المعلمين" value={stats.teachers} icon={School} color="amber" />
           <StatCard title="حلقات التحفيظ" value={stats.halaqas} icon={UserCog} color="rose" />
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
           <div className="relative w-full xl:max-w-md group">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث بالاسم، الرقم، أو الجوال..." 
                className="w-full h-14 pr-14 pl-6 bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-100/50 dark:border-slate-800/50 rounded-2xl font-bold text-sm outline-none focus:border-blue-600/20 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
              />
           </div>

           <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                {['all', 'student', 'teacher', 'halaqa', 'parent'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveTypeFilter(type)}
                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTypeFilter === type ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {type === 'all' ? 'الكل' : type === 'student' ? 'طلاب' : type === 'teacher' ? 'معلمين' : type === 'halaqa' ? 'حلقات' : 'أولياء أمور'}
                  </button>
                ))}
              </div>

              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={`h-11 px-5 rounded-2xl border-slate-200 dark:border-slate-800 text-xs font-bold gap-2 ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
              >
                <Filter className="w-4 h-4" />
                تصفية متقدمة
              </Button>

              {(activeTypeFilter !== 'all' || activeRoleFilter !== 'all' || searchTerm) && (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setActiveTypeFilter('all');
                    setActiveRoleFilter('all');
                    setSearchTerm('');
                  }}
                  className="h-11 px-4 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 text-xs font-bold gap-2"
                >
                  <FilterX className="w-4 h-4" />
                  مسح
                </Button>
              )}
           </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden text-right" dir="rtl">
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                 <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-right">
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">المستخدم</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">النوع / الرقم</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">الحلقة / التبعية</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">الجوال</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">الحالة</th>
                       <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">خيارات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    <AnimatePresence mode="popLayout">
                       {loading ? (
                         Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                       ) : filteredUsers.length > 0 ? (
                         filteredUsers.map((user) => (
                           <motion.tr 
                             layout
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             key={user.id} 
                             className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
                           >
                              <td className="px-8 py-6" onClick={() => { setSelectedUser(user); setIsProfileModalOpen(true); }}>
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-500 font-bold text-lg border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden shrink-0">
                                       {user.photoURL ? (
                                         <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                       ) : (
                                         user.displayName?.[0] || 'U'
                                       )}
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                       <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight truncate">{user.displayName || 'مستخدم بلا اسم'}</p>
                                       <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5 truncate">
                                          <Mail size={12} />
                                          {user.email || 'بدون بريد'}
                                       </p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex flex-col gap-1">
                                    {getUserTypeBadge(user.type)}
                                    <span className="text-[10px] font-black text-slate-300"># {user.number || '---'}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex flex-col gap-2">
                                    <Badge variant="slate" className="px-3 py-1 rounded-lg border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                                       {user.type === 'student' ? (user.halaqaName || '---') : (user.type === 'halaqa' ? 'مركز إداري' : 'كادر تعليمي')}
                                    </Badge>
                                    {user.type === 'halaqa' && (
                                      <div className="flex items-center gap-2">
                                         <Badge variant="info" className="px-2 py-0 rounded font-black text-[8px]">{getStudentCountForHalaqa(user.id)} طالب</Badge>
                                         <span className="text-[9px] font-bold text-slate-400">معلم: {getTeacherForHalaqa(user.id)}</span>
                                      </div>
                                    )}
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                                    {user.phoneNumber || '--'}
                                 </p>
                              </td>
                              <td className="px-8 py-6">
                                 {user.status !== 'inactive' ? (
                                   <div className="flex items-center gap-2 text-emerald-500">
                                      <CheckCircle2 size={14} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">نشط</span>
                                   </div>
                                 ) : (
                                   <div className="flex items-center gap-2 text-rose-500">
                                      <XCircle size={14} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">معطل</span>
                                   </div>
                                 )}
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center justify-center gap-2">
                                    <Button onClick={() => handleEdit(user)} variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20">
                                       <Edit size={16} />
                                    </Button>
                                    <DropdownMenu>
                                       <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl">
                                             <MoreVertical size={16} />
                                          </Button>
                                       </DropdownMenuTrigger>
                                       <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 border-slate-200 dark:border-slate-800">
                                          <DropdownMenuItem className="rounded-xl gap-3 text-xs font-semibold py-3" onClick={() => { setSelectedUser(user); setIsProfileModalOpen(true); }}>
                                             <Eye size={16} className="text-slate-400" />
                                             عرض الملف الشخصي
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="rounded-xl gap-3 text-xs font-semibold py-3 text-rose-500 focus:text-rose-600" onClick={() => handleDeleteUser(user.id)}>
                                             <Trash2 size={16} />
                                             حذف الحساب
                                          </DropdownMenuItem>
                                       </DropdownMenuContent>
                                    </DropdownMenu>
                                 </div>
                              </td>
                           </motion.tr>
                         ))
                       ) : (
                         <tr>
                            <td colSpan={6} className="px-8 py-32 text-center">
                               <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
                                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex items-center justify-center text-slate-300">
                                     <FilterX size={40} />
                                  </div>
                                  <div className="space-y-2">
                                     <h3 className="font-bold text-lg text-slate-900 dark:text-white family-cairo">لم يتم العثور على نتائج</h3>
                                     <p className="text-sm text-slate-400 leading-relaxed font-medium">حاول تغيير معايير البحث أو الفلترة التي قمت باختيارها للوصول لنتائج أفضل.</p>
                                  </div>
                                  <Button variant="outline" onClick={() => { setActiveTypeFilter('all'); setSearchTerm(''); }} className="rounded-2xl px-8">إعادة ضبط البحث</Button>
                               </div>
                            </td>
                         </tr>
                       )}
                    </AnimatePresence>
                 </tbody>
              </table>
           </div>
        </div>

        {/* PROFILE MODAL (MOBILE PARITY) */}
        <AnimatePresence>
          {isProfileModalOpen && selectedUser && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsProfileModalOpen(false)} />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-right"
                 dir="rtl"
               >
                  <div className="relative h-44 bg-gradient-to-br from-blue-600 to-indigo-700">
                     <div className="absolute top-0 left-0 p-6 flex gap-3">
                        <Button variant="ghost" size="icon" onClick={() => setIsProfileModalOpen(false)} className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/20">
                           <X size={20} />
                        </Button>
                     </div>
                     <div className="absolute -bottom-16 right-10 flex items-end gap-6">
                        <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-800 p-2 shadow-xl border-4 border-white dark:border-slate-800">
                           <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-300 overflow-hidden">
                              {selectedUser.photoURL ? <img src={selectedUser.photoURL} className="w-full h-full object-cover" /> : selectedUser.displayName?.[0]}
                           </div>
                        </div>
                        <div className="pb-4">
                           <h2 className="text-2xl font-bold text-slate-900 dark:text-white family-cairo">{selectedUser.displayName}</h2>
                           <div className="flex items-center gap-2 mt-2">
                             {getUserTypeBadge(selectedUser.type)}
                             <span className="text-xs font-bold text-slate-400">#{selectedUser.number}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="pt-20 px-10 pb-10 space-y-8 h-[60vh] overflow-y-auto custom-scrollbar">
                     <section className="space-y-4">
                        <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
                           <BadgeInfo size={16} />
                           المعلومات الأساسية
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                           <InfoItem label="البريد الإلكتروني" value={selectedUser.email} icon={Mail} />
                           <InfoItem label="رقم الجوال" value={selectedUser.phoneNumber} icon={Phone} />
                           <InfoItem label="المرحلة الدراسية" value={selectedUser.educationalStage} icon={GraduationCap} />
                           <InfoItem label="الحالة" value={selectedUser.status === 'active' ? 'نشط' : 'معطل'} icon={CheckCircle2} color={selectedUser.status === 'active' ? 'green' : 'red'} />
                        </div>
                     </section>

                     <section className="space-y-4">
                        <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
                           <Fingerprint size={16} />
                           بيانات الهوية والعمل
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                           <InfoItem label="رقم الهوية" value={selectedUser.identityNumber} icon={Shield} />
                           <InfoItem label="المسمى الوظيفي" value={selectedUser.jobTitle || '---'} icon={Briefcase} />
                           <InfoItem label="الحلقة المسندة" value={selectedUser.halaqaName} icon={Users2} />
                           <InfoItem label="الرقم الأكاديمي" value={selectedUser.number} icon={MoreVertical} />
                        </div>
                     </section>

                     <section className="space-y-4">
                        <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
                           <MapPin size={16} />
                           النبذة الشخصية والملاحظات
                        </h3>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                           <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">{selectedUser.bio || 'لم يتم إضافة نبذة شخصية بعد...'}</p>
                           {selectedUser.notes && (
                             <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                               <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">ملاحظات الإدارة:</p>
                               <p className="text-sm font-medium text-slate-600 dark:text-slate-500">{selectedUser.notes}</p>
                             </div>
                           )}
                        </div>
                     </section>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Unified Add/Edit Modal */}
        <Modal 
          isOpen={isAddModalOpen} 
          onClose={() => { setIsAddModalOpen(false); resetForm(); }}
          title={isEditMode ? 'تعديل بيانات المستخدم' : 'إضافة عضو جديد للنظام'}
        >
          <form onSubmit={handleSubmit} className="space-y-6 pt-4" dir="rtl">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">نوع العضوية</label>
                   <select 
                     value={formData.type}
                     onChange={(e) => {
                        const newType = e.target.value;
                        setFormData({...formData, type: newType});
                        if (!isEditMode) getNextNumber(newType);
                     }}
                     className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none focus:border-blue-500 transition-all"
                   >
                      <option value="student">طالب / دارس</option>
                      <option value="teacher">معلم / مشرف تعليمي</option>
                      <option value="halaqa">حلقة تحفيظ</option>
                      <option value="admin">مدير نظام</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الرقم المرجعي</label>
                   <Input 
                      value={formData.number}
                      readOnly
                      className="bg-slate-100/50 dark:bg-slate-900 cursor-not-allowed font-black text-blue-600 text-center"
                   />
                </div>
             </div>

             <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رقم السجل المدني (10 أرقام)</label>
                   <Input 
                      required
                      value={formData.civilId}
                      onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                         setFormData({...formData, civilId: val});
                      }}
                      placeholder="رقم الهوية المكون من 10 أرقام..."
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رقم الجوال الشخصي</label>
                   <Input 
                      required
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      placeholder="05xxxxxxxx"
                   />
                </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الرقم القومي / الهوية</label>
                    <Input 
                       value={formData.identityNumber}
                       onChange={(e) => setFormData({...formData, identityNumber: e.target.value})}
                       placeholder="رقم الهوية..."
                    />
                 </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المسمى الوظيفي (للمعلمين)</label>
                   <Input 
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                      placeholder="مثال: معلم قرآن"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الصلاحية (الدور)</label>
                   <select 
                     value={formData.role}
                     onChange={(e) => setFormData({...formData, role: e.target.value})}
                     className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none"
                   >
                      <option value="user">مستخدم عادي</option>
                      <option value="mentor">مشرف (Mentor)</option>
                      <option value="admin">مدير (Admin)</option>
                   </select>
                </div>
             </div>

             {formData.type === 'student' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الحلقة التابع لها</label>
                      <select 
                        value={formData.halaqaId}
                        onChange={(e) => {
                          const h = halaqas.find(x => x.id === e.target.value);
                          setFormData({...formData, halaqaId: e.target.value, halaqaName: h?.displayName});
                        }}
                        className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none"
                      >
                         <option value="">اختر حلقة...</option>
                         {halaqas.map(h => <option key={h.id} value={h.id}>{h.displayName}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ولي الأمر (اختياري)</label>
                      <select 
                        value={formData.guardianUserId}
                        onChange={(e) => setFormData({...formData, guardianUserId: e.target.value})}
                        className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none"
                      >
                         <option value="">اختر ولي الأمر من النظام...</option>
                         {users.filter(u => u.type === 'parent').map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المرحلة الدراسية</label>
                      <select 
                        value={formData.educationalStage}
                        onChange={(e) => setFormData({...formData, educationalStage: e.target.value})}
                        className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none"
                      >
                         <option value="تمهيدي">تمهيدي</option>
                         <option value="ابتدائي">ابتدائي</option>
                         <option value="متوسط">متوسط</option>
                         <option value="ثانوي">ثانوي</option>
                         <option value="جامعي">جامعي</option>
                      </select>
                   </div>
                </div>
             )}

             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">النبذة الشخصية (Bio)</label>
                <textarea 
                   rows={2}
                   value={formData.bio}
                   onChange={(e) => setFormData({...formData, bio: e.target.value})}
                   className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-blue-500 resize-none"
                   placeholder="اكتب نبذة مختصرة عن المستخدم..."
                />
             </div>

             <div className="flex gap-4 pt-6">
                <Button 
                   type="submit" 
                   disabled={isSaving}
                   className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-base shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98]"
                >
                   {isSaving ? 'جاري الحفظ...' : isEditMode ? 'تحديث البيانات' : 'حفظ ونشر الحساب'}
                </Button>
                <Button 
                   type="button" 
                   variant="outline"
                   onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                   className="h-14 px-8 rounded-2xl font-bold text-sm"
                >
                   إلغاء
                </Button>
             </div>
          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
}

function InfoItem({ label, value, icon: Icon, color = 'blue' }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
    green: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10',
    red: 'text-rose-500 bg-rose-50 dark:bg-rose-900/10'
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/20">
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
          <Icon size={18} />
       </div>
       <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{value || '---'}</p>
       </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'from-blue-500 to-indigo-600 shadow-blue-500/10',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/10',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/10',
    rose: 'from-rose-500 to-pink-600 shadow-rose-500/10'
  };

  return (
    <Card className="relative overflow-hidden group hover:border-blue-500/20 transition-all duration-300">
       <CardContent className="p-8">
          <div className="flex items-center justify-between">
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">{title}</p>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tight text-right">{value}</h3>
             </div>
             <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110 duration-500`}>
                <Icon size={24} />
             </div>
          </div>
          <div className={`absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br ${colors[color]} opacity-[0.03] rounded-tl-[5rem] transition-all group-hover:w-28 group-hover:h-28`}></div>
       </CardContent>
    </Card>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
       <td className="px-8 py-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
             <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                <div className="h-3 w-24 bg-slate-50 dark:bg-slate-900 rounded-lg"></div>
             </div>
          </div>
       </td>
       <td className="px-8 py-6"><div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div></td>
       <td className="px-8 py-6"><div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg"></div></td>
       <td className="px-8 py-6"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg"></div></td>
       <td className="px-8 py-6"><div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded-lg"></div></td>
       <td className="px-8 py-6"><div className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg mx-auto"></div></td>
    </tr>
  );
}
