'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Printer, 
  Image as ImageIcon, 
  Type, 
  Layout, 
  CheckCircle2,
  RefreshCcw,
  Upload
} from 'lucide-react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { UI_TEXT } from '@/lib/ui-text';

export default function PdfSettingsManager() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    rightHeader: '',
    leftHeader: '',
    footerText: '',
    isHeaderVisible: true,
    logoUrl: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'pdf_config');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setSettings(snap.data() as any);
      }
    } catch (error) {
      console.error("Error fetching PDF settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'pdf_config'), {
        ...settings,
        updatedAt: serverTimestamp()
      });
      setFeedbackMessage(UI_TEXT.messages.pdfSettingsSaved);
    } catch (error) {
      console.error("Error saving PDF settings:", error);
      setFeedbackMessage(UI_TEXT.messages.pdfSettingsSaveError);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-slate-400 font-bold uppercase tracking-widest">جاري تحميل الإعدادات...</div>;

  return (
    <div className="space-y-8" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Header Config */}
        <div className="space-y-6">
           <div className="flex items-center gap-3">
              <Layout className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 dark:text-white">إعدادات الرأس (Header)</h3>
           </div>
           
           <Card className="border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
              <CardContent className="p-8 space-y-6">
                 <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                       <p className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">إظهار رأس التقرير</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">تفعيل أو تعطيل ظهور البيانات العلوية</p>
                    </div>
                    <button 
                      onClick={() => setSettings({...settings, isHeaderVisible: !settings.isHeaderVisible})}
                      className={`w-12 h-6 rounded-full transition-all relative ${settings.isHeaderVisible ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                       <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.isHeaderVisible ? 'right-7' : 'right-1'}`}></div>
                    </button>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">النص الأيمن (عربي)</label>
                    <textarea 
                      value={settings.rightHeader}
                      onChange={(e) => setSettings({...settings, rightHeader: e.target.value})}
                      className="w-full min-h-[100px] p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-blue-500"
                      placeholder="أدخل النص العربي الذي سيظهر في الجهة اليمنى من الرأس..."
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">النص الأيسر (إنجليزي/إضافي)</label>
                    <textarea 
                      value={settings.leftHeader}
                      onChange={(e) => setSettings({...settings, leftHeader: e.target.value})}
                      className="w-full min-h-[100px] p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-blue-500 text-left"
                      dir="ltr"
                      placeholder="Enter the text for the left side of the header..."
                    />
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Logo & Footer */}
        <div className="space-y-6">
           <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 dark:text-white">الشعار والتذييل</h3>
           </div>

           <Card className="border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
              <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رابط شعار المؤسسة (Logo URL)</label>
                     <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 group/logo relative">
                           {settings.logoUrl ? (
                             <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                           ) : (
                             <div className="flex flex-col items-center gap-2">
                                <ImageIcon className="text-slate-200" size={32} />
                                <span className="text-[8px] font-black text-slate-300">لا يوجد شعار</span>
                             </div>
                           )}
                           <div className="absolute inset-0 bg-blue-600/0 group-hover/logo:bg-blue-600/5 transition-all"></div>
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                           <Input 
                             value={settings.logoUrl}
                             onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                             className="h-12 bg-white dark:bg-slate-900 font-mono text-[11px]"
                             placeholder="https://example.com/logo.png"
                           />
                           <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-sm">أدخل رابط مباشر للصورة (PNG أو SVG) ليتم عرضها في ترويسة التقارير الرسمية.</p>
                        </div>
                     </div>
                  </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نص التذييل (التوقيعات)</label>
                    <textarea 
                      value={settings.footerText}
                      onChange={(e) => setSettings({...settings, footerText: e.target.value})}
                      className="w-full min-h-[120px] p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-blue-500"
                      placeholder="أدخل نص التذييل ومساحات التوقيع..."
                    />
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
         <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="h-14 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 gap-3 font-black text-sm"
         >
            {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات التقارير'}
            <Save className="w-5 h-5" />
         </Button>
      </div>
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
  );
}
