"use client";

import Image from "next/image";
import {
  X,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Star,
  Calendar,
  FileText,
  ShieldCheck,
  Clock,
  XCircle,
  CheckCircle,
  UserCircle,
  Trophy,
  AlertTriangle,
} from "lucide-react";

interface Seeker {
  profile_id: string;
  job_title: string | null;
  experience_years: number | null;
  skills: string[] | null;
  bio: string | null;
  cv_url: string | null;
  is_available: boolean | null;
  current_employer: string | null;
  verification_status: string | null;
  is_featured: boolean | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
}

interface Props {
  seeker: Seeker | null;
  onClose: () => void;
  onUpdateVerification: (id: string, status: string) => Promise<void>;
  onToggleFeatured: (id: string, featured: boolean) => Promise<void>;
}

export default function SeekerDetailModal({ seeker, onClose, onUpdateVerification, onToggleFeatured }: Props) {
  if (!seeker) return null;

  const profile = seeker.profiles;
  const canBeFeature = (seeker.experience_years || 0) >= 6 && !!seeker.cv_url;

  const getStatusBadge = () => {
    const status = seeker.verification_status || "pending";
    if (status === "verified") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-bold">
          <ShieldCheck className="h-4 w-4" /> {"\u0645\u0648\u062b\u0642"}
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm font-bold">
          <XCircle className="h-4 w-4" /> {"\u0645\u0631\u0641\u0648\u0636"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm font-bold">
        <Clock className="h-4 w-4" /> {"\u0642\u064a\u062f \u0627\u0644\u062a\u0648\u062b\u064a\u0642"}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-brand-600" />
            {"\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0645\u0648\u0638\u0641"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0 overflow-hidden border-2 border-brand-100">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill className="object-cover" sizes="80px" />
              ) : (
                <UserCircle className="h-10 w-10 text-brand-600" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-slate-900">{profile?.full_name || "\u0628\u062f\u0648\u0646 \u0627\u0633\u0645"}</h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {getStatusBadge()}
                {seeker.is_featured && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-800 border border-amber-300 rounded-full text-sm font-bold shadow-sm">
                    <Trophy className="h-4 w-4" /> {"\u0645\u0648\u0638\u0641 \u0645\u0645\u064a\u0632"}
                  </span>
                )}
                {seeker.is_available !== false ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">
                    <CheckCircle className="h-3 w-3" /> {"\u0645\u062a\u0627\u062d \u0644\u0644\u0639\u0645\u0644"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-bold">
                    {"\u063a\u064a\u0631 \u0645\u062a\u0627\u062d"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">{"\u0627\u0644\u0645\u0633\u0645\u0649 \u0627\u0644\u0648\u0638\u064a\u0641\u064a"}</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Briefcase className="h-4 w-4 text-brand-600" />
                {seeker.job_title || "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">{"\u0633\u0646\u0648\u0627\u062a \u0627\u0644\u062e\u0628\u0631\u0629"}</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Star className="h-4 w-4 text-amber-500" />
                {seeker.experience_years != null ? `${seeker.experience_years} \u0633\u0646\u0648\u0627\u062a` : "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">{"\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a"}</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Mail className="h-4 w-4 text-slate-500" />
                {profile?.email || "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">{"\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641"}</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Phone className="h-4 w-4 text-slate-500" />
                {profile?.phone || "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">{"\u0627\u0644\u0645\u0648\u0642\u0639"}</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <MapPin className="h-4 w-4 text-slate-500" />
                {profile?.location || "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">{"\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0633\u062c\u064a\u0644"}</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Calendar className="h-4 w-4 text-slate-500" />
                {new Date(profile?.created_at || 0).toLocaleDateString("ar-EG")}
              </div>
            </div>
          </div>

          {/* Skills */}
          {seeker.skills && seeker.skills.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">{"\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062a"}</p>
              <div className="flex flex-wrap gap-2">
                {seeker.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg text-xs font-bold border border-brand-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {seeker.bio && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">{"\u0646\u0628\u0630\u0629 \u0639\u0646 \u0627\u0644\u0645\u0648\u0638\u0641"}</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl leading-relaxed">{seeker.bio}</p>
            </div>
          )}

          {/* CV */}
          {seeker.cv_url && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">{"\u0627\u0644\u0633\u064a\u0631\u0629 \u0627\u0644\u0630\u0627\u062a\u064a\u0629"}</p>
              <a
                href={seeker.cv_url.startsWith('http') ? seeker.cv_url : `/api/cv?path=${encodeURIComponent(seeker.cv_url)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                <FileText className="h-4 w-4" />
                {"\u0639\u0631\u0636 \u0627\u0644\u0633\u064a\u0631\u0629 \u0627\u0644\u0630\u0627\u062a\u064a\u0629 (PDF)"}
              </a>
            </div>
          )}

          {/* Featured Employee Section */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase mb-3">{"\u062a\u0645\u064a\u064a\u0632 \u0627\u0644\u0645\u0648\u0638\u0641"}</p>
            {seeker.is_featured ? (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 mb-3">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
                  <Trophy className="h-5 w-5 text-amber-600" />
                  {"\u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0638\u0641 \u0645\u0645\u064a\u0632 \u062d\u0627\u0644\u064a\u0627\u064b"}
                </div>
                <p className="text-xs text-amber-700">{"\u064a\u0638\u0647\u0631 \u0628\u0634\u0627\u0631\u0629 \u0630\u0647\u0628\u064a\u0629 \u0641\u064a \u062c\u0645\u064a\u0639 \u0623\u0646\u062d\u0627\u0621 \u0627\u0644\u0645\u0646\u0635\u0629"}</p>
                <button
                  onClick={() => onToggleFeatured(seeker.profile_id, false)}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-white text-amber-700 border border-amber-300 rounded-xl text-sm font-bold hover:bg-amber-50 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  {"\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u0645\u064a\u064a\u0632"}
                </button>
              </div>
            ) : (
              <div>
                {!canBeFeature && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-slate-600">
                      <p className="font-bold mb-1">{"\u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0645\u064a\u064a\u0632 - \u0627\u0644\u0634\u0631\u0648\u0637 \u063a\u064a\u0631 \u0645\u0633\u062a\u0648\u0641\u0627\u0629:"}</p>
                      <ul className="space-y-0.5 mr-3">
                        <li className={`flex items-center gap-1 ${(seeker.experience_years || 0) >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                          {(seeker.experience_years || 0) >= 6 ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {"\u062e\u0628\u0631\u0629 6 \u0633\u0646\u0648\u0627\u062a \u0641\u0623\u0643\u062b\u0631"} ({seeker.experience_years || 0} {"\u0633\u0646\u0648\u0627\u062a"})
                        </li>
                        <li className={`flex items-center gap-1 ${seeker.cv_url ? 'text-green-600' : 'text-red-500'}`}>
                          {seeker.cv_url ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {"\u0633\u064a\u0631\u0629 \u0630\u0627\u062a\u064a\u0629 \u0645\u0631\u0641\u0648\u0639\u0629"}
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => onToggleFeatured(seeker.profile_id, true)}
                  disabled={!canBeFeature}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    canBeFeature
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 shadow-md'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Trophy className="h-4 w-4" />
                  {"\u062a\u0645\u064a\u064a\u0632 \u0643\u0645\u0648\u0638\u0641 \u0645\u0645\u064a\u0632"}
                </button>
              </div>
            )}
          </div>

          {/* Verification Actions */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase mb-3">{"\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0627\u0644\u062a\u0648\u062b\u064a\u0642"}</p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => onUpdateVerification(seeker.profile_id, "verified")}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                {"\u062a\u0648\u062b\u064a\u0642 \u0627\u0644\u062d\u0633\u0627\u0628"}
              </button>
              <button
                onClick={() => onUpdateVerification(seeker.profile_id, "rejected")}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                {"\u0631\u0641\u0636 \u0627\u0644\u062a\u0648\u062b\u064a\u0642"}
              </button>
              <button
                onClick={() => onUpdateVerification(seeker.profile_id, "pending")}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors"
              >
                <Clock className="h-4 w-4" />
                {"\u0625\u0639\u0627\u062f\u0629 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
