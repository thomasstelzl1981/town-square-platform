/**
 * TLC Handover Protocol Section — Übergabeprotokolle for a lease
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { ClipboardCheck, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useHandoverProtocol, type HandoverProtocol } from '@/hooks/useHandoverProtocol';
import { toast } from 'sonner';

interface Props {
  leaseId: string;
  unitId: string;
  tenantId: string;
  tenantName?: string;
}

export function TLCHandoverSection({ leaseId, unitId, tenantId, tenantName }: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formType, setFormType] = useState<'move_in' | 'move_out'>('move_in');
  const [inspectorName, setInspectorName] = useState('');

  const { protocols, loading, fetchProtocols, createProtocol } = useHandoverProtocol(leaseId);

  useEffect(() => {
    if (open && protocols.length === 0 && !loading) {
      fetchProtocols();
    }
  }, [open, protocols.length, loading, fetchProtocols]);

  const handleCreate = async () => {
    const { error } = await createProtocol({
      tenantId,
      leaseId,
      unitId,
      type: formType,
      inspectorName: inspectorName || undefined,
      tenantName,
    });
    if (error) {
      toast.error(`Fehler: ${error.message}`);
    } else {
      setCreating(false);
      setInspectorName('');
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 text-xs">
          <span className="flex items-center gap-2">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Übergabeprotokolle ({protocols.length})
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-1">
        {loading ? (
          <p className="text-xs text-muted-foreground p-2">Lädt…</p>
        ) : (
          <>
            {protocols.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border bg-card text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {p.protocol_type === 'move_in' ? 'Einzug' : 'Auszug'}
                  </Badge>
                  <span>{format(new Date(p.protocol_date || p.created_at), 'dd.MM.yyyy', { locale: de })}</span>
                  {p.inspector_name && <span className="text-muted-foreground">({p.inspector_name})</span>}
                </div>
                <Badge variant={p.status === 'signed' ? 'default' : 'secondary'} className="text-[9px]">
                  {p.status === 'signed' ? 'Unterschrieben' : p.status === 'draft' ? 'Entwurf' : p.status}
                </Badge>
              </div>
            ))}

            {creating ? (
              <div className="p-3 rounded-lg border border-dashed border-primary/30 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Typ</Label>
                    <Select value={formType} onValueChange={(v) => setFormType(v as any)}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="move_in">Einzug</SelectItem>
                        <SelectItem value="move_out">Auszug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Protokollführer</Label>
                    <Input className="h-7 text-xs" value={inspectorName} onChange={e => setInspectorName(e.target.value)} placeholder="Name" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={handleCreate}>Anlegen</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCreating(false)}>Abbrechen</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => setCreating(true)}>
                <Plus className="mr-1 h-3 w-3" />Protokoll anlegen
              </Button>
            )}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
