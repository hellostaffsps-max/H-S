"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Printer, Save, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Link from 'next/link';

interface Experience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

interface CVData {
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  languages: string[];
  colorScheme: 'brand' | 'blue' | 'slate' | 'emerald' | 'rose';
  layout: 'modern' | 'classic' | 'split';
}

const defaultCVData: CVData = {
  summary: '',
  experience: [],
  education: [],
  skills: [],
  languages: [],
  colorScheme: 'brand',
  layout: 'modern',
};

const COLOR_MAP = {
  brand: { bg: 'bg-brand-600', text: 'text-brand-600', border: 'border-brand-600', lightBg: 'bg-brand-50', hex: '#ea580c' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', lightBg: 'bg-blue-50', hex: '#2563eb' },
  slate: { bg: 'bg-slate-800', text: 'text-slate-800', border: 'border-slate-800', lightBg: 'bg-slate-100', hex: '#1e293b' },
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600', lightBg: 'bg-emerald-50', hex: '#059669' },
  rose: { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', lightBg: 'bg-rose-50', hex: '#e11d48' },
};

export default function CVBuilder() {
  const { profile, user } = useAuth();
  const [cvData, setCvData] = useState<CVData>(defaultCVData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      if (!isSupabaseConfigured || !user) {
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from('seekers')
        .select('resume_data')
        .eq('profile_id', user.id)
        .single();
        
      if (data && data.resume_data && Object.keys(data.resume_data).length > 0) {
        setCvData(data.resume_data as CVData);
      }
      setLoading(false);
    }
    loadData();
  }, [user]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `CV_${profile?.full_name || 'hello_staff'}`,
  });

  const handleSave = async () => {
    if (!isSupabaseConfigured || !user) return;
    setSaving(true);
    await supabase.from('seekers').upsert({
      profile_id: user.id,
      resume_data: cvData as any
    });
    setSaving(false);
  };

  const addExperience = () => {
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, { id: Date.now().toString(), title: '', company: '', duration: '', description: '' }]
    }));
  };

  const removeExperience = (id: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter(e => e.id !== id)
    }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };
  
  const addEducation = () => {
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, { id: Date.now().toString(), degree: '', institution: '', year: '' }]
    }));
  };

  const removeEducation = (id: string) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.filter(e => e.id !== id)
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    setCvData(prev => ({ ...prev, skills: list }));
  };

  const handleLanguagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    setCvData(prev => ({ ...prev, languages: list }));
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
      
      {/* Editor sidebar */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-700 transition-colors">
              <ArrowRight className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">منشئ السيرة الذاتية</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button 
              onClick={handlePrint} 
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" /> تصدير PDF
            </button>
          </div>
        </div>

        <div className="bg-white border text-right border-slate-200 rounded-2xl p-6 shadow-sm overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)'}}>
          
          <div className="mb-8 p-4 bg-yellow-50 text-yellow-800 text-sm border border-yellow-200 rounded-xl">
             <strong>تنويه:</strong> تأكد من الضغط على زر الحفظ لحفظ التعديلات في قاعدة البيانات قبل الخروج أو التصدير. البيانات أدناه تستخدم كمعاينة مباشرة في الوقت الفعلي.
          </div>

          <div className="mb-8 grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-slate-900 mb-3 block">المظهر (اللون)</h3>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(COLOR_MAP) as (keyof typeof COLOR_MAP)[]).map((col) => (
                  <button
                    key={col}
                    onClick={() => setCvData(prev => ({ ...prev, colorScheme: col }))}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${cvData.colorScheme === col ? 'border-slate-900 ring-2 ring-slate-200' : 'border-transparent'}`}
                    style={{ backgroundColor: COLOR_MAP[col].hex }}
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-3 block">شكل السيرة الذاتية (النمط)</h3>
              <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-1">
                <button 
                  onClick={() => setCvData(prev => ({ ...prev, layout: 'modern' }))}
                  className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${cvData.layout === 'modern' ? 'bg-white shadow-sm font-bold text-slate-900 border border-slate-200' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  عصري
                </button>
                <button 
                  onClick={() => setCvData(prev => ({ ...prev, layout: 'classic' }))}
                  className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${cvData.layout === 'classic' ? 'bg-white shadow-sm font-bold text-slate-900 border border-slate-200' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  كلاسيكي
                </button>
                <button 
                  onClick={() => setCvData(prev => ({ ...prev, layout: 'split' }))}
                  className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${cvData.layout === 'split' ? 'bg-white shadow-sm font-bold text-slate-900 border border-slate-200' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  مقسوم
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-slate-900 mb-3 block">نبذة تعريفية (الملخص)</h3>
            <textarea 
              rows={4} 
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              value={cvData.summary}
              onChange={(e) => setCvData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="اكتب نبذة عنك، مهاراتك بشكل عام وما تبحث عنه..."
            ></textarea>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">الخبرات العملية</h3>
              <button onClick={addExperience} className="text-brand-600 text-sm font-medium flex items-center gap-1 hover:text-brand-700"><Plus className="w-4 h-4"/> إضافة خبرة</button>
            </div>
            <div className="space-y-4">
              {cvData.experience.map(exp => (
                <div key={exp.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 relative group">
                  <button onClick={() => removeExperience(exp.id)} className="absolute top-3 left-3 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">المسمى الوظيفي</label>
                      <input type="text" value={exp.title} onChange={e => updateExperience(exp.id, 'title', e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">اسم المطعم/الشركة</label>
                      <input type="text" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">الفترة الزمنية (مثال: 2020 - 2022)</label>
                      <input type="text" value={exp.duration} onChange={e => updateExperience(exp.id, 'duration', e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">الوصف</label>
                      <textarea rows={2} value={exp.description} onChange={e => updateExperience(exp.id, 'description', e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                    </div>
                  </div>
                </div>
              ))}
              {cvData.experience.length === 0 && <p className="text-sm text-slate-500 italic">لم يتم إضافة خبرات بعد.</p>}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">التعليم</h3>
              <button onClick={addEducation} className="text-brand-600 text-sm font-medium flex items-center gap-1 hover:text-brand-700"><Plus className="w-4 h-4"/> إضافة تعليم</button>
            </div>
            <div className="space-y-4">
              {cvData.education.map(edu => (
                <div key={edu.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 relative group">
                  <button onClick={() => removeEducation(edu.id)} className="absolute top-3 left-3 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">الشهادة / الدرجة</label>
                      <input type="text" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">المؤسسة التعليمية</label>
                      <input type="text" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">سنة التخرج</label>
                      <input type="text" value={edu.year} onChange={e => updateEducation(edu.id, 'year', e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                    </div>
                  </div>
                </div>
              ))}
              {cvData.education.length === 0 && <p className="text-sm text-slate-500 italic">لم يتم إضافة تعليم بعد.</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-bold text-slate-900 mb-3 block">المهارات (مفصول بفاصلة ,)</h3>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                value={cvData.skills.join(', ')}
                onChange={handleSkillsChange}
                placeholder="إدارة المطاعم, خدمة الزبائن, باريستا..."
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-3 block">اللغات (مفصول بفاصلة ,)</h3>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                value={cvData.languages.join(', ')}
                onChange={handleLanguagesChange}
                placeholder="العربية, الإنجليزية, العبرية..."
              />
            </div>
          </div>

        </div>
      </div>

      {/* CV Preview (Printable Area) */}
      <div className="w-full lg:w-1/2 bg-slate-100 p-4 sm:p-8 rounded-3xl border border-slate-200 flex items-start justify-center overflow-x-auto">
        
        {/* A4 Size Paper Preview */}
        <div 
          ref={componentRef}
          className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] text-slate-900 text-right print:shadow-none print:w-[210mm] print:h-auto print:min-h-0 relative overflow-hidden"
          dir="rtl"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }} // Basic font, you can change to a classic CV font if needed
        >
          
          {cvData.layout === 'modern' && (
            <div className="p-[10mm] sm:p-[15mm]">
              {/* Header */}
              <div className={`border-b-2 ${COLOR_MAP[cvData.colorScheme].border} pb-6 mb-6 flex items-center justify-between`}>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">{profile?.full_name || 'اسمك الكامل'}</h1>
                  <div className={`text-lg font-medium ${COLOR_MAP[cvData.colorScheme].text}`}>{cvData.experience[0]?.title || 'المسمى الوظيفي'}</div>
                </div>
                {profile?.avatar_url && (
                  <img src={profile.avatar_url} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-slate-100 shadow-sm" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="col-span-2 space-y-8">
                  {cvData.summary && (
                    <section>
                      <h2 className={`text-lg font-bold text-slate-800 border-b border-slate-200 pb-1.5 mb-3 uppercase flex items-center gap-2`}>النبذة التعريفية</h2>
                      <p className="text-sm text-slate-600 leading-relaxed text-justify">{cvData.summary}</p>
                    </section>
                  )}

                  {cvData.experience.length > 0 && (
                    <section>
                      <h2 className={`text-lg font-bold text-slate-800 border-b border-slate-200 pb-1.5 mb-4 uppercase`}>الخبرات العملية</h2>
                      <div className="space-y-5">
                        {cvData.experience.map(exp => (
                          <div key={exp.id}>
                            <div className="flex justify-between items-baseline mb-1">
                              <h3 className="font-bold text-slate-900 text-sm">{exp.title}</h3>
                              <span className={`text-xs ${COLOR_MAP[cvData.colorScheme].text} font-bold`}>{exp.duration}</span>
                            </div>
                            <div className="text-sm text-slate-700 font-bold mb-1.5">{exp.company}</div>
                            <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {cvData.education.length > 0 && (
                    <section>
                      <h2 className={`text-lg font-bold text-slate-800 border-b border-slate-200 pb-1.5 mb-4 uppercase`}>التعليم</h2>
                      <div className="space-y-4">
                        {cvData.education.map(edu => (
                          <div key={edu.id}>
                            <div className="flex justify-between items-baseline mb-0.5">
                              <h3 className="font-bold text-slate-900 text-sm">{edu.degree}</h3>
                              <span className={`text-xs ${COLOR_MAP[cvData.colorScheme].text} font-bold`}>{edu.year}</span>
                            </div>
                            <div className="text-sm text-slate-600">{edu.institution}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Sidebar */}
                <div className={`col-span-1 space-y-8 ${COLOR_MAP[cvData.colorScheme].lightBg} p-5 rounded-2xl`}>
                  <section>
                    <h2 className="text-base font-bold text-slate-900 border-b border-slate-200/60 pb-1.5 mb-3 uppercase">التواصل</h2>
                    <ul className="text-xs space-y-2.5 text-slate-700 font-medium">
                      <li>{profile?.phone || 'رقم الهاتف'}</li>
                      <li style={{wordBreak: "break-all"}}>{profile?.id ? "البريد الإلكتروني من النظام" : "email@example.com"}</li>
                      <li>{profile?.location || 'الموقع/المدينة'}</li>
                    </ul>
                  </section>

                  {cvData.skills.length > 0 && (
                    <section>
                      <h2 className="text-base font-bold text-slate-900 border-b border-slate-200/60 pb-1.5 mb-3 uppercase">المهارات</h2>
                      <ul className="list-disc list-inside text-xs space-y-2 pl-1 pr-2 text-slate-700 font-medium">
                        {cvData.skills.map((skill, i) => <li key={i}>{skill}</li>)}
                      </ul>
                    </section>
                  )}

                  {cvData.languages.length > 0 && (
                    <section>
                      <h2 className="text-base font-bold text-slate-900 border-b border-slate-200/60 pb-1.5 mb-3 uppercase">اللغات</h2>
                      <ul className="list-disc list-inside text-xs space-y-2 pl-1 pr-2 text-slate-700 font-medium">
                        {cvData.languages.map((lang, i) => <li key={i}>{lang}</li>)}
                      </ul>
                    </section>
                  )}
                </div>
              </div>
            </div>
          )}

          {cvData.layout === 'classic' && (
            <div className="p-[10mm] sm:p-[15mm]">
              {/* Header */}
              <div className="text-center mb-8 pb-6 border-b-2 border-slate-100">
                {profile?.avatar_url && (
                  <img src={profile.avatar_url} alt="Profile" className="w-24 h-24 rounded-full object-cover border border-slate-200 shadow-sm mx-auto mb-4" />
                )}
                <h1 className="text-3xl font-bold text-slate-900 mb-2 uppercase tracking-wide">{profile?.full_name || 'اسمك الكامل'}</h1>
                <div className={`text-lg tracking-wide font-medium ${COLOR_MAP[cvData.colorScheme].text} mb-4`}>{cvData.experience[0]?.title || 'المسمى الوظيفي'}</div>
                
                <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-600 font-medium">
                  {profile?.phone && <span>{profile.phone}</span>}
                  {profile?.id && <span>email@example.com</span>}
                  {profile?.location && <span>{profile.location}</span>}
                </div>
              </div>

              <div className="max-w-4xl mx-auto space-y-8">
                {cvData.summary && (
                  <section>
                    <h2 className={`text-lg font-bold ${COLOR_MAP[cvData.colorScheme].text} mb-3 uppercase tracking-wider`}>النبذة التعريفية</h2>
                    <p className="text-sm text-slate-600 leading-relaxed text-justify">{cvData.summary}</p>
                  </section>
                )}

                {cvData.experience.length > 0 && (
                  <section>
                    <h2 className={`text-lg font-bold ${COLOR_MAP[cvData.colorScheme].text} mb-4 uppercase tracking-wider`}>الخبرات العملية</h2>
                    <div className="space-y-6">
                      {cvData.experience.map(exp => (
                        <div key={exp.id} className="relative pl-4 border-r-2 border-slate-200 pr-4">
                          <div className={`absolute w-3 h-3 rounded-full ${COLOR_MAP[cvData.colorScheme].bg} -right-[7px] top-1.5 ring-4 ring-white`}></div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                            <h3 className="font-bold text-slate-900 text-base">{exp.title}</h3>
                            <span className="text-xs text-slate-500 font-medium py-1 px-2 bg-slate-100 rounded-md shrink-0">{exp.duration}</span>
                          </div>
                          <div className="text-sm text-slate-700 font-bold mb-2">{exp.company}</div>
                          <p className="text-sm text-slate-600 leading-relaxed">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {cvData.education.length > 0 && (
                  <section>
                    <h2 className={`text-lg font-bold ${COLOR_MAP[cvData.colorScheme].text} mb-4 uppercase tracking-wider`}>التعليم</h2>
                    <div className="space-y-5">
                      {cvData.education.map(edu => (
                        <div key={edu.id} className="relative pl-4 border-r-2 border-slate-200 pr-4">
                          <div className={`absolute w-3 h-3 rounded-full ${COLOR_MAP[cvData.colorScheme].bg} -right-[7px] top-1.5 ring-4 ring-white`}></div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                            <h3 className="font-bold text-slate-900 text-base">{edu.degree}</h3>
                            <span className="text-xs text-slate-500 font-medium py-1 px-2 bg-slate-100 rounded-md shrink-0">{edu.year}</span>
                          </div>
                          <div className="text-sm text-slate-600">{edu.institution}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                  {cvData.skills.length > 0 && (
                    <section>
                      <h2 className={`text-lg font-bold ${COLOR_MAP[cvData.colorScheme].text} mb-3 uppercase tracking-wider`}>المهارات</h2>
                      <div className="flex flex-wrap gap-2">
                        {cvData.skills.map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">{skill}</span>
                        ))}
                      </div>
                    </section>
                  )}

                  {cvData.languages.length > 0 && (
                    <section>
                      <h2 className={`text-lg font-bold ${COLOR_MAP[cvData.colorScheme].text} mb-3 uppercase tracking-wider`}>اللغات</h2>
                      <div className="flex flex-wrap gap-2">
                         {cvData.languages.map((lang, i) => (
                          <span key={i} className={`px-3 py-1 ${COLOR_MAP[cvData.colorScheme].lightBg} ${COLOR_MAP[cvData.colorScheme].text} text-xs rounded-full font-bold`}>{lang}</span>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          )}

          {cvData.layout === 'split' && (
            <div className="flex min-h-[297mm]">
              {/* Sidebar (Right side in RTL) */}
              <div className={`w-[32%] ${COLOR_MAP[cvData.colorScheme].bg} text-white p-8 space-y-8 print:w-[32%]`}>
                <div className="text-center mb-8 border-b border-white/20 pb-8">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white mx-auto shadow-lg mb-6" />
                  ) : (
                    <div className="w-32 h-32 rounded-full mx-auto shadow-lg mb-6 bg-white/20 flex items-center justify-center text-4xl text-white font-bold">
                       {profile?.full_name?.[0] || 'A'}
                    </div>
                  )}
                  <h1 className="text-2xl font-bold mb-2 tracking-wide leading-tight">{profile?.full_name || 'اسمك الكامل'}</h1>
                  <div className={`text-sm font-medium opacity-90 uppercase tracking-widest`}>{cvData.experience[0]?.title || 'المسمى الوظيفي'}</div>
                </div>

                <section>
                  <h2 className="text-sm font-bold uppercase tracking-widest border-b border-white/20 pb-2 mb-4">التواصل</h2>
                  <ul className="text-xs space-y-4 opacity-90 font-medium">
                    <li>{profile?.phone || 'رقم الهاتف'}</li>
                    <li style={{wordBreak: "break-all"}}>{profile?.id ? "البريد الإلكتروني من النظام" : "email@example.com"}</li>
                    <li>{profile?.location || 'الموقع/المدينة'}</li>
                  </ul>
                </section>

                {cvData.skills.length > 0 && (
                  <section>
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-white/20 pb-2 mb-4">المهارات</h2>
                    <ul className="list-disc list-inside text-xs space-y-2 opacity-90 pb-1">
                      {cvData.skills.map((skill, i) => <li key={i}>{skill}</li>)}
                    </ul>
                  </section>
                )}

                {cvData.languages.length > 0 && (
                  <section>
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-white/20 pb-2 mb-4">اللغات</h2>
                    <ul className="list-disc list-inside text-xs space-y-2 opacity-90">
                      {cvData.languages.map((lang, i) => <li key={i}>{lang}</li>)}
                    </ul>
                  </section>
                )}
              </div>

              {/* Main Content (Left side in RTL) */}
              <div className="w-[68%] bg-white p-8 sm:p-10 space-y-8 print:w-[68%]">
                {cvData.summary && (
                  <section>
                    <h2 className={`text-xl font-bold shadow-sm inline-block pb-1.5 border-b-4 ${COLOR_MAP[cvData.colorScheme].border} mb-4 text-slate-800`}>النبذة التعريفية</h2>
                    <p className="text-sm text-slate-600 leading-relaxed text-justify mt-2">{cvData.summary}</p>
                  </section>
                )}

                {cvData.experience.length > 0 && (
                  <section>
                    <h2 className={`text-xl font-bold shadow-sm inline-block pb-1.5 border-b-4 ${COLOR_MAP[cvData.colorScheme].border} mb-6 text-slate-800`}>الخبرات العملية</h2>
                    <div className="space-y-6">
                      {cvData.experience.map(exp => (
                        <div key={exp.id}>
                          <div className="flex justify-between items-end mb-1 text-slate-900 border-b border-slate-100 pb-1">
                            <h3 className="font-bold text-base">{exp.title} <span className="font-medium text-sm text-slate-500 mr-1">| {exp.company}</span></h3>
                            <span className={`text-xs font-bold ${COLOR_MAP[cvData.colorScheme].text}`}>{exp.duration}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mt-2">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {cvData.education.length > 0 && (
                  <section>
                    <h2 className={`text-xl font-bold shadow-sm inline-block pb-1.5 border-b-4 ${COLOR_MAP[cvData.colorScheme].border} mb-6 text-slate-800`}>التعليم</h2>
                    <div className="space-y-5">
                      {cvData.education.map(edu => (
                        <div key={edu.id}>
                          <div className="flex justify-between items-end mb-1 text-slate-900 border-b border-slate-100 pb-1">
                            <h3 className="font-bold text-base">{edu.degree} <span className="font-medium text-sm text-slate-500 mr-1">| {edu.institution}</span></h3>
                            <span className={`text-xs font-bold ${COLOR_MAP[cvData.colorScheme].text}`}>{edu.year}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
