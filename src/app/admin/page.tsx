"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  UserCheck,
  Building2,
  FileText,
  ShieldCheck,
  MessageSquare,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalEmployers: 0,
    totalSubscriptions: 0,
    pendingArticles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: jobsCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
      const { count: employersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employer');
      const { count: subsCount } = await supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: articlesCount } = await supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval');
      
      setStats({
        totalUsers: usersCount || 0,
        totalJobs: jobsCount || 0,
        totalEmployers: employersCount || 0,
        totalSubscriptions: subsCount || 0,
        pendingArticles: articlesCount || 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const statCards = [
    { name: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-blue-600', text: 'text-blue-50', trend: '+12%' },
    { name: 'الاشتراكات الفعالة', value: stats.totalSubscriptions, icon: ShieldCheck, color: 'from-emerald-500 to-teal-600', text: 'text-emerald-50', trend: '+28%' },
    { name: 'الوظائف النشطة', value: stats.totalJobs, icon: Briefcase, color: 'from-brand-500 to-brand-700', text: 'text-brand-50', trend: '+5%' },
    { name: 'مقالات للمراجعة', value: stats.pendingArticles, icon: FileText, color: 'from-amber-500 to-orange-600', text: 'text-amber-50', trend: '+2' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-l from-slate-900 to-slate-800 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2">نظرة عامة على المنصة</h2>
          <p className="text-slate-300">مرحباً بك في لوحة الإدارة العليا. إليك ملخص الأداء لليوم.</p>
        </div>
        <div className="flex gap-3 relative z-10">
          <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-sm font-bold backdrop-blur-md transition-all">
            تصدير التقرير
          </button>
          <button className="px-5 py-2.5 bg-brand-500 text-white rounded-2xl text-sm font-bold hover:bg-brand-600 shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2">
            <Activity className="h-4 w-4" />
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat) => (
          <motion.div 
            key={stat.name} 
            variants={item}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.color} p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all group cursor-default transform hover:-translate-y-1`}
          >
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <stat.icon className="h-32 w-32" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl text-white">
                  <stat.icon className="h-6 w-6" />
                </div>
                <span className="flex items-center gap-1 text-white text-xs font-bold bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {stat.trend}
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
              <p className={`text-sm font-bold mb-1 ${stat.text}`}>{stat.name}</p>
              <h3 className="text-4xl font-black text-white tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              أحدث طلبات الاشتراك
            </h3>
            <button className="text-sm font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-4 py-1.5 rounded-full transition-colors">عرض الكل</button>
          </div>
          <div className="p-6 text-center py-16">
            <div className="inline-flex p-4 bg-slate-50 rounded-3xl mb-4 border border-slate-100">
              <ShieldCheck className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">لا توجد طلبات اشتراك جديدة بانتظار المراجعة</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden text-white"
        >
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-brand-400" />
              إجراءات سريعة
            </h3>
          </div>
          <div className="p-6 space-y-4">
             <button className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
               <div className="p-2 bg-brand-500 rounded-xl group-hover:scale-110 transition-transform">
                 <MessageSquare className="h-5 w-5 text-white" />
               </div>
               <div className="text-right">
                 <p className="font-bold">إرسال تعميم</p>
                 <p className="text-xs text-slate-400">إرسال رسالة لجميع المستخدمين</p>
               </div>
             </button>

             <button className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
               <div className="p-2 bg-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                 <FileText className="h-5 w-5 text-white" />
               </div>
               <div className="text-right">
                 <p className="font-bold">نشر مقال جديد</p>
                 <p className="text-xs text-slate-400">إضافة محتوى لمدونة المنصة</p>
               </div>
             </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
