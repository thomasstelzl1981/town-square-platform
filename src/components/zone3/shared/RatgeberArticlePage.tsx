/**
 * RatgeberArticlePage — Shared single-article view for all Zone 3 brands.
 * Renders a full article from brand_articles with SEO, breadcrumbs, and markdown.
 */
import { useParams, Link } from "react-router-dom";
import { useBrandArticle } from "@/hooks/useBrandArticles";
import { SEOHead, type BreadcrumbItem } from "./SEOHead";
import { BRAND_SEO_CONFIG } from "./SEOHead";
import ReactMarkdown from "react-markdown";
import { CalendarDays, ArrowLeft, Clock } from "lucide-react";

interface RatgeberArticlePageProps {
  brand: string;
  brandLabel: string;
  listPath: string; // e.g. "/ratgeber"
}

export function RatgeberArticlePage({ brand, brandLabel, listPath }: RatgeberArticlePageProps) {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useBrandArticle(brand, slug || "");
  const brandConfig = BRAND_SEO_CONFIG[brand];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("de-DE", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  // Estimate reading time (~200 words/min for German)
  const readingTime = article ? Math.max(1, Math.ceil(article.content.split(/\s+/).length / 200)) : 0;

  const breadcrumbs: BreadcrumbItem[] = brandConfig ? [
    { name: brandLabel, url: brandConfig.domain },
    { name: "Ratgeber", url: `${brandConfig.domain}/ratgeber` },
    ...(article ? [{ name: article.title, url: `${brandConfig.domain}/ratgeber/${article.slug}` }] : []),
  ] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Artikel wird geladen…</div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Artikel nicht gefunden.</p>
        <Link to={listPath} className="text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        brand={brand}
        page={{
          title: article.title,
          description: article.description,
          path: `/ratgeber/${article.slug}`,
          ogType: "article",
        }}
        article={{
          headline: article.title,
          description: article.description,
          datePublished: article.published_at || article.created_at,
          dateModified: article.updated_at,
        }}
        breadcrumbs={breadcrumbs}
      />

      <article className="min-h-screen">
        {/* Article Header */}
        <section className="pt-16 md:pt-24 pb-8 px-6">
          <div className="max-w-3xl mx-auto">
            <Link
              to={listPath}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" /> Alle Ratgeber
            </Link>

            {article.category && (
              <span className="inline-block text-xs font-medium text-primary uppercase tracking-wider mb-4">
                {article.category}
              </span>
            )}

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-6">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b pb-6">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                {formatDate(article.published_at)}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {readingTime} Min. Lesezeit
              </div>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="pb-24 px-6">
          <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </section>
      </article>
    </>
  );
}
