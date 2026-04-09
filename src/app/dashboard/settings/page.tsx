'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Database, 
  Save, 
  Globe, 
  Smartphone,
  LogOut
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const settingsTabs = [
    { id: 'profile', name: 'الحساب الشخصي', icon: <User className="w-4 h-4" /> },
    { id: 'security', name: 'الأمان والخصوصية', icon: <Shield className="w-4 h-4" /> },
    { id: 'system', name: 'إعدادات النظام', icon: <SettingsIcon className="w-4 h-4" /> },
    { id: 'data', name: 'قاعدة البيانات', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">الإعدادات العامة</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">مركز التحكم والتفضيلات الشخصية والأمان.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="enterprise-button min-w-[140px]"
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            {!isSaving && <Save className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Sidebar */}
          <div className="md:col-span-3 enterprise-card overflow-hidden">
             <div className="p-2 space-y-1">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                  >
                    {tab.icon}
                    {tab.name}
                  </button>
                ))}
             </div>
             
             <div className="p-2 mt-4 border-t border-gray-100 dark:border-gray-700">
                <button className="w-full flex items-center justify-between px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-sm font-semibold transition-colors">
                   <span>تسجيل الخروج</span>
                   <LogOut className="w-4 h-4" />
                </button>
             </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-9 enterprise-card p-6 min-h-[400px]">
             
             {activeTab === 'profile' && (
               <div className="space-y-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">معلومات الحساب الشخصي</h2>
                  
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400 border border-gray-200 dark:border-gray-700">
                        👨‍💻
                     </div>
                     <div>
                        <button className="enterprise-button-secondary text-xs py-1.5">تغيير الصورة</button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                           <User className="w-4 h-4" /> مسمى العرض الكامل
                        </label>
                        <input className="enterprise-input" defaultValue="المشرف العام" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                           <Globe className="w-4 h-4" /> البريد الإلكتروني
                        </label>
                        <input className="enterprise-input" defaultValue="admin@domain.com" />
                     </div>
                     <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                           <Smartphone className="w-4 h-4" /> رقم الهاتف المتصل
                        </label>
                        <input className="enterprise-input md:w-1/2 text-left" dir="ltr" defaultValue="05XXXXXXX" />
                     </div>
                  </div>
               </div>
             )}

             {activeTab === 'security' && (
               <div className="space-y-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">الأمان وكلمات المرور</h2>
                  
                  <div className="space-y-4">
                     <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between">
                        <div>
                           <h4 className="font-semibold text-gray-900 dark:text-white">كلمة المرور الحالية</h4>
                           <p className="text-sm text-gray-500 mt-0.5">تم التغيير منذ شهرين</p>
                        </div>
                        <button className="enterprise-button-secondary">تغيير</button>
                     </div>
                     
                     <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between">
                        <div>
                           <h4 className="font-semibold text-gray-900 dark:text-white">المصادقة الثنائية (2FA)</h4>
                           <p className="text-sm text-gray-500 mt-0.5">إضافة طبقة أمان إضافية مفعَّلة عبر الـ SMS</p>
                        </div>
                        <button className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded">مفعل</button>
                     </div>
                  </div>
               </div>
             )}

             {activeTab === 'system' && (
               <div className="space-y-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">واجهة وتفضيلات النظام</h2>
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">مظهر النظام (النطاق اللوني)</label>
                        <select className="enterprise-input w-full md:w-1/2">
                           <option>الوضع الفاتح (Light Mode)</option>
                           <option>الوضع الداكن (Dark Mode)</option>
                           <option>تلقائي حسب الجوال</option>
                        </select>
                     </div>
                  </div>
               </div>
             )}

             {activeTab === 'data' && (
               <div className="space-y-6 text-center py-10">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Database className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">استقرار قاعدة البيانات</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                     بيانات النظام تعمل بشكل متزامن وحي. يمكنك أخذ نسخة احتياطية محلية للسجلات.
                  </p>
                  <button className="enterprise-button-secondary mx-auto">
                     إنشاء نسخة احتياطية
                  </button>
               </div>
             )}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
