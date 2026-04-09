'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [recits, setRecits] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sDoc = await getDoc(doc(db, 'users', id as string));
      if (!sDoc.exists()) { router.push('/dashboard/students'); return; }
      setStudent({ id: sDoc.id, ...sDoc.data() });

      const [rSnap, aSnap, tSnap] = await Promise.all([
        getDocs(query(collection(db, 'dailyrecitations', id as string, 'dailyrecitations'), orderBy('date', 'desc'), limit(15))),
        getDocs(query(collection(db, 'tracking', id as string, 'tracking'), where('type', '==', 'attendance'), orderBy('date', 'desc'), limit(15))),
        getDocs(query(collection(db, 'testsessions', id as string, 'testsessions'), orderBy('date', 'desc'), limit(10)))
      ]);

      setRecits(rSnap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
      setAttendance(aSnap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
      setTests(tSnap.docs.map(ds => ({ id: ds.id, ...ds.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
       <div className="py-40 flex flex-col items-center justify-center gap-6 glass-panel rounded-[3rem] animate-pulse">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-primary-glow"></div>
          <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Generating Unified Student Profile Hub...</p>
       </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="animate-snappy space-y-8 pb-10">
        
        {/* Elite Profile Header - Bento Style */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           
           <div className="lg:col-span-8 glass-panel p-10 md:p-14 rounded-[3rem] border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[120px] -mr-40 -mt-40 transition-all group-hover:bg-primary/20"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                 <div className="w-44 h-44 rounded-[2.5rem] bg-white/5 border border-white/10 p-2 shadow-2xl relative">
                    <div className="w-full h-full rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center text-5xl font-black text-gradient">
                       {student.photoURL ? <img src={student.photoURL} alt="" className="w-full h-full object-cover" /> : student.displayName[0]}
                    </div>
                    <div className="absolute -bottom-2 -left-2 bg-emerald-500 text-white text-[10px] font-black px-5 py-2 rounded-full border-2 border-[#020617] shadow-xl">Verified Student</div>
                 </div>
                 <div className="text-center md:text-right flex-1">
                    <h1 className="text-4xl md:text-5xl font-black text-gradient tracking-tight mb-4 leading-none">{student.displayName}</h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                       <Tag label={student.educationalStage} icon="🎓" />
                       <Tag label={`Halaqa ID: ${student.halaqaId?.slice(0, 6)}`} icon="🏷️" />
                       <Tag label={`Serial: ${student.number}`} icon="🆔" />
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-4 glass-panel p-10 rounded-[3rem] border-white/5 flex flex-col justify-between group">
              <div className="space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Contact Gateway</h3>
                 <div className="space-y-3">
                    <ContactCard label="رقم الجوال الشخصي" value={student.phone || student.phoneNumber} icon="📱" />
                    <ContactCard label="رقم جوال ولي الأمر" value={student.guardianPhone || student.guardianPhoneNumber} icon="🛡️" />
                 </div>
              </div>
              <button className="w-full py-4 mt-8 glass-card border-emerald-500/20 text-emerald-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">تصدير التقرير الفردي (PDF)</button>
           </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
           <ProfileTab label="نظرة عامة" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
           <ProfileTab label="سجل التسميع" active={activeTab === 'recitation'} onClick={() => setActiveTab('recitation')} />
           <ProfileTab label="الحضور والغياب" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
           <ProfileTab label="الاختبارات" active={activeTab === 'tests'} onClick={() => setActiveTab('tests')} />
        </div>

        {/* Tab Content Hub */}
        <div className="min-h-[500px]">
           {activeTab === 'overview' && (
             <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-fade">
                <div className="md:col-span-8 space-y-8">
                   <div className="glass-panel p-10 rounded-[3rem] border-white/5">
                      <h3 className="text-xl font-black mb-8">إحصائيات الإنجاز التراكمي</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                         <StatCompact label="إجمالي الحفظ" value={`${recits.filter(r => r.type === 'memorization').length} سجل`} color="emerald" />
                         <StatCompact label="نسبة الحضور" value="96%" color="blue" />
                         <StatCompact label="متوسط الاختبارات" value="94/100" color="rose" />
                         <StatCompact label="سجلات المراجعة" value={`${recits.filter(r => r.type === 'revision').length} سجل`} color="amber" />
                      </div>
                   </div>
                   
                   <div className="glass-panel p-10 rounded-[3rem] border-white/5">
                      <h3 className="text-xl font-black mb-8">البيانات الإدارية الكاملة</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-10">
                         <DetailField label="الجنسية" value={student.nationality || 'سعودي'} />
                         <DetailField label="رقم الهوية" value={student.identityNumber} />
                         <DetailField label="منطقة السكن" value={student.residenceArea} />
                         <DetailField label="تاريخ الانضمام" value={student.createdAt?.toDate().toLocaleDateString('ar-SA')} />
                         <DetailField label="الحالة الأكاديمية" value={student.isActive ? 'نشط' : 'متوقف'} />
                         <DetailField label="مستوى الحفظ" value={student.memorizationAmount || 'بدون تقييم'} />
                      </div>
                   </div>
                </div>

                <div className="md:col-span-4 glass-panel p-10 rounded-[3rem] border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent flex flex-col justify-center items-center text-center group">
                   <div className="text-5xl mb-8 group-hover:rotate-12 transition-transform">⚡</div>
                   <h4 className="text-xl font-black mb-4">نشاط الطالب اليوم</h4>
                   <p className="text-[11px] font-bold text-slate-500 leading-relaxed max-w-[200px] mb-8">
                      سجل الطالب حضوراً مبكراً اليوم وأتم تسميع 3 صفحات بمستوى ممتاز.
                   </p>
                   <div className="px-6 py-2 bg-emerald-500/20 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-lg shadow-emerald-500/10">Consistent Performance</div>
                </div>
             </div>
           )}

           {activeTab === 'recitation' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade">
                {recits.length === 0 ? <EmptyTab /> : recits.map(r => (
                  <div key={r.id} className="glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col justify-between group">
                    <div className="flex items-center gap-5 mb-8">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl group-hover:bg-primary/20 transition-colors">
                          {getRecitIcon(r.type)}
                       </div>
                       <div>
                          <p className="font-black text-lg group-hover:text-primary transition-colors">{getRecitLabel(r.type)}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{r.date}</p>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-500 uppercase">المقدار:</span>
                          <span className="font-black">{r.amount}</span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-500 uppercase">التقييم:</span>
                          <span className="font-black text-emerald-500">{r.rating === 5 ? 'ممتاز' : 'جيد جداً'}</span>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
           )}

           {activeTab === 'attendance' && (
             <div className="grid grid-cols-2 md:grid-cols-5 gap-6 animate-fade">
                {attendance.length === 0 ? <div className="col-span-full"><EmptyTab /></div> : attendance.map(a => (
                  <div key={a.id} className="glass-card p-8 rounded-[2.5rem] border-white/5 text-center flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">{a.date}</span>
                    <div className={`w-12 h-12 rounded-3xl flex items-center justify-center text-xl mb-4 ${a.status === 'present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                       {a.status === 'present' ? '✓' : '✕'}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${a.status === 'present' ? 'text-emerald-500' : 'text-rose-500'}`}>
                       {a.status === 'present' ? 'Attended' : 'Absent'}
                    </span>
                  </div>
                ))}
             </div>
           )}

           {activeTab === 'tests' && (
              <div className="space-y-4 animate-fade max-w-4xl mx-auto">
                 {tests.length === 0 ? <EmptyTab /> : tests.map(t => (
                    <div key={t.id} className="glass-card p-8 rounded-[2.5rem] border-white/5 flex items-center justify-between group">
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-3xl group-hover:bg-rose-500/10 transition-colors">📝</div>
                          <div>
                             <h4 className="font-black text-xl group-hover:text-rose-500 transition-colors">{t.test_name}</h4>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{t.date}</p>
                          </div>
                       </div>
                       <div className="text-left">
                          <p className="text-4xl font-black font-outfit text-gradient tracking-tighter">%{t.score}</p>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exam Results</span>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>

      </div>
    </DashboardLayout>
  );
}

function ProfileTab({ label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap border ${active ? 'primary-gradient text-white shadow-xl shadow-primary-glow border-primary/20' : 'glass-card border-white/5 text-slate-500 hover:text-white'}`}>
      {label}
    </button>
  );
}

function ContactCard({ label, value, icon }: any) {
  return (
    <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl group hover:bg-white/10 transition-all">
       <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-sm shadow-inner">{icon}</div>
       <div className="min-w-0">
          <p className="text-[9px] font-black uppercase text-slate-600 tracking-tighter leading-none mb-1">{label}</p>
          <p className="text-xs font-black tracking-widest truncate">{value || '---'}</p>
       </div>
    </div>
  );
}

function Tag({ label, icon }: any) {
  return (
    <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 shadow-lg">
       <span className="text-sm">{icon}</span>
       <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{label}</span>
    </div>
  );
}

function StatCompact({ label, value, color }: any) {
  const colors: any = { emerald: 'text-emerald-400', blue: 'text-blue-400', rose: 'text-rose-400', amber: 'text-amber-400' };
  return (
    <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] text-center group hover:bg-white/10 transition-all">
       <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 group-hover:text-white transition-colors">{label}</p>
       <p className={`text-2xl font-black font-outfit tracking-tighter ${colors[color]}`}>{value}</p>
    </div>
  );
}

function DetailField({ label, value }: any) {
  return (
    <div>
       <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5">{label}</p>
       <p className="font-bold text-slate-200">{value || '---'}</p>
    </div>
  );
}

function EmptyTab() {
  return (
     <div className="col-span-full py-32 text-center glass-panel rounded-[3rem] border-dashed border-white/10 italic text-slate-500 text-sm font-bold">Comprehensive data retrieval for this section is empty.</div>
  );
}

function getRecitIcon(type: string) {
  const icons: any = { memorization: '✨', revision: '🔄', tathbeet: '💎', tashih_tilawah: '📖' };
  return icons[type] || '📖';
}

function getRecitLabel(type: string) {
  const labels: any = { memorization: 'حفظ جديد', revision: 'مراجعة', tathbeet: 'تثبيت', tashih_tilawah: 'تصحيح تلاوة' };
  return labels[type] || type;
}
