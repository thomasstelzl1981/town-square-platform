/**
 * AcquiaryAssignments — Mandate Assignment Overview
 * 
 * Shows mandates that have been assigned but not yet accepted
 * Allows re-assignment if needed
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
  Link2, Loader2, User, Building2, Clock, 
  CheckCircle2, XCircle, RefreshCw
} from 'lucide-react';
import { useAcqMandates, useAkquiseManagers, useAssignAcqManager } from '@/hooks/useAcqMandate';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { MANDATE_STATUS_CONFIG } from '@/types/acquisition';

// Re-assignment button component
function ReassignButton({ 
  mandateId, 
  currentManagerId 
}: { 
  mandateId: string; 
  currentManagerId: string | null;
}) {
  const { data: managers } = useAkquiseManagers();
  const assignManager = useAssignAcqManager();
  const [open, setOpen] = React.useState(false);
  const [selectedManagerId, setSelectedManagerId] = React.useState('');

  const handleReassign = async () => {
    if (!selectedManagerId) return;
    await assignManager.mutateAsync({
      mandateId,
      managerId: selectedManagerId,
    });
    setOpen(false);
    setSelectedManagerId('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Neu zuweisen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manager neu zuweisen</DialogTitle>
          <DialogDescription>
            Wählen Sie einen anderen AkquiseManager für dieses Mandat.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
            <SelectTrigger>
              <SelectValue placeholder="Manager auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {managers?.filter(m => m.id !== currentManagerId).map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.display_name || manager.email || manager.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleReassign}
            disabled={!selectedManagerId || assignManager.isPending}
          >
            {assignManager.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Neu zuweisen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AcquiaryAssignments() {
  const { data: mandates, isLoading } = useAcqMandates();
  const { data: managers } = useAkquiseManagers();

  // Filter to assigned mandates (not yet active)
  const assignedMandates = mandates?.filter(m => m.status === 'assigned') || [];
  const activeMandates = mandates?.filter(m => m.status === 'active') || [];

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return '–';
    const manager = managers?.find(m => m.id === managerId);
    return manager?.display_name || manager?.email || 'Unbekannt';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warten auf Annahme</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedMandates.length}</div>
            <p className="text-xs text-muted-foreground">Manager muss Split bestätigen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiv</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeMandates.length}</div>
            <p className="text-xs text-muted-foreground">In Bearbeitung</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AkquiseManager</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Verfügbar</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Acceptance */}
      {assignedMandates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Warten auf Annahme
          </h3>
          {assignedMandates.map((mandate) => (
            <Card key={mandate.id} className="border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{mandate.code}</span>
                        <Badge variant="secondary">Zugewiesen</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{getManagerName(mandate.assigned_manager_user_id)}</span>
                        <span>•</span>
                        <span>
                          Zugewiesen {mandate.assigned_at 
                            ? formatDistanceToNow(new Date(mandate.assigned_at), { locale: de, addSuffix: true })
                            : '–'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReassignButton mandateId={mandate.id} currentManagerId={mandate.assigned_manager_user_id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recently Accepted */}
      {activeMandates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Kürzlich angenommen
          </h3>
          {activeMandates.slice(0, 5).map((mandate) => (
            <Card key={mandate.id} className="border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{mandate.code}</span>
                        <Badge className="bg-green-500">Aktiv</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{getManagerName(mandate.assigned_manager_user_id)}</span>
                        <span>•</span>
                        <span>
                          Split bestätigt {mandate.split_terms_confirmed_at 
                            ? formatDistanceToNow(new Date(mandate.split_terms_confirmed_at), { locale: de, addSuffix: true })
                            : '–'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {assignedMandates.length === 0 && activeMandates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine zugewiesenen Mandate</h3>
            <p className="text-muted-foreground">
              Weisen Sie neue Mandate aus dem Inbox einem AkquiseManager zu.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
