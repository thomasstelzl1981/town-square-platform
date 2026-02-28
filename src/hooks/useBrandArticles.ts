import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BrandArticle {
  id: string;
  brand: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string | null;
  author: string | null;
  og_image: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all published articles for a brand.
 */
export function useBrandArticles(brand: string) {
  return useQuery({
    queryKey: ["brand-articles", brand],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_articles")
        .select("*")
        .eq("brand", brand)
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as BrandArticle[];
    },
    enabled: !!brand,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

/**
 * Fetch a single published article by brand + slug.
 */
export function useBrandArticle(brand: string, slug: string) {
  return useQuery({
    queryKey: ["brand-article", brand, slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_articles")
        .select("*")
        .eq("brand", brand)
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data as BrandArticle;
    },
    enabled: !!brand && !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
