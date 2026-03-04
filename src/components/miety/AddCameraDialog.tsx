/**
 * CameraInlineForm — Inline card for creating/editing cameras (AES-konform)
 * 
 * Replaces the former AddCameraDialog (Dialog pattern → Inline pattern).
 * Also exports the legacy AddCameraDialog as a compatibility wrapper.
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Save } from 'lucide-react';
import { CameraFormData } from '@/hooks/useCameras';

interface CameraInlineFormProps {
  onSubmit: (data: CameraFormData) => void;
  onClose: () => void;
  isLoading?: boolean;
  initialData?: Partial<CameraFormData>;
  mode?: 'add' | 'edit';
}

export function CameraInlineForm({
  onSubmit,
  onClose,
  isLoading,
  initialData,
  mode = 'add',
}: CameraInlineFormProps) {
  const [name, setName] = useState(initialData?.name ?? (mode === 'add' ? 'Kamera 1' : ''));
  const [snapshotUrl, setSnapshotUrl] = useState(initialData?.snapshot_url ?? '');
  const [authUser, setAuthUser] = useState(initialData?.auth_user ?? '');
  const [authPass, setAuthPass] = useState(initialData?.auth_pass ?? '');
  const [refreshInterval, setRefreshInterval] = useState(
    initialData?.refresh_interval_sec?.toString() ?? '30'
  );

  useEffect(() => {
    setName(initialData?.name ?? (mode === 'add' ? 'Kamera 1' : ''));
    setSnapshotUrl(initialData?.snapshot_url ?? '');
    setAuthUser(initialData?.auth_user ?? '');
    setAuthPass(initialData?.auth_pass ?? '');
    setRefreshInterval(initialData?.refresh_interval_sec?.toString() ?? '30');
  }, [initialData, mode]);

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
    <Card className="glass-card border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {mode === 'add' ? 'Kamera hinzufügen' : 'Kamera bearbeiten'}
          </CardTitle>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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

          {/* Action buttons — AES-konform: Abbrechen + Speichern inline */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || !snapshotUrl}>
              <Save className="h-4 w-4 mr-2" />
              {mode === 'add' ? 'Hinzufügen' : 'Speichern'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/** @deprecated Legacy wrapper — use CameraInlineForm instead */
export function AddCameraDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CameraFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<CameraFormData>;
  mode?: 'add' | 'edit';
}) {
  if (!props.open) return null;
  return (
    <CameraInlineForm
      onSubmit={props.onSubmit}
      onClose={() => props.onOpenChange(false)}
      isLoading={props.isLoading}
      initialData={props.initialData}
      mode={props.mode}
    />
  );
}
