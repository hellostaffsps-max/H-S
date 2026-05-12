"use client";

import { useEffect, useState } from 'react';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  XCircle,
  Settings,
  UserCheck,
  Briefcase,
  FileText,
  CreditCard,
  Bell,
  Search,
  MessageSquare,
  Image as ImageIcon,
  UserPlus,
  User,
  Lock,
  ChevronDown
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  'المستخدمين': UserCheck,
  'الوظائف': Briefcase,
  'المحتوى': FileText,
  'المالية': CreditCard,
  'التواصل': Bell,
  'النظام': Settings,
  'الإعلانات': ImageIcon,
  'الدعم': MessageSquare
};

export default function RolesManagement() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  
  // Add Moderator Modal State
  const [isAddModeratorOpen, setIsAddModeratorOpen] = useState(false);
  const [newModUsername, setNewModUsername] = useState('');
  const [newModPass, setNewModPass] = useState('');
  const [newModName, setNewModName] = useState('');
  const [newModRole, setNewModRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch('/api/admin/permissions')
      ]);
      
      const rolesJson = await rolesRes.json();
      const permsJson = await permsRes.json();
      
      if (rolesJson.success) setRoles(rolesJson.data);
      if (permsJson.success) setPermissions(permsJson.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (role: any = null) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleDesc(role.description || '');
      setSelectedPerms(role.permissions || []);
    } else {
      setEditingRole(null);
      setRoleName('');
      setRoleDesc('');
      setSelectedPerms([]);
    }
    setIsModalOpen(true);
  };

  const handleTogglePerm = (permId: string) => {
    setSelectedPerms(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: roleName,
      description: roleDesc,
      permissions: selectedPerms
    };

    try {
      const url = editingRole ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles';
      const method = editingRole ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert('خطأ: ' + json.error);
      }
    } catch (error) {
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدور؟ سيتم إزالة الدور من جميع المشرفين المرتبطين به.')) return;
    
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchData();
    } catch (error) {
      alert('خطأ في الحذف');
    }
  };

  const handleCreateModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/users/create-moderator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newModUsername,
          password: newModPass,
          fullName: newModName,
          roleId: newModRole
        })
      });

      const json = await res.json();
      if (json.success) {
        alert('تم إنشاء المشرف بنجاح');
        setIsAddModeratorOpen(false);
        setNewModUsername('');
        setNewModPass('');
        setNewModName('');
        setNewModRole('');
      } else {
        alert('خطأ: ' + json.error);
      }
    } catch (error) {
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc: any, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">إدارة الأدوار والصلاحيات</h2>
          <p className="text-slate-500">قم بإنشاء أدوار مخصصة وتحديد ما يمكن لكل مشرف القيام به</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAddModeratorOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
          >
            <UserPlus className="h-5 w-5" />
            إضافة مشرف جديد
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
          >
            <Plus className="h-5 w-5" />
            إضافة دور جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-full text-center py-12 text-slate-400">جاري التحميل...</p>
        ) : roles.length === 0 ? (
          <p className="col-span-full text-center py-12 text-slate-400">لا يوجد أدوار معرفة حالياً</p>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenModal(role)}
                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(role.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-black text-slate-900 mb-1">{role.name}</h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{role.description || 'لا يوجد وصف لهذا الدور'}</p>
              
              <div className="flex flex-wrap gap-1.5">
                {role.permissions?.slice(0, 3).map((pId: string) => {
                  const perm = permissions.find(p => p.id === pId);
                  return (
                    <span key={pId} className="px-2 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-100">
                      {perm?.name_ar || pId}
                    </span>
                  );
                })}
                {role.permissions?.length > 3 && (
                  <span className="px-2 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-lg">
                    +{role.permissions.length - 3} أخرى
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Role Editor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">
                {editingRole ? 'تعديل الدور' : 'إنشاء دور جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم الدور</label>
                  <input 
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="مثلاً: مدير محتوى"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الوصف</label>
                  <textarea 
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    placeholder="وصف مختصر لمهام هذا الدور..."
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none h-24"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">تحديد الصلاحيات</label>
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, perms]: [string, any]) => {
                    const Icon = CATEGORY_ICONS[category] || Shield;
                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Icon className="h-4 w-4" />
                          <span className="text-xs font-black uppercase tracking-wider">{category}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {perms.map((perm: any) => (
                            <button
                              key={perm.id}
                              type="button"
                              onClick={() => handleTogglePerm(perm.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${
                                selectedPerms.includes(perm.id)
                                  ? 'bg-brand-50 border-brand-200 text-brand-700 ring-2 ring-brand-500/10'
                                  : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                              }`}
                            >
                              <div className={`h-5 w-5 rounded flex items-center justify-center border ${
                                selectedPerms.includes(perm.id) ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-200'
                              }`}>
                                {selectedPerms.includes(perm.id) && <CheckCircle className="h-3 w-3" />}
                              </div>
                              <span className="text-sm font-bold">{perm.name_ar}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button 
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Moderator Modal */}
      {isAddModeratorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-emerald-600" />
                إضافة مشرف جديد
              </h3>
              <button onClick={() => setIsAddModeratorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateModerator} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={newModName}
                    onChange={(e) => setNewModName(e.target.value)}
                    placeholder="مثلاً: أحمد محمد"
                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">اسم المستخدم (معرف الدخول)</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={newModUsername}
                    onChange={(e) => setNewModUsername(e.target.value)}
                    placeholder="مثلاً: admin_ahmad"
                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">3-30 حرف، يمكن استخدام الأحرف والأرقام والشرطة السفلية</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="password"
                    required
                    minLength={6}
                    value={newModPass}
                    onChange={(e) => setNewModPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الدور (الصلاحيات)</label>
                <div className="relative">
                  <Shield className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <select 
                    required
                    value={newModRole}
                    onChange={(e) => setNewModRole(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">اختر دوراً...</option>
                    <option value="super">سوبر أدمن (صلاحيات كاملة)</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAddModeratorOpen(false)}
                  className="px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
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
