/**
 * ContactImportPipeline — Unified import component for research results
 * Handles both contact_staging (Desk) and contacts (Zone 2) targets.
 * Uses engine-based deduplication from useResearchImport.
 */
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SearchResultCard } from './SearchResultCard';
import type { ResearchContact } from '@/hooks/useResearchEngine';
import { supabase } from '@/integrations/supabase/client';
import { normalizeContact, calcConfidence, findDedupeMatches } from '@/engines/marketDirectory/engine';
import { toast } from 'sonner';

type ImportTarget = 'contacts' | 'contact_staging';

interface ContactImportPipelineProps {
  results: ResearchContact[];
  target?: ImportTarget;
  desk?: string;
  categoryCode?: string;
  onImportComplete?: (stats: { imported: number; skipped: number; updated: number }) => void;
}

export function ContactImportPipeline({
  results,
  target = 'contacts',
  desk,
  categoryCode,
  onImportComplete,
}: ContactImportPipelineProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; updated: number } | null>(null);

  const allSelected = selectedIds.size === results.length && results.length > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map((_, i) => i)));
    }
  };

  const toggleOne = (idx: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleImport = async () => {
    const selected = results.filter((_, i) => selectedIds.has(i));
    if (selected.length === 0) {
      toast.error('Bitte Kontakte auswählen');
      return;
    }

    setIsImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();
      const tenantId = (profile as any)?.org_id;

      let imported = 0, skipped = 0, updated = 0;

      if (target === 'contact_staging') {
        // Direct insert into staging for Desk flows
        for (const r of selected) {
          const nameParts = r.name?.split(' ') || [];
          const { error } = await supabase.from('contact_staging').insert({
            salutation: null,
            first_name: nameParts[0] || null,
            last_name: nameParts.slice(1).join(' ') || null,
            email: r.email,
            company_name: r.name,
            category: categoryCode || null,
            source: r.sources?.[0] || 'research',
            status: 'pending',
            desk: desk || null,
          } as any);
          if (error) { console.error('Staging insert error:', error); continue; }
          imported++;
        }
      } else {
        // Full engine-based import to contacts table
        const { data: existing } = await supabase
          .from('contacts')
          .select('id, email, phone, first_name, last_name, company, postal_code, street')
          .eq('tenant_id', tenantId)
          .is('deleted_at', null)
          .limit(1000);

        const dedupePool = (existing || []).map((c: any) => ({
          id: c.id, email: c.email, phone: c.phone,
          firstName: c.first_name, lastName: c.last_name,
          company: c.company, postalCode: c.postal_code,
          street: c.street, domain: undefined,
        }));

        for (const r of selected) {
          const nameParts = r.name?.split(' ') || [];
          const norm = normalizeContact({
            salutation: null,
            first_name: nameParts[0] || null,
            last_name: nameParts.slice(1).join(' ') || null,
            company_name: r.name,
            contact_person_name: null,
            phone: r.phone || null,
            email: r.email || null,
            website_url: r.website || null,
            address_line: r.address || null,
            postal_code: null,
            city: null,
          });
          const n = norm.normalized;

          const matches = findDedupeMatches(
            { email: n.email, phoneE164: n.phoneE164, domain: n.domain, firstName: n.firstName, lastName: n.lastName, company: n.company, postalCode: n.postalCode, street: n.street },
            dedupePool,
          );

          if (matches.length > 0) {
            skipped++;
            continue;
          }

          const conf = calcConfidence(n, 1);
          const { error } = await supabase.from('contacts').insert({
            tenant_id: tenantId,
            salutation: n.salutation || null,
            first_name: n.firstName || null,
            last_name: n.lastName || null,
            email: n.email || null,
            phone: n.phoneE164 || null,
            company: n.company || null,
            street: n.street || null,
            postal_code: n.postalCode || null,
            city: n.city || null,
            category: categoryCode || 'Sonstige',
            confidence_score: Math.round(conf.score * 100),
            quality_status: 'approved',
          } as any);
          if (error) { console.error('Contact insert error:', error); continue; }
          imported++;
        }
      }

      const stats = { imported, skipped, updated };
      setImportResult(stats);
      onImportComplete?.(stats);

      const parts: string[] = [];
      if (imported > 0) parts.push(`${imported} importiert`);
      if (skipped > 0) parts.push(`${skipped} Duplikate übersprungen`);
      if (updated > 0) parts.push(`${updated} aktualisiert`);
      toast.success(parts.join(', ') || 'Import abgeschlossen');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import fehlgeschlagen');
    } finally {
      setIsImporting(false);
    }
  };

  if (results.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Import ({selectedIds.size}/{results.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={toggleAll} className="text-xs h-7">
              {allSelected ? 'Keine' : 'Alle'} auswählen
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={isImporting || selectedIds.size === 0}
              className="text-xs h-7"
            >
              {isImporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <UserPlus className="h-3 w-3 mr-1" />}
              {selectedIds.size} importieren
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {importResult && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 text-xs mb-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            {importResult.imported} importiert
            {importResult.skipped > 0 && `, ${importResult.skipped} Duplikate`}
          </div>
        )}
        {results.map((r, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.has(idx)}
              onCheckedChange={() => toggleOne(idx)}
            />
            <div className="flex-1 min-w-0">
              <SearchResultCard result={r} compact />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
