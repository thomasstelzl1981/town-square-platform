/**
 * TLC Defect Report Section — Mängelmelder with auto-triage
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Wrench, ChevronDown, Plus, AlertTriangle } from 'lucide-react';
import { useDefectReport } from '@/hooks/useDefectReport';
import { toast } from 'sonner';

interface Props {
  tenantId: string;
  leaseId?: string;
  propertyId?: string;
}

export function TLCDefectSection({ tenantId, leaseId, propertyId }: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { createDefectReport } = useDefectReport();

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Titel ist erforderlich'); return; }
    setSubmitting(true);
    const { error, triage } = await createDefectReport({
      tenantId,
      leaseId,
      propertyId,
      title: title.trim(),
      description: description.trim(),
      locationDetail: location.trim() || undefined,
    });
    setSubmitting(false);
    if (error) {
      toast.error(`Fehler: ${error.message}`);
    } else {
      toast.success(`Mangel gemeldet — Triage: ${triage?.severity || 'normal'} (SLA: ${triage?.slaHours || 48}h)`);
      setCreating(false);
      setTitle('');
      setDescription('');
      setLocation('');
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 text-xs">
          <span className="flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5" />
            Mängelmelder
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-1">
        {creating ? (
          <div className="p-3 rounded-lg border border-dashed border-primary/30 space-y-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Mangel-Titel *</Label>
              <Input className="h-7 text-xs" value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. Wasserschaden Bad" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Beschreibung</Label>
              <Textarea className="text-xs min-h-[60px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Details zum Mangel..." />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Ort / Raum</Label>
              <Input className="h-7 text-xs" value={location} onChange={e => setLocation(e.target.value)} placeholder="z.B. Badezimmer, Küche" />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              Auto-Triage erkennt Dringlichkeit anhand von Keywords (Wasser, Heizung, Gas...)
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Wird gemeldet…' : 'Mangel melden'}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCreating(false)}>Abbrechen</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-3 w-3" />Mangel melden
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
