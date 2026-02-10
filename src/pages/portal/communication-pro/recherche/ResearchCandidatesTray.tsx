/**
 * ResearchCandidatesTray — Kachel 3: Gefundene Kontakte (Übernahme)
 * MOD-14 Communication Pro > Recherche
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UserCheck, Inbox, Eye, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CandidatePreviewDrawer } from './CandidatePreviewDrawer';
import { CreditConfirmModal } from './CreditConfirmModal';
import { toast } from '@/hooks/use-toast';

interface ContactCandidate {
  id: string;
  full_name: string;
  role: string;
  company: string;
  location: string;
  email: string;
  phone: string;
  domain: string;
  confidence: number;
  status: 'new' | 'reviewed' | 'imported' | 'rejected';
}

const DEMO_CANDIDATES: ContactCandidate[] = [
  { id: 'c1', full_name: 'Dr. Klaus Weber', role: 'Geschäftsführer', company: 'Weber Hausverwaltung GmbH', location: 'München', email: 'k.w***@weber-hv.de', phone: '+49 89 ***', domain: 'weber-hv.de', confidence: 0.95, status: 'new' },
  { id: 'c2', full_name: 'Sabine Meier', role: 'Geschäftsführerin', company: 'Meier Immobilien GmbH', location: 'München', email: 's.m***@meier-immo.de', phone: '', domain: 'meier-immo.de', confidence: 0.88, status: 'new' },
  { id: 'c3', full_name: 'Thomas Hartmann', role: 'Inhaber', company: 'Hartmann & Partner Verwaltung', location: 'Augsburg', email: 't.h***@hp-verwaltung.de', phone: '+49 821 ***', domain: 'hp-verwaltung.de', confidence: 0.82, status: 'reviewed' },
  { id: 'c4', full_name: 'Anna Schmidt', role: 'Prokuristin', company: 'Schmidt HV München', location: 'München', email: 'a.s***@schmidt-hv.de', phone: '', domain: 'schmidt-hv.de', confidence: 0.79, status: 'new' },
  { id: 'c5', full_name: 'Michael Braun', role: 'Geschäftsführer', company: 'Braun Property Management', location: 'Freising', email: 'm.b***@braun-pm.de', phone: '+49 8161 ***', domain: 'braun-pm.de', confidence: 0.91, status: 'imported' },
  { id: 'c6', full_name: 'Lisa Hoffmann', role: 'Teamleiterin', company: 'IVG Immobilien AG', location: 'München', email: 'l.h***@ivg.de', phone: '', domain: 'ivg.de', confidence: 0.73, status: 'new' },
  { id: 'c7', full_name: 'Peter Kraus', role: 'Geschäftsführer', company: 'Kraus Wohnungsverwaltung', location: 'Rosenheim', email: 'p.k***@kraus-wv.de', phone: '+49 8031 ***', domain: 'kraus-wv.de', confidence: 0.86, status: 'new' },
  { id: 'c8', full_name: 'Julia Wagner', role: 'COO', company: 'WagnerHaus GmbH', location: 'München', email: 'j.w***@wagnerhaus.de', phone: '', domain: 'wagnerhaus.de', confidence: 0.77, status: 'rejected' },
  { id: 'c9', full_name: 'Stefan Bauer', role: 'Gesellschafter', company: 'Bauer Immobilienverwaltung', location: 'Landshut', email: 's.b***@bauer-iv.de', phone: '+49 871 ***', domain: 'bauer-iv.de', confidence: 0.84, status: 'new' },
  { id: 'c10', full_name: 'Karin Fischer', role: 'Geschäftsführerin', company: 'Fischer & Sohn HV', location: 'Ingolstadt', email: 'k.f***@fischer-hv.de', phone: '', domain: 'fischer-hv.de', confidence: 0.90, status: 'reviewed' },
];

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  new: { label: 'Neu', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  reviewed: { label: 'Geprüft', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  imported: { label: 'Übernommen', className: 'bg-status-success/10 text-status-success border-status-success/20' },
  rejected: { label: 'Abgelehnt', className: 'bg-status-error/10 text-status-error border-status-error/20' },
};

export function ResearchCandidatesTray() {
  const [candidates] = useState<ContactCandidate[]>(DEMO_CANDIDATES);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewCandidate, setPreviewCandidate] = useState<ContactCandidate | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const importableCandidates = candidates.filter(c => c.status !== 'imported' && c.status !== 'rejected');
  const selectedImportable = [...selected].filter(id => importableCandidates.some(c => c.id === id));

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selectedImportable.length === importableCandidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(importableCandidates.map(c => c.id)));
    }
  };

  const handleImport = () => {
    if (selectedImportable.length === 0) return;
    setShowCreditModal(true);
  };

  const confirmImport = () => {
    toast({
      title: `${selectedImportable.length} Kontakt(e) übernommen`,
      description: `${selectedImportable.length} Credits verbraucht`,
    });
    setSelected(new Set());
    setShowCreditModal(false);
  };

  return (
    <>
      <Card className="glass-card border-primary/20 flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Gefundene Kontakte
            </CardTitle>
            <Badge variant="outline" className="text-[9px]">
              {candidates.length} Treffer
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-2">
          {candidates.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <Inbox className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Keine Treffer</p>
              <p className="text-[10px] text-muted-foreground/70">Starte eine Pro-Suche in Kachel 2</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedImportable.length === importableCandidates.length && importableCandidates.length > 0}
                    onCheckedChange={toggleAll}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {selectedImportable.length > 0 ? `${selectedImportable.length} ausgewählt` : 'Alle auswählen'}
                  </span>
                </div>
                {selectedImportable.length > 0 && (
                  <Button size="sm" variant="default" className="h-6 text-[10px] gap-1" onClick={handleImport}>
                    <Download className="h-3 w-3" />
                    Übernehmen ({selectedImportable.length} Cr.)
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-auto space-y-1 max-h-[400px]">
                {candidates.map((c) => {
                  const statusInfo = STATUS_LABELS[c.status];
                  const isDisabled = c.status === 'imported' || c.status === 'rejected';
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border border-border/30 hover:border-primary/20 transition-colors",
                        isDisabled && "opacity-50"
                      )}
                    >
                      <Checkbox
                        checked={selected.has(c.id)}
                        onCheckedChange={() => toggleSelect(c.id)}
                        disabled={isDisabled}
                        className="h-3.5 w-3.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium truncate">{c.full_name}</span>
                          <Badge variant="outline" className={cn("text-[8px] h-4", statusInfo.className)}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {c.role} · {c.company} · {c.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge variant="outline" className="text-[8px] h-4">
                          {Math.round(c.confidence * 100)}%
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => setPreviewCandidate(c)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CandidatePreviewDrawer
        candidate={previewCandidate}
        open={!!previewCandidate}
        onOpenChange={(open) => !open && setPreviewCandidate(null)}
      />

      <CreditConfirmModal
        open={showCreditModal}
        onOpenChange={setShowCreditModal}
        count={selectedImportable.length}
        onConfirm={confirmImport}
      />
    </>
  );
}
