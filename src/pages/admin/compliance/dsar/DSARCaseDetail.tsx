/**
 * DSAR Case Detail — 4-Block Inline-Ansicht
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, ShieldCheck, ShieldX, X, UserCheck } from 'lucide-react';
import { DSARResponseGenerator } from './DSARResponseGenerator';
import type { DSARRequest } from '../useComplianceCases';

const IDENTITY_BADGES: Record<string, string> = {
  UNVERIFIED: 'bg-amber-500/10 text-amber-700 border-amber-200',
  VERIFIED: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  FAILED: 'bg-destructive/10 text-destructive border-destructive/30',
};

interface DSARCaseDetailProps {
  request: DSARRequest;
  companyProfile: any;
  onUpdate: (id: string, updates: Record<string, any>) => void;
  onClose: () => void;
  isPending?: boolean;
}

export function DSARCaseDetail({ request, companyProfile, onUpdate, onClose, isPending }: DSARCaseDetailProps) {
  const r = request as any;
  const [identityMethod, setIdentityMethod] = useState(r.identity_method || 'EMAIL');
  const [identityNotes, setIdentityNotes] = useState(r.identity_notes || '');
  const [internalNotes, setInternalNotes] = useState(r.internal_notes || r.notes || '');
  const [scopeNotes, setScopeNotes] = useState(r.scope_notes || '');

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
    onUpdate(r.id, { internal_notes: internalNotes, scope_notes: scopeNotes });
  };

  const handleResponseSent = (channel: string) => {
    onUpdate(r.id, {
      response_status: 'SENT',
      response_sent_at: new Date().toISOString(),
      response_channel: channel,
      status: 'RESPONDED',
    });
  };

  const handleClose = () => {
    onUpdate(r.id, { status: 'CLOSED', closed_at: new Date().toISOString() });
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
              <p className="font-medium">{r.scope_mode === 'LIMITED' ? 'Eingeschränkt' : 'Vollexport'}</p>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Scope-Notizen</Label>
            <Textarea value={scopeNotes} onChange={e => setScopeNotes(e.target.value)} placeholder="z.B. nur Daten aus Modul X, Zeitraum Y..." className="min-h-[60px] text-sm" />
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

        {/* Block 3: Antwort */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Antwort</p>
          {r.response_status === 'SENT' ? (
            <div className="text-sm text-emerald-600">
              ✅ Antwort versendet am {r.response_sent_at ? new Date(r.response_sent_at).toLocaleDateString('de-DE') : '—'} via {r.response_channel || '—'}
            </div>
          ) : (
            <DSARResponseGenerator
              requesterName={r.requester_name}
              requestDate={receivedDate}
              companyProfile={companyProfile}
              onMarkSent={handleResponseSent}
              disabled={!isVerified}
              disabledReason="Antwortvorlage erst nach Identitätsprüfung verfügbar."
            />
          )}
        </div>

        {/* Block 4: Intern */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Intern</p>
          <Textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} placeholder="Interne Notizen, Kommunikation, Bearbeitungsverlauf..." className="min-h-[120px] text-sm" />
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={isPending}>
              <Save className="h-3 w-3 mr-1" /> Notizen speichern
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
