/**
 * MOD-07: Selbstauskunft Tab
 * Displays persistent applicant profile (finance_request_id IS NULL)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, Building, CheckCircle, AlertCircle, 
  FileEdit, Loader2, RefreshCw 
} from 'lucide-react';
import { SelbstauskunftForm } from '@/components/finanzierung/SelbstauskunftForm';
import type { ApplicantProfile } from '@/types/finance';

export default function SelbstauskunftTab() {
  const { activeOrganization } = useAuth();

  // Fetch persistent applicant profile (finance_request_id IS NULL)
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['persistent-applicant-profile', activeOrganization?.id],
    queryFn: async (): Promise<ApplicantProfile | null> => {
      if (!activeOrganization?.id) return null;

      // First, try to find persistent profile
      const { data, error } = await supabase
        .from('applicant_profiles')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .is('finance_request_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // If no persistent profile exists, create one
      if (!data) {
        const { data: newProfile, error: createError } = await supabase
          .from('applicant_profiles')
          .insert({
            tenant_id: activeOrganization.id,
            profile_type: 'private',
            party_role: 'primary',
          })
          .select()
          .single();

        if (createError) throw createError;
        return newProfile as unknown as ApplicantProfile;
      }

      return data as unknown as ApplicantProfile;
    },
    enabled: !!activeOrganization?.id,
  });

  // Calculate completion score
  const calculateCompletionScore = () => {
    if (!profile) return 0;

    const requiredFields = [
      'first_name', 'last_name', 'email', 'phone',
      'birth_date', 'address_street', 'address_city', 'address_postal_code',
      'employment_type', 'net_income_monthly',
    ];

    const filledFields = requiredFields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  const completionScore = calculateCompletionScore();
  const isReadyToSubmit = completionScore >= 80;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Completion Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meine Selbstauskunft
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Vollständigkeit</span>
              <span className="text-sm text-muted-foreground">{completionScore}%</span>
            </div>
            <Progress value={completionScore} className="h-2" />
          </div>

          <div className="flex items-center gap-2">
            {isReadyToSubmit ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Bereit zur Einreichung
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Daten unvollständig
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {isReadyToSubmit 
                ? 'Ihre Daten sind vollständig für eine Finanzierungsanfrage.' 
                : 'Bitte ergänzen Sie die fehlenden Angaben.'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Profile Type Tabs */}
      <Tabs defaultValue={profile?.profile_type || 'private'}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="private" className="gap-2">
            <User className="h-4 w-4" />
            Privatperson
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Building className="h-4 w-4" />
            Unternehmer / Selbstständig
          </TabsTrigger>
        </TabsList>

        <TabsContent value="private" className="mt-6">
          {profile && (
            <SelbstauskunftForm
              profile={profile}
              onSave={() => refetch()}
            />
          )}
        </TabsContent>

        <TabsContent value="business" className="mt-6">
          {profile && (
            <SelbstauskunftForm
              profile={profile}
              onSave={() => refetch()}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Info Box */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FileEdit className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Dauerhafte Selbstauskunft</p>
              <p className="mt-1">
                Diese Daten werden dauerhaft gespeichert und bei jeder neuen Finanzierungsanfrage 
                automatisch verwendet. Sie können die Daten jederzeit aktualisieren.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
