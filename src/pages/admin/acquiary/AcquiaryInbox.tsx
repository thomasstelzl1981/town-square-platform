/**
 * AcquiaryInbox — New Mandate Submissions
 * 
 * Shows mandates with status: submitted_to_zone1
 * Allows triaging and assigning to AkquiseManager
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Inbox, Loader2, User, MapPin, Building2, 
  FileText, CheckCircle2, Users, Euro
} from 'lucide-react';
import { 
  useAcqMandatesInbox, 
  useAssignAcqManager,
  useAkquiseManagers,
} from '@/hooks/useAcqMandate';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { MANDATE_STATUS_CONFIG, ASSET_FOCUS_OPTIONS } from '@/types/acquisition';

export default function AcquiaryInbox() {
  const { data: mandates, isLoading } = useAcqMandatesInbox();
  const { data: managers } = useAkquiseManagers();
  const assignManager = useAssignAcqManager();
  
  const [selectedMandateId, setSelectedMandateId] = React.useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = React.useState<string>('');
  const [assignOpen, setAssignOpen] = React.useState(false);

  const handleAssign = async () => {
    if (!selectedMandateId || !selectedManagerId) return;
    
    await assignManager.mutateAsync({
      mandateId: selectedMandateId,
      managerId: selectedManagerId,
    });
    
    setAssignOpen(false);
    setSelectedMandateId(null);
    setSelectedManagerId('');
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '–';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  const getAssetFocusLabels = (focus: string[] | null) => {
    if (!focus || focus.length === 0) return '–';
    return focus.map(f => {
      const option = ASSET_FOCUS_OPTIONS.find(o => o.value === f);
      return option?.label || f;
    }).join(', ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!mandates || mandates.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keine neuen Mandate</h3>
          <p className="text-muted-foreground">
            Aktuell gibt es keine Akquise-Mandate zu bearbeiten.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neue Mandate</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mandates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verfügbare Manager</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ø Volumen</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                mandates.reduce((sum, m) => sum + ((m.price_min || 0) + (m.price_max || 0)) / 2, 0) / mandates.length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ältestes Mandat</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mandates.length > 0 
                ? format(new Date(mandates[mandates.length - 1].created_at), 'dd.MM.', { locale: de })
                : '–'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mandate List */}
      <div className="space-y-3">
        {mandates.map((mandate) => {
          const statusConfig = MANDATE_STATUS_CONFIG[mandate.status] || MANDATE_STATUS_CONFIG.draft;

          return (
            <Card key={mandate.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{mandate.code}</span>
                        <Badge variant={statusConfig.variant as any}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{(mandate.search_area as any)?.region || 'Region nicht angegeben'}</span>
                        <span>•</span>
                        <span>{getAssetFocusLabels(mandate.asset_focus)}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(mandate.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        {formatCurrency(mandate.price_min)} – {formatCurrency(mandate.price_max)}
                      </div>
                      {mandate.yield_target && (
                        <div className="text-muted-foreground">
                          Zielrendite: {mandate.yield_target}%
                        </div>
                      )}
                    </div>
                    
                    <Dialog open={assignOpen && selectedMandateId === mandate.id} onOpenChange={(open) => {
                      setAssignOpen(open);
                      if (open) setSelectedMandateId(mandate.id);
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Users className="h-4 w-4 mr-2" />
                          Zuweisen
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>AkquiseManager zuweisen</DialogTitle>
                          <DialogDescription>
                            Wählen Sie einen AkquiseManager für Mandat {mandate.code}.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4 space-y-4">
                          <div className="p-3 bg-muted rounded-lg text-sm">
                            <div className="font-medium mb-1">Mandat-Details</div>
                            <div className="text-muted-foreground">
                              {getAssetFocusLabels(mandate.asset_focus)} • {formatCurrency(mandate.price_min)} – {formatCurrency(mandate.price_max)}
                            </div>
                          </div>
                          
                          <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Manager auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                              {managers?.map((manager) => (
                                <SelectItem key={manager.id} value={manager.id}>
                                  {manager.display_name || manager.email || manager.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {(!managers || managers.length === 0) && (
                            <p className="text-sm text-muted-foreground">
                              Keine Benutzer mit der Rolle "akquise_manager" gefunden.
                            </p>
                          )}
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAssignOpen(false)}>
                            Abbrechen
                          </Button>
                          <Button 
                            onClick={handleAssign}
                            disabled={!selectedManagerId || assignManager.isPending}
                          >
                            {assignManager.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Zuweisen
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
