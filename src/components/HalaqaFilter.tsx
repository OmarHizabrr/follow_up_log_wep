'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, ChevronDown, Check, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
    if (id) localStorage.setItem('lastSelectedHalaqaId', id);
    else localStorage.removeItem('lastSelectedHalaqaId');
  };

  const fetchHalaqas = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('userData');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const isAdmin = user?.role === 'admin' || user?.type === 'admin';

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

  const selectedName = selectedId 
    ? halaqas.find(h => h.id === selectedId)?.name || 'جاري التحميل...' 
    : 'جميع الحلقات';

  return (
    <div className={`relative ${className}`} dir="rtl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-full flex items-center justify-between px-6 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm hover:border-blue-500/30 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedId ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
            {selectedId ? <Users size={16} /> : <Globe size={16} />}
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedName}</span>
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full mt-3 right-0 left-0 bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
            >
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                <button
                  onClick={() => handleSelect(null)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-right transition-all mb-1 ${!selectedId ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Globe size={16} />
                    <span className="text-sm font-bold tracking-tight">عرض جميع الحلقات</span>
                  </div>
                  {!selectedId && <Check size={16} />}
                </button>

                {halaqas.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleSelect(h.id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-right transition-all mb-1 ${selectedId === h.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Users size={16} />
                      <span className="text-sm font-bold tracking-tight">{h.name}</span>
                    </div>
                    {selectedId === h.id && <Check size={16} />}
                  </button>
                ))}

                {halaqas.length === 0 && !loading && (
                  <div className="p-10 text-center opacity-40">
                    <Users size={24} className="mx-auto mb-2" />
                    <p className="text-xs font-bold">لا يوجد حلقات مسندة</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
