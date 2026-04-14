'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Modal } from '@/components/ui/Modal';
import { Fingerprint, Phone, Save, User, Shield } from 'lucide-react';

interface UserFormProps {
  mode: 'create' | 'edit';
  userId?: string;
}

interface HalaqaOption {
  id: string;
  displayName: string;
}

export default function UserForm({ mode, userId }: UserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [halaqas, setHalaqas] = useState<HalaqaOption[]>([]);

  const [formData, setFormData] = useState({
    type: 'student',
    displayName: '',
    phoneNumber: '',
    civilId: '',
    number: '',
    role: 'user',
    status: 'active',
    educationalStage: 'ابتدائي',
    halaqaId: '',
    halaqaName: '',
    bio: '',
  });

  useEffect(() => {
    loadHalaqas();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && userId) {
      loadUser(userId);
      return;
    }
    if (mode === 'create') {
      loadNextNumber('student');
    }
  }, [mode, userId]);

  const loadHalaqas = async () => {
    const snapshot = await getDocs(query(collection(db, 'users'), where('type', '==', 'halaqa')));
    setHalaqas(
      snapshot.docs.map((item) => ({
        id: item.id,
        displayName: (item.data().displayName as string) || 'حلقة',
      }))
    );
  };

  const loadNextNumber = async (type: string) => {
    const snapshot = await getDocs(query(collection(db, 'users'), where('type', '==', type)));
    let max = 0;
    snapshot.docs.forEach((item) => {
      const value = Number(item.data().number || 0);
      if (!Number.isNaN(value) && value > max) max = value;
    });
    setFormData((prev) => ({ ...prev, number: String(max + 1) }));
  };

  const loadUser = async (id: string) => {
    setIsLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', id));
      if (!userDoc.exists()) {
        router.push('/dashboard/users');
        return;
      }
      const data = userDoc.data();
      setFormData((prev) => ({
        ...prev,
        type: (data.type as string) || 'student',
        displayName: (data.displayName as string) || '',
        phoneNumber: (data.phoneNumber as string) || '',
        civilId: (data.civilId as string) || '',
        number: String(data.number || ''),
        role: (data.role as string) || 'user',
        status: (data.status as string) || 'active',
        educationalStage: (data.educationalStage as string) || 'ابتدائي',
        halaqaId: (data.halaqaId as string) || '',
        halaqaName: (data.halaqaName as string) || '',
        bio: (data.bio as string) || '',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const stageOptions = useMemo(
    () => [
      { value: 'تمهيدي', label: 'تمهيدي' },
      { value: 'ابتدائي', label: 'ابتدائي' },
      { value: 'متوسط', label: 'متوسط' },
      { value: 'ثانوي', label: 'ثانوي' },
      { value: 'جامعي', label: 'جامعي' },
    ],
    []
  );

  const typeOptions = useMemo(
    () => [
      { value: 'student', label: 'طالب / دارس' },
      { value: 'teacher', label: 'معلم / مشرف تعليمي' },
      { value: 'halaqa', label: 'حلقة تحفيظ' },
      { value: 'parent', label: 'ولي أمر' },
      { value: 'admin', label: 'مدير نظام' },
    ],
    []
  );

  const roleOptions = useMemo(
    () => [
      { value: 'user', label: 'مستخدم' },
      { value: 'mentor', label: 'مشرف' },
      { value: 'admin', label: 'مدير' },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: 'active', label: 'نشط' },
      { value: 'inactive', label: 'معطل' },
    ],
    []
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      if (mode === 'create') {
        await addDoc(collection(db, 'users'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      } else if (userId) {
        await updateDoc(doc(db, 'users', userId), payload);
      }
      router.push('/dashboard/users');
    } catch (error) {
      console.error(error);
      setFeedbackMessage('تعذر حفظ بيانات المستخدم. حاول مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-10 rounded-[2.5rem]">
        <p className="text-center text-sm font-bold text-slate-400">جاري تحميل بيانات المستخدم...</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-8 md:p-10 rounded-[2.5rem] border-slate-200/60 dark:border-slate-800">
        <form className="space-y-8" dir="rtl" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="الاسم"
              required
              value={formData.displayName}
              onChange={(event) => setFormData({ ...formData, displayName: event.target.value })}
              icon={User}
            />
            <Input
              label="رقم الجوال"
              value={formData.phoneNumber}
              onChange={(event) => setFormData({ ...formData, phoneNumber: event.target.value })}
              icon={Phone}
            />
            <Input
              label="السجل المدني"
              value={formData.civilId}
              onChange={(event) =>
                setFormData({ ...formData, civilId: event.target.value.replace(/\D/g, '').slice(0, 10) })
              }
              icon={Fingerprint}
            />
            <Input
              label="الرقم المرجعي"
              value={formData.number}
              onChange={(event) => setFormData({ ...formData, number: event.target.value })}
              readOnly={mode === 'create'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="mb-2 block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">نوع العضوية</label>
              <SearchableSelect
                value={formData.type}
                onChange={(value) => {
                  setFormData({ ...formData, type: value });
                  if (mode === 'create') loadNextNumber(value);
                }}
                options={typeOptions}
                searchPlaceholder="ابحث عن النوع..."
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">الصلاحية</label>
              <SearchableSelect
                value={formData.role}
                onChange={(value) => setFormData({ ...formData, role: value })}
                options={roleOptions}
                searchPlaceholder="ابحث عن الصلاحية..."
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">الحالة</label>
              <SearchableSelect
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value })}
                options={statusOptions}
                searchPlaceholder="ابحث عن الحالة..."
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">المرحلة</label>
              <SearchableSelect
                value={formData.educationalStage}
                onChange={(value) => setFormData({ ...formData, educationalStage: value })}
                options={stageOptions}
                searchPlaceholder="ابحث عن المرحلة..."
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">الحلقة</label>
            <SearchableSelect
              value={formData.halaqaId}
              onChange={(value) => {
                const selectedHalaqa = halaqas.find((item) => item.id === value);
                setFormData({
                  ...formData,
                  halaqaId: value,
                  halaqaName: selectedHalaqa?.displayName || '',
                });
              }}
              options={halaqas.map((item) => ({ value: item.id, label: item.displayName }))}
              placeholder="اختر الحلقة"
              searchPlaceholder="ابحث عن الحلقة..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">نبذة</label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-blue-500"
              placeholder="نبذة مختصرة..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" className="h-12 px-8" onClick={() => router.push('/dashboard/users')}>
              رجوع
            </Button>
            <Button type="submit" className="h-12 px-8 gap-2" isLoading={isSaving}>
              <Save size={16} />
              {mode === 'create' ? 'حفظ المستخدم' : 'حفظ التعديلات'}
            </Button>
          </div>
        </form>
      </Card>

      <Modal isOpen={Boolean(feedbackMessage)} onClose={() => setFeedbackMessage(null)} title="تنبيه النظام">
        <div className="space-y-6 text-right">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{feedbackMessage || ''}</p>
          <div className="flex justify-end">
            <Button className="h-10 px-6" onClick={() => setFeedbackMessage(null)}>
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
