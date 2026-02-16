/**
 * VertraegeTab — Zentrale Vertragsübersicht (MOD-01)
 * 
 * Aggregiert alle Vereinbarungen aus verschiedenen Quellen:
 * - user_consents (AGB, Datenschutz, SCHUFA etc.)
 * - finance_mandates (Finanzierungsbeauftragungen)
 * - listings (Verkaufsmandate)
 * - commissions (Provisionsvereinbarungen)
 * - acq_mandates (Suchaufträge)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData/engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Shield, 
  FileCheck, 
  Landmark, 
  Tag, 
  Coins, 
  Handshake,
  HardDrive,
  ExternalLink,
  FileQuestion
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Agreement {
  id: string;
  type: 'consent' | 'finance_mandate' | 'sales_mandate' | 'commission' | 'acq_mandate';
  title: string;
  description: string;
  date: Date;
  status: string;
  icon: React.ElementType;
  link?: string;
}

// Icon mapping based on agreement type/code
const getAgreementIcon = (type: string, code?: string): React.ElementType => {
  if (type === 'consent') {
    if (code?.includes('PRIVACY') || code?.includes('DATENSCHUTZ')) return Shield;
    if (code?.includes('SCHUFA')) return FileCheck;
    if (code?.includes('STORAGE')) return HardDrive;
    if (code?.includes('PARTNER') || code?.includes('KOOPERATION')) return Handshake;
    return FileText;
  }
  if (type === 'finance_mandate') return Landmark;
  if (type === 'sales_mandate') return Tag;
  if (type === 'commission') return Coins;
  if (type === 'acq_mandate') return FileCheck;
  return FileQuestion;
};

// Status badge variant
const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'accepted':
    case 'active':
    case 'approved':
      return 'default';
    case 'pending':
    case 'draft':
      return 'secondary';
    case 'rejected':
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

// Status label translation
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    accepted: 'Akzeptiert',
    active: 'Aktiv',
    approved: 'Genehmigt',
    pending: 'Ausstehend',
    draft: 'Entwurf',
    rejected: 'Abgelehnt',
    cancelled: 'Storniert',
    submitted: 'Eingereicht',
    assigned: 'Zugewiesen',
    in_review: 'In Prüfung',
  };
  return labels[status] || status;
};

export function VertraegeTab() {
  const { user, activeTenantId } = useAuth();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-AKQUISE-MANDAT');
  // 1. User Consents (AGB, Datenschutz, SCHUFA etc.)
  const { data: consents, isLoading: consentsLoading } = useQuery({
    queryKey: ['user-consents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_consents')
        .select('*, agreement_templates(*)')
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .order('consented_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // 2. Finance Mandates
  const { data: financeMandates, isLoading: financeLoading } = useQuery({
    queryKey: ['finance-mandates', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('finance_mandates')
        .select('*, finance_requests(public_id)')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // 3. Listings with Sales Mandate
  const { data: salesMandates, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-mandates', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('listings')
        .select('*, properties(id, address, city)')
        .eq('tenant_id', activeTenantId)
        .not('sales_mandate_consent_id', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // 4. Commissions
  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ['commission-agreements', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .not('agreement_consent_id', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // 5. Acquisition Mandates
  const { data: acqMandates, isLoading: acqLoading } = useQuery({
    queryKey: ['acq-mandates', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('acq_mandates')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const isLoading = consentsLoading || financeLoading || salesLoading || commissionsLoading || acqLoading;

  // Format and combine all agreements
  const allAgreements: Agreement[] = [
    // Consents
    ...(consents || []).map((c): Agreement => ({
      id: c.id,
      type: 'consent',
      title: c.agreement_templates?.title || 'Vereinbarung',
      description: `Akzeptiert am ${format(new Date(c.consented_at), 'dd.MM.yyyy, HH:mm', { locale: de })}`,
      date: new Date(c.consented_at),
      status: c.status,
      icon: getAgreementIcon('consent', c.agreement_templates?.code),
    })),
    // Finance Mandates
    ...(financeMandates || []).map((fm): Agreement => ({
      id: fm.id,
      type: 'finance_mandate',
      title: `Finanzierungsmandat ${fm.finance_requests?.public_id || ''}`,
      description: `Erteilt am ${format(new Date(fm.created_at), 'dd.MM.yyyy', { locale: de })}`,
      date: new Date(fm.created_at),
      status: fm.status,
      icon: Landmark,
      link: `/portal/finanzierung/status`,
    })),
    // Sales Mandates
    ...(salesMandates || []).map((sm): Agreement => {
      const address = sm.properties?.address 
        ? `${sm.properties.address}${sm.properties.city ? `, ${sm.properties.city}` : ''}`
        : 'Objekt';
      const propertyId = (sm.properties as any)?.id;
      return {
        id: sm.id,
        type: 'sales_mandate',
        title: `Verkaufsmandat — ${address}`,
        description: `Erteilt am ${format(new Date(sm.created_at), 'dd.MM.yyyy', { locale: de })}`,
        date: new Date(sm.created_at),
        status: sm.status,
        icon: Tag,
        link: propertyId ? `/portal/immobilien/${propertyId}?tab=verkaufsauftrag` : `/portal/verkauf/objekte`,
      };
    }),
    // Commissions (with new commission_type and reference info)
    ...(commissions || []).map((c): Agreement => {
      const typeLabels: Record<string, string> = {
        finance: 'Finanzierung',
        acquisition: 'Akquise',
        sales: 'Verkauf',
        lead: 'Lead',
      };
      const typeLabel = typeLabels[c.commission_type || ''] || 'Provision';
      return {
        id: c.id,
        type: 'commission',
        title: `Provisionsvereinbarung — ${typeLabel}`,
        description: `Abgeschlossen am ${format(new Date(c.created_at), 'dd.MM.yyyy', { locale: de })}${c.gross_commission ? ` — Brutto: ${c.gross_commission.toLocaleString('de-DE')} €` : c.amount ? ` — ${c.amount.toLocaleString('de-DE')} €` : ''}${c.platform_fee ? ` (Plattform: ${c.platform_fee.toLocaleString('de-DE')} €)` : ''}`,
        date: new Date(c.created_at),
        status: c.status,
        icon: Coins,
      };
    }),
    // Acquisition Mandates (filtered by demo toggle)
    ...(acqMandates || []).filter(am => demoEnabled || !isDemoId(am.id)).map((am): Agreement => ({
      id: am.id,
      type: 'acq_mandate',
      title: `Suchauftrag ${am.code || ''}`,
      description: `Erstellt am ${format(new Date(am.created_at), 'dd.MM.yyyy', { locale: de })}`,
      date: new Date(am.created_at),
      status: am.status,
      icon: FileCheck,
      link: `/portal/investments/mandat/${am.id}`,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <PageShell>
      <ModulePageHeader title="Verträge" description="Ihre rechtlichen Vereinbarungen im Überblick" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Verträge & Vereinbarungen
          </CardTitle>
          <CardDescription>
            Alle rechtlichen Vereinbarungen, die Sie abgeschlossen haben.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : allAgreements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Noch keine Vereinbarungen</p>
              <p className="text-sm mt-1">
                Hier erscheinen automatisch alle Verträge und Vereinbarungen, 
                die Sie im System abschließen.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allAgreements.map((agreement) => {
                const Icon = agreement.icon;
                return (
                  <div
                    key={`${agreement.type}-${agreement.id}`}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{agreement.title}</p>
                      <p className="text-sm text-muted-foreground">{agreement.description}</p>
                    </div>
                    <Badge variant={getStatusVariant(agreement.status)}>
                      {getStatusLabel(agreement.status)}
                    </Badge>
                    {agreement.link ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={agreement.link}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Öffnen
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        Details
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 text-muted-foreground">
            <FileCheck className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Welche Verträge erscheinen hier?</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>AGB und Datenschutzerklärung</li>
                <li>SCHUFA-Einwilligungen</li>
                <li>Finanzierungsbeauftragungen</li>
                <li>Verkaufsmandate</li>
                <li>Provisionsvereinbarungen</li>
                <li>Suchaufträge (Akquise)</li>
                <li>Premium-Storage-Verträge</li>
                <li>Kooperationsvereinbarungen</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

export default VertraegeTab;
