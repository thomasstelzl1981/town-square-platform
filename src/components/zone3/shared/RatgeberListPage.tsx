/**
 * RatgeberListPage — Shared article listing component for all Zone 3 brands.
 * Reads published articles from brand_articles and renders them as a card grid.
 */
import { Link } from "react-router-dom";
import { useBrandArticles } from "@/hooks/useBrandArticles";
import { SEOHead } from "./SEOHead";
import { CalendarDays, ArrowRight, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface RatgeberListPageProps {
  brand: string;
  brandLabel: string;
  basePath: string; // e.g. "/ratgeber" on custom domain, "/website/kaufy/ratgeber" on preview
}

export function RatgeberListPage({ brand, brandLabel, basePath }: RatgeberListPageProps) {
  const { data: articles, isLoading, error } = useBrandArticles(brand);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("de-DE", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  // Extract first paragraph as preview
  const getPreview = (content: string, maxLen = 200) => {
    const firstPara = content.split("\n").find(l => l.trim() && !l.startsWith("#") && !l.startsWith("*"));
    if (!firstPara) return content.slice(0, maxLen);
    return firstPara.length > maxLen ? firstPara.slice(0, maxLen) + "…" : firstPara;
  };

  return (
    <>
      <SEOHead
        brand={brand}
        page={{
          title: `Ratgeber — ${brandLabel}`,
          description: `Aktuelle Fachartikel und Ratgeber von ${brandLabel}. Expertenwissen verständlich erklärt.`,
          path: "/ratgeber",
        }}
      />

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              Wissen & Insights
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Ratgeber
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Expertenwissen von {brandLabel} — verständlich aufbereitet und praxisnah.
            </p>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="pb-24 px-6">
          <div className="max-w-6xl mx-auto">
            {isLoading && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-xl border bg-card p-6 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                    <div className="h-6 bg-muted rounded w-full mb-3" />
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="text-center py-12 text-muted-foreground">
                Artikel konnten nicht geladen werden.
              </div>
            )}

            {articles && articles.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Noch keine Artikel veröffentlicht. Bald mehr hier!
              </div>
            )}

            {articles && articles.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    to={`${basePath}/${article.slug}`}
                    className="group rounded-xl border bg-card hover:border-primary/50 transition-all duration-300 overflow-hidden hover:shadow-lg"
                  >
                    <div className="p-6">
                      {article.category && (
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">
                          {article.category}
                        </span>
                      )}
                      <h2 className="text-xl font-semibold mt-2 mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {article.description || getPreview(article.content)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatDate(article.published_at)}
                        </div>
                        <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                          Lesen <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
