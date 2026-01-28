import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, Loader2, Building2, CheckCircle2, 
  AlertTriangle, FileText, ArrowLeft 
} from 'lucide-react';
import { useFinanceBankContacts } from '@/hooks/useFinanceMandate';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SubmitToBankTabProps {
  cases: any[];
  isLoading: boolean;
}

export default function SubmitToBankTab({ cases, isLoading }: SubmitToBankTabProps) {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: banks, isLoading: banksLoading } = useFinanceBankContacts();
  
  const [selectedBankId, setSelectedBankId] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState('');

  const submitToBank = useMutation({
    mutationFn: async () => {
      if (!caseId || !selectedBankId) throw new Error('Bitte Bank auswählen');

      const { error } = await supabase
        .from('future_room_cases')
        .update({
          status: 'submitted',
          target_bank_id: selectedBankId,
          submitted_to_bank_at: new Date().toISOString(),
          bank_response: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', caseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['future-room-cases'] });
      toast.success('Erfolgreich bei Bank eingereicht');
      navigate('/portal/finanzierungsmanager/status');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  if (isLoading || banksLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no caseId, show list of ready cases
  if (!caseId) {
    const readyCases = cases.filter(c => 
      c.status === 'active' || c.status === 'ready_to_submit'
    );

    if (readyCases.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Fälle bereit</h3>
            <p className="text-muted-foreground">
              Vervollständigen Sie zunächst die Selbstauskunft, um einen Fall einzureichen.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Bereit zur Einreichung</h2>
        <div className="grid gap-4">
          {readyCases.map((caseItem) => {
            const mandate = caseItem.finance_mandates;
            const request = mandate?.finance_requests;
            const applicant = request?.applicant_profiles?.[0];

            return (
              <Card 
                key={caseItem.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/portal/finanzierungsmanager/einreichen/${caseItem.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <span className="font-medium">
                          {applicant?.first_name} {applicant?.last_name}
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {request?.public_id}
                        </p>
                      </div>
                    </div>
                    <Button size="sm">
                      Einreichen
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Show submission form
  const selectedCase = cases.find(c => c.id === caseId);
  if (!selectedCase) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Fall nicht gefunden</p>
        </CardContent>
      </Card>
    );
  }

  const mandate = selectedCase.finance_mandates;
  const request = mandate?.finance_requests;
  const applicant = request?.applicant_profiles?.[0];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/portal/finanzierungsmanager/einreichen')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück zur Übersicht
      </Button>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Einreichung vorbereiten</CardTitle>
          <CardDescription>
            {applicant?.first_name} {applicant?.last_name} – {request?.public_id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 p-4 bg-muted rounded-lg">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Darlehensbetrag</span>
              <span className="font-medium">
                {applicant?.loan_amount_requested
                  ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(applicant.loan_amount_requested)
                  : '–'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kaufpreis</span>
              <span className="font-medium">
                {applicant?.purchase_price
                  ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(applicant.purchase_price)
                  : '–'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Eigenkapital</span>
              <span className="font-medium">
                {applicant?.equity_amount
                  ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(applicant.equity_amount)
                  : '–'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bank auswählen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {banks && banks.length > 0 ? (
            <RadioGroup value={selectedBankId || ''} onValueChange={setSelectedBankId}>
              <div className="grid gap-3">
                {banks.map((bank) => (
                  <div
                    key={bank.id}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedBankId === bank.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedBankId(bank.id)}
                  >
                    <RadioGroupItem value={bank.id} id={bank.id} />
                    <Label htmlFor={bank.id} className="flex-1 cursor-pointer">
                      <span className="font-medium">{bank.bank_name}</span>
                      {bank.contact_name && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({bank.contact_name})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Keine Bankkontakte verfügbar. Bitte den Admin kontaktieren.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Anmerkungen (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Besondere Hinweise für die Einreichung..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => submitToBank.mutate()}
          disabled={!selectedBankId || submitToBank.isPending}
        >
          {submitToBank.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Bei Bank einreichen
        </Button>
      </div>
    </div>
  );
}
