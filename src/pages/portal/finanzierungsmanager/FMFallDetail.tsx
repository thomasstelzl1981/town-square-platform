/**
 * FM Fall Detail — Orchestrator (MOD-11)
 * R-20 Refactoring: 579 → ~160 lines
 */
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Save } from 'lucide-react';
import { useState } from 'react';
import * as React from 'react';
import { useFinanceRequest, useUpdateRequestStatus } from '@/hooks/useFinanceRequest';
import { PageShell } from '@/components/shared/PageShell';
import { toast } from 'sonner';
import {
  PersonSection, EmploymentSection, BankSection, IncomeSection,
  ExpensesSection, AssetsSection, createEmptyApplicantFormData,
  type ApplicantFormData,
} from '@/components/finanzierung/ApplicantPersonFields';
import { profileToFormData } from '@/components/finanzierung/SelbstauskunftFormV2';
import { supabase } from '@/integrations/supabase/client';
import { getStatusLabel } from '@/types/finance';
import { FallHeaderBlock, FallContentBlocks } from '@/components/finanzierungsmanager/fall';

export default function FMFallDetail() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading, refetch: refetchRequest } = useFinanceRequest(requestId);
  const updateStatus = useUpdateRequestStatus();

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ApplicantFormData | null>(null);
  const [coFormData, setCoFormData] = useState<ApplicantFormData | null>(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const [splitView, setSplitView] = useState(false);

  React.useEffect(() => {
    if (request && !formInitialized) {
      const applicant = request.applicant_profiles?.[0];
      const coApplicant = request.applicant_profiles?.[1];
      if (applicant) setFormData(profileToFormData(applicant as any));
      setCoFormData(coApplicant ? profileToFormData(coApplicant as any) : createEmptyApplicantFormData());
      setFormInitialized(true);
    }
  }, [request, formInitialized]);

  if (isLoading) return <PageShell><div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;
  if (!request) return <PageShell><Card className="glass-card"><CardContent className="p-12 text-center"><p className="text-muted-foreground">Fall nicht gefunden</p><Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">Zurück</Button></CardContent></Card></PageShell>;

  const applicant = request.applicant_profiles?.[0];
  const coApplicant = request.applicant_profiles?.[1];
  const property = request.properties;
  const currentStatus = request.status;
  const isProlongation = request.purpose === 'umschuldung';
  const purposeLabel = isProlongation ? 'Prolongation / Umschuldung' : (applicant?.purpose || 'Finanzierung');

  const handleStatusChange = async (newStatus: string) => {
    try { await updateStatus.mutateAsync({ requestId: request.id, status: newStatus }); toast.success(`Status → ${getStatusLabel(newStatus)}`); } catch { toast.error('Fehler beim Aktualisieren'); }
  };

  const handleChange = (field: string, value: unknown) => setFormData(prev => prev ? { ...prev, [field]: value } : prev);
  const handleCoChange = (field: string, value: unknown) => setCoFormData(prev => prev ? { ...prev, [field]: value } : prev);

  const handleCoFirstInput = async () => {
    if (coApplicant || !applicant) return;
    try { await supabase.from('applicant_profiles').insert({ tenant_id: (applicant as any).tenant_id, party_role: 'co_applicant', profile_type: 'person', finance_request_id: request.id, linked_primary_profile_id: applicant.id }); toast.success('2. Antragsteller angelegt'); refetchRequest(); } catch (err) { console.error(err); }
  };

  const handleSaveApplicants = async () => {
    if (!formData || !applicant) return;
    setIsSaving(true);
    try {
      const { error: e1 } = await supabase.from('applicant_profiles').update(formData as any).eq('id', applicant.id);
      if (e1) throw e1;
      if (coApplicant && coFormData) { const { error: e2 } = await supabase.from('applicant_profiles').update(coFormData as any).eq('id', coApplicant.id); if (e2) throw e2; }
      toast.success('Selbstauskunft gespeichert'); refetchRequest();
    } catch { toast.error('Fehler beim Speichern'); } finally { setIsSaving(false); }
  };

  const dualProps = formData && coFormData ? { formData, coFormData, onChange: handleChange, onCoChange: handleCoChange, readOnly: false, onCoFirstInput: handleCoFirstInput } : null;
  const contentBlocks = FallContentBlocks({ request, applicant, coApplicant, property, currentStatus, isProlongation, purposeLabel, splitView, onStatusChange: handleStatusChange });

  const selbstauskunftBlock = (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/20">
          <h3 className="text-base font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Selbstauskunft</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Vollständigkeit: {applicant?.completion_score || 0}%</span>
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${applicant?.completion_score || 0}%` }} /></div>
            <Button size="sm" className="h-7 text-xs" onClick={handleSaveApplicants} disabled={isSaving}>{isSaving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}Speichern</Button>
          </div>
        </div>
        {dualProps ? (
          <div className="p-4 space-y-6"><PersonSection {...dualProps} /><EmploymentSection {...dualProps} /><BankSection {...dualProps} /><IncomeSection {...dualProps} /><ExpensesSection {...dualProps} /><AssetsSection {...dualProps} /></div>
        ) : (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /><p className="text-sm">Daten werden geladen...</p></div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <PageShell fullWidth={splitView}>
      <FallHeaderBlock publicId={request.public_id} requestId={request.id} applicantName={`${applicant?.first_name || ''} ${applicant?.last_name || ''}`} purposeLabel={purposeLabel} currentStatus={currentStatus} splitView={splitView} onSplitViewChange={setSplitView} onStatusChange={handleStatusChange} onNavigateBack={() => navigate(-1)} />
      {splitView ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 220px)' }}>
          <div className="overflow-y-auto space-y-4 pr-2 scrollbar-thin">{contentBlocks.kurzbeschreibungBlock}{contentBlocks.objektBlock}{contentBlocks.kalkulatorBlock}{contentBlocks.datenraumBlock}{contentBlocks.notizenBlock}{contentBlocks.fertigstellenBlock}</div>
          <div className="overflow-y-auto pl-2 scrollbar-thin">{selbstauskunftBlock}</div>
        </div>
      ) : (
        <div className="space-y-4">{contentBlocks.kurzbeschreibungBlock}{selbstauskunftBlock}{contentBlocks.objektBlock}{contentBlocks.kalkulatorBlock}{contentBlocks.datenraumBlock}{contentBlocks.notizenBlock}{contentBlocks.fertigstellenBlock}</div>
      )}
    </PageShell>
  );
}
