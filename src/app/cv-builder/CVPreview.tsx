"use client";
import React from 'react';
import Image from "next/image";
import { Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import ImageLightbox from "@/components/ImageLightbox";

interface Experience {
  id: string; title: string; company: string; duration: string; description: string;
}
interface Education {
  id: string; degree: string; institution: string; year: string;
}
export interface CVData {
  summary: string; experience: Experience[]; education: Education[];
  skills: string[]; languages: string[]; achievements: string[];
}

interface Props {
  cvData: CVData;
  profile: any;
  componentRef: React.RefObject<HTMLDivElement | null>;
  logoUrl: string;
}

export default function CVPreview({ cvData, profile, componentRef, logoUrl }: Props) {
  return (
    <div
      ref={componentRef}
      className="bg-white shadow-2xl text-slate-900 print:shadow-none relative overflow-hidden"
      dir="rtl"
      // Force exact A4 dimensions at 96 DPI for consistent rendering & printing
      style={{ 
        width: '794px', 
        minHeight: '1123px',
        fontFamily: "'Inter', system-ui, sans-serif" 
      }}
    >
      {/* Decorative Header Accent */}
      <div className="absolute top-0 left-0 w-full h-2 bg-emerald-600 print:bg-[#059669]"></div>

      <div className="flex h-full min-h-[1123px]">
        {/* Sidebar */}
        <div className="w-[280px] bg-slate-900 text-slate-100 flex flex-col shrink-0 print:bg-[#0f172a]">
          {/* Photo & Identity */}
          <div className="p-8 text-center bg-slate-800/50 print:bg-[#1e293b]">
            <div className="relative inline-block mb-5">
              <ImageLightbox src={profile?.avatar_url} alt={profile?.full_name}>
                {profile?.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt={profile?.full_name} 
                    width={128} 
                    height={128} 
                    className="rounded-2xl object-cover border-4 border-slate-700/50 shadow-xl select-none" 
                    draggable={false}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl mx-auto bg-slate-800 flex items-center justify-center text-4xl font-bold border-4 border-slate-700/50 shadow-xl text-emerald-400 select-none">
                    {profile?.full_name?.[0] || 'أ'}
                  </div>
                )}
              </ImageLightbox>
              {/* Subtle accent dot */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2 leading-tight">
              {profile?.full_name || 'اسمك الكامل'}
            </h1>
            <div className="text-sm font-medium text-emerald-400 uppercase tracking-widest">
              {cvData.experience[0]?.title || 'المسمى الوظيفي'}
            </div>
          </div>

          <div className="p-8 flex-1 flex flex-col gap-8">
            {/* Contact */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] border-b border-slate-700 pb-2 mb-4 text-slate-400">معلومات التواصل</h2>
              <ul className="space-y-4 text-sm opacity-90">
                {profile?.phone && (
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-emerald-400"><Phone className="w-4 h-4" /></div>
                    <span dir="ltr">{profile.phone}</span>
                  </li>
                )}
                {profile?.email && (
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-emerald-400"><Mail className="w-4 h-4" /></div>
                    <span className="break-all text-[13px]">{profile.email}</span>
                  </li>
                )}
                {profile?.location && (
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-emerald-400"><MapPin className="w-4 h-4" /></div>
                    <span>{profile.location}</span>
                  </li>
                )}
              </ul>
            </section>

            {/* Skills */}
            {cvData.skills.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] border-b border-slate-700 pb-2 mb-4 text-slate-400">المهارات</h2>
                <div className="flex flex-wrap gap-2">
                  {cvData.skills.map((s, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {cvData.languages.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] border-b border-slate-700 pb-2 mb-4 text-slate-400">اللغات</h2>
                <div className="flex flex-col gap-3">
                  {cvData.languages.map((l, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm">{l}</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, idx) => (
                          <div key={idx} className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white p-10 flex flex-col">
          {/* Summary */}
          {cvData.summary && (
            <section className="mb-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                <span className="w-2 h-6 bg-emerald-500 rounded-sm inline-block shrink-0"></span>
                النبذة التعريفية
              </h2>
              <p className="text-sm text-slate-600 leading-loose text-justify px-4 border-r-2 border-slate-100">
                {cvData.summary}
              </p>
            </section>
          )}

          {/* Achievements */}
          {cvData.achievements.length > 0 && (
            <section className="mb-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                <span className="w-2 h-6 bg-emerald-500 rounded-sm inline-block shrink-0"></span>
                الإنجازات الرئيسية
              </h2>
              <div className="grid grid-cols-2 gap-4 px-4">
                {cvData.achievements.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-700 leading-relaxed font-medium">{a}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Experience */}
          {cvData.experience.length > 0 && (
            <section className="mb-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-6">
                <span className="w-2 h-6 bg-emerald-500 rounded-sm inline-block shrink-0"></span>
                الخبرات العملية
              </h2>
              <div className="space-y-6 px-4">
                {cvData.experience.map(exp => (
                  <div key={exp.id} className="relative before:absolute before:right-[-17px] before:top-2 before:w-3 before:h-3 before:bg-white before:border-2 before:border-emerald-500 before:rounded-full after:absolute after:right-[-12px] after:top-6 after:w-0.5 after:h-full after:bg-slate-100 last:after:hidden">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-slate-900 text-[15px]">{exp.title}</h3>
                      <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">{exp.duration}</span>
                    </div>
                    <div className="text-sm text-slate-600 font-bold mb-2">{exp.company}</div>
                    {exp.description && <p className="text-xs text-slate-500 leading-relaxed text-justify">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {cvData.education.length > 0 && (
            <section className="mb-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-6">
                <span className="w-2 h-6 bg-emerald-500 rounded-sm inline-block shrink-0"></span>
                التعليم الأكاديمي
              </h2>
              <div className="space-y-5 px-4">
                {cvData.education.map(edu => (
                  <div key={edu.id} className="relative before:absolute before:right-[-17px] before:top-2 before:w-3 before:h-3 before:bg-slate-200 before:rounded-full after:absolute after:right-[-12px] after:top-6 after:w-0.5 after:h-full after:bg-slate-100 last:after:hidden">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-slate-900 text-sm">{edu.degree}</h3>
                      <span className="text-xs text-slate-500 font-semibold">{edu.year}</span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium">{edu.institution}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          <div className="mt-auto"></div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-0 left-0 w-full bg-slate-900 py-3 px-6 flex items-center justify-between z-10 print:bg-[#0f172a]">
        <div className="flex items-center gap-3">
          {logoUrl && <Image src={logoUrl} alt="Hello Staff" width={100} height={24} className="object-contain brightness-0 invert opacity-80" />}
          <span className="text-xs text-white/50 tracking-wider">WWW.HELLOSTAFF.PS</span>
        </div>
        <div className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
          Created via Hello Staff
        </div>
      </div>
    </div>
  );
}

