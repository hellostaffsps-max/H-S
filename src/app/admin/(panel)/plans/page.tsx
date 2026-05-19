"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { 
  Layers, 
  Search, 
  Loader2, 
  Plus, 
  Edit, 
  Check, 
  X, 
  ShieldCheck, 
  Save, 
  Trash2,
  AlertCircle,
  Megaphone
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  job_limit: number;
  extra_job_price: number;
  duration_days: number;
  allow_articles: boolean;
  featured_listings: boolean;
  max_articles_per_month: number;
  allow_ads: boolean;
  features: string[];
  is_active: boolean;
  created_at?: string;
}

export default function PlansManagement() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans");
      const json = await res.json();
      if (json.success) {
        setPlans(json.data || []);
      }
    } catch (e: any) {
      console.error("Error fetching plans:", e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setModalLoading(true);
    
    const isNew = !editingPlan.id;
    const url = isNew ? "/api/admin/plans" : `/api/admin/plans/${editingPlan.id}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan)
      });
      
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchPlans();
      } else {
        showToast("فشل الحفظ: " + json.error, "error");
      }
    } catch (e: any) {
      showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeactivate = async (id: string, currentStatus: boolean) => {
    if (!confirm(currentStatus ? "هل أنت متأكد من إيقاف هذه الباقة؟ لن يتمكن المستخدمون الجدد من الاشتراك بها." : "هل أنت متأكد من تفعيل هذه الباقة؟")) return;
    
    try {
      const res = await fetch(`/api/admin/plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      const json = await res.json();
      if (json.success) {
        fetchPlans();
      }
    } catch (e) {
      showToast("فشل في تغيير حالة الباقة", "error");
    }
  };

  const openNewPlanModal = () => {
    setEditingPlan({
      id: "",
      name: "",
      price: 0,
      job_limit: 1,
      extra_job_price: 15,
      duration_days: 30,
      allow_articles: false,
      featured_listings: false,
      max_articles_per_month: 0,
      allow_ads: false,
      features: [],
      is_active: true
    });
    setIsModalOpen(true);
  };

  const filteredPlans = plans.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">الباقات</h2>
          <p className="text-slate-500">إدارة خطط الأسعار والاشتراكات لأصحاب العمل</p>
        </div>
        <button 
          onClick={openNewPlanModal}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
        >
          <Plus className="h-5 w-5" />
          إضافة باقة جديدة
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="البحث باسم الباقة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map(plan => (
            <div key={plan.id} className={`bg-white rounded-3xl border ${plan.is_active ? 'border-slate-100 shadow-sm' : 'border-dashed border-slate-300 opacity-75'} p-6 relative overflow-hidden transition-all hover:shadow-md`}>
              {!plan.is_active && (
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                    متوقفة
                  </span>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-black text-brand-600">
                    {plan.price === 0 ? "مجاناً" : `${plan.price} ₪`}
                  </span>
                  {plan.price > 0 && <span className="text-slate-500 text-sm">/ {plan.duration_days} يوم</span>}
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">حد الوظائف:</span>
                  <span className="font-bold text-slate-900">{plan.job_limit} وظائف</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">وظيفة إضافية:</span>
                  <span className="font-bold text-slate-900">{plan.extra_job_price} ₪</span>
                </div>
                {plan.allow_articles && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">نشر مقالات:</span>
                    <span className="font-bold text-slate-900">{plan.max_articles_per_month} مقالات/شهر</span>
                  </div>
                )}
                {plan.featured_listings && (
                  <div className="flex items-center gap-2 text-sm text-brand-600 font-bold bg-brand-50 p-2 rounded-lg">
                    <ShieldCheck className="h-4 w-4" /> تمييز الإعلانات والوظائف
                  </div>
                )}
                {plan.allow_ads && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 font-bold bg-amber-50 p-2 rounded-lg">
                    <Megaphone className="h-4 w-4" /> متاح إنشاء إعلانات
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <button 
                  onClick={() => {
                    setEditingPlan({...plan});
                    setIsModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                >
                  <Edit className="h-4 w-4" /> تعديل
                </button>
                <button 
                  onClick={() => handleDeactivate(plan.id, plan.is_active)}
                  className={`flex items-center justify-center p-2.5 rounded-xl font-bold transition-colors ${plan.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                  title={plan.is_active ? "إيقاف الباقة" : "تفعيل الباقة"}
                >
                  {plan.is_active ? <Trash2 className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                </button>
              </div>
            </div>
          ))}
          {filteredPlans.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 font-medium border-2 border-dashed border-slate-100 rounded-3xl">
              لا توجد باقات لعرضها
            </div>
          )}
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-black text-slate-900">
                {editingPlan.id ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSavePlan} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">اسم الباقة *</label>
                  <input 
                    required
                    type="text" 
                    value={editingPlan.name}
                    onChange={e => setEditingPlan({...editingPlan, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">السعر (شيكل) *</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    value={editingPlan.price}
                    onChange={e => setEditingPlan({...editingPlan, price: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">حد الوظائف</label>
                  <input 
                    type="number" 
                    min="1"
                    value={editingPlan.job_limit}
                    onChange={e => setEditingPlan({...editingPlan, job_limit: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">سعر الوظيفة الإضافية (شيكل)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={editingPlan.extra_job_price}
                    onChange={e => setEditingPlan({...editingPlan, extra_job_price: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">المدة (أيام) *</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={editingPlan.duration_days}
                    onChange={e => setEditingPlan({...editingPlan, duration_days: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">نشر مقالات؟</label>
                  <div className="flex items-center gap-4 h-[50px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingPlan.allow_articles}
                        onChange={e => setEditingPlan({...editingPlan, allow_articles: e.target.checked})}
                        className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-slate-700">السماح بالمقالات</span>
                    </label>
                  </div>
                </div>

                {editingPlan.allow_articles && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">الحد الأقصى للمقالات شهرياً</label>
                    <input 
                      type="number" 
                      min="1"
                      value={editingPlan.max_articles_per_month}
                      onChange={e => setEditingPlan({...editingPlan, max_articles_per_month: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    />
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <input 
                      type="checkbox" 
                      checked={editingPlan.featured_listings}
                      onChange={e => setEditingPlan({...editingPlan, featured_listings: e.target.checked})}
                      className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900">تمييز الإعلانات والوظائف</p>
                      <p className="text-xs text-slate-500">جعل الوظائف المنشورة بهذه الباقة مميزة عن غيرها</p>
                    </div>
                  </label>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <input 
                      type="checkbox" 
                      checked={editingPlan.allow_ads}
                      onChange={e => setEditingPlan({...editingPlan, allow_ads: e.target.checked})}
                      className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900">السماح بإنشاء إعلانات (Ads)</p>
                      <p className="text-xs text-slate-500">تمكين صاحب المنشأة من إنشاء إعلانات متحركة في الصفحة الرئيسية</p>
                    </div>
                  </label>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 flex justify-between items-center">
                    المميزات المعروضة للعميل
                    <button 
                      type="button"
                      onClick={() => setEditingPlan({...editingPlan, features: [...editingPlan.features, "ميزة جديدة"]})}
                      className="text-xs text-brand-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> أضف ميزة
                    </button>
                  </label>
                  <div className="space-y-2">
                    {editingPlan.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text" 
                          value={feature}
                          onChange={e => {
                            const newFeatures = [...editingPlan.features];
                            newFeatures[idx] = e.target.value;
                            setEditingPlan({...editingPlan, features: newFeatures});
                          }}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const newFeatures = editingPlan.features.filter((_, i) => i !== idx);
                            setEditingPlan({...editingPlan, features: newFeatures});
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {editingPlan.features.length === 0 && (
                      <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                        لا يوجد مميزات مضافة.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editingPlan.is_active}
                      onChange={e => setEditingPlan({...editingPlan, is_active: e.target.checked})}
                      className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="font-bold text-slate-700">الباقة مفعلة (تظهر للمستخدمين)</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-3">
                <button 
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  {modalLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  حفظ الباقة
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
