"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, MessageCircle, Send, Trash2, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
}

export default function ArticleInteractions({ articleId }: { articleId: string }) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [likes, setLikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);

  useEffect(() => {
    fetchInteractions();
    checkUserVerification();
  }, [articleId, user?.id, profile?.role]);

  async function checkUserVerification() {
    if (!user || !profile) {
      setCheckingVerification(false);
      return;
    }

    try {
      const table = profile.role === 'employer' ? 'employers' : 'seekers';
      const { data, error } = await supabase
        .from(table)
        .select('verification_status')
        .eq('profile_id', user.id)
        .single();

      if (profile.role === 'admin' || data?.verification_status === 'verified') {
        setIsVerified(true);
      }
    } catch (err) {
      console.error("Error checking verification:", err);
    } finally {
      setCheckingVerification(false);
    }
  }

  async function fetchInteractions() {
    setLoading(true);
    try {
      // Fetch likes count
      const { count: likesCount } = await supabase
        .from("article_likes")
        .select("*", { count: "exact", head: true })
        .eq("article_id", articleId);
      
      setLikes(likesCount || 0);

      // Check if current user liked
      if (user) {
        const { data: userLike } = await supabase
          .from("article_likes")
          .select("*")
          .eq("article_id", articleId)
          .eq("user_id", user.id)
          .maybeSingle();
        
        setIsLiked(!!userLike);
      }

      // Fetch comments with user details
      const { data: commentsData } = await supabase
        .from("article_comments")
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .eq("article_id", articleId)
        .order("created_at", { ascending: false });

      setComments(commentsData as any || []);
    } catch (err) {
      console.error("Error fetching interactions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleLike() {
    if (!user) {
      showToast("يرجى تسجيل الدخول أولاً", "warning");
      return;
    }
    if (!isVerified) {
      showToast("هذه الميزة متاحة فقط للمستخدمين الموثقين", "warning");
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from("article_likes")
          .delete()
          .eq("article_id", articleId)
          .eq("user_id", user.id);
        setLikes(prev => prev - 1);
        setIsLiked(false);
      } else {
        await supabase
          .from("article_likes")
          .insert({ article_id: articleId, user_id: user.id });
        setLikes(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!isVerified) return;
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("article_comments")
        .insert({
          article_id: articleId,
          user_id: user.id,
          content: newComment.trim()
        })
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .single();

      if (data) {
        setComments(prev => [data as any, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(id: string) {
    try {
      const { error } = await supabase
        .from("article_comments")
        .delete()
        .eq("id", id);
      
      // The RLS policy will handle the check (owner or admin)
      // But we should double check if we need to pass user_id in eq if not admin
      if (profile?.role !== 'admin') {
        // If not admin, the RLS still protects it, but adding this for clarity
      }

      if (!error) {
        setComments(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  }

  return (
    <div className="mt-12 pt-8 border-t border-slate-100" dir="rtl">
      {/* Interactions Bar */}
      <div className="flex items-center gap-6 mb-8">
        <button
          onClick={toggleLike}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
            isLiked ? "bg-brand-50 text-brand-600 font-bold" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <ThumbsUp className={cn("h-5 w-5", isLiked && "fill-brand-600")} />
          <span>{likes} إعجاب</span>
        </button>
        <div className="flex items-center gap-2 text-slate-500 px-4 py-2">
          <MessageCircle className="h-5 w-5" />
          <span>{comments.length} تعليق</span>
        </div>
      </div>

      {/* Comment Form */}
      <div className="mb-10">
        {!user ? (
          <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200">
            <p className="text-slate-600 mb-4 text-sm font-medium">سجل الدخول للمشاركة في النقاش</p>
            <a href="/auth/login" className="inline-block bg-brand-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors">
              تسجيل الدخول
            </a>
          </div>
        ) : checkingVerification ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : !isVerified ? (
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 flex flex-col items-center text-center">
            <Lock className="h-8 w-8 text-amber-500 mb-3" />
            <h4 className="text-amber-800 font-bold mb-1">الميزة مخصصة للحسابات الموثقة</h4>
            <p className="text-amber-700 text-sm">يجب توثيق حسابك لتتمكن من تسجيل الإعجاب والتعليق على المقالات.</p>
          </div>
        ) : (
          <form onSubmit={postComment} className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="" width={40} height={40} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold">
                  {(profile?.full_name || "U")[0]}
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="أضف تعليقك هنا..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none min-h-[100px]"
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="absolute left-3 bottom-3 bg-brand-600 text-white p-2 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 text-sm font-medium">كن أول من يعلق على هذا المقال</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                {comment.user.avatar_url ? (
                  <Image src={comment.user.avatar_url} alt="" width={40} height={40} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold bg-slate-100">
                    {comment.user.full_name[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 relative group">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-black text-slate-900">{comment.user.full_name}</h5>
                  <span className="text-[10px] text-slate-400">{new Date(comment.created_at).toLocaleDateString("ar-EG")}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                
                {(user?.id === comment.user_id || profile?.role === 'admin') && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className={cn(
                      "absolute top-3 left-3 p-1.5 transition-all rounded-lg",
                      profile?.role === 'admin' && user?.id !== comment.user_id 
                        ? "text-red-400 hover:text-red-600 bg-red-50/50 opacity-100" 
                        : "text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50"
                    )}
                    title={profile?.role === 'admin' ? "حذف كمدير" : "حذف"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
