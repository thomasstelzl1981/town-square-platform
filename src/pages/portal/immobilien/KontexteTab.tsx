/**
 * KontexteTab — Orchestrator (R-4 Refactored)
 * Manages landlord contexts for tax regime separation
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { CreateContextDialog } from '@/components/shared';
import { PropertyContextAssigner } from '@/components/shared/PropertyContextAssigner';
import { calculateTax, TaxAssessmentType } from '@/lib/taxCalculator';
import { toast } from 'sonner';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { ContextCardView } from '@/components/immobilien/ContextCardView';
import { ContextCardEdit } from '@/components/immobilien/ContextCardEdit';
import type { LandlordContext, ContextMember, ContextFormData, OwnerData } from '@/components/immobilien/kontexteTypes';

export function KontexteTab() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [assignerContext, setAssignerContext] = useState<{ id: string; name: string } | null>(null);
  const [editingContextId, setEditingContextId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<ContextFormData | null>(null);
  const [editOwners, setEditOwners] = useState<OwnerData[]>([]);

  // === Queries ===
  const { data: contexts = [], isLoading } = useQuery({
    queryKey: ['landlord-contexts', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('landlord_contexts').select('*').eq('tenant_id', activeTenantId!).order('created_at', { ascending: true });
      if (error) throw error;
      return data as LandlordContext[];
    },
    enabled: !!activeTenantId,
  });

  const { data: membersByContext = new Map<string, ContextMember[]>() } = useQuery({
    queryKey: ['context-members', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('context_members')
        .select('id, context_id, first_name, last_name, ownership_share, birth_name, birth_date, tax_class, profession, gross_income_yearly, church_tax')
        .eq('tenant_id', activeTenantId!);
      if (error) throw error;
      const byContext = new Map<string, ContextMember[]>();
      data?.forEach(m => { const list = byContext.get(m.context_id) || []; list.push(m as ContextMember); byContext.set(m.context_id, list); });
      return byContext;
    },
    enabled: !!activeTenantId,
  });

  const { data: contextPropertyCounts = {} } = useQuery({
    queryKey: ['context-property-counts', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('context_property_assignment').select('context_id, property_id').eq('tenant_id', activeTenantId!);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(a => { counts[a.context_id] = (counts[a.context_id] || 0) + 1; });
      return counts;
    },
    enabled: !!activeTenantId,
  });

  // === Mutation ===
  const updateContextMutation = useMutation({
    mutationFn: async () => {
      if (!editingContextId || !editFormData || !activeTenantId) throw new Error('Fehlende Daten');

      let calculatedTaxRate = editFormData.tax_rate_percent;
      if (editFormData.context_type === 'PRIVATE' && editFormData.taxable_income_yearly) {
        const taxResult = calculateTax({ taxableIncome: editFormData.taxable_income_yearly, assessmentType: editFormData.tax_assessment_type, childrenCount: editFormData.children_count, churchTax: editFormData.church_tax });
        calculatedTaxRate = Math.round(taxResult.marginalTaxRate);
      }

      const managingDirectorDisplay = editFormData.context_type === 'BUSINESS' && editFormData.md_first_name && editFormData.md_last_name
        ? `${editFormData.md_salutation ? editFormData.md_salutation + ' ' : ''}${editFormData.md_first_name} ${editFormData.md_last_name}`.trim()
        : editFormData.managing_director || null;

      const { error: ctxError } = await supabase.from('landlord_contexts').update({
        name: editFormData.name, context_type: editFormData.context_type, tax_rate_percent: calculatedTaxRate,
        taxable_income_yearly: editFormData.context_type === 'PRIVATE' ? editFormData.taxable_income_yearly : null,
        tax_assessment_type: editFormData.context_type === 'PRIVATE' ? editFormData.tax_assessment_type : null,
        church_tax: editFormData.context_type === 'PRIVATE' ? editFormData.church_tax : null,
        children_count: editFormData.context_type === 'PRIVATE' ? editFormData.children_count : null,
        managing_director: managingDirectorDisplay,
        legal_form: editFormData.context_type === 'BUSINESS' ? editFormData.legal_form : null,
        hrb_number: editFormData.context_type === 'BUSINESS' ? editFormData.hrb_number : null,
        ust_id: editFormData.context_type === 'BUSINESS' ? editFormData.ust_id : null,
        md_salutation: editFormData.context_type === 'BUSINESS' ? editFormData.md_salutation || null : null,
        md_first_name: editFormData.context_type === 'BUSINESS' ? editFormData.md_first_name || null : null,
        md_last_name: editFormData.context_type === 'BUSINESS' ? editFormData.md_last_name || null : null,
        tax_number: editFormData.context_type === 'BUSINESS' ? editFormData.tax_number || null : null,
        registry_court: editFormData.context_type === 'BUSINESS' ? editFormData.registry_court || null : null,
        street: editFormData.street || null, house_number: editFormData.house_number || null,
        postal_code: editFormData.postal_code || null, city: editFormData.city || null,
      }).eq('id', editingContextId);
      if (ctxError) throw ctxError;

      const { error: deleteError } = await supabase.from('context_members').delete().eq('context_id', editingContextId);
      if (deleteError) throw deleteError;

      if (editOwners.length > 0 && editFormData.context_type === 'PRIVATE') {
        const membersToInsert = editOwners.map(o => ({
          context_id: editingContextId, tenant_id: activeTenantId,
          first_name: o.first_name, last_name: o.last_name, tax_class: o.tax_class,
          ownership_share: o.ownership_share, gross_income_yearly: o.gross_income_yearly, profession: o.profession,
        }));
        const { error: insertError } = await supabase.from('context_members').insert(membersToInsert);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      toast.success('Vermietereinheit aktualisiert');
      queryClient.invalidateQueries({ queryKey: ['landlord-contexts'] });
      queryClient.invalidateQueries({ queryKey: ['context-members'] });
      setEditingContextId(null); setEditFormData(null); setEditOwners([]);
    },
    onError: (error) => { console.error('Update error:', error); toast.error('Fehler beim Speichern'); },
  });

  // === Handlers ===
  const handleStartEdit = (ctx: LandlordContext) => {
    const members = membersByContext.get(ctx.id) || [];
    setEditingContextId(ctx.id);
    setEditFormData({
      name: ctx.name, context_type: ctx.context_type as 'PRIVATE' | 'BUSINESS',
      tax_rate_percent: ctx.tax_rate_percent ?? 30, taxable_income_yearly: ctx.taxable_income_yearly ?? null,
      tax_assessment_type: (ctx.tax_assessment_type as TaxAssessmentType) || 'SPLITTING',
      church_tax: ctx.church_tax ?? false, children_count: ctx.children_count ?? 0,
      managing_director: ctx.managing_director || '', legal_form: ctx.legal_form || '',
      hrb_number: ctx.hrb_number || '', ust_id: ctx.ust_id || '',
      street: ctx.street || '', house_number: ctx.house_number || '',
      postal_code: ctx.postal_code || '', city: ctx.city || '',
      md_salutation: ctx.md_salutation || '', md_first_name: ctx.md_first_name || '',
      md_last_name: ctx.md_last_name || '', tax_number: ctx.tax_number || '', registry_court: ctx.registry_court || '',
    });
    setEditOwners(members.map(m => ({
      id: m.id, first_name: m.first_name, last_name: m.last_name,
      tax_class: m.tax_class || 'I', ownership_share: m.ownership_share ?? 50,
      gross_income_yearly: m.gross_income_yearly, profession: m.profession || '',
    })));
  };

  const handleCancelEdit = () => { setEditingContextId(null); setEditFormData(null); setEditOwners([]); };
  const updateOwner = (idx: number, field: keyof OwnerData, value: any) => { setEditOwners(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o)); };
  const addOwner = () => { setEditOwners(prev => [...prev, { first_name: '', last_name: '', tax_class: 'I', ownership_share: 50, gross_income_yearly: null, profession: '' }]); };
  const removeOwner = (idx: number) => { setEditOwners(prev => prev.filter((_, i) => i !== idx)); };

  // === Render ===
  return (
    <PageShell>
      <ModulePageHeader title="Vermietereinheiten" description="Verwalte deine steuerlichen Kontexte für die Immobilienbewertung" />

      {isLoading ? (
        <Card className="border-dashed"><CardContent className="py-8 text-center text-muted-foreground">Lade Vermietereinheiten...</CardContent></Card>
      ) : (
        <div className="flex flex-wrap gap-4">
          {contexts.map((ctx) => {
            const isEditing = editingContextId === ctx.id;
            const members = membersByContext.get(ctx.id) || [];
            const propertyCount = contextPropertyCounts[ctx.id] || 0;
            
            return isEditing && editFormData ? (
              <ContextCardEdit
                key={ctx.id}
                editFormData={editFormData}
                editOwners={editOwners}
                isPending={updateContextMutation.isPending}
                onFormChange={setEditFormData}
                onUpdateOwner={updateOwner}
                onAddOwner={addOwner}
                onRemoveOwner={removeOwner}
                onSave={() => updateContextMutation.mutate()}
                onCancel={handleCancelEdit}
              />
            ) : (
              <ContextCardView key={ctx.id} ctx={ctx} members={members} propertyCount={propertyCount} onEdit={handleStartEdit} onAssign={setAssignerContext} />
            );
          })}

          <Card className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] border-dashed cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors" onClick={() => setShowCreateDialog(true)}>
            <CardContent className="flex flex-col items-center justify-center py-12 h-full min-h-[200px]">
              <div className="p-3 rounded-full bg-muted mb-3"><Plus className="h-6 w-6 text-muted-foreground" /></div>
              <p className="font-medium text-muted-foreground">Neue Vermietereinheit</p>
              <p className="text-xs text-muted-foreground mt-1">anlegen</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Hinweis:</strong> Vermietereinheiten ermöglichen die Trennung von Objekten nach 
            unterschiedlichen steuerlichen Regimes oder Eigentümerstrukturen (z.B. Ehepaar, Gesellschaft). 
            Der hinterlegte Steuersatz wird für Renditeberechnungen verwendet.
          </p>
        </CardContent>
      </Card>

      <CreateContextDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {assignerContext && (
        <PropertyContextAssigner open={!!assignerContext} onOpenChange={(open) => !open && setAssignerContext(null)} contextId={assignerContext.id} contextName={assignerContext.name} />
      )}
    </PageShell>
  );
}
