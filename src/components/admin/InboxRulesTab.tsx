/**
 * R-3: Routing Rules Tab extracted from Inbox.tsx
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Filter, Pencil, Trash2 } from 'lucide-react';
import type { RoutingRule, Organization } from './inboxTypes';
import { getOrgName } from './inboxHelpers';

interface InboxRulesTabProps {
  rules: RoutingRule[];
  organizations: Organization[];
  onCreateRule: () => void;
  onEditRule: (rule: RoutingRule) => void;
  onDeleteRule: (ruleId: string) => void;
}

export default function InboxRulesTab({ rules, organizations, onCreateRule, onEditRule, onDeleteRule }: InboxRulesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div />
        <Button size="sm" onClick={onCreateRule}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Regel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Routing-Regeln</CardTitle>
          <CardDescription>Bestimmen, wohin eingehende Post automatisch zugestellt wird</CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Filter className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Keine Routing-Regeln vorhanden</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Ziel-Tenant</TableHead>
                  <TableHead>Mandat</TableHead>
                  <TableHead>Priorität</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        {rule.description && <p className="text-sm text-muted-foreground">{rule.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{getOrgName(rule.target_tenant_id, organizations)}</TableCell>
                    <TableCell>
                      {rule.mandate_id ? <Badge variant="outline" className="text-xs">Verknüpft</Badge> : '—'}
                    </TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => onEditRule(rule)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDeleteRule(rule.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
