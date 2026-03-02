/**
 * TLC Defect Report Section — Mängelmelder with auto-triage + existing reports list
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { Wrench, Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { useDefectReport } from '@/hooks/useDefectReport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Props {
  tenantId: string;
  leaseId?: string;
  propertyId?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  emergency: 'destructive',
  urgent: 'default',
  standard: 'secondary',
};

const SEVERITY_LABELS: Record<string, string> = {
  emergency: 'Notfall',
  urgent: 'Dringend',
  standard: 'Normal',
};

export function TLCDefectSection({ tenantId, leaseId, propertyId }: Props) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingDefects, setExistingDefects] = useState<any[]>([]);
  const [loadingDefects, setLoadingDefects] = useState(false);
  const { createDefectReport } = useDefectReport();

  useEffect(() => {
    const fetchDefects = async () => {
      setLoadingDefects(true);
      const query = supabase.from('tenancy_tasks').select('*').eq('tenant_id', tenantId).eq('task_type', 'defect').order('created_at', { ascending: false }).limit(20);
      if (leaseId) query.eq('lease_id', leaseId);
      const { data } = await query;
      setExistingDefects(data || []);
      setLoadingDefects(false);
    };
    fetchDefects();
  }, [tenantId, leaseId]);

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Titel ist erforderlich'); return; }
    setSubmitting(true);
    const { error, triage } = await createDefectReport({ tenantId, leaseId, propertyId, title: title.trim(), description: description.trim(), locationDetail: location.trim() || undefined });
    setSubmitting(false);
    if (error) { toast.error(`Fehler: ${error.message}`); } else {
      toast.success(`Mangel gemeldet — Triage: ${triage?.severity || 'normal'} (SLA: ${triage?.slaHours || 48}h)`);
      setCreating(false); setTitle(''); setDescription(''); setLocation('');
      const query = supabase.from('tenancy_tasks').select('*').eq('tenant_id', tenantId).eq('task_type', 'defect').order('created_at', { ascending: false }).limit(20);
      if (leaseId) query.eq('lease_id', leaseId);
      const { data } = await query;
      setExistingDefects(data || []);
    }
  };

  const openCount = existingDefects.filter(d => d.status === 'open').length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className={DESIGN.TYPOGRAPHY.LABEL}>
          <Wrench className="h-3.5 w-3.5 inline mr-1.5" />
          Mängelmelder
        </h4>
        {openCount > 0 && (
          <Badge variant="destructive" className="text-[9px] px-1 py-0">{openCount} offen</Badge>
        )}
      </div>

      {loadingDefects ? (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground p-2">
          <Loader2 className="h-3 w-3 animate-spin" />Lädt Mängel…
        </div>
      ) : existingDefects.length > 0 ? (
        <div className="space-y-1">
          {existingDefects.map(d => (
            <div key={d.id} className="flex items-center justify-between p-2 rounded-lg border bg-card text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium truncate">{d.title}</span>
                  <Badge variant={(SEVERITY_COLORS[d.severity_assessment] || 'secondary') as any} className="text-[9px] px-1 py-0 shrink-0">
                    {SEVERITY_LABELS[d.severity_assessment] || d.severity_assessment}
                  </Badge>
                  <Badge variant={d.status === 'open' ? 'outline' : 'secondary'} className="text-[9px] px-1 py-0 shrink-0">
                    {d.status === 'open' ? 'Offen' : d.status === 'in_progress' ? 'In Arbeit' : 'Erledigt'}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-0.5 truncate">
                  {format(new Date(d.created_at), 'dd.MM.yyyy', { locale: de })}
                  {d.location_detail && ` • ${d.location_detail}`}
                  {d.sla_hours && ` • SLA: ${d.sla_hours}h`}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground px-2">Keine Mängel gemeldet.</p>
      )}

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
    </div>
  );
}
