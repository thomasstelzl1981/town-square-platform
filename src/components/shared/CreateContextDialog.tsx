import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Building2, User, Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Extended interface for landlord context with all fields
interface LandlordContext {
  id: string;
  name: string;
  context_type: string;
  tax_regime: string | null;
  tax_rate_percent: number | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  hrb_number: string | null;
  ust_id: string | null;
  legal_form: string | null;
  managing_director: string | null;
  is_default: boolean | null;
}

interface CreateContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editContext?: LandlordContext | null; // NEU: Für Bearbeitung
}

interface OwnerData {
  id?: string; // For existing members
  first_name: string;
  last_name: string;
  birth_name: string;
  birth_date: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  email: string;
  phone: string;
  ownership_share: number;
  // NEU: Steuerdaten
  tax_class: string;
  profession: string;
  gross_income_yearly: number | null;
  church_tax: boolean;
}

interface ContextFormData {
  name: string;
  context_type: 'PRIVATE' | 'BUSINESS';
  tax_rate_percent: number;
  // Adresse der Vermietereinheit / Firmenadresse
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  // Business fields
  hrb_number: string;
  ust_id: string;
  legal_form: string;
  managing_director: string;
}

const emptyOwner: OwnerData = {
  first_name: '',
  last_name: '',
  birth_name: '',
  birth_date: '',
  street: '',
  house_number: '',
  postal_code: '',
  city: '',
  email: '',
  phone: '',
  ownership_share: 50,
  // NEU: Steuerdaten
  tax_class: 'I',
  profession: '',
  gross_income_yearly: null,
  church_tax: false,
};

const defaultFormData: ContextFormData = {
  name: '',
  context_type: 'PRIVATE',
  tax_rate_percent: 30,
  street: '',
  house_number: '',
  postal_code: '',
  city: '',
  hrb_number: '',
  ust_id: '',
  legal_form: 'GmbH',
  managing_director: '',
};

