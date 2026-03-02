/**
 * TLC Applicant Pipeline Section — Bewerbermanagement (8-Stufen)
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Users, Plus, ArrowRight } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { useTenancyApplicants, APPLICANT_STATUS_LABELS, type ApplicantStatus } from '@/hooks/useTenancyApplicants';
import { toast } from 'sonner';

interface Props {
  unitId?: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  screening: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  shortlisted: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  viewing_scheduled: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  viewing_done: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
  withdrawn: 'bg-muted text-muted-foreground',
};

export function TLCApplicantSection({ unitId }: Props) {
  const [creating, setCreating] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const { applicants, stats, isLoading, createApplicant, updateApplicantStatus } = useTenancyApplicants(unitId);

  const handleCreate = () => {
    if (!firstName.trim() || !lastName.trim()) { toast.error('Name ist erforderlich'); return; }
    createApplicant.mutate({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined }, {
      onSuccess: () => { setCreating(false); setFirstName(''); setLastName(''); setEmail(''); setPhone(''); }
    });
  };

  const getNextStatus = (current: ApplicantStatus): ApplicantStatus | null => {
    const flow: Record<string, ApplicantStatus> = { new: 'screening', screening: 'shortlisted', shortlisted: 'viewing_scheduled', viewing_scheduled: 'viewing_done', viewing_done: 'approved' };
    return flow[current] || null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className={DESIGN.TYPOGRAPHY.LABEL}>
          <Users className="h-3.5 w-3.5 inline mr-1.5" />
          Bewerber ({stats.total})
        </h4>
        {stats.new > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{stats.new} neu</Badge>
        )}
      </div>
      {isLoading ? (
        <p className="text-xs text-muted-foreground p-2">Lädt…</p>
      ) : (
        <>
          {applicants.map(a => {
            const next = getNextStatus(a.status);
            return (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border bg-card text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{a.lastName}, {a.firstName}</span>
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${statusColors[a.status] || ''}`}>
                    {APPLICANT_STATUS_LABELS[a.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {next && (
                    <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={() => updateApplicantStatus.mutate({ id: a.id, status: next })}>
                      <ArrowRight className="h-3 w-3 mr-0.5" />{APPLICANT_STATUS_LABELS[next]}
                    </Button>
                  )}
                  {a.status !== 'rejected' && a.status !== 'withdrawn' && a.status !== 'approved' && (
                    <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] text-destructive" onClick={() => updateApplicantStatus.mutate({ id: a.id, status: 'rejected' })}>✕</Button>
                  )}
                </div>
              </div>
            );
          })}
          {creating ? (
            <div className="p-3 rounded-lg border border-dashed border-primary/30 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-[11px]">Vorname *</Label><Input className="h-7 text-xs" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-[11px]">Nachname *</Label><Input className="h-7 text-xs" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-[11px]">E-Mail</Label><Input className="h-7 text-xs" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-[11px]">Telefon</Label><Input className="h-7 text-xs" value={phone} onChange={e => setPhone(e.target.value)} /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={createApplicant.isPending}>Anlegen</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCreating(false)}>Abbrechen</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => setCreating(true)}>
              <Plus className="mr-1 h-3 w-3" />Bewerber hinzufügen
            </Button>
          )}
        </>
      )}
    </div>
  );
}
