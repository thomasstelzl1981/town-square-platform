/**
 * Delegations Page — Orchestrator
 * R-27: 486 → ~100 lines
 */
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertTriangle, Clock } from 'lucide-react';
import { PdfExportFooter } from '@/components/pdf';
import { DESIGN } from '@/config/designManifest';
import { DelegationCreateDialog, DelegationDetailDialog, DelegationRevokeDialog } from '@/components/admin/delegations';
import { DelegationTable } from '@/components/admin/delegations/DelegationTable';
import type { Tables, Enums } from '@/integrations/supabase/types';

type OrgDelegation = Tables<'org_delegations'>;
type Organization = Tables<'organizations'>;

export default function DelegationsPage() {
  const { isPlatformAdmin, user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const [delegations, setDelegations] = useState<OrgDelegation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<OrgDelegation | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<OrgDelegation | null>(null);

  async function fetchData() {
    setLoading(true); setError(null);
    try {
      const [orgsRes, delRes] = await Promise.all([
        supabase.from('organizations').select('*').order('name'),
        supabase.from('org_delegations').select('*').order('created_at', { ascending: false }),
      ]);
      if (orgsRes.error) throw orgsRes.error;
      if (delRes.error) throw delRes.error;
      setOrganizations(orgsRes.data || []);
      setDelegations(delRes.data || []);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : String(err)); }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const getOrgName = (id: string) => organizations.find(o => o.id === id)?.name || id;

  return (
    <div className={DESIGN.SPACING.SECTION} ref={contentRef}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>Delegierungen</h2>
          <p className={DESIGN.TYPOGRAPHY.MUTED}>Organisationsübergreifende Zugriffsrechte verwalten</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Neue Delegierung</Button>
      </div>

      {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
      <Alert><Clock className="h-4 w-4" /><AlertDescription>Delegierungen sind unveränderliche Historie. Aktive Delegierungen können widerrufen, aber nicht gelöscht werden.</AlertDescription></Alert>

      <DelegationTable delegations={delegations} loading={loading} getOrgName={getOrgName} onView={setViewTarget} onRevoke={setRevokeTarget} />

      <DelegationCreateDialog open={createOpen} onOpenChange={setCreateOpen} organizations={organizations} onCreated={fetchData} />
      <DelegationDetailDialog delegation={viewTarget} onClose={() => setViewTarget(null)} getOrgName={getOrgName} />
      <DelegationRevokeDialog delegation={revokeTarget} onClose={() => setRevokeTarget(null)} onRevoked={fetchData} />

      <PdfExportFooter contentRef={contentRef} documentTitle="Delegationen" subtitle={`${delegations.length} Cross-Org-Zugriffsrechte`} moduleName="Zone 1 Admin" />
    </div>
  );
}
