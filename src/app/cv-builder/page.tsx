"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Printer, Save, Plus, Trash2, ArrowRight, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Link from 'next/link';
import CVPreview, { type CVData } from './CVPreview';
import PaymentModal from './PaymentModal';
import { saveCVData, checkCVDownloadStatus } from '@/app/actions/cv';

const SUGGESTED_SKILLS = [
  'إدارة المطاعم', 'خدمة الزبائن', 'باريستا', 'طهي', 'شيف معجنات',
  'إدارة المخزون', 'كاشير', 'تنظيم الفعاليات', 'حفظ الصحة والسلامة',
  'قيادة فريق', 'التواصل الفعال', 'العمل تحت الضغط', 'النظافة العامة',
  'إعداد المشروبات', 'خدمة الطاولات', 'استقبال الزبائن', 'الضيافة',
  'إدارة الحجوزات', 'تحضير الطعام', 'سلامة الغذاء', 'POS Systems',
];

const SUGGESTED_LANGS = ['العربية', 'العبرية', 'الإنجليزية', 'التركية', 'الفرنسية'];

const defaultCVData: CVData = {
  summary: '', experience: [], education: [],
  skills: [], languages: [], achievements: [],
};

export default function CVBuilder() {
  const { profile, user } = useAuth();
  const [cvData, setCvData] = useState<CVData>(defaultCVData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [canDownload, setCanDownload] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured || !user) { setLoading(false); return; }
      const [seekerRes, statusRes, settingsRes] = await Promise.all([
        supabase.from('seekers').select('resume_data').eq('profile_id', user.id).single(),
        checkCVDownloadStatus(),
        supabase.from('platform_settings').select('logo_url').limit(1).single(),
      ]);
      if (seekerRes.data?.resume_data && Object.keys(seekerRes.data.resume_data).length > 0) {
        const d = seekerRes.data.resume_data as any;
        setCvData({ ...defaultCVData, ...d, achievements: d.achievements || [] });
      }
      setCanDownload(statusRes.canDownload);
      setDownloadStatus(statusRes.status);
      if (settingsRes.data?.logo_url) setLogoUrl(settingsRes.data.logo_url);
      setLoading(false);
    }
    load();
  }, [user]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `CV_${profile?.full_name || 'hello_staff'}`,
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const result = await saveCVData(cvData);
    setSaving(false);
    if (result.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  const handleExport = () => {
    if (canDownload) { handlePrint(); }
    else { setShowPayment(true); }
  };

  const addExperience = () => setCvData(p => ({ ...p, experience: [...p.experience, { id: Date.now().toString(), title: '', company: '', duration: '', description: '' }] }));
  const removeExperience = (id: string) => setCvData(p => ({ ...p, experience: p.experience.filter(e => e.id !== id) }));
  const updateExperience = (id: string, field: string, value: string) => setCvData(p => ({ ...p, experience: p.experience.map(e => e.id === id ? { ...e, [field]: value } : e) }));

  const addEducation = () => setCvData(p => ({ ...p, education: [...p.education, { id: Date.now().toString(), degree: '', institution: '', year: '' }] }));
  const removeEducation = (id: string) => setCvData(p => ({ ...p, education: p.education.filter(e => e.id !== id) }));
  const updateEducation = (id: string, field: string, value: string) => setCvData(p => ({ ...p, education: p.education.map(e => e.id === id ? { ...e, [field]: value } : e) }));

  const toggleSkill = (skill: string) => {
    setCvData(p => ({
      ...p,
      skills: p.skills.includes(skill) ? p.skills.filter(s => s !== skill) : [...p.skills, skill],
    }));
  };

  const addCustomSkill = () => {
    if (newSkill.trim() && !cvData.skills.includes(newSkill.trim())) {
      setCvData(p => ({ ...p, skills: [...p.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setCvData(p => ({ ...p, achievements: [...p.achievements, newAchievement.trim()] }));
      setNewAchievement('');
    }
  };

  const toggleLang = (lang: string) => {
    setCvData(p => ({
      ...p,
      languages: p.languages.includes(lang) ? p.languages.filter(l => l !== lang) : [...p.languages, lang],
    }));
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
      {/* Editor */}
      <div className="w-full lg:w-1/2 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
              <ArrowRight className="w-5 h-5 text-slate-700" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">منشئ السيرة الذاتية</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
              {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4" />}
              {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ ✓' : 'حفظ مجاني'}
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
              {canDownload ? <Printer className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {canDownload ? 'تصدير PDF' : 'تصدير PDF - ₪10'}
            </button>
          </div>
        </div>

        {downloadStatus === 'pending' && (
          <div className="p-3 bg-amber-50 text-amber-800 text-sm border border-amber-200 rounded-xl">⏳ طلب التصدير قيد المراجعة. ستتلقى إشعاراً عند الموافقة.</div>
        )}

        <div className="bg-white border text-right border-slate-200 rounded-2xl p-5 shadow-sm overflow-y-auto space-y-6" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {/* Summary */}
          <div>
            <h3 className="font-bold text-slate-900 mb-2 text-sm">النبذة التعريفية</h3>
            <textarea rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm focus:outline-none" value={cvData.summary} onChange={e => setCvData(p => ({ ...p, summary: e.target.value }))} placeholder="اكتب نبذة عنك..." />
          </div>

          {/* Achievements */}
          <div>
            <h3 className="font-bold text-slate-900 mb-2 text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-600" /> الإنجازات الرئيسية</h3>
            <div className="flex gap-2 mb-2">
              <input type="text" value={newAchievement} onChange={e => setNewAchievement(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAchievement()} className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="مثال: زيادة المبيعات بنسبة 30%" />
              <button onClick={addAchievement} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cvData.achievements.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs">
                  {a} <button onClick={() => setCvData(p => ({ ...p, achievements: p.achievements.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-sm">الخبرات العملية</h3>
              <button onClick={addExperience} className="text-emerald-600 text-xs font-medium flex items-center gap-1 hover:text-emerald-700"><Plus className="w-3.5 h-3.5" /> إضافة</button>
            </div>
            <div className="space-y-3">
              {cvData.experience.map(exp => (
                <div key={exp.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 relative">
                  <button onClick={() => removeExperience(exp.id)} className="absolute top-2 left-2 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-0.5">المسمى الوظيفي</label>
                      <input type="text" value={exp.title} onChange={e => updateExperience(exp.id, 'title', e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-0.5">الشركة</label>
                      <input type="text" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-medium text-slate-500 mb-0.5">الفترة</label>
                      <input type="text" value={exp.duration} onChange={e => updateExperience(exp.id, 'duration', e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs" placeholder="2020 - 2022" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-medium text-slate-500 mb-0.5">الوصف</label>
                      <textarea rows={2} value={exp.description} onChange={e => updateExperience(exp.id, 'description', e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs" />
                    </div>
                  </div>
                </div>
              ))}
              {cvData.experience.length === 0 && <p className="text-xs text-slate-400 italic">لم يتم إضافة خبرات بعد.</p>}
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-sm">التعليم</h3>
              <button onClick={addEducation} className="text-emerald-600 text-xs font-medium flex items-center gap-1 hover:text-emerald-700"><Plus className="w-3.5 h-3.5" /> إضافة</button>
            </div>
            <div className="space-y-3">
              {cvData.education.map(edu => (
                <div key={edu.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 relative">
                  <button onClick={() => removeEducation(edu.id)} className="absolute top-2 left-2 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-[10px] font-medium text-slate-500 mb-0.5">الشهادة</label><input type="text" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs" /></div>
                    <div><label className="block text-[10px] font-medium text-slate-500 mb-0.5">المؤسسة</label><input type="text" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs" /></div>
                    <div className="col-span-2"><label className="block text-[10px] font-medium text-slate-500 mb-0.5">السنة</label><input type="text" value={edu.year} onChange={e => updateEducation(edu.id, 'year', e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs" /></div>
                  </div>
                </div>
              ))}
              {cvData.education.length === 0 && <p className="text-xs text-slate-400 italic">لم يتم إضافة تعليم بعد.</p>}
            </div>
          </div>

          {/* Skills with Keywords */}
          <div>
            <h3 className="font-bold text-slate-900 mb-2 text-sm">المهارات <span className="text-[10px] text-slate-400 font-normal">(اضغط لإضافة)</span></h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SUGGESTED_SKILLS.map(skill => (
                <button key={skill} onClick={() => toggleSkill(skill)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${cvData.skills.includes(skill) ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                  {skill}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomSkill()} className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="أضف مهارة أخرى..." />
              <button onClick={addCustomSkill} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"><Plus className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Languages */}
          <div>
            <h3 className="font-bold text-slate-900 mb-2 text-sm">اللغات</h3>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_LANGS.map(lang => (
                <button key={lang} onClick={() => toggleLang(lang)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${cvData.languages.includes(lang) ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'}`}>
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="w-full lg:w-1/2 bg-slate-100 p-4 sm:p-6 rounded-3xl border border-slate-200 flex items-start justify-center overflow-x-auto">
        <CVPreview cvData={cvData} profile={profile} componentRef={componentRef} logoUrl={logoUrl} />
      </div>

      {/* Payment Modal */}
      {user && <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} userId={user.id} />}
    </div>
  );
}
