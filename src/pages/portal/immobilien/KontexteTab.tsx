import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, User, MapPin, Link2, Users, Pencil, Calculator, X, Loader2, Trash2 } from 'lucide-react';
import { CreateContextDialog } from '@/components/shared';
import { PropertyContextAssigner } from '@/components/shared/PropertyContextAssigner';
import { calculateTax, TaxAssessmentType } from '@/lib/taxCalculator';
import { toast } from 'sonner';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

interface LandlordContext {
  id: string;
  name: string;
  context_type: string;
  tax_regime: string | null;
  is_default: boolean | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  hrb_number: string | null;
  ust_id: string | null;
  legal_form: string | null;
  tax_rate_percent: number | null;
  managing_director: string | null;
  taxable_income_yearly?: number | null;
  tax_assessment_type?: string | null;
  church_tax?: boolean | null;
  children_count?: number | null;
  // NEW: Structured managing director fields
  md_salutation?: string | null;
  md_first_name?: string | null;
  md_last_name?: string | null;
  tax_number?: string | null;
  registry_court?: string | null;
}

interface ContextMember {
  id: string;
  context_id: string;
  first_name: string;
  last_name: string;
  ownership_share: number | null;
  birth_name: string | null;
  birth_date: string | null;
  tax_class: string | null;
  profession: string | null;
  gross_income_yearly: number | null;
  church_tax: boolean | null;
}

interface ContextFormData {
  name: string;
  context_type: 'PRIVATE' | 'BUSINESS';
  tax_rate_percent: number;
  taxable_income_yearly: number | null;
  tax_assessment_type: TaxAssessmentType;
  church_tax: boolean;
  children_count: number;
  // Business fields
  managing_director: string;
  legal_form: string;
  hrb_number: string;
  ust_id: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  // NEW: Structured managing director fields
  md_salutation: string;
  md_first_name: string;
  md_last_name: string;
  tax_number: string;
  registry_court: string;
}

interface OwnerData {
  id?: string;
  first_name: string;
  last_name: string;
  tax_class: string;
  ownership_share: number;
  gross_income_yearly: number | null;
  profession: string;
}

