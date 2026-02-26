import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CameraFormData } from '@/hooks/useCameras';

interface AddCameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CameraFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<CameraFormData>;
  mode?: 'add' | 'edit';
}

export function AddCameraDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  initialData,
  mode = 'add',
}: AddCameraDialogProps) {
  const [name, setName] = useState(initialData?.name ?? 'Kamera 1');
  const [snapshotUrl, setSnapshotUrl] = useState(initialData?.snapshot_url ?? '');
  const [authUser, setAuthUser] = useState(initialData?.auth_user ?? '');
  const [authPass, setAuthPass] = useState(initialData?.auth_pass ?? '');
  const [refreshInterval, setRefreshInterval] = useState(
    initialData?.refresh_interval_sec?.toString() ?? '30'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      snapshot_url: snapshotUrl,
      auth_user: authUser || undefined,
      auth_pass: authPass || undefined,
      refresh_interval_sec: parseInt(refreshInterval) || 30,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Kamera hinzufügen' : 'Kamera bearbeiten'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cam-name">Name</Label>
            <Input
              id="cam-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Einfahrt, Garten"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cam-url">Snapshot-URL</Label>
            <Input
              id="cam-url"
              value={snapshotUrl}
              onChange={(e) => setSnapshotUrl(e.target.value)}
              placeholder="http://meine-ip:8080/cgi-bin/snapshot.cgi"
              required
            />
            <p className="text-xs text-muted-foreground">
              Die öffentlich erreichbare URL zum Snapshot-Endpunkt Ihrer Kamera
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cam-user">Benutzername</Label>
              <Input
                id="cam-user"
                value={authUser}
                onChange={(e) => setAuthUser(e.target.value)}
                placeholder="admin"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cam-pass">Passwort</Label>
              <Input
                id="cam-pass"
                type="password"
                value={authPass}
                onChange={(e) => setAuthPass(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cam-refresh">Aktualisierung (Sekunden)</Label>
            <Input
              id="cam-refresh"
              type="number"
              min={5}
              max={300}
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || !snapshotUrl}>
              {mode === 'add' ? 'Hinzufügen' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
