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
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'active'
  const [searchTerm, setSearchTerm] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [updatingPlan, setUpdatingPlan] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
  }, []);

  async function fetchPlans() {
    const { data } = await supabase.from('subscription_plans').select('*').order('price', { ascending: true });
    if (data) setPlans(data);
  }

  async function fetchSubscriptions() {
    try {
      const res = await fetch('/api/admin/subscriptions');
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch subscriptions');
      setSubscriptions(result.data);
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
      alert('حدث خطأ أثناء تحديث حالة الاشتراك');
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
      alert('تم تحديث الخطة بنجاح');
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('حدث خطأ أثناء ترقية الخطة');
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
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">إدارة الاشتراكات والدفع</h2>
            <p className="text-slate-500 text-sm">مراجعة طلبات الترقية وتفعيل خطط أصحاب العمل</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex gap-2 w-full md:w-auto">
            {['all', 'pending', 'active'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex-1 md:flex-none ${
                  filter === f 
                    ? 'bg-brand-600 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f === 'all' ? 'الكل' : f === 'pending' ? 'بانتظار المراجعة' : 'نشط'}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد أو الخطة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="text-center p-12">
              <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">لا توجد طلبات تطابق بحثك</p>
            </div>
          ) : (
            <table className="w-full text-right">
              <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">المستخدم</th>
                  <th className="px-6 py-4">الخطة</th>
                  <th className="px-6 py-4">تاريخ التسجيل</th>
                  <th className="px-6 py-4 text-center">المتبقي</th>
                  <th className="px-6 py-4 text-center">الحالة</th>
                  <th className="px-6 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                          {sub.profiles?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{sub.profiles?.full_name || 'مستخدم غير معروف'}</p>
                          <p className="text-xs text-slate-500">{sub.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{sub.subscription_plans?.name || 'خطة غير معروفة'}</p>
                      <p className="text-xs text-slate-500">
                        {sub.subscription_plans?.price ? `${sub.subscription_plans.price} ₪` : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-900 font-bold">
                          {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString('ar-EG') : '-'}
                        </span>
                        <span className="text-[10px] text-slate-400">الطلب: {new Date(sub.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {sub.status === 'active' && sub.ends_at ? (
                        <div className="flex flex-col items-center">
                          <span className={cn(
                            "text-sm font-black",
                            (getRemainingDays(sub.ends_at) || 0) < 5 ? "text-red-600" : "text-brand-600"
                          )}>
                            {getRemainingDays(sub.ends_at)} يوم
                          </span>
                          <span className="text-[10px] text-slate-400">ينتهي {new Date(sub.ends_at).toLocaleDateString('ar-EG')}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        sub.status === 'active' ? 'bg-green-100 text-green-700' :
                        sub.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        sub.status === 'expired' ? 'bg-slate-100 text-slate-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {sub.status === 'active' && <CheckCircle className="h-3 w-3" />}
                        {sub.status === 'pending' && <Clock className="h-3 w-3" />}
                        {sub.status === 'rejected' && <XCircle className="h-3 w-3" />}
                        {sub.status === 'active' ? 'فعال' :
                         sub.status === 'rejected' ? 'مرفوض' :
                         sub.status === 'expired' ? 'منتهي' : 'بانتظار المراجعة'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {sub.status === 'active' && (
                          <button 
                            onClick={() => setEditingSub(sub)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="ترقية / تغيير الخطة"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                        )}

                        {sub.status === 'pending' ? (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(sub.id, 'active')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="موافقة وتفعيل"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(sub.id, 'rejected')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="رفض"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        ) : sub.status === 'active' ? (
                          <button 
                            onClick={() => handleUpdateStatus(sub.id, 'rejected')}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="إلغاء الاشتراك"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        ) : null}

                        {sub.payment_receipt_url && (
                          <a 
                            href={sub.payment_receipt_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="عرض وصل الدفع"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {editingSub && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100"
          >
            <h3 className="text-xl font-black text-slate-900 mb-2">ترقية خطة الاشتراك</h3>
            <p className="text-slate-500 text-sm mb-6">
              تغيير خطة المستخدم: <span className="font-bold text-slate-900">{editingSub.profiles?.full_name}</span>
            </p>

            <div className="space-y-3 mb-8">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleUpgradePlan(editingSub.id, plan.id)}
                  disabled={updatingPlan || plan.id === editingSub.plan_id}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 text-right transition-all flex items-center justify-between group",
                    plan.id === editingSub.plan_id 
                      ? "border-brand-500 bg-brand-50/50" 
                      : "border-slate-100 hover:border-brand-200 hover:bg-slate-50"
                  )}
                >
                  <div>
                    <p className="font-bold text-slate-900">{plan.name}</p>
                    <p className="text-xs text-slate-500">{plan.price} ₪</p>
                  </div>
                  {plan.id === editingSub.plan_id ? (
                    <span className="text-[10px] font-bold text-brand-600 bg-white px-2 py-1 rounded-lg">الحالية</span>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-brand-400"></div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setEditingSub(null)}
                className="flex-1 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
