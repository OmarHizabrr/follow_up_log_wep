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
import { User, Phone, Fingerprint, Save, GraduationCap, Users } from 'lucide-react';

interface StudentFormProps {
  mode: 'create' | 'edit';
  studentId?: string;
}

interface HalaqaOption {
  id: string;
  displayName: string;
}

interface ParentOption {
  id: string;
  displayName: string;
}

export default function StudentForm({ mode, studentId }: StudentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [halaqas, setHalaqas] = useState<HalaqaOption[]>([]);
  const [parents, setParents] = useState<ParentOption[]>([]);

  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    civilId: '',
    educationalStage: 'ابتدائي',
    halaqaId: '',
    halaqaName: '',
    guardianUserId: '',
    guardianName: '',
    number: '',
    status: 'active',
    type: 'student',
  });

  useEffect(() => {
    loadReferences();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && studentId) {
      loadStudent(studentId);
      return;
    }
    if (mode === 'create') {
      loadNextStudentNumber();
    }
  }, [mode, studentId]);

  const loadReferences = async () => {
    const [halaqaSnap, parentSnap] = await Promise.all([
      getDocs(query(collection(db, 'users'), where('type', '==', 'halaqa'))),
      getDocs(query(collection(db, 'users'), where('type', '==', 'parent'))),
    ]);

    setHalaqas(
      halaqaSnap.docs.map((item) => ({
        id: item.id,
        displayName: (item.data().displayName as string) || 'حلقة',
      }))
    );
    setParents(
      parentSnap.docs.map((item) => ({
        id: item.id,
        displayName: (item.data().displayName as string) || 'ولي أمر',
      }))
    );
  };

  const loadNextStudentNumber = async () => {
    const studentsSnap = await getDocs(query(collection(db, 'users'), where('type', '==', 'student')));
    let maxNumber = 0;
    studentsSnap.docs.forEach((item) => {
      const value = Number(item.data().number || 0);
      if (!Number.isNaN(value) && value > maxNumber) maxNumber = value;
    });
    setFormData((prev) => ({ ...prev, number: String(maxNumber + 1) }));
  };

  const loadStudent = async (id: string) => {
    setIsLoading(true);
    try {
      const studentDoc = await getDoc(doc(db, 'users', id));
      if (!studentDoc.exists()) {
        router.push('/dashboard/students');
        return;
      }
      const data = studentDoc.data();
      setFormData((prev) => ({
        ...prev,
        displayName: (data.displayName as string) || '',
        phoneNumber: (data.phoneNumber as string) || '',
        civilId: (data.civilId as string) || '',
        educationalStage: (data.educationalStage as string) || 'ابتدائي',
        halaqaId: (data.halaqaId as string) || '',
        halaqaName: (data.halaqaName as string) || '',
        guardianUserId: (data.guardianUserId as string) || '',
        guardianName: (data.guardianName as string) || '',
        number: (data.number as string) || '',
        status: (data.status as string) || 'active',
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const selectedParent = parents.find((item) => item.id === formData.guardianUserId);
      const payload = {
        ...formData,
        guardianName: selectedParent?.displayName || formData.guardianName || '',
        updatedAt: serverTimestamp(),
      };

      if (mode === 'create') {
        const ref = await addDoc(collection(db, 'users'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        router.push(`/dashboard/students/${ref.id}`);
      } else if (studentId) {
        await updateDoc(doc(db, 'users', studentId), payload);
        router.push(`/dashboard/students/${studentId}`);
      }
    } catch (error) {
      console.error(error);
      setFeedbackMessage('تعذر حفظ بيانات الطالب. حاول مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-10 rounded-[2.5rem]">
        <p className="text-center text-sm font-bold text-slate-400">جاري تحميل بيانات الطالب...</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-8 md:p-10 rounded-[2.5rem] border-slate-200/60 dark:border-slate-800">
        <form className="space-y-8" dir="rtl" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="اسم الطالب"
              required
              value={formData.displayName}
              onChange={(event) => setFormData({ ...formData, displayName: event.target.value })}
              icon={User}
              placeholder="الاسم الثلاثي"
            />
            <Input
              label="رقم الجوال"
              value={formData.phoneNumber}
              onChange={(event) => setFormData({ ...formData, phoneNumber: event.target.value })}
              icon={Phone}
              placeholder="05xxxxxxxx"
            />
            <Input
              label="السجل المدني"
              value={formData.civilId}
              onChange={(event) =>
                setFormData({ ...formData, civilId: event.target.value.replace(/\D/g, '').slice(0, 10) })
              }
              icon={Fingerprint}
              placeholder="10 أرقام"
            />
            <Input
              label="الرقم الأكاديمي"
              value={formData.number}
              readOnly={mode === 'create'}
              onChange={(event) => setFormData({ ...formData, number: event.target.value })}
              icon={GraduationCap}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="mb-2 block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">المرحلة الدراسية</label>
              <SearchableSelect
                value={formData.educationalStage}
                onChange={(value) => setFormData({ ...formData, educationalStage: value })}
                options={stageOptions}
                searchPlaceholder="ابحث عن المرحلة..."
              />
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

            <div>
              <label className="mb-2 block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">ولي الأمر</label>
              <SearchableSelect
                value={formData.guardianUserId}
                onChange={(value) => setFormData({ ...formData, guardianUserId: value })}
                options={parents.map((item) => ({ value: item.id, label: item.displayName }))}
                placeholder="اختياري"
                searchPlaceholder="ابحث عن ولي الأمر..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-8"
              onClick={() => router.push('/dashboard/students')}
            >
              رجوع
            </Button>
            <Button type="submit" className="h-12 px-8 gap-2" isLoading={isSaving}>
              <Save size={16} />
              {mode === 'create' ? 'حفظ الطالب' : 'حفظ التعديلات'}
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
