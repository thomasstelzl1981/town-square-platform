/**
 * MOD-11 Finanzierungsmanager - Mandate Tab
 * 
 * Collapsible "How it works" + Mandate Inbox (delegated) + 
 * Annehmen → Provisionsvereinbarung (Consent) → Case erzeugen
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Inbox, Search, Lightbulb, User, Building2, Clock, 
  CheckCircle2, Send, AlertCircle, Loader2, ArrowRight, 
  Filter, ChevronDown, FileText, Shield
} from 'lucide-react';
import { useAcceptMandate } from '@/hooks/useFinanceMandate';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MandateTab() {
  const [howItWorksOpen, setHowItWorksOpen] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('delegated');
  const [acceptDialogOpen, setAcceptDialogOpen] = React.useState(false);
  const [selectedMandateId, setSelectedMandateId] = React.useState<string | null>(null);
  const [consentChecked, setConsentChecked] = React.useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const acceptMandate = useAcceptMandate();

  // Fetch mandates assigned to current user
  const { data: mandates, isLoading, refetch } = useQuery({
    queryKey: ['manager-mandates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('finance_mandates')
        .select(`
          *,
          finance_requests (
            id,
            public_id,
            status,
            created_at,
            applicant_profiles (
              id,
              first_name,
              last_name,
              profile_type,
              completion_score,
              purchase_price,
              loan_amount_requested
            )
          )
        `)
        .eq('assigned_manager_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const filteredMandates = React.useMemo(() => {
    if (!mandates) return [];
    
    return mandates.filter(mandate => {
      if (statusFilter !== 'all' && mandate.status !== statusFilter) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const request = mandate.finance_requests as any;
        const applicant = request?.applicant_profiles?.[0];
        
        const searchFields = [
          mandate.public_id,
          request?.public_id,
          applicant?.first_name,
          applicant?.last_name,
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchFields.includes(query)) return false;
      }
      
      return true;
    });
  }, [mandates, searchQuery, statusFilter]);

  const handleAcceptClick = (mandateId: string) => {
    setSelectedMandateId(mandateId);
    setConsentChecked(false);
    setAcceptDialogOpen(true);
  };

  const handleAcceptConfirm = async () => {
    if (!selectedMandateId || !consentChecked) return;
    
    await acceptMandate.mutateAsync(selectedMandateId);
    setAcceptDialogOpen(false);
    setSelectedMandateId(null);
    refetch();
    navigate('/portal/finanzierungsmanager/bearbeitung');
  };

  return (
    <div className="space-y-6">
      {/* Collapsible How It Works */}
      <Collapsible open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
        <Card className="bg-primary/5 border-primary/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-primary/10 transition-colors rounded-t-lg">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  So funktioniert's
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${howItWorksOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { icon: Inbox, title: 'Mandat prüfen', desc: 'Eingehende Anfragen sichten' },
                  { icon: CheckCircle2, title: 'Annehmen', desc: 'Provisionsvereinbarung bestätigen' },
                  { icon: FileText, title: 'Bearbeiten', desc: 'Unterlagen prüfen und ergänzen' },
                  { icon: Send, title: 'Einreichen', desc: 'Bei Bank einreichen' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6" />
            Meine Mandate
          </h2>
          <p className="text-muted-foreground">
            {mandates?.filter(m => m.status === 'delegated').length || 0} wartend, {' '}
            {mandates?.filter(m => m.status === 'accepted').length || 0} aktiv
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Name oder ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="delegated">Wartend</SelectItem>
            <SelectItem value="accepted">Aktiv</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mandate List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMandates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Mandate</h3>
            <p className="text-muted-foreground">
              {statusFilter === 'delegated' 
                ? 'Keine wartenden Mandate vorhanden.'
                : 'Keine Mandate gefunden.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMandates.map((mandate) => {
            const request = mandate.finance_requests as any;
            const applicant = request?.applicant_profiles?.[0];
            
            return (
              <Card key={mandate.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm">{mandate.public_id || request?.public_id}</span>
                          <Badge variant={mandate.status === 'delegated' ? 'secondary' : 'default'}>
                            {mandate.status === 'delegated' ? 'Wartend' : 'Aktiv'}
                          </Badge>
                        </div>
                        <p className="font-medium">
                          {applicant?.first_name && applicant?.last_name
                            ? `${applicant.first_name} ${applicant.last_name}`
                            : 'Name nicht angegeben'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(mandate.created_at), 'dd.MM.yyyy', { locale: de })}
                          </span>
                          {applicant?.loan_amount_requested && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(applicant.loan_amount_requested)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {mandate.status === 'delegated' && (
                        <Button
                          size="sm"
                          onClick={() => handleAcceptClick(mandate.id)}
                        >
                          Annehmen
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                      {mandate.status === 'accepted' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/portal/finanzierungsmanager/bearbeitung')}
                        >
                          Bearbeiten
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Accept Dialog with Commission Consent */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Mandat annehmen
            </DialogTitle>
            <DialogDescription>
              Bitte bestätigen Sie die Provisionsvereinbarung, um das Mandat anzunehmen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2 text-sm">
                <p><strong>Provisionsvereinbarung:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Bei erfolgreicher Vermittlung erhalten Sie eine Provision gemäß Partnervertrag</li>
                  <li>Die Provision wird nach Abschluss der Finanzierung abgerechnet</li>
                  <li>Sie verpflichten sich zur sorgfältigen Bearbeitung des Mandats</li>
                </ul>
              </CardContent>
            </Card>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="consent" 
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked === true)}
              />
              <Label htmlFor="consent" className="text-sm">
                Ich akzeptiere die Provisionsvereinbarung und verpflichte mich zur 
                ordnungsgemäßen Bearbeitung.
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleAcceptConfirm} 
              disabled={!consentChecked || acceptMandate.isPending}
            >
              {acceptMandate.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Mandat annehmen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
