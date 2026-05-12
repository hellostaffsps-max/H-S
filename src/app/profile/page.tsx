"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import SeekerProfile from "./SeekerProfile";
import EmployerProfile from "./EmployerProfile";

export default function ProfilePage() {
  const { profile, user, loading: authLoading, refreshProfile } = useAuth();
  const [detailData, setDetailData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      if (!user || !profile) {
        setFetching(false);
        return;
      }

      try {
        if (profile.role === "employer") {
          const { data } = await supabase
            .from("employers")
            .select("*")
            .eq("profile_id", user.id)
            .single();
          setDetailData(data);
        } else {
          const { data } = await supabase
            .from("seekers")
            .select("*")
            .eq("profile_id", user.id)
            .single();
          setDetailData(data);
        }
      } catch {
        setDetailData(null);
      } finally {
        setFetching(false);
      }
    }

    if (!authLoading) {
      fetchDetail();
    }
  }, [user, profile, authLoading]);

  if (authLoading || fetching) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-16 text-center">
        <p className="text-slate-500">يرجى تسجيل الدخول لعرض الملف الشخصي</p>
      </div>
    );
  }

  // Admin users see a redirect message (admin dashboard is separate)
  if (profile.role === "admin") {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-16 text-center">
        <p className="text-slate-500 mb-4">المسؤولون يستخدمون لوحة التحكم الإدارية</p>
        <a
          href="/admin"
          className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
        >
          الذهاب إلى لوحة التحكم
        </a>
      </div>
    );
  }

  if (profile.role === "employer") {
    return (
      <EmployerProfile
        profile={profile}
        user={user}
        employerData={detailData}
        onEmployerDataUpdate={setDetailData}
        onProfileUpdate={refreshProfile}
      />
    );
  }

  return (
    <SeekerProfile
      profile={profile}
      user={user}
      seekerData={detailData}
      onSeekerDataUpdate={setDetailData}
      onProfileUpdate={refreshProfile}
    />
  );
}
