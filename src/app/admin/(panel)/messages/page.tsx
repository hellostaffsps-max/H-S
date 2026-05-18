"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  MessageSquare, 
  Search, 
  Send, 
  Users, 
  User,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { createNotification } from '@/app/actions/notifications';

type Message = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  receiver_id: string | null;
  receiver?: {
    full_name: string;
    email: string;
  };
};

export default function AdminMessages() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form state
  const [isBroadcast, setIsBroadcast] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  async function fetchMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, title, content, created_at, receiver_id, sender_id,
          receiver:profiles!messages_receiver_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMessages(data as any);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .neq('role', 'admin');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    if (!isBroadcast && !selectedUser) return;
    if (!profile) return;

    setSending(true);
    setSuccessMsg('');

    try {
      // 1. Insert into messages table to keep record for admin history
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          sender_id: profile.id,
          receiver_id: isBroadcast ? null : selectedUser,
          title,
          content,
        });

      if (msgError) throw msgError;

      // 2. Actually notify the users so it appears in their bell icon
      if (isBroadcast) {
        const { error: rpcError } = await supabase.rpc('broadcast_notification', {
          p_title: title,
          p_message: content,
        });
        if (rpcError) throw rpcError;
      } else {
        const notifResult = await createNotification(
          selectedUser,
          title,
          content,
          'system',
          '/messages'
        );
        if (!notifResult.success) throw new Error(notifResult.error || 'Failed to send notification');
      }

      setSuccessMsg('تم إرسال الرسالة بنجاح!');
      setTitle('');
      setContent('');
      setSelectedUser('');
      fetchMessages(); // Refresh list

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('حدث خطأ أثناء الإرسال');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">الرسائل والإشعارات</h2>
            <p className="text-slate-500 text-sm">إرسال تعميم لجميع المستخدمين أو رسالة خاصة</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Send Message Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-500" />
              إرسال رسالة جديدة
            </h3>

            {successMsg && (
              <div className="mb-6 bg-green-50 text-green-700 p-3 rounded-xl border border-green-100 flex items-center gap-2 text-sm font-bold">
                <CheckCircle2 className="h-4 w-4" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">نوع الرسالة</label>
                <div className="flex bg-slate-50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsBroadcast(true)}
                    className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${
                      isBroadcast ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Users className="h-4 w-4" /> تعميم عام
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBroadcast(false)}
                    className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${
                      !isBroadcast ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <User className="h-4 w-4" /> رسالة خاصة
                  </button>
                </div>
              </div>

              {!isBroadcast && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">المستلم</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="">-- اختر المستخدم --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الرسالة</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تحديث هام في سياسة الخصوصية"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">محتوى الرسالة</label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending || (!isBroadcast && !selectedUser)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-70"
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                إرسال الآن
              </button>
            </form>
          </div>
        </div>

        {/* Message History */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[800px]">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
            <h3 className="font-bold text-slate-900">سجل الرسائل المرسلة</h3>
            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-lg">
              {messages.length} رسالة
            </span>
          </div>

          <div className="p-6 overflow-y-auto flex-grow">
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center p-12">
                <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                  <MessageSquare className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">لم تقم بإرسال أي رسائل حتى الآن</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-900">{msg.title || 'رسالة نظام'}</h4>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap mr-4">
                        {new Date(msg.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap">{msg.content}</p>
                    
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${msg.receiver_id ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {msg.receiver_id ? 'رسالة خاصة' : 'تعميم عام'}
                      </span>
                      {msg.receiver && (
                        <span className="text-xs text-slate-500 font-medium truncate">
                          إلى: {msg.receiver.full_name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
