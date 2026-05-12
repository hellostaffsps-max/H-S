"use client";

import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Clock,
  User,
  Briefcase,
  FileText,
  Users,
  Layers,
  CreditCard,
  ShieldCheck,
  Megaphone,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Eye,
} from 'lucide-react';
import Pagination from '@/components/Pagination';

interface AuditLog {
  id: string;
  admin_id: string | null;
  admin_name: string | null;
  admin_username: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  target_name: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const actionLabels: Record<string, string> = {
  'job.approve': 'اعتماد وظيفة',
  'job.reject': 'رفض وظيفة',
  'job.renew': 'تجديد وظيفة',
  'job.delete': 'حذف وظيفة',
  'job.update': 'تعديل وظيفة',
  'article.create': 'إنشاء مقال',
  'article.update': 'تعديل مقال',
  'article.delete': 'حذف مقال',
  'article.publish': 'نشر مقال',
  'user.delete': 'حذف مستخدم',
  'user.update_role': 'تغيير دور مستخدم',
  'user.verify': 'توثيق مستخدم',
  'user.reject': 'رفض توثيق مستخدم',
  'moderator.create': 'إنشاء مشرف',
  'plan.create': 'إنشاء باقة',
  'plan.update': 'تعديل باقة',
  'plan.delete': 'حذف باقة',
  'subscription.update': 'تعديل اشتراك',
  'role.create': 'إنشاء دور',
  'role.update': 'تعديل دور',
  'role.delete': 'حذف دور',
  'broadcast.send': 'إرسال تعميم',
  'settings.update': 'تعديل إعدادات',
};

const targetTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  job: Briefcase,
  article: FileText,
  user: Users,
  plan: Layers,
  subscription: CreditCard,
  role: ShieldCheck,
  broadcast: Megaphone,
  settings: Settings,
};

function getActionColor(action: string): string {
  if (action.includes('delete')) return 'text-red-600 bg-red-50 border-red-100';
  if (action.includes('approve') || action.includes('verify') || action.includes('publish')) return 'text-green-600 bg-green-50 border-green-100';
  if (action.includes('reject')) return 'text-amber-600 bg-amber-50 border-amber-100';
  if (action.includes('create')) return 'text-brand-600 bg-brand-50 border-brand-100';
  return 'text-slate-600 bg-slate-50 border-slate-100';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, targetTypeFilter]);

  async function fetchLogs() {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (actionFilter) params.set('action', actionFilter);
      if (targetTypeFilter) params.set('target_type', targetTypeFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        if (res.status === 403) {
          setError('غير مصرح: هذه الصفحة متاحة للسوبر أدمن فقط');
        } else {
          setError(json.error || 'فشل تحميل السجلات');
        }
        setLogs([]);
        return;
      }

      setLogs(json.data || []);
      if (json.pagination) {
        setTotalPages(json.pagination.totalPages);
        setHasNext(json.pagination.hasNext);
        setHasPrev(json.pagination.hasPrev);
        setTotal(json.pagination.total);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">سجل النشاطات</h2>
          <p className="text-slate-500">مراقبة جميع التغييرات التي يقوم بها المشرفون في المنصة</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> تحديث
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
          >
            <option value="">كل العمليات</option>
            {Object.entries(actionLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1">
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={targetTypeFilter}
            onChange={(e) => { setTargetTypeFilter(e.target.value); setPage(1); }}
            className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
          >
            <option value="">كل الأنواع</option>
            <option value="job">وظائف</option>
            <option value="article">مقالات</option>
            <option value="user">مستخدمين</option>
            <option value="plan">باقات</option>
            <option value="subscription">اشتراكات</option>
            <option value="role">أدوار</option>
            <option value="broadcast">تعميمات</option>
            <option value="settings">إعدادات</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Clock className="h-10 w-10 mx-auto mb-3 text-slate-200" />
            <p>لا توجد سجلات نشاطات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500">المشرف</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500">العملية</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500">الهدف</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500">التفاصيل</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const Icon = targetTypeIcons[log.target_type] || AlertTriangle;
                  const actionClass = getActionColor(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                            {log.admin_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{log.admin_name || 'مشرف'}</p>
                            {log.admin_username && (
                              <p className="text-[10px] text-slate-400">@{log.admin_username}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border ${actionClass}`}>
                          {actionLabels[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-700">{log.target_name || log.target_id || '—'}</p>
                            <p className="text-[10px] text-slate-400">{log.target_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          عرض
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">تفاصيل النشاط</h3>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">المعرف</span>
                <span className="font-mono text-slate-700 text-xs">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">المشرف</span>
                <span className="text-slate-700 font-bold">{selectedLog.admin_name || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">اسم المستخدم</span>
                <span className="text-slate-700">{selectedLog.admin_username || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">معرف المشرف</span>
                <span className="font-mono text-slate-700 text-xs">{selectedLog.admin_id || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">العملية</span>
                <span className="font-bold text-slate-700">{actionLabels[selectedLog.action] || selectedLog.action}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">الهدف</span>
                <span className="text-slate-700">{selectedLog.target_name || selectedLog.target_id || '—'} ({selectedLog.target_type})</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">التاريخ</span>
                <span className="text-slate-700">{formatDate(selectedLog.created_at)}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">التفاصيل:</span>
                <pre className="bg-slate-50 p-3 rounded-xl text-xs font-mono text-slate-700 overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
