'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X,
  ClipboardList,
  AlertTriangle,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function TestConfigManager() {
  const [activeSubTab, setActiveSubTab] = useState<'branch' | 'mistake'>('branch');
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    symbol: '',
    type: 'branch'
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'assessmentconfig'), orderBy('value', 'asc'));
      const snap = await getDocs(q);
      setConfigs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching configs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        type: activeSubTab,
        updatedAt: serverTimestamp()
      };

      if (editingConfig) {
        await updateDoc(doc(db, 'assessmentconfig', editingConfig.id), data);
      } else {
        await addDoc(collection(db, 'assessmentconfig'), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      fetchConfigs();
      setFormData({ name: '', value: '', symbol: '', type: activeSubTab });
      setEditingConfig(null);
    } catch (error) {
      console.error("Error saving config:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await deleteDoc(doc(db, 'assessmentconfig', id));
      fetchConfigs();
    } catch (error) {
      console.error("Error deleting config:", error);
    }
  };

  const openEdit = (config: any) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      value: config.value.toString(),
      symbol: config.symbol || '',
      type: config.type
    });
    setIsModalOpen(true);
  };

  const filteredConfigs = configs.filter(c => c.type === activeSubTab);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Sub Tabs */}
      <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveSubTab('branch')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'branch' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
        >
          فروع الاختبار
        </button>
        <button
          onClick={() => setActiveSubTab('mistake')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'mistake' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
        >
          درجات الخصم والرموز
        </button>
      </div>

      <Card className="border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 h-full">
         <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                     {activeSubTab === 'branch' ? <Layers size={20} /> : <AlertTriangle size={20} />}
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-900 dark:text-white">{activeSubTab === 'branch' ? 'فروع المنهج' : 'قائمة الأخطاء'}</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeSubTab === 'branch' ? 'إدارة أقسام الاختبار وترتيبها' : 'تحديد درجات الخصم لكل نوع خطأ'}</p>
                  </div>
               </div>
               <Button 
                onClick={() => { setEditingConfig(null); setFormData({name:'', value:'', symbol:'', type: activeSubTab}); setIsModalOpen(true); }}
                variant="outline" 
                size="sm" 
                className="rounded-xl font-bold text-[10px] uppercase gap-2 border-slate-200 dark:border-slate-800 h-10 px-5"
               >
                  <Plus size={14} />
                  إضافة بند جديد
               </Button>
            </div>

            <div className="space-y-3">
               {loading ? (
                 <p className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest">جاري التحميل...</p>
               ) : filteredConfigs.length > 0 ? (
                 filteredConfigs.map((config) => (
                   <div key={config.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 group hover:border-blue-500/20 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 text-sm">
                            {config.value}
                         </div>
                         <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{config.name}</p>
                            {config.symbol && <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">الرمز: {config.symbol}</p>}
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <Button onClick={() => openEdit(config)} variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-blue-50 hover:text-blue-600"><Edit size={16} /></Button>
                         <Button onClick={() => handleDelete(config.id)} variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-rose-50 hover:text-rose-500"><Trash2 size={16} /></Button>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-16 space-y-3">
                    <ClipboardList className="w-12 h-12 text-slate-200 mx-auto" />
                    <p className="text-sm font-bold text-slate-400">لا توجد إعدادات مضافة بعد</p>
                 </div>
               )}
            </div>
         </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingConfig ? 'تعديل البند' : 'إضافة بند جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الاسم</label>
              <Input 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="أدخل الاسم..."
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {activeSubTab === 'branch' ? 'الترتيب' : 'قيمة الخصم (درجات)'}
                 </label>
                 <Input 
                   required
                   type="number"
                   step="0.25"
                   value={formData.value}
                   onChange={(e) => setFormData({...formData, value: e.target.value})}
                   placeholder="0"
                 />
              </div>
              {activeSubTab === 'mistake' && (
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الرمز</label>
                   <Input 
                     value={formData.symbol}
                     onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                     placeholder="مثال: خ / ت"
                   />
                </div>
              )}
           </div>

           <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 h-12 rounded-xl bg-blue-600 font-black text-sm">حفظ التغييرات</Button>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-12 px-8 rounded-xl font-bold">إلغاء</Button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
