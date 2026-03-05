/**
 * LeadDialogs — Create and Assign dialogs
 * R-22 sub-component
 */
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface NewLead {
  name: string;
  email: string;
  phone: string;
  interest_type: string;
  notes: string;
}

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newLead: NewLead;
  onUpdate: (updates: Partial<NewLead>) => void;
  onCreate: () => void;
  creating: boolean;
}

export function LeadCreateDialog({ open, onOpenChange, newLead, onUpdate, onCreate, creating }: CreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Lead manuell anlegen</DialogTitle><DialogDescription>Erstellen Sie einen neuen Lead für den Pool.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>Name *</Label><Input value={newLead.name} onChange={(e) => onUpdate({ name: e.target.value })} placeholder="Vor- und Nachname" /></div>
          <div className="space-y-2"><Label>E-Mail</Label><Input type="email" value={newLead.email} onChange={(e) => onUpdate({ email: e.target.value })} placeholder="email@beispiel.de" /></div>
          <div className="space-y-2"><Label>Telefon</Label><Input type="tel" value={newLead.phone} onChange={(e) => onUpdate({ phone: e.target.value })} placeholder="+49..." /></div>
          <div className="space-y-2">
            <Label>Interesse-Typ</Label>
            <Select value={newLead.interest_type} onValueChange={(v) => onUpdate({ interest_type: v })}>
              <SelectTrigger><SelectValue placeholder="Auswählen…" /></SelectTrigger>
              <SelectContent>
                {[['purchase','Kauf'],['sale','Verkauf'],['financing','Finanzierung'],['investment','Investment'],['rental','Vermietung'],['other','Sonstiges']].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Notizen</Label><Textarea value={newLead.notes} onChange={(e) => onUpdate({ notes: e.target.value })} placeholder="Zusätzliche Informationen…" rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={onCreate} disabled={!newLead.name.trim() || creating}>{creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Lead erstellen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerOrgs: { id: string; name: string }[];
  selectedPartnerId: string;
  onSelectPartner: (id: string) => void;
  onAssign: () => void;
  assigning: boolean;
}

export function LeadAssignDialog({ open, onOpenChange, partnerOrgs, selectedPartnerId, onSelectPartner, onAssign, assigning }: AssignDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Lead zuweisen</DialogTitle><DialogDescription>Wählen Sie eine Partner-Organisation.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Partner-Organisation</Label>
            <Select value={selectedPartnerId} onValueChange={onSelectPartner}>
              <SelectTrigger><SelectValue placeholder="Partner auswählen…" /></SelectTrigger>
              <SelectContent>{partnerOrgs.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={onAssign} disabled={!selectedPartnerId || assigning}>{assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Zuweisen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
