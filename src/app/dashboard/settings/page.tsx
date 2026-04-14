'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Database, 
  Save, 
  Globe, 
  Smartphone,
  LogOut,
  Palette,
  Eye,
  Lock,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronLeft,
  X,
  Plus,
  ArrowLeft,
  Monitor,
  Moon,
  Sun,
  FileText,
  ClipboardList,
  BarChart3,
  Users,
  Info,
  HelpCircle,
  ShieldAlert,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';
import TestConfigManager from './tabs/TestConfigManager';
import PdfSettingsManager from './tabs/PdfSettingsManager';
import { isAdminLike } from '@/lib/access';
import { Modal } from '@/components/ui/Modal';
import { UI_TEXT } from '@/lib/ui-text';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const isAdmin = isAdminLike(user);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setFeedbackMessage(UI_TEXT.messages.settingsSaved);
    }, 1200);
  };

  const settingsTabs = [
    { id: 'profile', name: 'الحساب الشخصي', icon: <User className="w-4 h-4" />, desc: 'تحديث بيانات المعلم والصورة', adminOnly: false },
    { id: 'admin_institution', name: 'بيانات المؤسسة', icon: <Globe className="w-4 h-4" />, desc: 'إدارة بيانات الهوية والمركز', adminOnly: true },
    { id: 'system', name: 'المظهر والسمات', icon: <Palette className="w-4 h-4" />, desc: 'تخصيص واجهة المستخدم', adminOnly: false },
    { id: 'security', name: 'كلمة المرور', icon: <Lock className="w-4 h-4" />, desc: 'إدارة الحماية والوصول', adminOnly: false },
    { id: 'admin_tests', name: 'إدارة التسميع', icon: <ClipboardList className="w-4 h-4" />, desc: 'المناهج وإعدادات الاختبارات', adminOnly: true },
    { id: 'admin_reports', name: 'التقارير', icon: <BarChart3 className="w-4 h-4" />, desc: 'التقارير العامة والإحصائيات', adminOnly: true },
    { id: 'admin_users', name: 'المستخدمين', icon: <Users className="w-4 h-4" />, desc: 'إدارة حسابات المنصة', adminOnly: true },
    { id: 'pdf', name: 'إعدادات الطباعة', icon: <Printer className="w-4 h-4" />, desc: 'قوالب الـ PDF والتقارير', adminOnly: false },
    { id: 'support', name: 'حول والدعم', icon: <Info className="w-4 h-4" />, desc: 'المساعدة ومعلومات النظام', adminOnly: false },
  ].filter(tab => !tab.adminOnly || isAdmin);

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-16">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] p-12 md:p-16 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm transition-all group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12 lg:gap-20">
            <div className="space-y-4">
              <Badge variant="slate" className="px-3 py-1 rounded-lg border-slate-100 dark:border-slate-800 text-[10px] font-black">
                <SettingsIcon className="w-3.5 h-3.5" />
                إعدادات المنصة - {isAdmin ? 'مشرف عام' : 'مستخدم'}
              </Badge>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">إعدادات المنصة</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                إدارة شاملة لخيارات الأمان، تفضيلات العرض المتقدمة، ومزامنة السجلات السحابية الموحدة بين الويب والتطبيق.
              </p>
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              isLoading={isSaving}
              className="h-14 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20"
            >
              حـفظ الإعدادات والتغييرات
              {!isSaving && <Save className="w-5 h-5 mr-3" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Navigation */}
          <div className="xl:col-span-4 flex flex-col gap-6">
             <Card className="p-3 border-slate-200/60 dark:border-slate-800 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar-hide space-y-1">
                  {settingsTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-right flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02]'}`}
                    >
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-300 shrink-0 ${activeTab === tab.id ? 'bg-white/20 border-white/20 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 group-hover:scale-110'}`}>
                         {tab.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                         <p className="font-bold text-sm tracking-tight">{tab.name}</p>
                         <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60 truncate ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}>{tab.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
             </Card>
             
             <Card className="p-3 border-rose-100 dark:border-rose-900/20">
                <button 
                  onClick={() => {
                    localStorage.removeItem('userData');
                    router.push('/login');
                  }}
                  className="w-full h-14 flex items-center justify-between px-5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl text-sm font-bold transition-all group"
                >
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                         <LogOut size={18} />
                      </div>
                      <span className="tracking-tight uppercase">تسجيل الخروج الآمن</span>
                   </div>
                   <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                </button>
             </Card>
          </div>

          {/* Content Area */}
          <div className="xl:col-span-8">
             <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-10 md:p-14 border-slate-200/60 dark:border-slate-800 min-h-[600px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    
                   {activeTab === 'profile' && (
                     <div className="space-y-10">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                           <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">بيانات الحساب الشخصي</h2>
                        </div>
                        
                        <div className="flex items-center gap-10 p-10 bg-slate-50/50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100/50 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-900 group">
                           <div className="relative group shrink-0">
                              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-4xl font-bold border-4 border-white dark:border-slate-800 shadow-2xl transition-transform group-hover:scale-110 duration-500 overflow-hidden">
                                 {user?.photoURL ? (
                                   <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                 ) : (
                                   <span>{user?.displayName ? user.displayName[0] : '👨‍💻'}</span>
                                 )}
                              </div>
                              <button className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 text-blue-600 hover:scale-110 transition-transform">
                                 <Plus size={18} />
                              </button>
                           </div>
                           <div className="space-y-2 flex-1">
                              <h3 className="font-bold text-lg text-slate-900 dark:text-white">الصورة الشخصية</h3>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-sm">تغيير الصورة التي تظهر في اللوحة الشخصية وكامل سجلات النظام.</p>
                              <div className="flex items-center gap-4 pt-2">
                                 <Button variant="ghost" size="sm" className="text-blue-600 font-bold text-[11px] uppercase tracking-[0.2em] p-0">رفع صورة جديدة</Button>
                                 <div className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                 <Button variant="ghost" size="sm" className="text-red-500 font-bold text-[11px] uppercase tracking-[0.2em] p-0">حذف الصورة</Button>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                           <CustomFormRow label="الاسم الأكاديمي الكامل" icon={User} defaultValue={user?.displayName || "المشرف العام"} />
                           <CustomFormRow label="البريد الإلكتروني الأساسي" icon={Globe} defaultValue={user?.email || "admin@theplatform.com"} />
                           <div className="md:col-span-2">
                             <CustomFormRow label="رقم الجوال للتحقق" icon={Smartphone} defaultValue={user?.phoneNumber || ""} placeholder="أدخل رقم الجوال" isLtr />
                           </div>
                        </div>
                     </div>
                   )}

                   {activeTab === 'security' && (
                     <div className="space-y-10">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                           <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">إدارة كلمة المرور</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-8">
                           <CustomFormRow label="كلمة المرور الحالية" icon={Lock} type="password" placeholder="********" />
                           <CustomFormRow label="كلمة المرور الجديدة" icon={Lock} type="password" placeholder="********" />
                           <CustomFormRow label="تأكيد كلمة المرور الجديدة" icon={Lock} type="password" placeholder="********" />
                        </div>

                        <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
                           <div className="flex items-center gap-3 mb-2 text-amber-700 dark:text-amber-400">
                             <ShieldAlert size={18} />
                             <h4 className="font-bold text-sm uppercase tracking-widest">تنبيه أمني</h4>
                           </div>
                           <p className="text-xs font-medium text-amber-600 dark:text-amber-500/80 leading-relaxed">
                             يفضل تغيير كلمة المرور بشكل دوري كل ٩٠ يوماً لضمان أعلى معايير الحماية لبياناتك الشخصية وسجلات الطلاب.
                           </p>
                        </div>
                     </div>
                   )}

                   {activeTab === 'admin_institution' && isAdmin && (
                      <div className="space-y-10">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">إدارة بيانات المؤسسة الرسمية</h2>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <CustomFormRow label="اسم المؤسسة / المركز" icon={Globe} defaultValue="مركز المساواة لعلوم القرآن" />
                            <CustomFormRow label="شعار المؤسسة (URL)" icon={FileText} defaultValue="/images/logo/logo.png" />
                            <div className="md:col-span-2">
                               <CustomFormRow label="الرؤية والهدف" icon={Zap} placeholder="رؤية المؤسسة..." />
                            </div>
                            <CustomFormRow label="المدير العام" icon={User} defaultValue="أ. محمد المصطفى" />
                            <CustomFormRow label="رقم السجل الرسمي" icon={Shield} placeholder="123456789" />
                         </div>

                         <div className="p-10 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800/40">
                            <div className="flex items-center gap-4 mb-6">
                               <Sparkles className="text-indigo-600" />
                               <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-xs">إعدادات الهوية البصرية للتقارير</h3>
                            </div>
                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-6">هذه البيانات تظهر تلقائياً في ترويسة جميع تقارير الـ PDF المستخرجة من النظام.</p>
                            <Button className="rounded-xl px-10 bg-indigo-600 hover:bg-indigo-700 h-12 text-sm font-bold">تحديث قاعدة بيانات الهوية</Button>
                         </div>
                      </div>
                   )}
                   {activeTab === 'system' && (
                      <div className="space-y-10">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">تفضيلات الهوية البصرية</h2>
                         </div>
                        
                        <Card className="p-8 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-8">
                           <div className="flex items-center justify-between">
                              <div>
                                 <h4 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">نمط واجهة المستخدم</h4>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">تغيير مظهر المنصة العام</p>
                              </div>
                              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 dark:border-slate-700">
                                 <Palette size={22} />
                              </div>
                           </div>

                           <div className="grid grid-cols-3 gap-6">
                               <ThemeButton name="فاتح" icon={Sun} active />
                               <ThemeButton name="داكن" icon={Moon} />
                               <ThemeButton name="تلقائي" icon={Monitor} />
                           </div>
                        </Card>
                     </div>
                   )}

                   {activeTab === 'admin_tests' && isAdmin && (
                     <div className="space-y-10">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                           <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">إدارة التسميع والمناهج</h2>
                        </div>
                        <TestConfigManager />
                     </div>
                   )}

                   {activeTab === 'admin_reports' && isAdmin && (
                     <div className="space-y-10">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                           <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">التقارير والمؤشرات العامة</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-5">
                           <AdminToolCard 
                             title="التقارير العامة" 
                             desc="تحليلات شاملة للحضور، الإنجاز، ومؤشر النمو العام."
                             icon={BarChart3}
                             href="/dashboard/reports"
                           />
                           <AdminToolCard 
                             title="سجلات الزيارات الإدارية" 
                             desc="متابعة تقييم الحلقات وأداء المعلمين الميداني."
                             icon={Eye}
                             href="/dashboard/visits"
                           />
                        </div>
                     </div>
                   )}

                   {activeTab === 'admin_users' && isAdmin && (
                     <div className="space-y-10">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                           <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">إدارة مستخدمي المنصة</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-5">
                           <AdminToolCard 
                             title="جميع المستخدمين" 
                             desc="إدارة حسابات المعلمين، الطلاب، والمشرفين (تفعيل/إلغاء)."
                             icon={Users}
                             href="/dashboard/users"
                           />
                           <AdminToolCard 
                             title="الأدوار والصلاحيات" 
                             desc="تخصيص صلاحيات الوصول لكل فئة من مستخدمي النظام."
                             icon={Shield}
                           />
                        </div>
                     </div>
                   )}

                   {activeTab === 'pdf' && (
                     <div className="space-y-10">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                           <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">إعدادات طباعة التقارير</h2>
                        </div>
                        <PdfSettingsManager />
                     </div>
                   )}

                   {activeTab === 'support' && (
                     <div className="space-y-10">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                           <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">الدعم ومعلومات النظام</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-5">
                           <Card className="p-8 border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 text-center space-y-4">
                              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm border border-slate-100 dark:border-slate-800">
                                 <img src="/images/logo/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                              </div>
                              <div>
                                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">نظام المتابعة التعليمية المؤسسية</h3>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Version 2.5.0 </p>
                              </div>
                              <p className="text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
                                تم تطوير هذا النظام بأحدث التقنيات لضمان أفضل تجربة لمتابعة الطلاب والحلقات بطريقة رقمية متكاملة.
                              </p>
                           </Card>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                              <SupportLink title="مركز المساعدة" icon={HelpCircle} />
                              <SupportLink title="سياسة الخصوصية" icon={ShieldAlert} />
                           </div>
                        </div>
                     </div>
                   )}

                  </Card>
                </motion.div>
             </AnimatePresence>
          </div>

        </div>

      </div>
      <Modal
        isOpen={Boolean(feedbackMessage)}
        onClose={() => setFeedbackMessage(null)}
        title="تنبيه النظام"
      >
        <div className="space-y-6 text-right">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {feedbackMessage || ''}
          </p>
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

function CustomFormRow({ label, icon: Icon, defaultValue, placeholder, isLtr, type = "text" }: any) {
  return (
    <div className="space-y-3">
       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] block pr-1">
          {label}
       </label>
       <div className="relative group">
          <Icon className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
          <input 
            type={type}
            className={`w-full h-14 pr-12 pl-4 bg-slate-50/50 dark:bg-slate-900/40 border-2 border-slate-100/50 dark:border-slate-800 rounded-2xl font-bold text-base text-slate-900 dark:text-white outline-none focus:border-blue-600/30 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 ${isLtr ? 'text-left' : ''}`} 
            dir={isLtr ? 'ltr' : 'rtl'}
            defaultValue={defaultValue} 
            placeholder={placeholder}
          />
       </div>
    </div>
  );
}

function SecurityCard({ title, desc, icon: Icon, actionLabel, badge, isEnabled }: any) {
  return (
    <Card className="p-6 md:p-8 border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-blue-500/20 transition-all duration-300">
       <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all border border-slate-50 dark:border-slate-700 group-hover:scale-110">
             <Icon size={24} />
          </div>
          <div className="space-y-1">
             <div className="flex items-center gap-3">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">{title}</h4>
                {badge && <Badge variant="info" className="px-2 py-0.5 rounded-lg text-[8px] tracking-widest uppercase">{badge}</Badge>}
             </div>
             <p className="text-xs font-bold text-slate-400 uppercase dark:text-slate-500">{desc}</p>
          </div>
       </div>
       {isEnabled ? (
         <Badge variant="success" className="h-10 px-6 rounded-2xl font-bold uppercase tracking-widest gap-2">
            <CheckCircle2 size={16} />
            نشط
         </Badge>
       ) : (
         <Button variant="outline" className="h-11 px-8 rounded-2xl text-[10px] font-bold uppercase tracking-widest border-slate-200 dark:border-slate-800">{actionLabel}</Button>
       )}
    </Card>
  );
}

function ThemeButton({ name, icon: Icon, active }: any) {
  return (
    <button 
      className={`p-10 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center gap-4 ${active ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 shadow-2xl shadow-blue-500/10' : 'bg-slate-50/50 dark:bg-slate-800/20 border-transparent text-slate-400 opacity-60 hover:opacity-100 hover:border-slate-200 dark:hover:border-slate-700'}`}
    >
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${active ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
          <Icon size={28} />
       </div>
       <span className="font-bold text-xs uppercase tracking-widest">{name}</span>
    </button>
  );
}

function AdminToolCard({ title, desc, icon: Icon, href }: any) {
  const router = useRouter();
  return (
    <Card 
      onClick={() => href && router.push(href)}
      className={`p-6 md:p-8 border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex items-center justify-between gap-6 group hover:border-blue-500/20 transition-all duration-300 ${href ? 'cursor-pointer' : ''}`}
    >
       <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 transition-all border border-blue-100/50 dark:border-blue-800/20 group-hover:scale-110">
             <Icon size={24} />
          </div>
          <div className="space-y-1">
             <h4 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">{title}</h4>
             <p className="text-xs font-bold text-slate-400 uppercase dark:text-slate-500">{desc}</p>
          </div>
       </div>
       <ChevronLeft size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
    </Card>
  );
}

function SupportLink({ title, icon: Icon }: any) {
  return (
    <button className="flex items-center justify-between p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/20 transition-all group">
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all">
             <Icon size={20} />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</span>
       </div>
       <ArrowLeft size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:-translate-x-1 transition-all" />
    </button>
  );
}
