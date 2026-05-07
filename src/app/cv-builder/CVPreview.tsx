"use client";
import React from 'react';

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
      className="bg-white shadow-xl w-full max-w-[210mm] text-slate-900 print:shadow-none print:w-[210mm] print:min-h-[297mm] relative overflow-hidden"
      dir="rtl"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="flex">
        {/* Sidebar */}
        <div className="w-[32%] bg-[#0f4c3a] text-white p-6 flex flex-col print:w-[32%]">
          {/* Photo */}
          <div className="text-center mb-6 pb-5 border-b border-white/20">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-28 h-28 rounded-full object-cover border-4 border-white/30 mx-auto shadow-lg mb-4" />
            ) : (
              <div className="w-28 h-28 rounded-full mx-auto mb-4 bg-white/15 flex items-center justify-center text-3xl font-bold">
                {profile?.full_name?.[0] || 'A'}
              </div>
            )}
            <h1 className="text-xl font-bold leading-tight mb-1">{profile?.full_name || 'اسمك الكامل'}</h1>
            <div className="text-xs font-medium opacity-80 uppercase tracking-wider">{cvData.experience[0]?.title || 'المسمى الوظيفي'}</div>
          </div>

          {/* Contact */}
          <section className="mb-5">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] border-b border-white/20 pb-1.5 mb-3 text-emerald-300">التواصل</h2>
            <ul className="text-[10px] space-y-2 opacity-90">
              {profile?.phone && <li className="flex items-center gap-2">📱 {profile.phone}</li>}
              {profile?.email && <li className="flex items-center gap-2 break-all">✉️ {profile.email}</li>}
              {profile?.location && <li className="flex items-center gap-2">📍 {profile.location}</li>}
            </ul>
          </section>

          {/* Skills */}
          {cvData.skills.length > 0 && (
            <section className="mb-5">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] border-b border-white/20 pb-1.5 mb-3 text-emerald-300">المهارات</h2>
              <div className="space-y-1.5">
                {cvData.skills.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-[10px]">{s}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {cvData.languages.length > 0 && (
            <section className="mb-5">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] border-b border-white/20 pb-1.5 mb-3 text-emerald-300">اللغات</h2>
              <div className="space-y-1.5">
                {cvData.languages.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-[10px]">{l}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Main Content */}
        <div className="w-[68%] bg-white p-6 sm:p-8 flex flex-col print:w-[68%]">
          {/* Achievements */}
          {cvData.achievements.length > 0 && (
            <section className="mb-5">
              <h2 className="text-sm font-bold text-[#0f4c3a] border-b-2 border-emerald-600 pb-1 mb-3 uppercase tracking-wider">الإنجازات الرئيسية</h2>
              <div className="grid grid-cols-2 gap-2">
                {cvData.achievements.map((a, i) => (
                  <div key={i} className="flex items-start gap-1.5 bg-emerald-50 rounded-lg p-2">
                    <span className="text-emerald-600 text-xs mt-0.5">✓</span>
                    <span className="text-[10px] text-slate-700 leading-relaxed">{a}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Summary */}
          {cvData.summary && (
            <section className="mb-5">
              <h2 className="text-sm font-bold text-[#0f4c3a] border-b-2 border-emerald-600 pb-1 mb-3 uppercase tracking-wider">النبذة التعريفية</h2>
              <p className="text-[11px] text-slate-600 leading-relaxed text-justify">{cvData.summary}</p>
            </section>
          )}

          {/* Experience */}
          {cvData.experience.length > 0 && (
            <section className="mb-5">
              <h2 className="text-sm font-bold text-[#0f4c3a] border-b-2 border-emerald-600 pb-1 mb-3 uppercase tracking-wider">الخبرات العملية</h2>
              <div className="space-y-4">
                {cvData.experience.map(exp => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-bold text-slate-900 text-xs">{exp.title}</h3>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">{exp.duration}</span>
                    </div>
                    <div className="text-[11px] text-slate-700 font-semibold mb-1">{exp.company}</div>
                    {exp.description && <p className="text-[10px] text-slate-500 leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {cvData.education.length > 0 && (
            <section className="mb-5">
              <h2 className="text-sm font-bold text-[#0f4c3a] border-b-2 border-emerald-600 pb-1 mb-3 uppercase tracking-wider">التعليم</h2>
              <div className="space-y-3">
                {cvData.education.map(edu => (
                  <div key={edu.id}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-slate-900 text-xs">{edu.degree}</h3>
                      <span className="text-[10px] text-emerald-700 font-bold">{edu.year}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">{edu.institution}</div>
                  </div>
                ))}
              </div>
            </section>
          )}


        </div>
      </div>

      {/* Footer - Powered by HELLO STAFF */}
      <div className="bg-[#0f4c3a] py-2 px-4 flex items-center justify-center gap-2">
        <span className="text-[9px] text-white/70">Powered by</span>
        {logoUrl && <img src={logoUrl} alt="Hello Staff" className="h-4 w-4 object-contain" />}
        <span className="text-[10px] text-white font-bold tracking-wide">HELLO STAFF</span>
      </div>
    </div>
  );
}
