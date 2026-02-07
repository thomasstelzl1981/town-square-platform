/**
 * FutureRoom Zuweisung — Assignment Workstation
 * 
 * Lists unassigned (submitted_to_zone1) and assigned-but-not-accepted requests.
 * Allows assigning finance_manager_user_id.
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinanceMandates, useFinanceManagers, useAssignFinanceManager } from '@/hooks/useFinanceMandate';
import { Link2, User, CheckCircle2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

export default function FutureRoomZuweisung() {
  const { data: mandates, isLoading: mandatesLoading } = useFinanceMandates();
  const { data: managers, isLoading: managersLoading } = useFinanceManagers();
  const assignManager = useAssignFinanceManager();

  const [selectedManager, setSelectedManager] = useState<Record<string, string>>({});

  // Filter: unassigned (submitted_to_zone1) + assigned-but-not-accepted
  const unassigned = mandates?.filter(m => m.status === 'submitted_to_zone1' || m.status === 'new') || [];
  const assigned = mandates?.filter(m => m.status === 'assigned') || [];

  const handleAssign = async (mandateId: string) => {
    const managerId = selectedManager[mandateId];
    if (!managerId) {
      toast.error('Bitte einen Manager auswählen');
      return;
    }
    
    try {
      await assignManager.mutateAsync({ mandateId, managerId });
      toast.success('Manager erfolgreich zugewiesen');
      setSelectedManager(prev => {
        const next = { ...prev };
        delete next[mandateId];
        return next;
      });
    } catch (err) {
      toast.error('Zuweisung fehlgeschlagen');
    }
  };

  const isLoading = mandatesLoading || managersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unassigned Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Offene Anfragen zur Zuweisung
          </CardTitle>
          <CardDescription>
            Status: submitted_to_zone1 — Warten auf Manager-Zuweisung
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unassigned.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine offenen Anfragen</h3>
              <p className="text-muted-foreground">
                Alle Finanzierungsanfragen wurden zugewiesen.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Eingereicht</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Objekt</TableHead>
                  <TableHead>Manager zuweisen</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassigned.map((mandate) => (
                  <TableRow key={mandate.id}>
                    <TableCell className="font-mono text-sm">
                      {mandate.public_id || mandate.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(mandate.created_at), { 
                        addSuffix: true, 
                        locale: de 
                      })}
                    </TableCell>
                    <TableCell>
                      {mandate.finance_requests?.applicant_profiles?.[0]?.first_name 
                        ? `${mandate.finance_requests.applicant_profiles[0].first_name} ${mandate.finance_requests.applicant_profiles[0].last_name || ''}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {mandate.finance_requests?.object_address?.slice(0, 25) || 'Kein Objekt'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selectedManager[mandate.id] || ''}
                        onValueChange={(v) => setSelectedManager(prev => ({ ...prev, [mandate.id]: v }))}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Manager wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {managers?.map((mgr) => (
                            <SelectItem key={mgr.id} value={mgr.id}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {mgr.display_name || mgr.email}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleAssign(mandate.id)}
                        disabled={!selectedManager[mandate.id] || assignManager.isPending}
                      >
                        {assignManager.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Zuweisen'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assigned but not accepted */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Zugewiesen — Warten auf Annahme
          </CardTitle>
          <CardDescription>
            Status: assigned — Manager wurde informiert, Annahme steht aus
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assigned.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine wartenden Zuweisungen</h3>
              <p className="text-muted-foreground">
                Alle zugewiesenen Anfragen wurden von Managern angenommen.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Zugewiesen an</TableHead>
                  <TableHead>Zugewiesen am</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assigned.map((mandate) => (
                  <TableRow key={mandate.id}>
                    <TableCell className="font-mono text-sm">
                      {mandate.public_id || mandate.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {mandate.assigned_manager_id || '—'}
                    </TableCell>
                    <TableCell>
                      {mandate.delegated_at 
                        ? formatDistanceToNow(new Date(mandate.delegated_at), { addSuffix: true, locale: de })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Warte auf Annahme</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
