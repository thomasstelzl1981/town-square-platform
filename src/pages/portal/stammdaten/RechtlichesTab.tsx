/**
 * RechtlichesTab — Zone 2 Legal Consent Page
 * 
 * Displays active portal AGB + Privacy from compliance_documents (SSOT),
 * allows user to accept, stores consent in user_consents.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Scale, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { renderComplianceMarkdown } from '@/lib/complianceHelpers';

interface DocWithVersion {
  docId: string;
  docKey: string;
  title: string;
  version: number;
  contentMd: string;
  status: string;
}

export function RechtlichesTab() {
  const { user, activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [agbChecked, setAgbChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  // Load active compliance documents (portal_agb + portal_privacy)
  const { data: docs, isLoading: docsLoading } = useQuery({
    queryKey: ['compliance-portal-docs'],
    queryFn: async () => {
      const { data: documents, error: docErr } = await supabase
        .from('compliance_documents')
        .select('id, doc_key, title, current_version, status')
        .in('doc_key', ['portal_agb', 'portal_privacy', 'portal_security_notice', 'website_imprint_sot']);
      if (docErr) throw docErr;
      if (!documents?.length) return [];

      const results: DocWithVersion[] = [];
      for (const doc of documents) {
        const { data: versions } = await supabase
          .from('compliance_document_versions')
          .select('version, content_md, status')
          .eq('document_id', doc.id)
          .eq('status', 'active')
          .order('version', { ascending: false })
          .limit(1);

      let activeVersion = versions?.[0];
        let versionStatus = activeVersion ? 'active' : 'missing';

        // Draft fallback: if no active version, use latest draft
        if (!activeVersion) {
          const { data: draftVersions } = await supabase
            .from('compliance_document_versions')
            .select('version, content_md, status')
            .eq('document_id', doc.id)
            .eq('status', 'draft')
            .order('version', { ascending: false })
            .limit(1);
          if (draftVersions?.[0]) {
            activeVersion = draftVersions[0];
            versionStatus = 'draft';
          }
        }

        results.push({
          docId: doc.id,
          docKey: doc.doc_key,
          title: doc.title,
          version: activeVersion?.version ?? doc.current_version,
          contentMd: activeVersion?.content_md ?? '',
          status: versionStatus,
        });
      }
      return results;
    },
  });

  // Load company profile for placeholder replacement
  const { data: companyProfile } = useQuery({
    queryKey: ['compliance-company-profile-portal'],
    queryFn: async () => {
      const { data } = await supabase
        .from('compliance_company_profile' as any)
        .select('*')
        .eq('slug', 'sot')
        .maybeSingle();
      return data as any;
    },
  });

  // Check existing consents for current user
  const { data: existingConsents, isLoading: consentsLoading } = useQuery({
    queryKey: ['legal-consent-status', user?.id, activeTenantId],
    queryFn: async () => {
      if (!user?.id || !activeTenantId) return [];
      const { data, error } = await supabase
        .from('user_consents')
        .select('compliance_doc_id, compliance_version, consented_at, status')
        .eq('user_id', user.id)
        .eq('tenant_id', activeTenantId)
        .not('compliance_doc_id', 'is', null)
        .eq('status', 'accepted');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!activeTenantId,
  });

  // Save consent mutation
  const submitConsent = useMutation({
    mutationFn: async () => {
      if (!user?.id || !activeTenantId || !docs) throw new Error('Missing context');

      const agbDoc = docs.find(d => d.docKey === 'portal_agb');
      const privacyDoc = docs.find(d => d.docKey === 'portal_privacy');
      if (!agbDoc || !privacyDoc) throw new Error('Dokumente nicht gefunden');

      const consents = [agbDoc, privacyDoc].map(doc => ({
        user_id: user.id,
        tenant_id: activeTenantId,
        compliance_doc_id: doc.docId,
        compliance_version: doc.version,
        status: 'accepted' as const,
        consented_at: new Date().toISOString(),
        metadata: {},
      }));

      const { error } = await supabase.from('user_consents').insert(consents as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-consent-status'] });
      setAgbChecked(false);
      setPrivacyChecked(false);
      toast.success('Nutzungsvereinbarungen akzeptiert');
    },
    onError: () => toast.error('Fehler beim Speichern der Zustimmung'),
  });

  // Derive consent status
  const agbDoc = docs?.find(d => d.docKey === 'portal_agb');
  const privacyDoc = docs?.find(d => d.docKey === 'portal_privacy');
  const securityDoc = docs?.find(d => d.docKey === 'portal_security_notice');
  const imprintDoc = docs?.find(d => d.docKey === 'website_imprint_sot');

  const hasAgbConsent = existingConsents?.some(
    c => c.compliance_doc_id === agbDoc?.docId && c.compliance_version === agbDoc?.version
  );
  const hasPrivacyConsent = existingConsents?.some(
    c => c.compliance_doc_id === privacyDoc?.docId && c.compliance_version === privacyDoc?.version
  );
  const isFullyConsented = hasAgbConsent && hasPrivacyConsent;

  // Check if there's an older consent but not for current version
  const hasAnyConsent = existingConsents && existingConsents.length > 0;
  const needsReConsent = hasAnyConsent && !isFullyConsented;

  const isLoading = docsLoading || consentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const consentDate = isFullyConsented
    ? existingConsents?.find(c => c.compliance_doc_id === agbDoc?.docId)?.consented_at
    : null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Status Banner */}
      {isFullyConsented ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Zugestimmt am {consentDate ? new Date(consentDate).toLocaleDateString('de-DE') : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              AGB v{agbDoc?.version} · Datenschutz v{privacyDoc?.version}
            </p>
          </div>
        </div>
      ) : needsReConsent ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
              Neue Version verfügbar – bitte erneut zustimmen
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <Scale className="h-5 w-5 text-yellow-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              Zustimmung erforderlich
            </p>
            <p className="text-xs text-muted-foreground">
              Bitte lesen und akzeptieren Sie die Nutzungsvereinbarungen, um alle Funktionen freizuschalten.
            </p>
          </div>
        </div>
      )}

      {/* AGB Card */}
      {agbDoc && (
        <DocCard doc={agbDoc} companyProfile={companyProfile} />
      )}

      {/* Privacy Card */}
      {privacyDoc && (
        <DocCard doc={privacyDoc} companyProfile={companyProfile} />
      )}

      {/* Security Notice (optional, display only) */}
      {securityDoc && securityDoc.status === 'active' && (
        <DocCard doc={securityDoc} companyProfile={companyProfile} />
      )}

      {/* Consent Form (only if not fully consented) */}
      {!isFullyConsented && agbDoc && privacyDoc && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agb-consent"
                checked={agbChecked}
                onCheckedChange={(v) => setAgbChecked(v === true)}
              />
              <label htmlFor="agb-consent" className="text-sm cursor-pointer leading-tight">
                Ich habe die <strong>AGB</strong> (v{agbDoc.version}) gelesen und akzeptiere sie.
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="privacy-consent"
                checked={privacyChecked}
                onCheckedChange={(v) => setPrivacyChecked(v === true)}
              />
              <label htmlFor="privacy-consent" className="text-sm cursor-pointer leading-tight">
                Ich habe die <strong>Datenschutzerklärung</strong> (v{privacyDoc.version}) gelesen und akzeptiere sie.
              </label>
            </div>
            <Button
              className="w-full"
              disabled={!agbChecked || !privacyChecked || submitConsent.isPending}
              onClick={() => submitConsent.mutate()}
            >
              {submitConsent.isPending ? 'Wird gespeichert...' : 'Zustimmen & Freischalten'}
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Impressum (read-only, § 5 DDG) */}
      {imprintDoc && (
        <DocCard doc={imprintDoc} companyProfile={companyProfile} />
      )}
    </div>
  );
}

function DocCard({
  doc,
  companyProfile,
}: {
  doc: DocWithVersion;
  companyProfile: any;
}) {
  const rendered = renderComplianceMarkdown(doc.contentMd, companyProfile);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{doc.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">v{doc.version}</Badge>
            <Badge
              variant={doc.status === 'active' ? 'default' : doc.status === 'draft' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {doc.status === 'active' ? 'Aktiv' : doc.status === 'draft' ? 'Entwurf' : doc.status === 'missing' ? 'Fehlt' : doc.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="p-4 rounded-md bg-muted/50 prose prose-sm dark:prose-invert max-w-none text-sm min-h-[200px]">
          {rendered ? (
            <ReactMarkdown>{rendered}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic">Kein Inhalt verfügbar.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RechtlichesTab;
