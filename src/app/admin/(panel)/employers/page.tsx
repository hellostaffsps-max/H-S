"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Building2, Search, Loader2, MapPin, Phone, Calendar, Briefcase, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Employer {
  profile_id: string;
  company_name: string;
  business_type: string | null;
  city: string | null;
  area: string | null;
  whatsapp_number: string | null;
  business_email: string | null;
  number_of_branches: number | null;
  number_of_employees: string | null;
  logo_url: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    created_at: string;
  } | null;
}

export default function EmployersManagement() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEmployers();
  }, []);

  async function fetchEmployers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employers")
        .select("*, profiles(full_name, email, phone, created_at)");

      if (error) throw error;
      
      const sorted = (data || []).sort((a, b) => {
        const d1 = new Date(a.profiles?.created_at || 0).getTime();
        const d2 = new Date(b.profiles?.created_at || 0).getTime();
        return d2 - d1;
      });
      
      setEmployers(sorted);
    } catch (e: any) {
      console.error("Error fetching employers:", e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = employers.filter((emp) =>
    emp.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.business_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">أصحاب العمل</h2>
          <p className="text-slate-500">إدارة حسابات المنشآت والشركات المسجلة</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-100">
          <Building2 className="h-4 w-4 text-brand-600" />
          <span className="font-bold">{employers.length}</span> منشأة مسجلة
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="البحث باسم المنشأة أو المدينة أو نوع العمل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">المنشأة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">نوع العمل</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الموقع</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">التواصل</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    {searchTerm ? "لا توجد نتائج مطابقة" : "لا يوجد أصحاب عمل مسجلين بعد"}
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.profile_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 overflow-hidden">
                          {emp.logo_url ? (
                            <Image src={emp.logo_url} alt="" fill className="object-cover rounded-xl" sizes="40px" />
                          ) : (
                            <Building2 className="h-5 w-5 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{emp.company_name || "بدون اسم"}</p>
                          <p className="text-xs text-slate-500">{emp.profiles?.full_name || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold">
                        <Briefcase className="h-3 w-3" />
                        {emp.business_type || "غير محدد"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {emp.city || "غير محدد"}{emp.area ? ` - ${emp.area}` : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {emp.whatsapp_number && (
                          <div className="flex items-center gap-1 text-xs text-slate-600">
                            <Phone className="h-3 w-3 text-green-500" />
                            <span dir="ltr">{emp.whatsapp_number}</span>
                          </div>
                        )}
                        {emp.business_email && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <ExternalLink className="h-3 w-3" />
                            {emp.business_email}
                          </div>
                        )}
                        {!emp.whatsapp_number && !emp.business_email && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(emp.profiles?.created_at || 0).toLocaleDateString("ar-EG")}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
