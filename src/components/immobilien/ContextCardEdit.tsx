/**
 * R-4: ContextCardEdit — Inline edit form for a landlord context
 */
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Plus, X, Loader2, Trash2 } from 'lucide-react';
import type { TaxAssessmentType } from '@/lib/taxCalculator';
import type { ContextFormData, OwnerData } from './kontexteTypes';

interface ContextCardEditProps {
  editFormData: ContextFormData;
  editOwners: OwnerData[];
  isPending: boolean;
  onFormChange: (data: ContextFormData) => void;
  onUpdateOwner: (idx: number, field: keyof OwnerData, value: any) => void;
  onAddOwner: () => void;
  onRemoveOwner: (idx: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ContextCardEdit({
  editFormData, editOwners, isPending,
  onFormChange, onUpdateOwner, onAddOwner, onRemoveOwner, onSave, onCancel,
}: ContextCardEditProps) {
  const f = editFormData;
  const set = (partial: Partial<ContextFormData>) => onFormChange({ ...f, ...partial });

  return (
    <Card className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] border-primary ring-2 ring-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Bearbeitung</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Name */}
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input value={f.name} onChange={(e) => set({ name: e.target.value })} className="h-8 text-sm" />
        </div>
        
        {/* Typ Toggle */}
        <RadioGroup value={f.context_type} onValueChange={(v) => set({ context_type: v as 'PRIVATE' | 'BUSINESS' })}>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="PRIVATE" id="edit-private" />
              <Label htmlFor="edit-private" className="text-xs cursor-pointer">Privat</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="BUSINESS" id="edit-business" />
              <Label htmlFor="edit-business" className="text-xs cursor-pointer">Gesellschaft</Label>
            </div>
          </div>
        </RadioGroup>
        
        {/* PRIVAT: Steuerbasis */}
        {f.context_type === 'PRIVATE' && (
          <div className="space-y-3 p-3 bg-muted/40 rounded-lg">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Steuerbasis</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">zVE (€/Jahr)</Label>
                <Input type="number" value={f.taxable_income_yearly ?? ''} onChange={(e) => set({ taxable_income_yearly: Number(e.target.value) || null })} className="h-8 text-sm" placeholder="z.B. 80000" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Kinder</Label>
                <Input type="number" min={0} value={f.children_count} onChange={(e) => set({ children_count: Number(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <RadioGroup value={f.tax_assessment_type} onValueChange={(v) => set({ tax_assessment_type: v as TaxAssessmentType })} className="flex gap-3">
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="SPLITTING" id="edit-split" />
                  <Label htmlFor="edit-split" className="text-xs cursor-pointer">Splitting</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="SINGLE" id="edit-single" />
                  <Label htmlFor="edit-single" className="text-xs cursor-pointer">Einzel</Label>
                </div>
              </RadioGroup>
              <div className="flex items-center gap-1.5">
                <Checkbox id="edit-church" checked={f.church_tax} onCheckedChange={(c) => set({ church_tax: !!c })} />
                <Label htmlFor="edit-church" className="text-xs cursor-pointer">Kirchensteuer</Label>
              </div>
            </div>
          </div>
        )}
        
        {/* PRIVAT: Eigentümer */}
        {f.context_type === 'PRIVATE' && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Eigentümer</span>
            {editOwners.map((owner, idx) => (
              <div key={idx} className="p-2 bg-muted/40 rounded-lg space-y-2 relative">
                {editOwners.length > 1 && (
                  <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => onRemoveOwner(idx)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2 pr-6">
                  <Input placeholder="Vorname" value={owner.first_name} onChange={(e) => onUpdateOwner(idx, 'first_name', e.target.value)} className="h-7 text-xs" />
                  <Input placeholder="Nachname" value={owner.last_name} onChange={(e) => onUpdateOwner(idx, 'last_name', e.target.value)} className="h-7 text-xs" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={owner.tax_class} onValueChange={(v) => onUpdateOwner(idx, 'tax_class', v)}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Stkl." /></SelectTrigger>
                    <SelectContent>
                      {['I','II','III','IV','V','VI'].map(c => (<SelectItem key={c} value={c} className="text-xs">Steuerklasse {c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Anteil %" value={owner.ownership_share ?? ''} onChange={(e) => onUpdateOwner(idx, 'ownership_share', Number(e.target.value) || 0)} className="h-7 text-xs" />
                  <Input type="number" placeholder="Einkommen €" value={owner.gross_income_yearly ?? ''} onChange={(e) => onUpdateOwner(idx, 'gross_income_yearly', Number(e.target.value) || null)} className="h-7 text-xs" />
                </div>
                <Input placeholder="Beruf" value={owner.profession} onChange={(e) => onUpdateOwner(idx, 'profession', e.target.value)} className="h-7 text-xs" />
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={onAddOwner} className="text-xs h-7 w-full border border-dashed">
              <Plus className="h-3 w-3 mr-1" /> Eigentümer hinzufügen
            </Button>
          </div>
        )}
        
        {/* BUSINESS: Firmendaten */}
        {f.context_type === 'BUSINESS' && (
          <>
            <div className="space-y-3 p-3 bg-muted/40 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Geschäftsführer / Inhaber</span>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Anrede</Label>
                  <Select value={f.md_salutation} onValueChange={(v) => set({ md_salutation: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Anrede" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Herr">Herr</SelectItem>
                      <SelectItem value="Frau">Frau</SelectItem>
                      <SelectItem value="Divers">Divers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vorname</Label>
                  <Input value={f.md_first_name} onChange={(e) => set({ md_first_name: e.target.value })} placeholder="Max" className="h-8 text-sm" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Nachname</Label>
                  <Input value={f.md_last_name} onChange={(e) => set({ md_last_name: e.target.value })} placeholder="Mustermann" className="h-8 text-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-3 bg-muted/40 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registerdaten</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Rechtsform</Label>
                  <Select value={f.legal_form} onValueChange={(v) => set({ legal_form: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Rechtsform" /></SelectTrigger>
                    <SelectContent>
                      {['GmbH','UG','GmbH & Co. KG','KG','OHG','AG','e.K.'].map(lf => (
                        <SelectItem key={lf} value={lf}>{lf === 'UG' ? 'UG (haftungsbeschränkt)' : lf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Steuernummer</Label>
                  <Input value={f.tax_number} onChange={(e) => set({ tax_number: e.target.value })} placeholder="123/456/78901" className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Amtsgericht</Label>
                  <Input value={f.registry_court} onChange={(e) => set({ registry_court: e.target.value })} placeholder="Amtsgericht Leipzig" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Handelsregisternummer</Label>
                  <Input value={f.hrb_number} onChange={(e) => set({ hrb_number: e.target.value })} placeholder="HRB 12345" className="h-8 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">USt-ID</Label>
                <Input value={f.ust_id} onChange={(e) => set({ ust_id: e.target.value })} placeholder="DE123456789" className="h-8 text-sm" />
              </div>
            </div>

            <div className="space-y-3 p-3 bg-muted/40 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Steuersatz</span>
              <div className="space-y-1">
                <Label className="text-xs">Gesamtsteuersatz (%)</Label>
                <Input type="number" value={f.tax_rate_percent} onChange={(e) => set({ tax_rate_percent: Number(e.target.value) || 30 })} placeholder="30" className="h-8 text-sm" />
                <p className="text-xs text-muted-foreground">KSt + GewSt + Soli (Standard: 30%)</p>
              </div>
            </div>
          </>
        )}

        {/* Adresse */}
        <div className="space-y-3 p-3 bg-muted/40 rounded-lg">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Adresse (optional)</span>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Straße</Label>
              <Input value={f.street} onChange={(e) => set({ street: e.target.value })} placeholder="Musterstraße" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nr.</Label>
              <Input value={f.house_number} onChange={(e) => set({ house_number: e.target.value })} placeholder="15" className="h-8 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input value={f.postal_code} onChange={(e) => set({ postal_code: e.target.value })} placeholder="04103" className="h-8 text-sm" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Stadt</Label>
              <Input value={f.city} onChange={(e) => set({ city: e.target.value })} placeholder="Leipzig" className="h-8 text-sm" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel} className="flex-1">Abbrechen</Button>
          <Button size="sm" onClick={onSave} disabled={isPending} className="flex-1">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
