"use client";

import { useEffect, useState } from 'react';

import { 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  User,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (json.success && json.data) {
        setUsers(json.data);
      }
    } catch (error: any) {
      alert('خطأ في تحميل المستخدمين: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'فشل الحذف');
      setUsers(users.filter(u => u.id !== id));
      alert(json.message || 'تم حذف المستخدم بنجاح');
    } catch (error: any) {
      alert('خطأ في الحذف: ' + error.message);
    }
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'فشل تغيير الدور');
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      setActiveMenu(null);
      alert('تم تغيير الدور بنجاح');
    } catch (error: any) {
      alert('خطأ في تغيير الدور: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">إدارة المستخدمين</h2>
          <p className="text-slate-500">تحكم في حسابات الباحثين عن عمل وأصحاب العمل</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو المعرف..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all text-sm">
            <Filter className="h-4 w-4" />
            تصفية
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">المستخدم</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الدور</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الموقع</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">تاريخ التسجيل</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">جاري التحميل...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">لا يوجد مستخدمين حالياً</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="h-full w-full object-cover rounded-xl" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{user.full_name || 'بدون اسم'}</p>
                          <p className="text-xs text-slate-500">{user.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        user.role === 'admin' 
                          ? 'bg-purple-50 text-purple-700' 
                          : user.role === 'employer' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'bg-green-50 text-green-700'
                      }`}>
                        {user.role === 'admin' ? <Shield className="h-3 w-3" /> : null}
                        {user.role === 'admin' ? 'مدير' : user.role === 'employer' ? 'صاحب عمل' : 'باحث عن عمل'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {user.location || 'غير محدد'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {new Date(user.created_at).toLocaleDateString('ar-EG')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 relative">
                        {user.role !== 'admin' && (
                          <>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all" 
                              title="حذف المستخدم"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                            
                            <div className="relative">
                              <button 
                                onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>

                              {activeMenu === user.id && (
                                <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden py-1">
                                  <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">تغيير الدور إلى:</p>
                                  <button 
                                    onClick={() => handleChangeRole(user.id, 'seeker')}
                                    className="w-full text-right px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 transition-colors"
                                  >
                                    باحث عن عمل
                                  </button>
                                  <button 
                                    onClick={() => handleChangeRole(user.id, 'employer')}
                                    className="w-full text-right px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 transition-colors"
                                  >
                                    صاحب عمل
                                  </button>
                                  <button 
                                    onClick={() => handleChangeRole(user.id, 'admin')}
                                    className="w-full text-right px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 transition-colors"
                                  >
                                    مدير (أدمن)
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
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
