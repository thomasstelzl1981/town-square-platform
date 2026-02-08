import { useState, useEffect, useMemo } from 'react';
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
import { Loader2, Building2, User, Plus, Trash2, ArrowRight, ArrowLeft, Calculator, Info, Users, Baby } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateTax, TaxAssessmentType } from '@/lib/taxCalculator';

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
  // Private tax basis fields (optional for compatibility)
  taxable_income_yearly?: number | null;
  tax_assessment_type?: string | null;
  church_tax?: boolean | null;
  children_count?: number | null;
}

interface CreateContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editContext?: LandlordContext | null;
}

interface OwnerData {
  id?: string;
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
  tax_class: string;
  profession: string;
  gross_income_yearly: number | null;
  church_tax: boolean;
}

interface ContextFormData {
  name: string;
  context_type: 'PRIVATE' | 'BUSINESS';
  tax_rate_percent: number;
  // Adresse
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  // Business fields
  hrb_number: string;
  ust_id: string;
  legal_form: string;
  managing_director: string;
  // NEW: Private tax basis
  taxable_income_yearly: number | null;
  tax_assessment_type: TaxAssessmentType;
  church_tax: boolean;
  children_count: number;
  // NEW: Structured managing director fields
  md_salutation: string;
  md_first_name: string;
  md_last_name: string;
  tax_number: string;
  registry_court: string;
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
  // NEW: Private tax basis defaults
  taxable_income_yearly: null,
  tax_assessment_type: 'SPLITTING',
  church_tax: false,
  children_count: 0,
  // NEW: Structured managing director defaults
  md_salutation: '',
  md_first_name: '',
  md_last_name: '',
  tax_number: '',
  registry_court: '',
};

