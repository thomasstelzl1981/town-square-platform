import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMSVPremium, useMSVCommunicationPrefs } from '@/hooks/useMSVPremium';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Building2, 
  Bell, 
  Mail, 
  Clock,
  Star,
  Coins,
  ExternalLink,
  FileText,
  Plus,
  Trash2,
  Loader2
} from 'lucide-react';

interface BankAccount {
  id: string;
  account_name: string;
  iban: string;
  bank_name: string;
  is_default: boolean;
  status: 'connected' | 'pending' | 'error';
}

const EinstellungenTab = () => {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const { isPremium, activeUnits, isLoading: premiumLoading } = useMSVPremium();
  const { prefs, isLoading: prefsLoading, refetch: refetchPrefs } = useMSVCommunicationPrefs();
  
  // Local state initialized from DB
  const [autoReminders, setAutoReminders] = useState(false);
  const [autoReports, setAutoReports] = useState(false);
  const [reminderDay, setReminderDay] = useState(10);
  const [reportDay, setReportDay] = useState(15);
  const [reminderChannel, setReminderChannel] = useState<'email' | 'letter'>('email');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Sync local state with DB prefs
  useEffect(() => {
    if (prefs) {
      setAutoReminders(prefs.auto_reminder_enabled || false);
      setAutoReports(prefs.auto_report_enabled || false);
      setReminderDay(prefs.reminder_day || 10);
      setReportDay(prefs.report_day || 15);
      setReminderChannel((prefs.preferred_channel as 'email' | 'letter') || 'email');
    }
  }, [prefs]);
  
  // Fetch bank accounts
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['msv-bank-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('msv_bank_accounts')
        .select('*')
        .order('is_default', { ascending: false });
      if (error) throw error;
      return (data || []) as BankAccount[];
    }
  });
  
  const creditsPerUnit = 40;

  // Save preferences mutation
  const savePrefs = useMutation({
    mutationFn: async () => {
      if (!activeTenantId) {
        throw new Error('Keine Organisation aktiv');
      }
      
      if (!prefs?.id) {
        // No existing prefs - create new
        const { error } = await supabase.from('msv_communication_prefs').insert([{
          tenant_id: activeTenantId,
          scope_type: 'tenant',
          scope_id: activeTenantId,
          preferred_channel: reminderChannel,
          reminder_day: reminderDay,
          report_day: reportDay,
          auto_reminder_enabled: autoReminders,
          auto_report_enabled: autoReports
        }]);
        if (error) throw error;
      } else {
        // Update existing
        const { error } = await supabase
          .from('msv_communication_prefs')
          .update({
            preferred_channel: reminderChannel,
            reminder_day: reminderDay,
            report_day: reportDay,
            auto_reminder_enabled: autoReminders,
            auto_report_enabled: autoReports
          })
          .eq('id', prefs.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Einstellungen gespeichert');
      setHasChanges(false);
      refetchPrefs();
    },
    onError: () => {
      toast.error('Fehler beim Speichern');
    }
  });

  const handleChange = (setter: (val: any) => void, value: any) => {
    setter(value);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Premium Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-accent" />
            Premium-Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">MSV Premium</p>
              <p className="text-sm text-muted-foreground">
                Automatisches Mahnwesen & Mietberichte
              </p>
            </div>
            <Badge variant={isPremium ? 'default' : 'outline'}>
              {isPremium ? 'Aktiv' : 'Nicht aktiviert'}
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Credits-Verbrauch</p>
                <p className="text-xs text-muted-foreground">
                  {creditsPerUnit} Credits / Einheit / Monat
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{activeUnits * creditsPerUnit} Credits</p>
              <p className="text-xs text-muted-foreground">
                {activeUnits} aktive Einheiten
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" disabled={activeUnits === 0 || isPremium}>
              {isPremium ? 'Premium aktiv' : 'Premium aktivieren'}
            </Button>
            {hasChanges && (
              <Button 
                onClick={() => savePrefs.mutate()} 
                disabled={savePrefs.isPending}
              >
                {savePrefs.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Speichern
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Automatisierung */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Automatisierung
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie automatische Aktionen für Premium-Nutzer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mahntag */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>Automatische Mahnungen</Label>
                  <p className="text-xs text-muted-foreground">
                    Mahnung versenden wenn Miete nicht eingegangen
                  </p>
                </div>
              </div>
              <Switch 
                checked={autoReminders} 
                onCheckedChange={(v) => handleChange(setAutoReminders, v)}
                disabled={!isPremium}
              />
            </div>
            
            {autoReminders && (
              <div className="ml-7 pl-3 border-l space-y-3">
                <div className="flex items-center gap-3">
                  <Label htmlFor="reminderDay" className="text-sm min-w-[80px]">Mahntag:</Label>
                  <Input
                    id="reminderDay"
                    type="number"
                    min={1}
                    max={28}
                    value={reminderDay}
                    onChange={(e) => handleChange(setReminderDay, parseInt(e.target.value) || 10)}
                    className="w-20"
                    disabled={!isPremium}
                  />
                  <span className="text-sm text-muted-foreground">des Monats</span>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Kommunikationsweg:</Label>
                  <RadioGroup 
                    value={reminderChannel} 
                    onValueChange={(v) => handleChange(setReminderChannel, v as 'email' | 'letter')}
                    disabled={!isPremium}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="email" />
                      <Label htmlFor="email" className="text-sm font-normal">E-Mail</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="letter" id="letter" />
                      <Label htmlFor="letter" className="text-sm font-normal">Brief</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Mietbericht */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>Automatische Mietberichte</Label>
                  <p className="text-xs text-muted-foreground">
                    Monatsbericht per E-Mail an Sie
                  </p>
                </div>
              </div>
              <Switch 
                checked={autoReports} 
                onCheckedChange={(v) => handleChange(setAutoReports, v)}
                disabled={!isPremium}
              />
            </div>
            
            {autoReports && (
              <div className="ml-7 pl-3 border-l">
                <div className="flex items-center gap-3">
                  <Label htmlFor="reportDay" className="text-sm min-w-[80px]">Reporttag:</Label>
                  <Input
                    id="reportDay"
                    type="number"
                    min={1}
                    max={28}
                    value={reportDay}
                    onChange={(e) => handleChange(setReportDay, parseInt(e.target.value) || 15)}
                    className="w-20"
                    disabled={!isPremium}
                  />
                  <span className="text-sm text-muted-foreground">des Monats</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kontoanbindung (FinAPI) */}
      <Card className={isPremium ? '' : 'border-dashed'}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Mietkonten
            {!isPremium && <Badge variant="secondary" className="ml-auto">Premium</Badge>}
          </CardTitle>
          <CardDescription>
            Verbinden Sie Ihre Bankkonten für automatische Transaktionserkennung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bankAccounts.length > 0 ? (
            <div className="space-y-2">
              {bankAccounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{account.account_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {account.iban} ({account.bank_name})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.is_default && (
                      <Badge variant="outline" className="text-xs">Standard</Badge>
                    )}
                    <Badge 
                      variant={account.status === 'connected' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {account.status === 'connected' ? 'Verbunden' : 
                       account.status === 'pending' ? 'Ausstehend' : 'Fehler'}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">Keine Konten verbunden</p>
              <p className="text-sm text-muted-foreground mt-1">
                Verbinden Sie Ihre Mietkonten für automatische Zahlungserkennung.
              </p>
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full" 
            disabled={!isPremium}
          >
            <Plus className="h-4 w-4 mr-2" />
            Konto hinzufügen
          </Button>

          <div className="rounded-lg bg-accent/10 p-3 text-sm">
            <p className="font-medium text-accent-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Coming Soon: FinAPI-Integration
            </p>
            <p className="text-muted-foreground mt-1">
              Automatische Transaktionserkennung und Zuordnung zu Mietverhältnissen.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* E-Mail-Versand */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="h-4 w-4" />
            E-Mail-Versand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Alle automatischen E-Mails werden über das System versendet (Resend).
            Die Absenderadresse ist Ihre hinterlegte Firmen-E-Mail aus den Stammdaten.
          </p>
          <Button variant="link" className="p-0 h-auto mt-2" asChild>
            <a href="/portal/stammdaten/firma">
              <ExternalLink className="h-3 w-3 mr-1" />
              Firmen-E-Mail bearbeiten
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EinstellungenTab;
