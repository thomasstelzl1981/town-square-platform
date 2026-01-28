/**
 * MOD-11 Finanzierungsmanager - Bearbeitung Tab
 * 
 * Case-Liste + Detail: Selbstauskunft nachpflegen + Objekt (read-only) + 
 * Datenraum-Links + Notizen
 */

import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, User, Building2, FolderOpen, MessageSquare,
  Clock, Loader2, ArrowLeft, ArrowRight, Save, CheckCircle2
} from 'lucide-react';
import { useFutureRoomCases } from '@/hooks/useFinanceMandate';
import { SelbstauskunftForm } from '@/components/finanzierung';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function BearbeitungTab() {
  const { caseId } = useParams();
  const { data: cases, isLoading } = useFutureRoomCases();
  
  // If we have a caseId, show detail view
  if (caseId) {
    const selectedCase = cases?.find(c => c.id === caseId);
    return <CaseDetail caseData={selectedCase} isLoading={isLoading} />;
  }
  
  // Otherwise show list
  return <CaseList cases={cases || []} isLoading={isLoading} />;
}

function CaseList({ cases, isLoading }: { cases: any[]; isLoading: boolean }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeCases = cases.filter(c => c.status !== 'closed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Bearbeitung
        </h2>
        <p className="text-muted-foreground">
          {activeCases.length} aktive Fälle
        </p>
      </div>

      {/* Case List */}
      {activeCases.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine aktiven Fälle</h3>
            <p className="text-muted-foreground mb-6">
              Nehmen Sie ein Mandat an, um mit der Bearbeitung zu beginnen.
            </p>
            <Button onClick={() => navigate('/portal/finanzierungsmanager')}>
              Zu den Mandaten
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeCases.map((caseItem) => {
            const mandate = caseItem.finance_mandates as any;
            const request = mandate?.finance_requests as any;
            const applicant = request?.applicant_profiles?.[0];
            
            const statusLabels: Record<string, string> = {
              'processing': 'In Bearbeitung',
              'submitted_to_bank': 'Bei Bank eingereicht',
              'pending_docs': 'Dokumente fehlen',
              'approved': 'Genehmigt',
              'rejected': 'Abgelehnt',
            };

            return (
              <Card 
                key={caseItem.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/portal/finanzierungsmanager/bearbeitung/${caseItem.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{mandate?.public_id || request?.public_id}</span>
                          <Badge variant="outline">
                            {statusLabels[caseItem.status] || caseItem.status}
                          </Badge>
                        </div>
                        <p className="font-medium">
                          {applicant?.first_name && applicant?.last_name
                            ? `${applicant.first_name} ${applicant.last_name}`
                            : 'Name nicht angegeben'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Angenommen: {format(new Date(caseItem.created_at), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CaseDetail({ caseData, isLoading }: { caseData: any; isLoading: boolean }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('selbstauskunft');
  const [notes, setNotes] = React.useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Fall nicht gefunden</h3>
          <Button onClick={() => navigate('/portal/finanzierungsmanager/bearbeitung')}>
            Zurück zur Übersicht
          </Button>
        </CardContent>
      </Card>
    );
  }

  const mandate = caseData.finance_mandates as any;
  const request = mandate?.finance_requests as any;
  const applicant = request?.applicant_profiles?.[0];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/portal/finanzierungsmanager/bearbeitung')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück zur Übersicht
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {mandate?.public_id || 'Fall bearbeiten'}
          </h2>
          <p className="text-muted-foreground">
            {applicant?.first_name} {applicant?.last_name} • 
            {applicant?.loan_amount_requested && ` ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(applicant.loan_amount_requested)}`}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          In Bearbeitung
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="selbstauskunft" className="gap-2">
            <User className="h-4 w-4" />
            Selbstauskunft
          </TabsTrigger>
          <TabsTrigger value="objekt" className="gap-2">
            <Building2 className="h-4 w-4" />
            Objekt
          </TabsTrigger>
          <TabsTrigger value="datenraum" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Datenraum
          </TabsTrigger>
          <TabsTrigger value="notizen" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Notizen
          </TabsTrigger>
        </TabsList>

        {/* Selbstauskunft */}
        <TabsContent value="selbstauskunft" className="mt-4">
          {applicant ? (
            <SelbstauskunftForm profile={applicant} readOnly={false} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Keine Selbstauskunft vorhanden</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Objekt (read-only) */}
        <TabsContent value="objekt" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Objektdaten
              </CardTitle>
              <CardDescription>
                Daten aus MOD-04 / MOD-08 (nur Ansicht)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {request?.property_id ? (
                <div className="space-y-4">
                  {/* TODO: Load property data from MOD-04 */}
                  <p className="text-muted-foreground">Objekt-ID: {request.property_id}</p>
                </div>
              ) : request?.custom_object_data ? (
                <div className="space-y-4">
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(request.custom_object_data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Kein Objekt zugeordnet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Datenraum */}
        <TabsContent value="datenraum" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Datenraum
              </CardTitle>
              <CardDescription>
                Dokumente und Unterlagen für die Finanzierung
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO: DMS integration with storage_nodes */}
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">
                  Datenraum wird geladen...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notizen */}
        <TabsContent value="notizen" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Interne Notizen
              </CardTitle>
              <CardDescription>
                Notizen zur Bearbeitung (nicht sichtbar für Kunden)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Ihre Notizen zum Fall..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
              <div className="flex justify-end">
                <Button variant="outline" disabled>
                  <Save className="mr-2 h-4 w-4" />
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Footer */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Bereit zur Einreichung?</p>
              <p className="text-sm text-muted-foreground">
                Prüfen Sie alle Unterlagen und reichen Sie bei der Bank ein.
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/portal/finanzierungsmanager/einreichen')}>
            Zur Einreichung
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