export function CreateContextDialog({ open, onOpenChange, editContext }: CreateContextDialogProps) {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<ContextFormData>(defaultFormData);
  const [owners, setOwners] = useState<OwnerData[]>([{ ...emptyOwner }, { ...emptyOwner }]);
  
  const isEditMode = !!editContext;

  // Calculate tax automatically for PRIVATE
  const calculatedTax = useMemo(() => {
    if (formData.context_type !== 'PRIVATE' || !formData.taxable_income_yearly) {
      return null;
    }
    return calculateTax({
      taxableIncome: formData.taxable_income_yearly,
      assessmentType: formData.tax_assessment_type,
      churchTax: formData.church_tax,
      childrenCount: formData.children_count,
    });
  }, [formData.taxable_income_yearly, formData.tax_assessment_type, formData.church_tax, formData.children_count, formData.context_type]);

  // Auto-update tax_rate_percent based on calculation (only for PRIVATE)
  useEffect(() => {
    if (formData.context_type === 'PRIVATE' && calculatedTax) {
      setFormData(prev => ({
        ...prev,
        tax_rate_percent: calculatedTax.marginalTaxRate,
      }));
    }
  }, [calculatedTax, formData.context_type]);

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
        // NEW: Load private tax basis
        taxable_income_yearly: editContext.taxable_income_yearly ?? null,
        tax_assessment_type: (editContext.tax_assessment_type as TaxAssessmentType) || 'SPLITTING',
        church_tax: editContext.church_tax ?? false,
        children_count: editContext.children_count ?? 0,
        // NEW: Load structured managing director fields
        md_salutation: '',
        md_first_name: '',
        md_last_name: '',
        tax_number: '',
        registry_court: '',
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
      
      // Build managing_director from structured fields for backward compatibility
      const managingDirectorDisplay = formData.context_type === 'BUSINESS' && formData.md_first_name && formData.md_last_name
        ? `${formData.md_salutation ? formData.md_salutation + ' ' : ''}${formData.md_first_name} ${formData.md_last_name}`.trim()
        : formData.managing_director || null;
      
      const contextData = {
        tenant_id: activeTenantId,
        name: formData.name,
        context_type: formData.context_type,
        tax_rate_percent: formData.tax_rate_percent,
        street: formData.street || null,
        house_number: formData.house_number || null,
        postal_code: formData.postal_code || null,
        city: formData.city || null,
        // Business fields
        hrb_number: formData.context_type === 'BUSINESS' ? formData.hrb_number || null : null,
        ust_id: formData.context_type === 'BUSINESS' ? formData.ust_id || null : null,
        legal_form: formData.context_type === 'BUSINESS' ? formData.legal_form || null : null,
        managing_director: managingDirectorDisplay,
        // NEW: Structured managing director fields
        md_salutation: formData.context_type === 'BUSINESS' ? formData.md_salutation || null : null,
        md_first_name: formData.context_type === 'BUSINESS' ? formData.md_first_name || null : null,
        md_last_name: formData.context_type === 'BUSINESS' ? formData.md_last_name || null : null,
        tax_number: formData.context_type === 'BUSINESS' ? formData.tax_number || null : null,
        registry_court: formData.context_type === 'BUSINESS' ? formData.registry_court || null : null,
        // Private tax basis fields
        tax_regime: formData.context_type === 'PRIVATE' ? formData.tax_assessment_type : null,
        taxable_income_yearly: formData.context_type === 'PRIVATE' ? formData.taxable_income_yearly : null,
        tax_assessment_type: formData.context_type === 'PRIVATE' ? formData.tax_assessment_type : null,
        church_tax: formData.context_type === 'PRIVATE' ? formData.church_tax : null,
        children_count: formData.context_type === 'PRIVATE' ? formData.children_count : null,
        // Store calculated marginal rate for simulations
        marginal_tax_rate: formData.context_type === 'PRIVATE' && calculatedTax 
          ? calculatedTax.marginalTaxRate / 100 
          : null,
      };
      
      let contextId: string;
      
      if (isEditMode && editContext) {
        const { error: updateError } = await supabase
          .from('landlord_contexts')
          .update(contextData)
          .eq('id', editContext.id);
        
        if (updateError) throw updateError;
        contextId = editContext.id;
        
        if (formData.context_type === 'PRIVATE') {
          await supabase
            .from('context_members')
            .delete()
            .eq('context_id', contextId);
        }
      } else {
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
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

            {/* PRIVATE: Tax Basis with automatic calculation */}
            {formData.context_type === 'PRIVATE' ? (
              <div className="p-4 border rounded-lg bg-primary/5 dark:bg-primary/10 space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <Label className="text-base font-medium">Steuerbasis (automatische Berechnung)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>Der Grenzsteuersatz wird automatisch nach dem BMF-Programmablaufplan berechnet, inkl. Soli (ab Freigrenze) und Kinderfreibeträge.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* zVE Input */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zve">Zu versteuerndes Einkommen (zVE) *</Label>
                    <div className="relative">
                      <Input
                        id="zve"
                        type="number"
                        placeholder="z.B. 98000"
                        value={formData.taxable_income_yearly ?? ''}
                        onChange={(e) => updateField('taxable_income_yearly', parseFloat(e.target.value) || null)}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Jährliches zu versteuerndes Einkommen des Haushalts</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Veranlagungsart</Label>
                    <Select
                      value={formData.tax_assessment_type}
                      onValueChange={(v) => updateField('tax_assessment_type', v as TaxAssessmentType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EINZEL">Einzelveranlagung</SelectItem>
                        <SelectItem value="SPLITTING">Zusammenveranlagung (Splitting)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Children & Church Tax */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="children" className="flex items-center gap-2">
                      <Baby className="h-4 w-4" />
                      Anzahl Kinder
                    </Label>
                    <Input
                      id="children"
                      type="number"
                      min={0}
                      max={10}
                      value={formData.children_count}
                      onChange={(e) => updateField('children_count', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">Für Kinderfreibeträge (4.656 € pro Kind)</p>
                  </div>

                  <div className="space-y-2 flex flex-col justify-center pt-6">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="church_tax"
                        checked={formData.church_tax}
                        onCheckedChange={(checked) => updateField('church_tax', !!checked)}
                      />
                      <Label htmlFor="church_tax" className="cursor-pointer">Kirchensteuerpflicht (9%)</Label>
                    </div>
                  </div>
                </div>

                {/* Calculated Result Box */}
                {calculatedTax && (
                  <div className="mt-4 p-3 bg-background rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Berechneter Grenzsteuersatz:</span>
                      <Badge variant="default" className="text-lg font-mono">
                        {calculatedTax.marginalTaxRate}%
                      </Badge>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Einkommensteuer:</span>
                        <span>{formatCurrency(calculatedTax.incomeTax)}</span>
                      </div>
                      {calculatedTax.solidaritySurcharge > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Soli:</span>
                          <span>{formatCurrency(calculatedTax.solidaritySurcharge)}</span>
                        </div>
                      )}
                      {calculatedTax.churchTax > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Kirchensteuer:</span>
                          <span>{formatCurrency(calculatedTax.churchTax)}</span>
                        </div>
                      )}
                      {calculatedTax.childAllowanceUsed && (
                        <div className="flex justify-between col-span-2">
                          <span className="text-muted-foreground">Kinderfreibetrag genutzt:</span>
                          <Badge variant="secondary" className="text-xs">Ja</Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Effektiver Steuersatz:</span>
                      <span className="font-medium">{calculatedTax.effectiveTaxRate}%</span>
                    </div>
                  </div>
                )}

                {!formData.taxable_income_yearly && (
                  <p className="text-sm text-warning">
                    ⚠️ Bitte geben Sie das zVE ein, um den Steuersatz automatisch zu berechnen.
                  </p>
                )}
              </div>
            ) : (
              /* BUSINESS: Simple fixed tax rate */
              <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
                <Label htmlFor="tax_rate" className="text-sm font-medium">
                  Gesamtsteuersatz für Renditeberechnungen
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Input
                      id="tax_rate"
                      type="number"
                      min={0}
                      max={100}
                      className="w-24 pr-6"
                      value={formData.tax_rate_percent}
                      onChange={(e) => updateField('tax_rate_percent', parseFloat(e.target.value) || 30)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Effektiver Gesamtsteuersatz (KSt + GewSt + Soli). Standard: 30%
                </p>
              </div>
            )}

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

            <div className="grid gap-4 md:grid-cols-2 max-h-[50vh] overflow-y-auto pr-1">
              {owners.map((owner, idx) => (
                <div key={idx} className="space-y-3 p-3 border rounded-lg relative bg-muted/20">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Eigentümer {idx + 1}</p>
                    {owners.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeOwner(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  
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

                  {/* Steuerdaten */}
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
            {/* Geschäftsführer / Inhaber */}
            <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
              <p className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Geschäftsführer / Inhaber
              </p>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Anrede</Label>
                  <Select
                    value={formData.md_salutation}
                    onValueChange={(v) => updateField('md_salutation', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Anrede" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Herr">Herr</SelectItem>
                      <SelectItem value="Frau">Frau</SelectItem>
                      <SelectItem value="Divers">Divers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Vorname</Label>
                  <Input
                    placeholder="Max"
                    value={formData.md_first_name}
                    onChange={(e) => updateField('md_first_name', e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs">Nachname</Label>
                  <Input
                    placeholder="Mustermann"
                    value={formData.md_last_name}
                    onChange={(e) => updateField('md_last_name', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Registerdaten */}
            <p className="text-sm font-medium text-muted-foreground">Registerdaten</p>
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
                <Label htmlFor="tax_number">Steuernummer</Label>
                <Input
                  id="tax_number"
                  placeholder="z.B. 123/456/78901"
                  value={formData.tax_number}
                  onChange={(e) => updateField('tax_number', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registry_court">Amtsgericht</Label>
                <Input
                  id="registry_court"
                  placeholder="z.B. Amtsgericht Leipzig"
                  value={formData.registry_court}
                  onChange={(e) => updateField('registry_court', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hrb">Handelsregisternummer</Label>
                <Input
                  id="hrb"
                  placeholder="z.B. HRB 12345"
                  value={formData.hrb_number}
                  onChange={(e) => updateField('hrb_number', e.target.value)}
                />
              </div>
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

            <Separator />

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
