"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  Loader2,
  FileText,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import Pagination from '@/components/Pagination';
import { useToast } from "@/hooks/useToast";

type Subscription = {
  id: string;
  status: string;
  plan_id?: string;
  plan_name?: string;
  payment_receipt_url: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  subscription_plans: {
    name: string;
    price: number;
    duration_days: number;
  };
};

export default function AdminSubscriptions() {
  const { showToast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [updatingPlan, setUpdatingPlan] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
  }, [page]);

  async function fetchPlans() {
    const { data } = await supabase.from('subscription_plans').select('id, name, price, features, job_limit, extra_job_price, duration_days, allow_articles, featured_listings, max_articles_per_month, allow_ads, is_active').order('price', { ascending: true });
    if (data) setPlans(data);
  }

  async function fetchSubscriptions() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/subscriptions?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch subscriptions');
      setSubscriptions(result.data);
      if (result.pagination) {
        setTotalPages(result.pagination.totalPages);
        setHasNext(result.pagination.hasNext);
        setHasPrev(result.pagination.hasPrev);
        setTotal(result.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to update status');
      
      setSubscriptions(subs => subs.map(sub => 
        sub.id === id ? result.data : sub
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('حدث خطأ أثناء تحديث حالة الاشتراك', "error");
    }
  };

  const handleUpgradePlan = async (subId: string, newPlanId: string) => {
    setUpdatingPlan(true);
    const selectedPlan = plans.find(p => p.id === newPlanId);
    
    try {
      const res = await fetch(`/api/admin/subscriptions/${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan_id: newPlanId, 
          plan_name: selectedPlan?.name, 
          status: 'active' 
        }),
      });
      if (!res.ok) throw new Error('Failed to upgrade plan');
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to upgrade plan');
      
      setSubscriptions(subs => subs.map(sub => 
        sub.id === subId ? result.data : sub
      ));
      setEditingSub(null);
      showToast('تم تحديث الخطة بنجاح', "success");
    } catch (error) {
      console.error('Error upgrading plan:', error);
      showToast('حدث خطأ أثناء ترقية الخطة', "error");
    } finally {
      setUpdatingPlan(false);
    }
  };

  const getRemainingDays = (endDate: string | null) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const filteredSubs = subscriptions.filter(sub => {
    const matchesFilter = filter === 'all' || sub.status === filter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      sub.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      sub.profiles?.email?.toLowerCase().includes(searchLower) ||
      sub.subscription_plans?.name?.toLowerCase().includes(searchLower);
    
    return matchesFilter && matchesSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      {/* Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 backdrop-blur-xl border border-brand-500/30 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-brand-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">إدارة الاشتراكات</h1>
            </div>
            <p className="text-slate-400 text-sm font-medium max-w-lg">
              مراجعة طلبات الترقية، التحقق من الإيصالات، وتفعيل باقات أصحاب العمل.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-[24px]">
            <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">طلبات معلقة</div>
            <div className="text-2xl font-black text-white">{subscriptions.filter(s => s.status === 'pending').length}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full md:w-auto">
          {['all', 'pending', 'active'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex-1 md:flex-none",
                filter === f 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {f === 'all' ? 'الكل' : f === 'pending' ? 'المعلقة' : 'النشطة'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
              <p className="text-slate-400 font-bold">جاري تحميل البيانات...</p>
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="text-center py-20 bg-slate-50/30">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">لا توجد اشتراكات</h3>
              <p className="text-sm text-slate-400">لم يتم العثور على أي طلبات تطابق الفلتر الحالي.</p>
            </div>
          ) : (
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">المستخدم</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">الخطة</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">التواريخ</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">المدة المتبقية</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">الحالة</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-lg border border-slate-200">
                          {sub.profiles?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{sub.profiles?.full_name || 'مستخدم غير معروف'}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{sub.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-900">{sub.subscription_plans?.name || sub.plan_name}</p>
                          {!sub.plan_id && (
                            <div className="group relative">
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                              <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                تنبيه: معرف الخطة مفقود. يرجى تعديل الخطة يدوياً قبل التفعيل لضمان عمل الصلاحيات.
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="inline-flex px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100">
                          ₪{sub.subscription_plans?.price || 0}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>بدأ: {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium pr-5">الطلب: {new Date(sub.created_at).toLocaleDateString('ar-EG')}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {sub.status === 'active' && sub.ends_at ? (
                        <div className="inline-flex flex-col items-center p-2 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className={cn(
                            "text-sm font-black",
                            (getRemainingDays(sub.ends_at) || 0) < 5 ? "text-rose-600" : "text-brand-600"
                          )}>
                            {getRemainingDays(sub.ends_at)} يوم
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black border",
                        sub.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        sub.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        sub.status === 'expired' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      )}>
                        {sub.status === 'active' ? 'نشط' :
                         sub.status === 'rejected' ? 'مرفوض' :
                         sub.status === 'expired' ? 'منتهي' : 'قيد المراجعة'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        {sub.status === 'pending' && (
                          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                            <button 
                              onClick={() => {
                                if (!sub.plan_id) {
                                  setEditingSub(sub);
                                  showToast('هذا الطلب لا يحتوي على معرف خطة (Plan ID). يرجى اختيار الخطة المناسبة من القائمة.', "info");
                                } else {
                                  handleUpdateStatus(sub.id, 'active');
                                }
                              }}
                              className="p-2 bg-white text-emerald-600 hover:text-emerald-700 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95"
                              title="تفعيل"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(sub.id, 'rejected')}
                              className="p-2 bg-white text-rose-600 hover:text-rose-700 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95"
                              title="رفض"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        )}

                        {sub.payment_receipt_url && (
                          <a 
                            href={sub.payment_receipt_url.startsWith('http') ? sub.payment_receipt_url : `/api/admin/receipt?path=${encodeURIComponent(sub.payment_receipt_url)}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="w-10 h-10 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl flex items-center justify-center transition-all group/receipt"
                            title="عرض الإيصال"
                          >
                            <ExternalLink className="h-5 w-5 group-hover/receipt:scale-110 transition-transform" />
                          </a>
                        )}

                        {sub.status === 'active' && (
                          <button 
                            onClick={() => setEditingSub(sub)}
                            className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-all"
                            title="تعديل الخطة"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          onPageChange={setPage}
        />
      </div>

      {/* Upgrade Modal */}
      {editingSub && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[40px] p-8 sm:p-10 max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
            
            <h3 className="text-2xl font-black text-slate-900 mb-2 relative">ترقية الخطة</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium relative">
              تغيير خطة المستخدم: <span className="font-bold text-brand-600">{editingSub.profiles?.full_name}</span>
            </p>

            <div className="space-y-3 mb-10 relative">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleUpgradePlan(editingSub.id, plan.id)}
                  disabled={updatingPlan || plan.id === editingSub.plan_id}
                  className={cn(
                    "w-full p-5 rounded-[24px] border-2 text-right transition-all flex items-center justify-between group",
                    plan.id === editingSub.plan_id 
                      ? "border-brand-500 bg-brand-50" 
                      : "border-slate-100 hover:border-brand-200 hover:bg-slate-50"
                  )}
                >
                  <div className="flex flex-col items-start">
                    <p className="font-black text-slate-900">{plan.name}</p>
                    <p className="text-[10px] font-black text-brand-600 px-2 py-0.5 bg-white rounded-lg border border-brand-100 mt-1">₪{plan.price}</p>
                  </div>
                  {plan.id === editingSub.plan_id ? (
                    <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-brand-400" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-4 relative">
              <button 
                onClick={() => setEditingSub(null)}
                className="flex-1 py-4 bg-slate-50 text-slate-600 font-black rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
