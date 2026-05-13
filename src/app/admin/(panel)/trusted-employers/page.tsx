"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  GripVertical,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface TrustedEmployer {
  id: string;
  name: string;
  logo_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export default function TrustedEmployersPage() {
  const [employers, setEmployers] = useState<TrustedEmployer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TrustedEmployer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [employerList, setEmployerList] = useState<{ profile_id: string; company_name: string; logo_url: string | null }[]>([]);
  const [selectedEmployerId, setSelectedEmployerId] = useState("");

  const fetchEmployers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trusted_employers")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setEmployers(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  async function fetchEmployerList() {
    const { data, error } = await supabase
      .from("employers")
      .select("profile_id, company_name, logo_url")
      .order("company_name", { ascending: true });
    if (!error && data) {
      setEmployerList(data);
    }
  }

  function openModal(emp?: TrustedEmployer) {
    setFormError(null);
    setSelectedEmployerId("");
    if (emp) {
      setEditing(emp);
      setName(emp.name);
      setLogoUrl(emp.logo_url || "");
      setIsVerified(emp.is_verified);
      setIsActive(emp.is_active);
      setDisplayOrder(emp.display_order);
    } else {
      setEditing(null);
      setName("");
      setLogoUrl("");
      setIsVerified(false);
      setIsActive(true);
      setDisplayOrder(employers.length);
      fetchEmployerList();
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("اسم المنشأة مطلوب");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        logo_url: logoUrl.trim() || null,
        is_verified: isVerified,
        is_active: isActive,
        display_order: displayOrder,
      };

      if (editing) {
        const { error } = await supabase
          .from("trusted_employers")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("trusted_employers")
          .insert(payload);
        if (error) throw error;
      }

      closeModal();
      await fetchEmployers();
    } catch (err: any) {
      setFormError(err.message || "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه المنشأة؟")) return;
    setDeletingId(id);
    const { error } = await supabase
      .from("trusted_employers")
      .delete()
      .eq("id", id);
    if (error) {
      alert("فشل الحذف: " + error.message);
    } else {
      setEmployers((prev) => prev.filter((e) => e.id !== id));
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            المنشآت الموثوقة
          </h2>
          <p className="text-slate-500">
            إدارة المنشآت الظاهرة في كاروسيل الصفحة الرئيسية
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-200"
        >
          <Plus className="w-4 h-4" />
          إضافة منشأة
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  الترتيب
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  المنشأة
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  اللوجو
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  الحالة
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  التوثيق
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
                  </td>
                </tr>
              ) : employers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    لا توجد منشآت مسجلة. اضغط "إضافة منشأة" لبدء الإضافة.
                  </td>
                </tr>
              ) : (
                employers.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-300" />
                        <span className="text-sm font-bold text-slate-700">
                          {emp.display_order}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">
                        {emp.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden p-0.5">
                        {emp.logo_url ? (
                          <Image
                            src={emp.logo_url}
                            alt={emp.name}
                            fill
                            className="object-contain"
                            sizes="40px"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          emp.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {emp.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> نشط
                          </>
                        ) : (
                          "معطل"
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {emp.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          موثق
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openModal(emp)}
                          className="p-2 hover:bg-brand-50 text-slate-400 hover:text-brand-600 rounded-lg transition-all"
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          disabled={deletingId === emp.id}
                          className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all disabled:opacity-50"
                          title="حذف"
                        >
                          {deletingId === emp.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-5 sm:p-6 flex items-center justify-between z-10">
              <h2 className="text-lg font-black text-slate-900">
                {editing ? "تعديل منشأة" : "إضافة منشأة"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{formError}</p>
                </div>
              )}

              {!editing && employerList.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    اختر منشأة من قائمة أصحاب العمل
                  </label>
                  <select
                    value={selectedEmployerId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedEmployerId(id);
                      const emp = employerList.find((x) => x.profile_id === id);
                      if (emp) {
                        setName(emp.company_name || "");
                        setLogoUrl(emp.logo_url || "");
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent appearance-none"
                  >
                    <option value="">— اختر منشأة —</option>
                    {employerList.map((emp) => (
                      <option key={emp.profile_id} value={emp.profile_id}>
                        {emp.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  اسم المنشأة *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="مثال: مقهى البرج"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  رابط شعار اللوجو
                </label>
                <div className="relative">
                  <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  اتركه فارغًا إذا لم يكن هناك لوجو
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    الترتيب
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={displayOrder}
                    onChange={(e) =>
                      setDisplayOrder(Number(e.target.value))
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-bold text-slate-700">
                      منشأة موثقة
                    </span>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-bold text-slate-700">
                      نشط
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editing ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    حفظ التعديلات
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    إضافة
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
