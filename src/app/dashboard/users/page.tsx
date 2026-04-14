'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { UI_TEXT } from '@/lib/ui-text';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function UsersManagementPage() {
  const router = useRouter();
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
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

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
      setFeedbackMessage(UI_TEXT.messages.userSaveError);
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

  const handleDeleteUser = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteDoc(doc(db, 'users', deleteTargetId));
      setDeleteTargetId(null);
      fetchUsers();
    } catch (e) {
      console.error(e);
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
      <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-8 sm:pb-12">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-5 sm:p-8 md:p-10 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
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
              onClick={() => router.push('/dashboard/users/add')}
              className="w-full sm:w-auto gap-2"
            >
              <UserPlus className="w-5 h-5" />
              إضافة مستخدم جديد
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
           <StatCard title="إجمالي المستخدمين" value={stats.total} icon={Users} color="blue" />
           <StatCard title="الطلاب المقيدين" value={stats.students} icon={GraduationCap} color="emerald" />
           <StatCard title="كادر المعلمين" value={stats.teachers} icon={School} color="amber" />
           <StatCard title="حلقات التحفيظ" value={stats.halaqas} icon={UserCog} color="rose" />
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
           <div className="relative w-full xl:max-w-md group">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث بالاسم، الرقم، أو الجوال..." 
                className="w-full h-11 pr-12 pl-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/70 rounded-lg font-medium text-sm outline-none focus:border-blue-600/20 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
           </div>

           <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
                {['all', 'student', 'teacher', 'halaqa', 'parent'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveTypeFilter(type)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeTypeFilter === type ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {type === 'all' ? 'الكل' : type === 'student' ? 'طلاب' : type === 'teacher' ? 'معلمين' : type === 'halaqa' ? 'حلقات' : 'أولياء أمور'}
                  </button>
                ))}
              </div>

              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={`h-10 px-5 border-slate-200 dark:border-slate-800 text-xs font-semibold gap-2 ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
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
                  className="h-10 px-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 text-xs font-semibold gap-2"
                >
                  <FilterX className="w-4 h-4" />
                  مسح
                </Button>
              )}
           </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-sm overflow-hidden text-right" dir="rtl">
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[860px] border-collapse">
                 <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-right">
                       <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">المستخدم</th>
                       <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">النوع / الرقم</th>
                       <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">الحلقة / التبعية</th>
                       <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">الجوال</th>
                       <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">الحالة</th>
                       <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">خيارات</th>
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
                              <td className="px-3 sm:px-6 py-3 sm:py-4" onClick={() => { setSelectedUser(user); setIsProfileModalOpen(true); }}>
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
                              <td className="px-3 sm:px-6 py-3 sm:py-4">
                                 <div className="flex flex-col gap-1">
                                    {getUserTypeBadge(user.type)}
                                    <span className="text-[10px] font-black text-slate-300"># {user.number || '---'}</span>
                                 </div>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4">
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
                              <td className="px-3 sm:px-6 py-3 sm:py-4">
                                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                                    {user.phoneNumber || '--'}
                                 </p>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4">
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
                              <td className="px-3 sm:px-6 py-3 sm:py-4">
                                 <div className="flex items-center justify-center gap-2">
                                    <Button onClick={() => router.push(`/dashboard/users/${user.id}/edit`)} variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20">
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
                                          <DropdownMenuItem className="rounded-xl gap-3 text-xs font-semibold py-3 text-rose-500 focus:text-rose-600" onClick={() => setDeleteTargetId(user.id)}>
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
                            <td colSpan={6} className="px-4 sm:px-8 py-20 sm:py-32 text-center">
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
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsProfileModalOpen(false)} />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 text-right max-h-[min(88dvh,calc(100dvh-1.5rem))] flex flex-col"
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

                  <div className="pt-20 px-4 sm:px-8 lg:px-10 pb-6 sm:pb-10 space-y-8 overflow-y-auto custom-scrollbar min-h-0 flex-1">
                     <section className="space-y-4">
                        <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
                           <BadgeInfo size={16} />
                           المعلومات الأساسية
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">نوع العضوية</label>
                   <SearchableSelect
                     value={formData.type}
                     onChange={(newType) => {
                       setFormData({ ...formData, type: newType });
                       if (!isEditMode) getNextNumber(newType);
                     }}
                     options={[
                       { value: 'student', label: 'طالب / دارس' },
                       { value: 'teacher', label: 'معلم / مشرف تعليمي' },
                       { value: 'halaqa', label: 'حلقة تحفيظ' },
                       { value: 'admin', label: 'مدير نظام' },
                     ]}
                     searchPlaceholder="ابحث عن نوع العضوية..."
                   />
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

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                   <SearchableSelect
                     value={formData.role}
                     onChange={(value) => setFormData({ ...formData, role: value })}
                     options={[
                       { value: 'user', label: 'مستخدم عادي' },
                       { value: 'mentor', label: 'مشرف (Mentor)' },
                       { value: 'admin', label: 'مدير (Admin)' },
                     ]}
                     searchPlaceholder="ابحث عن الدور..."
                   />
                </div>
             </div>

             {formData.type === 'student' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الحلقة التابع لها</label>
                      <SearchableSelect
                        value={formData.halaqaId || ''}
                        onChange={(value) => {
                          const halaqa = halaqas.find((item) => item.id === value);
                          setFormData({ ...formData, halaqaId: value, halaqaName: halaqa?.displayName || '' });
                        }}
                        options={halaqas.map((halaqa) => ({ value: halaqa.id, label: halaqa.displayName || 'حلقة' }))}
                        placeholder="اختر حلقة..."
                        searchPlaceholder="ابحث عن الحلقة..."
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ولي الأمر (اختياري)</label>
                      <SearchableSelect
                        value={formData.guardianUserId || ''}
                        onChange={(value) => setFormData({ ...formData, guardianUserId: value })}
                        options={users
                          .filter((userItem) => userItem.type === 'parent')
                          .map((parent) => ({ value: parent.id, label: parent.displayName || 'ولي أمر' }))}
                        placeholder="اختر ولي الأمر من النظام..."
                        searchPlaceholder="ابحث عن ولي الأمر..."
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المرحلة الدراسية</label>
                      <SearchableSelect
                        value={formData.educationalStage}
                        onChange={(value) => setFormData({ ...formData, educationalStage: value })}
                        options={[
                          { value: 'تمهيدي', label: 'تمهيدي' },
                          { value: 'ابتدائي', label: 'ابتدائي' },
                          { value: 'متوسط', label: 'متوسط' },
                          { value: 'ثانوي', label: 'ثانوي' },
                          { value: 'جامعي', label: 'جامعي' },
                        ]}
                        searchPlaceholder="ابحث عن المرحلة..."
                      />
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

             <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-6">
                <Button 
                   type="submit" 
                   disabled={isSaving}
                   className="flex-1 h-11 sm:h-12 bg-blue-600 hover:bg-blue-700 font-bold text-sm sm:text-base shadow-sm"
                >
                   {isSaving ? 'جاري الحفظ...' : isEditMode ? 'تحديث البيانات' : 'حفظ ونشر الحساب'}
                </Button>
                <Button 
                   type="button" 
                   variant="outline"
                   onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                   className="h-11 sm:h-12 px-6 sm:px-8 font-semibold text-sm"
                >
                   إلغاء
                </Button>
             </div>
          </form>
        </Modal>
        <Modal
          isOpen={Boolean(deleteTargetId)}
          onClose={() => setDeleteTargetId(null)}
          title={UI_TEXT.dialogs.deleteTitle}
        >
          <div className="space-y-6 text-right">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {UI_TEXT.messages.userDeleteConfirm}
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" className="h-11 px-6" onClick={() => setDeleteTargetId(null)}>
                {UI_TEXT.actions.cancel}
              </Button>
              <Button variant="danger" className="h-11 px-6" onClick={handleDeleteUser}>
                {UI_TEXT.actions.confirmDelete}
              </Button>
            </div>
          </div>
        </Modal>
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
