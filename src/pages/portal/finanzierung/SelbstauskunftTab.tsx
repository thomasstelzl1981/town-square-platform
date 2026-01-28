/**
 * MOD-07 Finanzierung - Selbstauskunft Tab
 * 
 * Permanente Datenbasis (applicant_profiles) + Dokumente-Abschnitt.
 * Owner-Kontext aus MOD-04 Pflicht.
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, FileText, Upload, AlertCircle, CheckCircle2, 
  Loader2, Building2, Plus 
} from 'lucide-react';
import { SelbstauskunftForm } from '@/components/finanzierung';
import { useFinanceRequests } from '@/hooks/useFinanceRequest';
import { useNavigate } from 'react-router-dom';

export default function SelbstauskunftTab() {
  const navigate = useNavigate();
  const { data: requests, isLoading } = useFinanceRequests();
  
  // Get the most recent draft request with its applicant profile
  const activeRequest = React.useMemo(() => {
    if (!requests) return null;
    // Find any request that has applicant profiles
    return requests.find(r => r.applicant_profiles && r.applicant_profiles.length > 0);
  }, [requests]);

  const primaryProfile = activeRequest?.applicant_profiles?.find(
    (p: any) => p.party_role === 'primary'
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Owner Context Notice */}
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Eigentümer-Kontext:</strong> Ihre Selbstauskunft ist mit Ihrem aktiven Eigentümer-Kontext verknüpft.
          {/* TODO: Context Picker when owner_context_id is implemented */}
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" />
            Selbstauskunft
          </h2>
          <p className="text-muted-foreground">
            Ihre persönlichen und finanziellen Daten für Finanzierungsanfragen
          </p>
        </div>
        {primaryProfile && (
          <Badge variant={primaryProfile.completion_score >= 80 ? 'default' : 'secondary'}>
            {primaryProfile.completion_score >= 80 ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <AlertCircle className="h-3 w-3 mr-1" />
            )}
            {primaryProfile.completion_score || 0}% vollständig
          </Badge>
        )}
      </div>

      {/* Main Content */}
      {primaryProfile ? (
        <SelbstauskunftForm 
          profile={primaryProfile as any} 
          readOnly={activeRequest?.status === 'submitted'}
        />
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Selbstauskunft vorhanden</h3>
            <p className="text-muted-foreground mb-6">
              Starten Sie eine neue Finanzierung, um Ihre Selbstauskunft anzulegen.
            </p>
            <Button onClick={() => navigate('/portal/finanzierung/neu')}>
              <Plus className="mr-2 h-4 w-4" />
              Neue Finanzierung starten
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dokumente
          </CardTitle>
          <CardDescription>
            Laden Sie erforderliche Unterlagen hoch (Gehaltsnachweise, Ausweis, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Dokumente per Drag & Drop oder Klick hochladen
            </p>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Dokumente hochladen
            </Button>
          </div>
          {/* TODO: Document list from DMS integration */}
        </CardContent>
      </Card>
    </div>
  );
}