export function CreateContextDialog({ open, onOpenChange, editContext }: CreateContextDialogProps) {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<ContextFormData>(defaultFormData);
  const [owners, setOwners] = useState<OwnerData[]>([{ ...emptyOwner }, { ...emptyOwner }]);
  
  const isEditMode = !!editContext;

  // Load existing context members when editing
  const { data: existingMembers } = useQuery({
    queryKey: ['context-members-edit', editContext?.id],
    queryFn: async () => {
      if (!editContext?.id) return [];
      const { data, error } = await supabase
        .from('context_members')
        .select('*')
        .eq('context_id', editContext.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!editContext?.id && open,
  });

  // Load form data when editing
  useEffect(() => {
    if (editContext && open) {
      setFormData({
        name: editContext.name || '',
        context_type: (editContext.context_type as 'PRIVATE' | 'BUSINESS') || 'PRIVATE',
        tax_rate_percent: editContext.tax_rate_percent ?? 30,
        street: editContext.street || '',
        house_number: editContext.house_number || '',
        postal_code: editContext.postal_code || '',
        city: editContext.city || '',
        hrb_number: editContext.hrb_number || '',
        ust_id: editContext.ust_id || '',
        legal_form: editContext.legal_form || 'GmbH',
        managing_director: editContext.managing_director || '',
      });
      setStep(1);
    }
  }, [editContext, open]);

  // Load existing members when editing
  useEffect(() => {
    if (existingMembers && existingMembers.length > 0) {
      const mappedOwners: OwnerData[] = existingMembers.map((m: any) => ({
        id: m.id,
        first_name: m.first_name || '',
        last_name: m.last_name || '',
        birth_name: m.birth_name || '',
        birth_date: m.birth_date || '',
        street: m.street || '',
        house_number: m.house_number || '',
        postal_code: m.postal_code || '',
        city: m.city || '',
        email: m.email || '',
        phone: m.phone || '',
        ownership_share: m.ownership_share || 50,
        tax_class: m.tax_class || 'I',
        profession: m.profession || '',
        gross_income_yearly: m.gross_income_yearly || null,
        church_tax: m.church_tax || false,
      }));
      setOwners(mappedOwners);
    } else if (!editContext) {
      // Reset to defaults for new context
      setOwners([{ ...emptyOwner }, { ...emptyOwner }]);
    }
  }, [existingMembers, editContext]);

  const resetForm = () => {
    setFormData(defaultFormData);
    setOwners([{ ...emptyOwner }, { ...emptyOwner }]);
    setStep(1);
  };

  const saveContext = useMutation({
    mutationFn: async () => {
      if (!activeTenantId) throw new Error('Keine Organisation aktiv');
      
      const contextData = {
        tenant_id: activeTenantId,
        name: formData.name,
        context_type: formData.context_type,
        tax_rate_percent: formData.tax_rate_percent,
        street: formData.street || null,
        house_number: formData.house_number || null,
        postal_code: formData.postal_code || null,
        city: formData.city || null,
        hrb_number: formData.context_type === 'BUSINESS' ? formData.hrb_number || null : null,
        ust_id: formData.context_type === 'BUSINESS' ? formData.ust_id || null : null,
        legal_form: formData.context_type === 'BUSINESS' ? formData.legal_form || null : null,
        managing_director: formData.context_type === 'BUSINESS' ? formData.managing_director || null : null,
        // Remove tax_regime for private, use simple rate
        tax_regime: formData.context_type === 'BUSINESS' ? 'EÜR' : null,
      };
      
      let contextId: string;
      
      if (isEditMode && editContext) {
        // UPDATE existing context
        const { error: updateError } = await supabase
          .from('landlord_contexts')
          .update(contextData)
          .eq('id', editContext.id);
        
        if (updateError) throw updateError;
        contextId = editContext.id;
        
        // Delete existing members and recreate
        if (formData.context_type === 'PRIVATE') {
          await supabase
            .from('context_members')
            .delete()
            .eq('context_id', contextId);
        }
      } else {
        // INSERT new context
        const { data: context, error: ctxError } = await supabase
          .from('landlord_contexts')
          .insert({
            ...contextData,
            is_default: false,
          })
          .select('id')
          .single();
        
        if (ctxError) throw ctxError;
        contextId = context.id;
      }
      
      // Create context_members for PRIVATE contexts
      if (formData.context_type === 'PRIVATE' && owners.length > 0) {
        const validOwners = owners.filter(o => o.first_name && o.last_name);
        
        if (validOwners.length > 0) {
          const membersToInsert = validOwners.map(o => ({
            tenant_id: activeTenantId,
            context_id: contextId,
            first_name: o.first_name,
            last_name: o.last_name,
            birth_name: o.birth_name || null,
            birth_date: o.birth_date || null,
            street: o.street || null,
            house_number: o.house_number || null,
            postal_code: o.postal_code || null,
            city: o.city || null,
            email: o.email || null,
            phone: o.phone || null,
            ownership_share: o.ownership_share || null,
            // NEU: Steuerdaten
            tax_class: o.tax_class || null,
            profession: o.profession || null,
            gross_income_yearly: o.gross_income_yearly || null,
            church_tax: o.church_tax || false,
          }));
          
          const { error: membersError } = await supabase
            .from('context_members')
            .insert(membersToInsert);
          
          if (membersError) throw membersError;
        }
      }
      
      return { id: contextId };
    },
    onSuccess: () => {
      toast.success(isEditMode 
        ? 'Vermietereinheit erfolgreich aktualisiert' 
        : 'Vermietereinheit erfolgreich angelegt'
      );
      queryClient.invalidateQueries({ queryKey: ['landlord-contexts'] });
      queryClient.invalidateQueries({ queryKey: ['context-members'] });
      queryClient.invalidateQueries({ queryKey: ['sender-contexts'] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern: ' + error.message);
    },
  });

  const handleSubmit = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        toast.error('Bitte geben Sie einen Namen ein');
        return;
      }
      setStep(2);
    } else {
      // Step 2 - Validate and submit
      if (formData.context_type === 'PRIVATE') {
        const validOwners = owners.filter(o => o.first_name && o.last_name);
        if (validOwners.length === 0) {
          toast.error('Bitte geben Sie mindestens einen Eigentümer an');
          return;
        }
      }
      saveContext.mutate();
    }
  };

  const updateField = <K extends keyof ContextFormData>(field: K, value: ContextFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateOwner = (index: number, field: keyof OwnerData, value: any) => {
    setOwners(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addOwner = () => {
    setOwners(prev => [...prev, { ...emptyOwner, ownership_share: 0 }]);
  };

  const removeOwner = (index: number) => {
    if (owners.length <= 1) return;
    setOwners(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 
              ? (isEditMode ? 'Vermietereinheit bearbeiten' : 'Vermietereinheit anlegen')
              : formData.context_type === 'PRIVATE' 
                ? 'Eigentümer erfassen' 
                : 'Gesellschaftsdaten'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? (isEditMode 
                  ? 'Ändern Sie die Grunddaten der Vermietereinheit.'
                  : 'Erstellen Sie eine neue Vermietereinheit für die steuerliche oder organisatorische Trennung.')
              : formData.context_type === 'PRIVATE'
                ? 'Erfassen Sie die Eigentümer mit Steuerdaten.'
                : 'Ergänzen Sie die Gesellschaftsdaten und Firmenadresse.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          /* STEP 1: Basic Context Data */
          <div className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name der Vermietereinheit *</Label>
              <Input
                id="name"
                placeholder="z.B. Familie Mustermann oder Muster Immobilien GmbH"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>

            {/* Typ */}
            <div className="space-y-3">
              <Label>Typ</Label>
              <RadioGroup
                value={formData.context_type}
                onValueChange={(v) => updateField('context_type', v as 'PRIVATE' | 'BUSINESS')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PRIVATE" id="private" />
                  <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer font-normal">
                    <User className="h-4 w-4" />
                    Privat (Einzelperson/Ehepaar)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BUSINESS" id="business" />
                  <Label htmlFor="business" className="flex items-center gap-2 cursor-pointer font-normal">
                    <Building2 className="h-4 w-4" />
                    Gesellschaft
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Steuersatz - für beide Typen */}
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Steuersatz (%)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="tax_rate"
                  type="number"
                  min={0}
                  max={100}
                  className="w-24"
                  value={formData.tax_rate_percent}
                  onChange={(e) => updateField('tax_rate_percent', parseFloat(e.target.value) || 30)}
                />
                <span className="text-sm text-muted-foreground">
                  {formData.context_type === 'PRIVATE' 
                    ? 'Persönlicher Grenzsteuersatz (für Renditeberechnungen)' 
                    : 'Gesamtsteuersatz (KSt + GewSt, Default 30%)'}
                </span>
              </div>
            </div>

            <Separator />

            {/* Adresse für Briefkopf / Korrespondenz */}
            <div className="space-y-2">
              <Label>
                {formData.context_type === 'PRIVATE' 
                  ? 'Adresse (für Briefkopf/Korrespondenz)' 
                  : 'Firmenadresse *'}
              </Label>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  placeholder="Straße"
                  value={formData.street}
                  onChange={(e) => updateField('street', e.target.value)}
                  className="col-span-3"
                />
                <Input
                  placeholder="Nr."
                  value={formData.house_number}
                  onChange={(e) => updateField('house_number', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="PLZ"
                  value={formData.postal_code}
                  onChange={(e) => updateField('postal_code', e.target.value)}
                />
                <Input
                  placeholder="Ort"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="col-span-2"
                />
              </div>
            </div>
          </div>
        ) : formData.context_type === 'PRIVATE' ? (
          /* STEP 2a: Private - Owners with Tax Data */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Eigentümer</Label>
              <Button type="button" variant="outline" size="sm" onClick={addOwner}>
                <Plus className="h-4 w-4 mr-1" />
                Weiteren hinzufügen
              </Button>
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(owners.length, 2)}, 1fr)` }}>
              {owners.map((owner, idx) => (
                <div key={idx} className="space-y-3 p-4 border rounded-lg relative">
                  {owners.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => removeOwner(idx)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                  <p className="text-sm font-medium text-muted-foreground">Eigentümer {idx + 1}</p>
                  
                  {/* Persönliche Daten */}
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Persönliche Daten</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Vorname *</Label>
                      <Input
                        value={owner.first_name}
                        onChange={(e) => updateOwner(idx, 'first_name', e.target.value)}
                        placeholder="Vorname"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nachname *</Label>
                      <Input
                        value={owner.last_name}
                        onChange={(e) => updateOwner(idx, 'last_name', e.target.value)}
                        placeholder="Nachname"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Geburtsname</Label>
                      <Input
                        value={owner.birth_name}
                        onChange={(e) => updateOwner(idx, 'birth_name', e.target.value)}
                        placeholder="Geburtsname"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Geburtsdatum</Label>
                      <Input
                        type="date"
                        value={owner.birth_date}
                        onChange={(e) => updateOwner(idx, 'birth_date', e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* NEU: Steuerdaten */}
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Steuerdaten</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Steuerklasse</Label>
                      <Select
                        value={owner.tax_class}
                        onValueChange={(v) => updateOwner(idx, 'tax_class', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Steuerklasse" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="I">I - Ledig</SelectItem>
                          <SelectItem value="II">II - Alleinerziehend</SelectItem>
                          <SelectItem value="III">III - Verheiratet (höheres Einkommen)</SelectItem>
                          <SelectItem value="IV">IV - Verheiratet (gleiches Einkommen)</SelectItem>
                          <SelectItem value="V">V - Verheiratet (niedrigeres Einkommen)</SelectItem>
                          <SelectItem value="VI">VI - Zweitjob</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Beruf</Label>
                      <Input
                        value={owner.profession}
                        onChange={(e) => updateOwner(idx, 'profession', e.target.value)}
                        placeholder="z.B. Software-Entwickler"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Bruttoeinkommen p.a. (€)</Label>
                      <Input
                        type="number"
                        value={owner.gross_income_yearly || ''}
                        onChange={(e) => updateOwner(idx, 'gross_income_yearly', parseFloat(e.target.value) || null)}
                        placeholder="z.B. 72000"
                      />
                    </div>
                    <div className="space-y-1 flex items-end pb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`church-${idx}`}
                          checked={owner.church_tax}
                          onCheckedChange={(checked) => updateOwner(idx, 'church_tax', !!checked)}
                        />
                        <Label htmlFor={`church-${idx}`} className="text-xs cursor-pointer">Kirchensteuer</Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Adresse */}
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Adresse</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1 col-span-3">
                      <Label className="text-xs">Straße</Label>
                      <Input
                        value={owner.street}
                        onChange={(e) => updateOwner(idx, 'street', e.target.value)}
                        placeholder="Straße"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nr.</Label>
                      <Input
                        value={owner.house_number}
                        onChange={(e) => updateOwner(idx, 'house_number', e.target.value)}
                        placeholder="Nr."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">PLZ</Label>
                      <Input
                        value={owner.postal_code}
                        onChange={(e) => updateOwner(idx, 'postal_code', e.target.value)}
                        placeholder="PLZ"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">Ort</Label>
                      <Input
                        value={owner.city}
                        onChange={(e) => updateOwner(idx, 'city', e.target.value)}
                        placeholder="Ort"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Kontakt & Anteil */}
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kontakt & Anteil</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">E-Mail</Label>
                      <Input
                        type="email"
                        value={owner.email}
                        onChange={(e) => updateOwner(idx, 'email', e.target.value)}
                        placeholder="E-Mail"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Telefon</Label>
                      <Input
                        value={owner.phone}
                        onChange={(e) => updateOwner(idx, 'phone', e.target.value)}
                        placeholder="Telefon"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Eigentumsanteil (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={owner.ownership_share}
                      onChange={(e) => updateOwner(idx, 'ownership_share', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* STEP 2b: Business - Company Details */
          <div className="space-y-4">
            {/* Gesellschaftsangaben */}
            <p className="text-sm font-medium text-muted-foreground">Gesellschaftsangaben</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rechtsform</Label>
                <Select
                  value={formData.legal_form}
                  onValueChange={(v) => updateField('legal_form', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GmbH">GmbH</SelectItem>
                    <SelectItem value="UG">UG (haftungsbeschränkt)</SelectItem>
                    <SelectItem value="GmbH & Co. KG">GmbH & Co. KG</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="OHG">OHG</SelectItem>
                    <SelectItem value="AG">AG</SelectItem>
                    <SelectItem value="e.K.">e.K.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="managing_director">Geschäftsführer</Label>
                <Input
                  id="managing_director"
                  placeholder="z.B. Hans Müller"
                  value={formData.managing_director}
                  onChange={(e) => updateField('managing_director', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hrb">HRB-Nummer</Label>
                <Input
                  id="hrb"
                  placeholder="z.B. HRB 12345 B"
                  value={formData.hrb_number}
                  onChange={(e) => updateField('hrb_number', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ust">USt-IdNr.</Label>
                <Input
                  id="ust"
                  placeholder="z.B. DE123456789"
                  value={formData.ust_id}
                  onChange={(e) => updateField('ust_id', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Steuersatz Zusammenfassung */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <strong>Gesamtsteuersatz:</strong> {formData.tax_rate_percent}%
                <span className="text-muted-foreground ml-2">
                  (wird für Renditeberechnungen verwendet)
                </span>
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          {step === 2 && (
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={saveContext.isPending}>
              {saveContext.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {step === 1 ? (
                <>
                  Weiter
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                isEditMode ? 'Speichern' : 'Anlegen'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
