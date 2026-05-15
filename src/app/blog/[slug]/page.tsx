import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import ShareButton from "@/components/blog/ShareButton";
import SafeHTML from "@/components/blog/SafeHTML";
import ArticleInteractions from "@/components/blog/ArticleInteractions";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", decodedSlug)
    .eq("status", "published")
    .single();

  if (!article) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" dir="rtl">
      {/* Breadcrumb */}
      <Link
        href="/blog"
        className="text-sm text-slate-500 hover:text-brand-600 flex items-center gap-1 transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> العودة للمدونة
      </Link>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-slate-400 mb-3 sm:mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(article.created_at).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            فريق Hello Staff
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-snug sm:leading-tight mb-3 sm:mb-4">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed">{article.excerpt}</p>
        )}
      </div>

      {/* Cover Image */}
      {article.cover_image && (
        <div className="rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-10 bg-slate-100 relative h-52 sm:h-64 lg:h-80">
          <Image
            src={article.cover_image}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
            priority
          />
        </div>
      )}

      {/* Content */}
      <article className="prose prose-slate prose-base sm:prose-lg max-w-none text-slate-700 leading-relaxed sm:leading-loose">
        <SafeHTML html={article.content} />
      </article>

      {/* Interactions Section */}
      <ArticleInteractions articleId={article.id} />

      {/* Share */}
      <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-slate-500 text-sm">هل استفدت من هذا المقال؟ شاركه مع زملائك</p>
        <ShareButton />
      </div>
    </div>
  );
}
