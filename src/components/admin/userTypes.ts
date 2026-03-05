/**
 * R-6: Extracted types and helpers from Users.tsx
 */
import type { Tables, Enums } from '@/integrations/supabase/types';
import { ROLES_CATALOG } from '@/constants/rolesMatrix';

export type Membership = Tables<'memberships'>;
export type Organization = Tables<'organizations'>;
export type MembershipRole = Enums<'membership_role'>;

export interface MembershipWithOrg extends Membership {
  organizations?: Organization;
}

export interface ProfileInfo {
  email?: string | null;
  display_name?: string | null;
}

const LEGACY_MEMBERSHIP_ROLES: { value: MembershipRole; label: string }[] = [
  { value: 'internal_ops', label: 'Internal Ops (Legacy)' },
  { value: 'renter_user', label: 'Mieter (Legacy)' },
  { value: 'future_room_web_user_lite', label: 'Web User Lite (Legacy)' },
];

export const ROLES: { value: MembershipRole; label: string; restricted?: boolean; description?: string; variant?: 'default' | 'secondary' | 'outline' | 'destructive' }[] = [
  ...ROLES_CATALOG
    .filter(r => !r.isLegacy)
    .map(r => ({
      value: r.membershipRole as MembershipRole,
      label: r.label,
      restricted: r.isSystem,
      description: r.description,
      variant: (r.isSystem ? 'default' : r.code === 'client_user' || r.code === 'super_user' ? 'secondary' : 'outline') as 'default' | 'secondary' | 'outline' | 'destructive',
    }))
    .filter((role, index, self) => self.findIndex(r => r.value === role.value) === index),
  ...LEGACY_MEMBERSHIP_ROLES.map(r => ({
    ...r,
    restricted: false,
    description: 'Legacy — nicht mehr aktiv vergeben',
    variant: 'outline' as const,
  })),
];

export function resolveDisplayRole(
  membershipRole: string,
  userId: string,
  superUserIds: Set<string>,
): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } {
  if (membershipRole === 'platform_admin') return { label: 'Platform Admin', variant: 'default' };
  if (membershipRole === 'org_admin') {
    if (superUserIds.has(userId)) return { label: 'Super-User', variant: 'secondary' };
    return { label: 'Standardkunde', variant: 'secondary' };
  }
  const found = ROLES.find(r => r.value === membershipRole);
  return { label: found?.label || membershipRole.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), variant: found?.variant || 'outline' };
}
