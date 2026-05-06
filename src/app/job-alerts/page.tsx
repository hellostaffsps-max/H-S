"use client";
import { useEffect, useState } from "react";
import {
  Bell,
  Plus,
  Trash2,
  Briefcase,
  MapPin,
  Tag,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import {
  getJobAlerts,
  createJobAlert,
  deleteJobAlert,
  toggleJobAlert,
} from "@/app/actions/job-alerts";

interface JobAlert {
  id: string;
  keyword: string | null;
  category: string | null;
  location: string | null;
  type: string | null;
  is_active: boolean;
  created_at: string;
}

export default function JobAlertsPage() {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    const result = await getJobAlerts();
    if (result.success) {
      setAlerts(result.data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createJobAlert(formData);

    if (result.success) {
      setShowForm(false);
      loadAlerts();
    } else {
      setError(result.error || "حدث خطأ");
    }

    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا التنبيه؟")) return;
    const result = await deleteJobAlert(id);
    if (result.success) {
      loadAlerts();
    }
  }

  async function handleToggle(id: string, current: boolean) {
    const result = await toggleJobAlert(id, !current);
    if (result.success) {
      loadAlerts();
    }
  }

  const categories = [
    { value: "طاهي/ة", label: "طاهي/ة" },
    { value: "نادل/ة", label: "نادل/ة" },
    { value: "باريستا", label: "باريستا" },
    { value: "كاشير", label: "كاشير" },
    { value: "مدير", label: "مدير" },
    { value: "توصيل", label: "توصيل" },
    { value: "مضيف/ة", label: "مضيف/ة" },
    { value: "أخرى", label: "أخرى" },
  ];

  const types = [
    { value: "دوام كامل", label: "دوام كامل" },
    { value: "دوام جزئي", label: "دوام جزئي" },
  ];

  const locations = [
    { value: "رام الله", label: "رام الله" },
    { value: "نابلس", label: "نابلس" },
    { value: "الخليل", label: "الخليل" },
    { value: "بيت لحم", label: "بيت لحم" },
    { value: "جنين", label: "جنين" },
    { value: "طولكرم", label: "طولكرم" },
    { value: "قلقيلية", label: "قلقيلية" },
  ];

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            تنبيهات الوظائف
          </h1>
          <p className="text-sm text-slate-500">
            احصل على إشعارات فورية بالوظائف التي تناسبك
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          تنبيه جديد
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            إنشاء تنبيه جديد
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  كلمة مفتاحية
                </label>
                <input
                  name="keyword"
                  type="text"
                  placeholder="مثال: طاهي، نادل..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  التخصص
                </label>
                <select
                  name="category"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
                >
                  <option value="">الكل</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  الموقع
                </label>
                <select
                  name="location"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
                >
                  <option value="">الكل</option>
                  {locations.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  نوع الدوام
                </label>
                <select
                  name="type"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
                >
                  <option value="">الكل</option>
                  {types.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                حفظ التنبيه
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-900 mb-1">
            لا توجد تنبيهات
          </p>
          <p className="text-sm text-slate-500">
            أنشئ تنبيهاً لتصلك الوظائف الجديدة التي تناسبك
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                alert.is_active
                  ? "border-slate-200"
                  : "border-slate-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell
                      className={`w-4 h-4 ${
                        alert.is_active ? "text-brand-600" : "text-slate-400"
                      }`}
                    />
                    <span className="text-sm font-bold text-slate-900">
                      تنبيه وظائف
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        alert.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {alert.is_active ? "مفعل" : "معطل"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    {alert.keyword && (
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                        <Tag className="w-3 h-3" /> {alert.keyword}
                      </span>
                    )}
                    {alert.category && (
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                        <Briefcase className="w-3 h-3" /> {alert.category}
                      </span>
                    )}
                    {alert.location && (
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                        <MapPin className="w-3 h-3" /> {alert.location}
                      </span>
                    )}
                    {alert.type && (
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                        <SlidersHorizontal className="w-3 h-3" /> {alert.type}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                    <Clock className="w-3 h-3" />
                    أنشئ في{" "}
                    {new Date(alert.created_at).toLocaleDateString("ar-EG")}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(alert.id, alert.is_active)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      alert.is_active
                        ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    {alert.is_active ? "تعطيل" : "تفعيل"}
                  </button>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
