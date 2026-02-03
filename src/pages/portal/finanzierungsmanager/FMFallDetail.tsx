/**
 * FM Fall Detail — Single Case View
 */
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { 
  ArrowLeft, User, Building2, FileText, Clock, CheckCircle2, 
  XCircle, AlertCircle, MessageSquare, Loader2 
} from 'lucide-react';
import { useFinanceRequest, useUpdateRequestStatus } from '@/hooks/useFinanceRequest';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  in_processing: { label: 'In Bearbeitung', variant: 'secondary' },
  needs_customer_action: { label: 'Wartet auf Kunde', variant: 'destructive' },
  completed: { label: 'Abgeschlossen', variant: 'default' },
  rejected: { label: 'Abgelehnt', variant: 'outline' },
};

export default function FMFallDetail() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading } = useFinanceRequest(requestId);
  const updateStatus = useUpdateRequestStatus();
  
  const [note, setNote] = useState('');
  const [showRueckfrage, setShowRueckfrage] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Fall nicht gefunden</p>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
            Zurück
          </Button>
        </CardContent>
      </Card>
    );
  }

  const applicant = request.applicant_profiles?.[0];
  const property = request.properties;
  const currentStatus = request.status;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({
        requestId: request.id,
        status: newStatus,
        notes: note || undefined,
      });
      toast.success('Status aktualisiert');
      setNote('');
      setShowRueckfrage(false);
    } catch (err) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">
            Fall: {request.public_id || request.id.slice(0, 8)}
          </h2>
          <p className="text-muted-foreground">
            {applicant?.first_name} {applicant?.last_name}
          </p>
        </div>
        <Badge {...(STATUS_LABELS[currentStatus] || { variant: 'outline' })}>
          {STATUS_LABELS[currentStatus]?.label || currentStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Antragsteller */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Antragsteller
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">
                  {applicant?.first_name} {applicant?.last_name}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">E-Mail</div>
                <div className="font-medium">{applicant?.email || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Telefon</div>
                <div className="font-medium">{applicant?.phone || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Profil-Typ</div>
                <div className="font-medium">
                  {applicant?.profile_type === 'private' ? 'Privatperson' : 'Unternehmer'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Netto-Einkommen</div>
                <div className="font-medium">
                  {applicant?.net_income_monthly
                    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(applicant.net_income_monthly)
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Vollständigkeit</div>
                <div className="font-medium">{applicant?.completion_score || 0}%</div>
              </div>
            </CardContent>
          </Card>

          {/* Objekt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Objekt
              </CardTitle>
            </CardHeader>
            <CardContent>
              {property ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Adresse</div>
                    <div className="font-medium">
                      {property.address}, {property.postal_code} {property.city}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Code</div>
                    <div className="font-medium">{property.code || '—'}</div>
                  </div>
                </div>
              ) : request.custom_object_data ? (
                <div>
                  <div className="text-sm text-muted-foreground">Eigenes Objekt</div>
                  <pre className="text-sm mt-2 p-3 bg-muted rounded">
                    {JSON.stringify(request.custom_object_data, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-muted-foreground">Kein Objekt verknüpft</p>
              )}
            </CardContent>
          </Card>

          {/* Finanzierungsdaten */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Finanzierungsdaten
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Kaufpreis</div>
                <div className="font-medium">
                  {applicant?.purchase_price
                    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(applicant.purchase_price)
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Darlehenswunsch</div>
                <div className="font-medium text-primary">
                  {applicant?.loan_amount_requested
                    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(applicant.loan_amount_requested)
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Eigenkapital</div>
                <div className="font-medium">
                  {applicant?.equity_amount
                    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(applicant.equity_amount)
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Verwendungszweck</div>
                <div className="font-medium">{applicant?.purpose || '—'}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktionen</CardTitle>
              <CardDescription>Status dieses Falls ändern</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                variant={currentStatus === 'in_processing' ? 'secondary' : 'default'}
                onClick={() => handleStatusChange('in_processing')}
                disabled={updateStatus.isPending}
              >
                <Clock className="h-4 w-4 mr-2" />
                In Bearbeitung
              </Button>
              
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setShowRueckfrage(true)}
                disabled={updateStatus.isPending}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Rückfrage an Kunden
              </Button>
              
              <Separator />
              
              <Button
                className="w-full"
                variant="default"
                onClick={() => handleStatusChange('completed')}
                disabled={updateStatus.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Abschließen
              </Button>
              
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => handleStatusChange('rejected')}
                disabled={updateStatus.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Ablehnen
              </Button>
            </CardContent>
          </Card>

          {/* Rückfrage Dialog */}
          {showRueckfrage && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Rückfrage erstellen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Welche Dokumente oder Informationen werden benötigt?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRueckfrage(false)}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={() => handleStatusChange('needs_customer_action')}
                    disabled={!note.trim() || updateStatus.isPending}
                    className="flex-1"
                  >
                    Senden
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {!showRueckfrage && (
            <Card>
              <CardHeader>
                <CardTitle>Interne Notiz</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Notizen zum Fall..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
