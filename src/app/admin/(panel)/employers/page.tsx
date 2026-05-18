"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Building2, Search, Loader2, MapPin, Phone, Calendar, Briefcase, ShieldCheck, XCircle, Clock, Eye } from "lucide-react";
import Pagination from "@/components/Pagination";
import { supabase } from "@/lib/supabase";
import EmployerDetailModal from "@/components/admin/EmployerDetailModal";

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
  cover_image_url: string | null;
  description: string | null;
  opening_hours: string | null;
  verification_status: string | null;
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
  const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchEmployers();
  }, []);

  async function fetchEmployers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employers")
        .select("*, profiles(full_name, email, phone, created_at)")
        .limit(200);

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

  async function handleUpdateVerification(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/employers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "فشل التحديث");

      setEmployers((prev) =>
        prev.map((emp) =>
          emp.profile_id === id ? { ...emp, verification_status: status } : emp
        )
      );
      if (selectedEmployer?.profile_id === id) {
        setSelectedEmployer({ ...selectedEmployer, verification_status: status });
      }
      alert("تم تحديث حالة التوثيق بنجاح");
    } catch (e: any) {
      alert("خطأ: " + e.message);
    }
  }

  const getVerificationBadge = (status: string | null) => {
    if (status === "verified") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
          <ShieldCheck className="h-3 w-3" /> موثق
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">
          <XCircle className="h-3 w-3" /> مرفوض
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
        <Clock className="h-3 w-3" /> قيد المراجعة
      </span>
    );
  };

  const filtered = employers.filter((emp) =>
    emp.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.business_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">البريد الإلكتروني</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">نوع العمل</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الموقع</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">التواصل</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">التوثيق</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">تاريخ التسجيل</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-400">
                    {searchTerm ? "لا توجد نتائج مطابقة" : "لا يوجد أصحاب عمل مسجلين بعد"}
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr
                    key={emp.profile_id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedEmployer(emp);
                      setIsModalOpen(true);
                    }}
                  >
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
                      <div className="text-xs text-slate-600 font-medium truncate max-w-[160px]" dir="ltr">
                        {emp.profiles?.email || "—"}
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
                            <span>{emp.business_email}</span>
                          </div>
                        )}
                        {!emp.whatsapp_number && !emp.business_email && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getVerificationBadge(emp.verification_status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(emp.profiles?.created_at || 0).toLocaleDateString("ar-EG")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="p-2 hover:bg-brand-50 text-slate-400 hover:text-brand-600 rounded-lg transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployer(emp);
                          setIsModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        total={total}
        onPageChange={setPage}
      />

      {/* Detail Modal */}
      {isModalOpen && selectedEmployer && (
        <EmployerDetailModal
          employer={selectedEmployer}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEmployer(null);
          }}
          onUpdateVerification={handleUpdateVerification}
        />
      )}
    </div>
  );
}
