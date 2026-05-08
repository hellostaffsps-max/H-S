"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck, Loader2, Users, Building2, UserSearch, Crown,
  Eye, Briefcase, FileText, Send, CreditCard, MessageSquare,
  Flag, BarChart3, Settings, ChevronDown, ChevronUp, Check, X,
  Lock
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface RoleInfo {
  key: string;
  label: string;
  labelEn: string;
  description: string;
  icon: typeof Users;
  color: string;
  count: number;
  permissions: { key: string; label: string; icon: typeof Eye; allowed: boolean }[];
}

export default function RolesManagement() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from("profiles").select("role");
      const roleCounts: Record<string, number> = {};
      (profiles || []).forEach((p: any) => {
        roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
      });

      const allPermissions = [
        { key: "view_dashboard", label: "عرض لوحة التحكم", icon: BarChart3 },
        { key: "manage_users", label: "إدارة المستخدمين", icon: Users },
        { key: "manage_jobs", label: "إدارة الوظائف", icon: Briefcase },
        { key: "create_job", label: "إنشاء وظيفة", icon: Briefcase },
        { key: "apply_job", label: "التقديم على وظيفة", icon: Send },
        { key: "manage_articles", label: "إدارة المقالات (موافقة/رفض)", icon: FileText },
        { key: "write_article", label: "كتابة مقال", icon: FileText },
        { key: "manage_subscriptions", label: "إدارة الاشتراكات والباقات", icon: CreditCard },
        { key: "send_broadcast", label: "إرسال تعميم عام", icon: MessageSquare },
        { key: "manage_support", label: "إدارة البلاغات والدعم", icon: Flag },
        { key: "view_reports", label: "عرض التقارير والإحصائيات", icon: BarChart3 },
        { key: "platform_settings", label: "إعدادات المنصة", icon: Settings },
        { key: "send_messages", label: "إرسال واستقبال الرسائل", icon: MessageSquare },
        { key: "view_applications", label: "عرض طلبات التوظيف", icon: Eye },
        { key: "manage_profile", label: "إدارة الملف الشخصي", icon: Users },
      ];

      const adminPerms = ["view_dashboard", "manage_users", "manage_jobs", "create_job", "manage_articles", "write_article", "manage_subscriptions", "send_broadcast", "manage_support", "view_reports", "platform_settings", "send_messages", "view_applications", "manage_profile"];
      const employerPerms = ["create_job", "write_article", "send_messages", "view_applications", "manage_profile"];
      const seekerPerms = ["apply_job", "send_messages", "manage_profile"];

      const roleData: RoleInfo[] = [
        {
          key: "admin",
          label: "مدير النظام",
          labelEn: "Admin",
          description: "صلاحيات كاملة للتحكم بجميع أقسام المنصة بما في ذلك إدارة المستخدمين والباقات والتقارير",
          icon: Crown,
          color: "brand",
          count: roleCounts["admin"] || 0,
          permissions: allPermissions.map(p => ({ ...p, allowed: adminPerms.includes(p.key) })),
        },
        {
          key: "employer",
          label: "صاحب عمل",
          labelEn: "Employer",
          description: "يمكنه نشر الوظائف، كتابة المقالات، استعراض طلبات التوظيف، والتواصل مع المرشحين",
          icon: Building2,
          color: "blue",
          count: roleCounts["employer"] || 0,
          permissions: allPermissions.map(p => ({ ...p, allowed: employerPerms.includes(p.key) })),
        },
        {
          key: "seeker",
          label: "باحث عن عمل",
          labelEn: "Seeker",
          description: "يمكنه تصفح الوظائف والتقديم عليها والتواصل مع أصحاب العمل وإدارة ملفه الشخصي",
          icon: UserSearch,
          color: "emerald",
          count: roleCounts["seeker"] || 0,
          permissions: allPermissions.map(p => ({ ...p, allowed: seekerPerms.includes(p.key) })),
        },
      ];

      setRoles(roleData);
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setLoading(false);
    }
  }

  const colorMap: Record<string, { bg: string; icon: string; border: string; badge: string; light: string }> = {
    brand: { bg: "bg-brand-50", icon: "text-brand-600", border: "border-brand-200", badge: "bg-brand-600 text-white", light: "bg-brand-50/50" },
    blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-200", badge: "bg-blue-600 text-white", light: "bg-blue-50/50" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200", badge: "bg-emerald-600 text-white", light: "bg-emerald-50/50" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">الصلاحيات والأدوار</h2>
          <p className="text-slate-500">إدارة أدوار المستخدمين والصلاحيات الممنوحة لكل دور</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200">
          <Lock className="h-4 w-4" />
          <span className="font-bold">الأدوار محمية ومحددة مسبقاً في النظام</span>
        </div>
      </div>

      {/* Roles Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => {
          const cm = colorMap[role.color] || colorMap.brand;
          const Icon = role.icon;
          const allowedCount = role.permissions.filter(p => p.allowed).length;
          return (
            <div key={role.key} className={`bg-white rounded-2xl border ${cm.border} p-5 shadow-sm`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${cm.bg}`}>
                  <Icon className={`h-5 w-5 ${cm.icon}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{role.label}</h3>
                  <p className="text-xs text-slate-500">{role.labelEn}</p>
                </div>
                <span className={`text-sm font-black px-3 py-1 rounded-full ${cm.badge}`}>
                  {role.count}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">{role.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  <span className="font-bold text-slate-700">{allowedCount}</span> / {role.permissions.length} صلاحية
                </span>
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${role.key === "admin" ? "bg-brand-500" : role.key === "employer" ? "bg-blue-500" : "bg-emerald-500"}`}
                    style={{ width: `${(allowedCount / role.permissions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            جدول الصلاحيات التفصيلي
          </h3>
          <p className="text-xs text-slate-500 mt-1">مقارنة الصلاحيات بين الأدوار الثلاثة</p>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[1fr_100px_100px_100px] gap-0 px-6 py-3 border-b border-slate-100 bg-slate-50/30 text-xs font-bold text-slate-500">
          <div>الصلاحية</div>
          <div className="text-center">مدير</div>
          <div className="text-center">صاحب عمل</div>
          <div className="text-center">باحث</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-50">
          {roles[0]?.permissions.map((perm, idx) => {
            const PermIcon = perm.icon;
            return (
              <div key={perm.key} className="grid grid-cols-[1fr_100px_100px_100px] gap-0 px-6 py-3 items-center hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <PermIcon className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700 font-medium">{perm.label}</span>
                </div>
                {roles.map((role) => {
                  const isAllowed = role.permissions[idx]?.allowed;
                  return (
                    <div key={role.key} className="flex justify-center">
                      {isAllowed ? (
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                          <X className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex gap-4">
        <ShieldCheck className="h-8 w-8 text-slate-400 shrink-0" />
        <div>
          <h4 className="font-bold text-slate-900 mb-1">ملاحظة أمنية</h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            الأدوار والصلاحيات مُحددة ومُطبّقة على مستوى قاعدة البيانات (Row Level Security) لضمان أعلى مستوى من الحماية.
            لا يمكن تعديل صلاحيات الأدوار من الواجهة لأسباب أمنية. لتغيير الصلاحيات يرجى التواصل مع فريق التطوير.
          </p>
        </div>
      </div>
    </div>
  );
}
