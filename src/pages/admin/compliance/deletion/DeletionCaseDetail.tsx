/**
 * Deletion Case Detail — 5-Block Inline-Ansicht
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, ShieldCheck, ShieldX, X, UserCheck, AlertTriangle } from 'lucide-react';
import { DeletionResponseGenerator } from './DeletionResponseGenerator';
import type { DeletionRequest } from '../useComplianceCases';

const IDENTITY_BADGES: Record<string, string> = {
  UNVERIFIED: 'bg-amber-500/10 text-amber-700 border-amber-200',
  VERIFIED: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  FAILED: 'bg-destructive/10 text-destructive border-destructive/30',
};

interface DeletionCaseDetailProps {
  request: DeletionRequest;
  companyProfile: any;
  onUpdate: (id: string, updates: Record<string, any>) => void;
  onClose: () => void;
  isPending?: boolean;
}

export function DeletionCaseDetail({ request, companyProfile, onUpdate, onClose, isPending }: DeletionCaseDetailProps) {
  const r = request;
  const [identityMethod, setIdentityMethod] = useState(r.identity_method || 'EMAIL');
  const [identityNotes, setIdentityNotes] = useState(r.identity_notes || '');
  const [internalNotes, setInternalNotes] = useState(r.internal_notes || r.notes || '');
  const [scopeNotes, setScopeNotes] = useState(r.scope_notes || '');
  const [legalHoldReason, setLegalHoldReason] = useState(r.legal_hold_reason || '');
  const [retentionNotes, setRetentionNotes] = useState(r.retention_notes || '');
  const [erasureSummary, setErasureSummary] = useState(r.erasure_summary || '');

  const identityStatus = r.identity_status || 'UNVERIFIED';
  const isVerified = identityStatus === 'VERIFIED';

  const handleVerify = () => {
    onUpdate(r.id, {
      identity_status: 'VERIFIED',
      identity_method: identityMethod,
      identity_notes: identityNotes,
      status: r.status === 'NEW' || r.status === 'IDENTITY_REQUIRED' ? 'IN_REVIEW' : r.status,
    });
  };

  const handleIdentityFailed = () => {
    onUpdate(r.id, {
      identity_status: 'FAILED',
      identity_method: identityMethod,
      identity_notes: identityNotes,
      status: 'REJECTED',
    });
  };

  const handleSaveNotes = () => {
    onUpdate(r.id, {
      internal_notes: internalNotes,
      scope_notes: scopeNotes,
      legal_hold_reason: legalHoldReason || null,
      retention_notes: retentionNotes || null,
      erasure_summary: erasureSummary || null,
      status: legalHoldReason && r.status === 'IN_REVIEW' ? 'HOLD_LEGAL' : r.status,
    });
  };

  const handleResponseSent = (channel: string, responseType: string) => {
    onUpdate(r.id, {
      response_status: 'SENT',
      response_sent_at: new Date().toISOString(),
      response_channel: channel,
      response_type: responseType,
      status: 'RESPONDED',
    });
  };

  const handleClose = () => {
    onUpdate(r.id, { status: 'CLOSED' });
  };

  const receivedDate = r.request_received_at || r.created_at;
  const dueDate = r.due_date ? new Date(r.due_date).toLocaleDateString('de-DE') : '—';
  const isOverdue = r.due_date && new Date(r.due_date) < new Date() && r.status !== 'CLOSED' && r.status !== 'REJECTED';

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-sm">{r.requester_email}</p>
            {r.requester_name && <p className="text-xs text-muted-foreground">{r.requester_name}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {/* Block 1: Anfragedaten */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Anfragedaten</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Kanal</span>
              <p className="font-medium">{r.request_channel || 'EMAIL'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Eingang</span>
              <p className="font-medium">{new Date(receivedDate).toLocaleDateString('de-DE')}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Frist (30 Tage)</span>
              <p className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                {dueDate} {isOverdue && '⚠️'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Scope</span>
              <p className="font-medium">{r.scope_mode === 'LIMITED' ? 'Eingeschränkt' : 'Vollständige Löschung'}</p>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Scope-Notizen</Label>
            <Textarea value={scopeNotes} onChange={e => setScopeNotes(e.target.value)} placeholder="z.B. nur bestimmte Datenbereiche, Zeitraum..." className="min-h-[60px] text-sm" />
          </div>
        </div>

        {/* Block 2: Identitätsprüfung */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identitätsprüfung</p>
            <Badge className={IDENTITY_BADGES[identityStatus] || ''}>
              {identityStatus === 'VERIFIED' ? 'Verifiziert' : identityStatus === 'FAILED' ? 'Fehlgeschlagen' : 'Ausstehend'}
            </Badge>
          </div>
          {!isVerified && identityStatus !== 'FAILED' && (
            <div className="space-y-2 rounded-lg border p-3 bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">Methode</Label>
                  <Select value={identityMethod} onValueChange={setIdentityMethod}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOGIN">Login-Verifizierung</SelectItem>
                      <SelectItem value="EMAIL">E-Mail-Challenge</SelectItem>
                      <SelectItem value="ID_DOC">Ausweisdokument</SelectItem>
                      <SelectItem value="OTHER">Sonstige</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea value={identityNotes} onChange={e => setIdentityNotes(e.target.value)} placeholder="Notizen zur Identitätsprüfung..." className="min-h-[60px] text-sm" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleVerify} disabled={isPending}>
                  <ShieldCheck className="h-3 w-3 mr-1" /> Identität bestätigt
                </Button>
                <Button size="sm" variant="destructive" onClick={handleIdentityFailed} disabled={isPending}>
                  <ShieldX className="h-3 w-3 mr-1" /> Identität fehlgeschlagen
                </Button>
              </div>
            </div>
          )}
          {isVerified && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> Verifiziert via {r.identity_method || identityMethod}
              {r.identity_notes && ` — ${r.identity_notes}`}
            </p>
          )}
        </div>

        {/* Block 3: Anspruchsprüfung / Legal Hold */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Anspruchsprüfung / Legal Hold</p>
            {legalHoldReason && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
          </div>
          <div className="space-y-3 rounded-lg border p-3 bg-muted/10">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" /> Legal Hold Grund
              </Label>
              <Textarea
                value={legalHoldReason}
                onChange={e => setLegalHoldReason(e.target.value)}
                placeholder="z.B. Steuerrechtliche Aufbewahrungspflicht bis 2033, laufende Rechtsstreitigkeiten..."
                className="min-h-[60px] text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Aufbewahrte Datenkategorien (Retention)</Label>
              <Textarea
                value={retentionNotes}
                onChange={e => setRetentionNotes(e.target.value)}
                placeholder="Welche Datenkategorien werden aufbewahrt + warum (z.B. Rechnungsdaten gem. § 147 AO, Vertragsdaten gem. § 257 HGB)..."
                className="min-h-[80px] text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lösch-/Anonymisierungsprotokoll</Label>
              <Textarea
                value={erasureSummary}
                onChange={e => setErasureSummary(e.target.value)}
                placeholder="Was wurde gelöscht/anonymisiert (z.B. Profildaten, Kontaktdaten, Login entfernt, DMS-Dokumente gelöscht)..."
                className="min-h-[80px] text-sm"
              />
            </div>
          </div>
        </div>

        {/* Block 4: Antwort */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Antwort</p>
          {r.response_status === 'SENT' ? (
            <div className="text-sm text-emerald-600">
              ✅ Antwort versendet am {r.response_sent_at ? new Date(r.response_sent_at).toLocaleDateString('de-DE') : '—'} via {r.response_channel || '—'}
              {r.response_type && ` (${r.response_type})`}
            </div>
          ) : (
            <DeletionResponseGenerator
              requesterName={r.requester_name}
              requestDate={receivedDate}
              companyProfile={companyProfile}
              erasureSummary={erasureSummary || null}
              retentionNotes={retentionNotes || null}
              legalHoldReason={legalHoldReason || null}
              onMarkSent={handleResponseSent}
              disabled={!isVerified}
              disabledReason="Antwortvorlage erst nach Identitätsprüfung verfügbar."
            />
          )}
        </div>

        {/* Block 5: Intern */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Intern</p>
          <Textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} placeholder="Interne Notizen, Bearbeitungsverlauf..." className="min-h-[120px] text-sm" />
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={isPending}>
              <Save className="h-3 w-3 mr-1" /> Speichern
            </Button>
            {r.status === 'RESPONDED' && (
              <Button size="sm" onClick={handleClose} disabled={isPending}>Case abschließen</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