export function KontexteTab() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [assignerContext, setAssignerContext] = useState<{ id: string; name: string } | null>(null);
  
  // Inline editing state
  const [editingContextId, setEditingContextId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<ContextFormData | null>(null);
  const [editOwners, setEditOwners] = useState<OwnerData[]>([]);

  // Fetch landlord contexts
  const { data: contexts = [], isLoading } = useQuery({
    queryKey: ['landlord-contexts', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landlord_contexts')
        .select('*')
        .eq('tenant_id', activeTenantId!)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as LandlordContext[];
    },
    enabled: !!activeTenantId,
  });

  // Fetch context members
  const { data: membersByContext = new Map<string, ContextMember[]>() } = useQuery({
    queryKey: ['context-members', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('context_members')
        .select('id, context_id, first_name, last_name, ownership_share, birth_name, birth_date, tax_class, profession, gross_income_yearly, church_tax')
        .eq('tenant_id', activeTenantId!);
      
      if (error) throw error;
      
      const byContext = new Map<string, ContextMember[]>();
      data?.forEach(m => {
        const list = byContext.get(m.context_id) || [];
        list.push(m as ContextMember);
        byContext.set(m.context_id, list);
      });
      return byContext;
    },
    enabled: !!activeTenantId,
  });

  // Fetch property counts per context
  const { data: contextPropertyCounts = {} } = useQuery({
    queryKey: ['context-property-counts', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('context_property_assignment')
        .select('context_id, property_id')
        .eq('tenant_id', activeTenantId!);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(a => {
        counts[a.context_id] = (counts[a.context_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!activeTenantId,
  });

  // Update mutation
  const updateContextMutation = useMutation({
    mutationFn: async () => {
      if (!editingContextId || !editFormData || !activeTenantId) {
        throw new Error('Fehlende Daten');
      }

      // Calculate tax rate for private contexts
      let calculatedTaxRate = editFormData.tax_rate_percent;
      if (editFormData.context_type === 'PRIVATE' && editFormData.taxable_income_yearly) {
        const taxResult = calculateTax({
          taxableIncome: editFormData.taxable_income_yearly,
          assessmentType: editFormData.tax_assessment_type,
          childrenCount: editFormData.children_count,
          churchTax: editFormData.church_tax,
        });
        calculatedTaxRate = Math.round(taxResult.marginalTaxRate);
      }

      // Build managing_director from structured fields for backward compatibility
      const managingDirectorDisplay = editFormData.context_type === 'BUSINESS' && editFormData.md_first_name && editFormData.md_last_name
        ? `${editFormData.md_salutation ? editFormData.md_salutation + ' ' : ''}${editFormData.md_first_name} ${editFormData.md_last_name}`.trim()
        : editFormData.managing_director || null;

      // Update landlord_contexts
      const { error: ctxError } = await supabase
        .from('landlord_contexts')
        .update({
          name: editFormData.name,
          context_type: editFormData.context_type,
          tax_rate_percent: calculatedTaxRate,
          taxable_income_yearly: editFormData.context_type === 'PRIVATE' ? editFormData.taxable_income_yearly : null,
          tax_assessment_type: editFormData.context_type === 'PRIVATE' ? editFormData.tax_assessment_type : null,
          church_tax: editFormData.context_type === 'PRIVATE' ? editFormData.church_tax : null,
          children_count: editFormData.context_type === 'PRIVATE' ? editFormData.children_count : null,
          managing_director: managingDirectorDisplay,
          legal_form: editFormData.context_type === 'BUSINESS' ? editFormData.legal_form : null,
          hrb_number: editFormData.context_type === 'BUSINESS' ? editFormData.hrb_number : null,
          ust_id: editFormData.context_type === 'BUSINESS' ? editFormData.ust_id : null,
          // NEW: Structured fields
          md_salutation: editFormData.context_type === 'BUSINESS' ? editFormData.md_salutation || null : null,
          md_first_name: editFormData.context_type === 'BUSINESS' ? editFormData.md_first_name || null : null,
          md_last_name: editFormData.context_type === 'BUSINESS' ? editFormData.md_last_name || null : null,
          tax_number: editFormData.context_type === 'BUSINESS' ? editFormData.tax_number || null : null,
          registry_court: editFormData.context_type === 'BUSINESS' ? editFormData.registry_court || null : null,
          street: editFormData.street || null,
          house_number: editFormData.house_number || null,
          postal_code: editFormData.postal_code || null,
          city: editFormData.city || null,
        })
        .eq('id', editingContextId);
      
      if (ctxError) throw ctxError;

      // Update members: delete all and re-insert
      const { error: deleteError } = await supabase
        .from('context_members')
        .delete()
        .eq('context_id', editingContextId);
      
      if (deleteError) throw deleteError;

      // Insert updated members
      if (editOwners.length > 0 && editFormData.context_type === 'PRIVATE') {
        const membersToInsert = editOwners.map(o => ({
          context_id: editingContextId,
          tenant_id: activeTenantId,
          first_name: o.first_name,
          last_name: o.last_name,
          tax_class: o.tax_class,
          ownership_share: o.ownership_share,
          gross_income_yearly: o.gross_income_yearly,
          profession: o.profession,
        }));

        const { error: insertError } = await supabase
          .from('context_members')
          .insert(membersToInsert);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      toast.success('Vermietereinheit aktualisiert');
      queryClient.invalidateQueries({ queryKey: ['landlord-contexts'] });
      queryClient.invalidateQueries({ queryKey: ['context-members'] });
      setEditingContextId(null);
      setEditFormData(null);
      setEditOwners([]);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('Fehler beim Speichern');
    },
  });

  const handleStartEdit = (ctx: LandlordContext) => {
    const members = membersByContext.get(ctx.id) || [];
    
    setEditingContextId(ctx.id);
    setEditFormData({
      name: ctx.name,
      context_type: ctx.context_type as 'PRIVATE' | 'BUSINESS',
      tax_rate_percent: ctx.tax_rate_percent ?? 30,
      taxable_income_yearly: ctx.taxable_income_yearly ?? null,
      tax_assessment_type: (ctx.tax_assessment_type as TaxAssessmentType) || 'SPLITTING',
      church_tax: ctx.church_tax ?? false,
      children_count: ctx.children_count ?? 0,
      managing_director: ctx.managing_director || '',
      legal_form: ctx.legal_form || '',
      hrb_number: ctx.hrb_number || '',
      ust_id: ctx.ust_id || '',
      street: ctx.street || '',
      house_number: ctx.house_number || '',
      postal_code: ctx.postal_code || '',
      city: ctx.city || '',
      // NEW: Structured managing director fields
      md_salutation: ctx.md_salutation || '',
      md_first_name: ctx.md_first_name || '',
      md_last_name: ctx.md_last_name || '',
      tax_number: ctx.tax_number || '',
      registry_court: ctx.registry_court || '',
    });
    setEditOwners(members.map(m => ({
      id: m.id,
      first_name: m.first_name,
      last_name: m.last_name,
      tax_class: m.tax_class || 'I',
      ownership_share: m.ownership_share ?? 50,
      gross_income_yearly: m.gross_income_yearly,
      profession: m.profession || '',
    })));
  };

  const handleCancelEdit = () => {
    setEditingContextId(null);
    setEditFormData(null);
    setEditOwners([]);
  };

  const handleSave = () => {
    updateContextMutation.mutate();
  };

  const updateOwner = (idx: number, field: keyof OwnerData, value: any) => {
    setEditOwners(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  };

  const addOwner = () => {
    setEditOwners(prev => [...prev, {
      first_name: '',
      last_name: '',
      tax_class: 'I',
      ownership_share: 50,
      gross_income_yearly: null,
      profession: '',
    }]);
  };

  const removeOwner = (idx: number) => {
    setEditOwners(prev => prev.filter((_, i) => i !== idx));
  };

  const formatAddress = (ctx: LandlordContext) => {
    const parts = [ctx.street, ctx.house_number].filter(Boolean).join(' ');
    const cityParts = [ctx.postal_code, ctx.city].filter(Boolean).join(' ');
    return [parts, cityParts].filter(Boolean).join(', ') || null;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Context Card View Component
  const ContextCardView = ({ ctx, members, propertyCount }: { 
    ctx: LandlordContext; 
    members: ContextMember[];
    propertyCount: number;
  }) => {
    const isPrivate = ctx.context_type === 'PRIVATE';
    
    return (
      <Card className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)]">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted shrink-0">
              {isPrivate ? <Users className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base truncate">{ctx.name}</CardTitle>
                <Badge variant={isPrivate ? 'secondary' : 'default'} className="shrink-0">
                  {isPrivate ? 'Privat' : 'Geschäftlich'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isPrivate && ctx.taxable_income_yearly ? (
                  <>
                    <Calculator className="inline h-3 w-3 mr-1" />
                    {ctx.tax_rate_percent ?? 30}% Grenzsteuersatz · zVE {formatCurrency(ctx.taxable_income_yearly)} 
                    · {ctx.tax_assessment_type === 'SPLITTING' ? 'Splitting' : 'Einzel'}
                    {ctx.children_count && ctx.children_count > 0 && (
                      <span className="ml-1">· {ctx.children_count} Kind(er)</span>
                    )}
                  </>
                ) : (
                  <>
                    {ctx.tax_rate_percent ?? 30}% Steuersatz
                    {ctx.legal_form && ` · ${ctx.legal_form}`}
                  </>
                )}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 pt-0">
          {isPrivate && members.length > 0 && (
            <div className="border-t pt-3">
              <div className="grid grid-cols-2 gap-2">
                {members.map(member => (
                  <div key={member.id} className="text-sm p-2 bg-muted/40 rounded-md space-y-0.5">
                    <p className="font-medium truncate">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[
                        member.birth_name && `geb. ${member.birth_name}`,
                        member.tax_class && `Stkl. ${member.tax_class}`,
                      ].filter(Boolean).join(' · ') || '–'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[
                        member.profession,
                        member.gross_income_yearly && formatCurrency(member.gross_income_yearly),
                      ].filter(Boolean).join(' · ') || '–'}
                    </p>
                    {member.ownership_share && (
                      <p className="text-xs font-medium text-primary">
                        {member.ownership_share}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isPrivate && (
            <div className="border-t pt-3 space-y-1 text-sm">
              {/* Display structured GF name or fallback to managing_director */}
              {(ctx.md_first_name || ctx.md_last_name || ctx.managing_director) && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    GF: {ctx.md_first_name || ctx.md_last_name 
                      ? `${ctx.md_salutation ? ctx.md_salutation + ' ' : ''}${ctx.md_first_name || ''} ${ctx.md_last_name || ''}`.trim()
                      : ctx.managing_director}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground truncate">
                {[
                  ctx.registry_court && ctx.hrb_number && `${ctx.registry_court}, HRB ${ctx.hrb_number}`,
                  !ctx.registry_court && ctx.hrb_number && `HRB: ${ctx.hrb_number}`,
                  ctx.tax_number && `StNr: ${ctx.tax_number}`,
                  ctx.ust_id && `USt-ID: ${ctx.ust_id}`,
                ].filter(Boolean).join(' · ') || '–'}
              </p>
            </div>
          )}

          {formatAddress(ctx) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{formatAddress(ctx)}</span>
            </div>
          )}

          <div className="border-t pt-3 space-y-2">
            <Badge variant="outline" className="text-xs">
              {propertyCount} Objekt(e) zugeordnet
            </Badge>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                onClick={() => handleStartEdit(ctx)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Bearbeiten
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                onClick={() => setAssignerContext({ id: ctx.id, name: ctx.name })}
              >
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
                Zuordnen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Context Card Edit Component
  const ContextCardEdit = () => {
    if (!editFormData) return null;
    
    return (
      <Card className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] border-primary ring-2 ring-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Bearbeitung</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          
          {/* Typ Toggle */}
          <RadioGroup 
            value={editFormData.context_type} 
            onValueChange={(v) => setEditFormData({ ...editFormData, context_type: v as 'PRIVATE' | 'BUSINESS' })}
          >
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
          {editFormData.context_type === 'PRIVATE' && (
            <div className="space-y-3 p-3 bg-muted/40 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Steuerbasis</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">zVE (€/Jahr)</Label>
                  <Input
                    type="number"
                    value={editFormData.taxable_income_yearly ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, taxable_income_yearly: Number(e.target.value) || null })}
                    className="h-8 text-sm"
                    placeholder="z.B. 80000"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kinder</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editFormData.children_count}
                    onChange={(e) => setEditFormData({ ...editFormData, children_count: Number(e.target.value) || 0 })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <RadioGroup 
                  value={editFormData.tax_assessment_type} 
                  onValueChange={(v) => setEditFormData({ ...editFormData, tax_assessment_type: v as TaxAssessmentType })}
                  className="flex gap-3"
                >
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
                  <Checkbox 
                    id="edit-church"
                    checked={editFormData.church_tax} 
                    onCheckedChange={(c) => setEditFormData({ ...editFormData, church_tax: !!c })} 
                  />
                  <Label htmlFor="edit-church" className="text-xs cursor-pointer">Kirchensteuer</Label>
                </div>
              </div>
            </div>
          )}
          
          {/* PRIVAT: Eigentümer */}
          {editFormData.context_type === 'PRIVATE' && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Eigentümer</span>
              {editOwners.map((owner, idx) => (
                <div key={idx} className="p-2 bg-muted/40 rounded-lg space-y-2 relative">
                  {editOwners.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-1 right-1 h-5 w-5 text-muted-foreground hover:text-destructive"
                      onClick={() => removeOwner(idx)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-2 pr-6">
                    <Input
                      placeholder="Vorname"
                      value={owner.first_name}
                      onChange={(e) => updateOwner(idx, 'first_name', e.target.value)}
                      className="h-7 text-xs"
                    />
                    <Input
                      placeholder="Nachname"
                      value={owner.last_name}
                      onChange={(e) => updateOwner(idx, 'last_name', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={owner.tax_class} onValueChange={(v) => updateOwner(idx, 'tax_class', v)}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Stkl." />
                      </SelectTrigger>
                      <SelectContent>
                        {['I','II','III','IV','V','VI'].map(c => (
                          <SelectItem key={c} value={c} className="text-xs">Steuerklasse {c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Anteil %"
                      value={owner.ownership_share ?? ''}
                      onChange={(e) => updateOwner(idx, 'ownership_share', Number(e.target.value) || 0)}
                      className="h-7 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Einkommen €"
                      value={owner.gross_income_yearly ?? ''}
                      onChange={(e) => updateOwner(idx, 'gross_income_yearly', Number(e.target.value) || null)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <Input
                    placeholder="Beruf"
                    value={owner.profession}
                    onChange={(e) => updateOwner(idx, 'profession', e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addOwner} className="text-xs h-7 w-full border border-dashed">
                <Plus className="h-3 w-3 mr-1" /> Eigentümer hinzufügen
              </Button>
            </div>
          )}
          
          {/* BUSINESS: Firmendaten */}
          {editFormData.context_type === 'BUSINESS' && (
            <>
              {/* Geschäftsführer / Inhaber */}
              <div className="space-y-3 p-3 bg-muted/40 rounded-lg">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Geschäftsführer / Inhaber</span>
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Anrede</Label>
                    <Select 
                      value={editFormData.md_salutation} 
                      onValueChange={(v) => setEditFormData({ ...editFormData, md_salutation: v })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Anrede" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Herr">Herr</SelectItem>
                        <SelectItem value="Frau">Frau</SelectItem>
                        <SelectItem value="Divers">Divers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Vorname</Label>
                    <Input 
                      value={editFormData.md_first_name}
                      onChange={(e) => setEditFormData({ ...editFormData, md_first_name: e.target.value })}
                      placeholder="Max" 
                      className="h-8 text-sm" 
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Nachname</Label>
                    <Input 
                      value={editFormData.md_last_name}
                      onChange={(e) => setEditFormData({ ...editFormData, md_last_name: e.target.value })}
                      placeholder="Mustermann" 
                      className="h-8 text-sm" 
                    />
                  </div>
                </div>
              </div>

              {/* Registerdaten */}
              <div className="space-y-3 p-3 bg-muted/40 rounded-lg">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registerdaten</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Rechtsform</Label>
                    <Select 
                      value={editFormData.legal_form} 
                      onValueChange={(v) => setEditFormData({ ...editFormData, legal_form: v })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Rechtsform" />
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
                  <div className="space-y-1">
                    <Label className="text-xs">Steuernummer</Label>
                    <Input 
                      value={editFormData.tax_number}
                      onChange={(e) => setEditFormData({ ...editFormData, tax_number: e.target.value })}
                      placeholder="123/456/78901" 
                      className="h-8 text-sm" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Amtsgericht</Label>
                    <Input 
                      value={editFormData.registry_court}
                      onChange={(e) => setEditFormData({ ...editFormData, registry_court: e.target.value })}
                      placeholder="Amtsgericht Leipzig" 
                      className="h-8 text-sm" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Handelsregisternummer</Label>
                    <Input 
                      value={editFormData.hrb_number}
                      onChange={(e) => setEditFormData({ ...editFormData, hrb_number: e.target.value })}
                      placeholder="HRB 12345" 
                      className="h-8 text-sm" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">USt-ID</Label>
                  <Input 
                    value={editFormData.ust_id}
                    onChange={(e) => setEditFormData({ ...editFormData, ust_id: e.target.value })}
                    placeholder="DE123456789" 
                    className="h-8 text-sm" 
                  />
                </div>
              </div>

              {/* Steuersatz */}
              <div className="space-y-3 p-3 bg-muted/40 rounded-lg">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Steuersatz</span>
                <div className="space-y-1">
                  <Label className="text-xs">Gesamtsteuersatz (%)</Label>
                  <Input 
                    type="number"
                    value={editFormData.tax_rate_percent}
                    onChange={(e) => setEditFormData({ ...editFormData, tax_rate_percent: Number(e.target.value) || 30 })}
                    placeholder="30" 
                    className="h-8 text-sm" 
                  />
                  <p className="text-xs text-muted-foreground">KSt + GewSt + Soli (Standard: 30%)</p>
                </div>
              </div>
            </>
          )}

          {/* Adresse (für beide Typen) */}
          <div className="space-y-3 p-3 bg-muted/40 rounded-lg">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Adresse (optional)</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Straße</Label>
                <Input 
                  value={editFormData.street}
                  onChange={(e) => setEditFormData({ ...editFormData, street: e.target.value })}
                  placeholder="Musterstraße" 
                  className="h-8 text-sm" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nr.</Label>
                <Input 
                  value={editFormData.house_number}
                  onChange={(e) => setEditFormData({ ...editFormData, house_number: e.target.value })}
                  placeholder="15" 
                  className="h-8 text-sm" 
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">PLZ</Label>
                <Input 
                  value={editFormData.postal_code}
                  onChange={(e) => setEditFormData({ ...editFormData, postal_code: e.target.value })}
                  placeholder="04103" 
                  className="h-8 text-sm" 
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Stadt</Label>
                <Input 
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  placeholder="Leipzig" 
                  className="h-8 text-sm" 
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleCancelEdit} className="flex-1">
              Abbrechen
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={updateContextMutation.isPending} 
              className="flex-1"
            >
              {updateContextMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Speichern'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageShell>
      <ModulePageHeader title="Vermietereinheiten" description="Verwalte deine steuerlichen Kontexte für die Immobilienbewertung" />

      {/* Context Cards Grid */}
      {isLoading ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            Lade Vermietereinheiten...
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-4">
          {contexts.map((ctx) => {
            const isEditing = editingContextId === ctx.id;
            const members = membersByContext.get(ctx.id) || [];
            const propertyCount = contextPropertyCounts[ctx.id] || 0;
            
            return isEditing ? (
              <ContextCardEdit key={ctx.id} />
            ) : (
              <ContextCardView 
                key={ctx.id} 
                ctx={ctx} 
                members={members}
                propertyCount={propertyCount}
              />
            );
          })}

          {/* Add New Context Card */}
          <Card 
            className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] border-dashed cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
            onClick={() => setShowCreateDialog(true)}
          >
            <CardContent className="flex flex-col items-center justify-center py-12 h-full min-h-[200px]">
              <div className="p-3 rounded-full bg-muted mb-3">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">Neue Vermietereinheit</p>
              <p className="text-xs text-muted-foreground mt-1">anlegen</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info-Box */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Hinweis:</strong> Vermietereinheiten ermöglichen die Trennung von Objekten nach 
            unterschiedlichen steuerlichen Regimes oder Eigentümerstrukturen (z.B. Ehepaar, Gesellschaft). 
            Der hinterlegte Steuersatz wird für Renditeberechnungen verwendet.
          </p>
        </CardContent>
      </Card>

      {/* Create Dialog - nur für Neuanlage */}
      <CreateContextDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />

      {/* Property Assigner Dialog */}
      {assignerContext && (
        <PropertyContextAssigner
          open={!!assignerContext}
          onOpenChange={(open) => !open && setAssignerContext(null)}
          contextId={assignerContext.id}
          contextName={assignerContext.name}
        />
      )}
    </PageShell>
  );
}
