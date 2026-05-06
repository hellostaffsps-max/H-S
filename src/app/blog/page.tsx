import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase-server";

export default async function BlogPage() {
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, cover_image, author_id, created_at, status")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col" dir="rtl">
      {/* Hero */}
      <section className="bg-brand-600 text-white py-12 sm:py-16 lg:py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-black mb-3 sm:mb-4">المدونة</h1>
          <p className="text-brand-50 text-base sm:text-lg">
            أحدث المقالات، النصائح، والأخبار من عالم الضيافة والتوظيف
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="max-w-6xl mx-auto w-full px-4 py-10 sm:py-16">
        {articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4 sm:p-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-brand-200 hover:shadow-lg transition-all"
              >
                <div className="h-44 sm:h-48 bg-slate-100 relative overflow-hidden">
                  {article.cover_image ? (
                    <img
                      src={article.cover_image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Clock className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-brand-600 transition-colors">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(article.created_at).toLocaleDateString("ar-EG")}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      فريق Hello Staff
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-20 text-slate-400">
            <Clock className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">لا توجد مقالات حالياً</h2>
            <p className="text-slate-500">تابعنا قريباً لمقالات جديدة عن الضيافة والتوظيف</p>
          </div>
        )}
      </section>
    </div>
  );
}
