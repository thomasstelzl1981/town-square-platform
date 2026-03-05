/**
 * R-6: Membership table with inline actions
 */
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { resolveDisplayRole, type Membership, type MembershipWithOrg, type ProfileInfo } from './userTypes';

interface UserTableProps {
  memberships: MembershipWithOrg[];
  profilesMap: Record<string, ProfileInfo>;
  superUserIds: Set<string>;
  getOrgName: (tenantId: string) => string;
  canEditMembership: (membership: Membership) => boolean;
  canDeleteMembership: (membership: Membership) => boolean;
  onEdit: (membership: Membership) => void;
  onDelete: (membership: Membership) => void;
}

export function UserTable({
  memberships, profilesMap, superUserIds, getOrgName,
  canEditMembership, canDeleteMembership, onEdit, onDelete,
}: UserTableProps) {
  if (memberships.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <p className="mt-2 text-muted-foreground">Keine Mitgliedschaften gefunden</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Benutzer</TableHead>
          <TableHead>Organisation</TableHead>
          <TableHead>Rolle</TableHead>
          <TableHead>Erstellt</TableHead>
          <TableHead className="text-right">Aktionen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {memberships.map((membership) => {
          const profile = profilesMap[membership.user_id];
          const resolved = resolveDisplayRole(membership.role, membership.user_id, superUserIds);
          return (
            <TableRow key={membership.id}>
              <TableCell>
                <div>
                  <p className="font-medium truncate max-w-[200px]">
                    {profile?.display_name || profile?.email || membership.user_id}
                  </p>
                  {profile?.email && profile?.display_name && (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{profile.email}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>{getOrgName(membership.tenant_id)}</TableCell>
              <TableCell><Badge variant={resolved.variant}>{resolved.label}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(membership.created_at), 'dd.MM.yyyy', { locale: de })}
              </TableCell>
              <TableCell className="text-right space-x-1">
                {canEditMembership(membership) && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(membership)}><Pencil className="h-4 w-4" /></Button>
                )}
                {canDeleteMembership(membership) && (
                  <Button variant="ghost" size="sm" onClick={() => onDelete(membership)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
