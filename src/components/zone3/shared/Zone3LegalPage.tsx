/**
 * Zone3LegalPage — Shared legal page for all Zone 3 websites
 * Loads compliance documents from DB, replaces placeholders, renders Markdown.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { renderComplianceMarkdown } from '@/lib/complianceHelpers';
import ReactMarkdown from 'react-markdown';
import { RefreshCw } from 'lucide-react';

/** Brand → company profile slug mapping */
const BRAND_PROFILE_MAP: Record<string, string> = {
  kaufy: 'futureroom',
  futureroom: 'futureroom',
  acquiary: 'futureroom',
  sot: 'sot',
  tierservice: 'lennox',
};

interface Zone3LegalPageProps {
  brand: 'kaufy' | 'futureroom' | 'acquiary' | 'sot' | 'tierservice';
  docType: 'imprint' | 'privacy' | 'terms';
}

const DOC_TYPE_KEY_MAP: Record<string, string> = {
  imprint: 'imprint',
  privacy: 'privacy',
  terms: 'terms',
};

export function Zone3LegalPage({ brand, docType }: Zone3LegalPageProps) {
  const docKey = `website_${DOC_TYPE_KEY_MAP[docType] ?? docType}_${brand}`;
  const profileSlug = BRAND_PROFILE_MAP[brand] ?? 'sot';

  // Load document + active version
  const { data, isLoading, error } = useQuery({
    queryKey: ['zone3-legal', docKey],
    queryFn: async () => {
      const { data: doc } = await supabase
        .from('compliance_documents')
        .select('id, title, current_version')
        .eq('doc_key', docKey)
        .maybeSingle();

      if (!doc) return null;

      const { data: versions } = await supabase
        .from('compliance_document_versions')
        .select('content_md')
        .eq('document_id', doc.id)
        .eq('status', 'active')
        .order('version', { ascending: false })
        .limit(1);

      return {
        title: doc.title as string,
        contentMd: (versions?.[0] as any)?.content_md as string ?? '',
      };
    },
  });

  // Load company profile for placeholder replacement
  const { data: profile } = useQuery({
    queryKey: ['compliance-company-profile', profileSlug],
    queryFn: async () => {
      const { data } = await supabase
        .from('compliance_company_profile' as any)
        .select('*')
        .eq('slug', profileSlug)
        .maybeSingle();
      return data as any;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.contentMd) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-muted-foreground text-sm">Dokument nicht verfügbar.</p>
      </div>
    );
  }

  const rendered = renderComplianceMarkdown(data.contentMd, profile);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(220,20%,10%)', marginBottom: 32 }}>{data.title}</h1>
      <div className="prose prose-sm max-w-none" style={{ color: 'hsl(220,20%,25%)' }}>
        <ReactMarkdown>{rendered}</ReactMarkdown>
      </div>
    </div>
  );
}