/**
 * R-6: All dialogs for Users page (Create membership, Edit role, Delete confirmation, Create user)
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { Membership, MembershipRole, Organization } from './userTypes';

// === Edit Role Dialog ===
interface EditRoleDialogProps {
  editTarget: Membership | null;
  editRole: MembershipRole | '';
  editing: boolean;
  editError: string | null;
  availableRoles: { value: MembershipRole; label: string; restricted?: boolean }[];
  getOrgName: (id: string) => string;
  onRoleChange: (role: MembershipRole) => void;
  onSave: () => void;
  onClose: () => void;
}

export function EditRoleDialog({ editTarget, editRole, editing, editError, availableRoles, getOrgName, onRoleChange, onSave, onClose }: EditRoleDialogProps) {
  return (
    <Dialog open={!!editTarget} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mitgliedschaft bearbeiten</DialogTitle>
          <DialogDescription>Rolle für diese Mitgliedschaft ändern.</DialogDescription>
        </DialogHeader>
        {editError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{editError}</AlertDescription></Alert>}
        {editTarget && (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Benutzer-ID</Label><p className="font-mono text-sm text-muted-foreground">{editTarget.user_id}</p></div>
            <div className="space-y-2"><Label>Organisation</Label><p className="text-sm">{getOrgName(editTarget.tenant_id)}</p></div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Neue Rolle</Label>
              <Select value={editRole} onValueChange={(value) => onRoleChange(value as MembershipRole)}>
                <SelectTrigger><SelectValue placeholder="Rolle wählen" /></SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (<SelectItem key={role.value} value={role.value}>{role.label}{role.restricted && ' ⚠️'}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={onSave} disabled={editing || !editRole}>{editing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// === Delete Confirmation ===
interface DeleteConfirmDialogProps {
  deleteTarget: Membership | null;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmDialog({ deleteTarget, deleting, onConfirm, onClose }: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={!!deleteTarget} onOpenChange={() => onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mitgliedschaft entfernen</AlertDialogTitle>
          <AlertDialogDescription>Die Rolle des Benutzers in dieser Organisation wird entfernt. Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={deleting}>{deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Entfernen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// === Create Membership Dialog ===
interface CreateMembershipDialogProps {
  open: boolean;
  creating: boolean;
  createError: string | null;
  newMembership: { user_id: string; tenant_id: string; role: MembershipRole | '' };
  organizations: Organization[];
  availableRoles: { value: MembershipRole; label: string; restricted?: boolean }[];
  isPlatformAdmin: boolean;
  onChange: (data: { user_id: string; tenant_id: string; role: MembershipRole | '' }) => void;
  onCreate: () => void;
  onClose: () => void;
}

export function CreateMembershipDialog({ open, creating, createError, newMembership, organizations, availableRoles, isPlatformAdmin, onChange, onCreate, onClose }: CreateMembershipDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mitgliedschaft hinzufügen</DialogTitle>
          <DialogDescription>Einem Benutzer eine Rolle in einer Organisation zuweisen.</DialogDescription>
        </DialogHeader>
        {createError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{createError}</AlertDescription></Alert>}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_id">Benutzer-ID</Label>
            <Input id="user_id" value={newMembership.user_id} onChange={(e) => onChange({ ...newMembership, user_id: e.target.value })} placeholder="UUID des Benutzers" />
            <p className="text-xs text-muted-foreground">Benutzer-UUID aus der Profiltabelle eingeben</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant">Organisation</Label>
            <Select value={newMembership.tenant_id} onValueChange={(value) => onChange({ ...newMembership, tenant_id: value })}>
              <SelectTrigger><SelectValue placeholder="Organisation wählen" /></SelectTrigger>
              <SelectContent>{organizations.map(org => (<SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rolle</Label>
            <Select value={newMembership.role} onValueChange={(value) => onChange({ ...newMembership, role: value as MembershipRole })}>
              <SelectTrigger><SelectValue placeholder="Rolle wählen" /></SelectTrigger>
              <SelectContent>{availableRoles.map(role => (<SelectItem key={role.value} value={role.value}>{role.label}{role.restricted && ' ⚠️'}</SelectItem>))}</SelectContent>
            </Select>
            {!isPlatformAdmin && <p className="text-xs text-muted-foreground">Die Platform-Admin-Rolle kann nur von Platform Admins vergeben werden</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={onCreate} disabled={creating}>{creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Hinzufügen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// === Create User Dialog ===
interface CreateUserDialogProps {
  open: boolean;
  creating: boolean;
  createError: string | null;
  newUser: { email: string; password: string; displayName: string };
  onChange: (data: { email: string; password: string; displayName: string }) => void;
  onCreate: () => void;
  onClose: () => void;
}

export function CreateUserDialog({ open, creating, createError, newUser, onChange, onCreate, onClose }: CreateUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuen Benutzer anlegen</DialogTitle>
          <DialogDescription>Der Benutzer erhält automatisch einen eigenen Mandanten und kann sich sofort mit diesen Daten einloggen.</DialogDescription>
        </DialogHeader>
        {createError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{createError}</AlertDescription></Alert>}
        <div className="space-y-4">
          <div className="space-y-2"><Label htmlFor="new-email">E-Mail-Adresse</Label><Input id="new-email" type="email" value={newUser.email} onChange={(e) => onChange({ ...newUser, email: e.target.value })} placeholder="name@example.com" /></div>
          <div className="space-y-2"><Label htmlFor="new-password">Passwort</Label><Input id="new-password" type="text" value={newUser.password} onChange={(e) => onChange({ ...newUser, password: e.target.value })} placeholder="Mindestens 6 Zeichen" /></div>
          <div className="space-y-2"><Label htmlFor="new-displayname">Anzeigename (optional)</Label><Input id="new-displayname" value={newUser.displayName} onChange={(e) => onChange({ ...newUser, displayName: e.target.value })} placeholder="Vor- und Nachname" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={onCreate} disabled={creating}>{creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Benutzer anlegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
