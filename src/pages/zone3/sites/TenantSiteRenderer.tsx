/**
 * Zone 3 — TenantSiteRenderer
 * Public delivery of published tenant websites
 */
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SectionRenderer } from '@/shared/website-renderer';
import type { WebsiteSnapshot } from '@/shared/website-renderer/types';

export default function TenantSiteRenderer() {
  const { slug } = useParams<{ slug: string }>();

  const { data: website, isLoading: loadingWebsite } = useQuery({
    queryKey: ['public_website', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_websites' as any)
        .select('id, tenant_id, name, slug, status, branding_json, seo_json')
        .eq('slug', slug!)
        .eq('status', 'published')
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!slug,
  });

  const { data: version, isLoading: loadingVersion } = useQuery({
    queryKey: ['public_website_version', website?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_versions' as any)
        .select('snapshot_json')
        .eq('website_id', website!.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!website?.id,
  });

  if (loadingWebsite || loadingVersion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Website nicht verfügbar</h1>
          <p className="text-muted-foreground">Diese Website existiert nicht oder wurde deaktiviert.</p>
        </div>
      </div>
    );
  }

  const snapshot = version?.snapshot_json as WebsiteSnapshot | undefined;
  const sections = snapshot?.pages?.[0]?.sections || [];
  const leadCaptureUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-website-lead-capture`;

  return (
    <div className="min-h-screen">
      <SectionRenderer
        sections={sections}
        branding={snapshot?.branding || website.branding_json}
        leadCaptureUrl={leadCaptureUrl}
        websiteId={website.id}
        tenantId={website.tenant_id}
      />
    </div>
  );
}
