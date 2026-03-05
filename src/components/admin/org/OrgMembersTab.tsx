/**
 * OrgMembersTab — Members table
 * R-19 sub-component
 */
import type { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type Membership = Tables<'memberships'>;

interface ProfileInfo {
  display_name: string | null;
  email: string | null;
}

interface Props {
  memberships: Membership[];
  profiles: Map<string, ProfileInfo>;
}

const formatRole = (role: string) => role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export function OrgMembersTab({ memberships, profiles }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>Mitglieder</CardTitle><CardDescription>{memberships.length} Benutzer in dieser Organisation</CardDescription></CardHeader>
      <CardContent>
        {memberships.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Keine Mitglieder gefunden</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Benutzer</TableHead><TableHead>E-Mail</TableHead><TableHead>Rolle</TableHead><TableHead>Erstellt</TableHead></TableRow></TableHeader>
            <TableBody>
              {memberships.map(m => {
                const profile = profiles.get(m.user_id);
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{(profile as any)?.display_name || m.user_id.substring(0, 8) + '…'}</TableCell>
                    <TableCell className="text-muted-foreground">{(profile as any)?.email || '—'}</TableCell>
                    <TableCell><Badge variant={m.role === 'platform_admin' ? 'default' : m.role === 'org_admin' ? 'secondary' : 'outline'}>{formatRole(m.role)}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(m.created_at), 'dd.MM.yyyy', { locale: de })}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
