'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isAdminLike } from '@/lib/access';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface Halaqa {
  id: string;
  name: string;
}

interface HalaqaFilterProps {
  onSelect: (halaqaId: string | null) => void;
  selectedId: string | null;
  className?: string;
}

export default function HalaqaFilter({ onSelect, selectedId, className = "" }: HalaqaFilterProps) {
  const [halaqas, setHalaqas] = useState<Halaqa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHalaqas();
    // Persistence Logic (Parity with App Efficiency)
    const persistedId = localStorage.getItem('lastSelectedHalaqaId');
    if (persistedId && !selectedId) {
      onSelect(persistedId);
    }
  }, []);

  const handleSelect = (id: string | null) => {
    onSelect(id);
    if (id) localStorage.setItem('lastSelectedHalaqaId', id);
    else localStorage.removeItem('lastSelectedHalaqaId');
  };

  const fetchHalaqas = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('userData');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const isAdmin = isAdminLike(user);

      let q;
      if (isAdmin) {
        // Admins see all halaqas
        q = query(collection(db, 'halaqat'), orderBy('name', 'asc'));
      } else {
        // Teachers see their assigned halaqas from members collection
        // Pattern: members/{teacherId}/member/{halaqaId}
        const memberRef = collection(db, 'members', user?.uid, 'member');
        const snap = await getDocs(memberRef);
        const assignedIds = snap.docs.map(d => d.id);
        
        if (assignedIds.length === 0) {
          setHalaqas([]);
          setLoading(false);
          return;
        }

        // Fetch the actual halaqas details
        q = query(collection(db, 'halaqat'), where('__name__', 'in', assignedIds));
      }

      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, name: d.data().name || d.data().displayName || 'حلقة غير مسمى' }));
      setHalaqas(list);
    } catch (e) {
      console.error("Error fetching halaqas:", e);
    } finally {
      setLoading(false);
    }
  };

  const allValue = '__all_halaqa__';

  return (
    <SearchableSelect
      className={className}
      value={selectedId ?? allValue}
      onChange={(nextValue) => handleSelect(nextValue === allValue ? null : nextValue)}
      options={[
        { value: allValue, label: 'عرض جميع الحلقات' },
        ...halaqas.map((halaqa) => ({ value: halaqa.id, label: halaqa.name })),
      ]}
      placeholder={loading ? 'جاري تحميل الحلقات...' : 'جميع الحلقات'}
      searchPlaceholder="ابحث عن الحلقة..."
      emptyText={loading ? 'جاري التحميل...' : 'لا يوجد حلقات مسندة'}
      disabled={loading}
    />
  );
}
