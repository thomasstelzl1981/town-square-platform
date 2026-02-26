import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Camera, Plus, ShoppingCart, ArrowRight, Trash2, Pencil, RefreshCw, Loader2 } from 'lucide-react';
import { useCameras, useCameraSnapshot, type Camera as CameraType } from '@/hooks/useCameras';
import { AddCameraDialog } from '@/components/miety/AddCameraDialog';
import type { CameraFormData } from '@/hooks/useCameras';

function CameraCard({ camera, onEdit, onDelete }: {
  camera: CameraType;
  onEdit: (c: CameraType) => void;
  onDelete: (id: string) => void;
}) {
  const { snapshotUrl, status, refresh } = useCameraSnapshot(camera.id, camera.refresh_interval_sec);

  return (
    <Card className="glass-card overflow-hidden">
      {/* Snapshot area */}
      <div className="relative aspect-video bg-muted flex items-center justify-center">
        {status === 'loading' && (
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
        )}
        {status === 'online' && snapshotUrl && (
          <img
            src={snapshotUrl}
            alt={camera.name}
            className="w-full h-full object-cover"
          />
        )}
        {status === 'offline' && (
          <div className="text-center text-muted-foreground">
            <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Nicht erreichbar</p>
          </div>
        )}
        {status === 'error' && (
          <div className="text-center text-destructive">
            <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Verbindungsfehler</p>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <Badge
            variant={status === 'online' ? 'default' : 'secondary'}
            className={status === 'online'
              ? 'bg-green-600 text-white text-[10px]'
              : 'text-[10px]'}
          >
            {status === 'online' ? '● Live' : status === 'loading' ? '…' : '○ Offline'}
          </Badge>
        </div>
      </div>

      {/* Info bar */}
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{camera.name}</p>
            <p className="text-[11px] text-muted-foreground">
              Alle {camera.refresh_interval_sec}s
            </p>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => refresh()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(camera)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(camera.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SmartHomeTile() {
  const navigate = useNavigate();
  const { camerasQuery, addCamera, updateCamera, deleteCamera } = useCameras();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCamera, setEditCamera] = useState<CameraType | null>(null);

  const cameras = camerasQuery.data ?? [];

  const handleAdd = (data: CameraFormData) => {
    addCamera.mutate(data, { onSuccess: () => setDialogOpen(false) });
  };

  const handleEdit = (data: CameraFormData) => {
    if (!editCamera) return;
    updateCamera.mutate({ id: editCamera.id, ...data }, {
      onSuccess: () => setEditCamera(null),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Kamera wirklich löschen?')) deleteCamera.mutate(id);
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="Smart Home"
        description="Kamera-Überwachung und Snapshot-Integration"
      />

      {/* Camera grid */}
      {cameras.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cameras.map((cam) => (
            <CameraCard
              key={cam.id}
              camera={cam}
              onEdit={(c) => setEditCamera(c)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Empty state when no cameras */}
      {cameras.length === 0 && !camerasQuery.isLoading && (
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <div className="p-4 rounded-full bg-primary/10 inline-block mb-4">
              <Camera className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Meine Kameras</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Verbinden Sie eine kompatible IP-Kamera (Amcrest, Reolink), um Live-Snapshots
              direkt in Ihrer Übersicht zu sehen — ohne Cloud-Abo.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs">Amcrest</Badge>
              <Badge variant="outline" className="text-xs">Reolink</Badge>
              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-0 text-xs">
                HTTP-Snapshot
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add camera button */}
      <Button onClick={() => setDialogOpen(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Kamera hinzufügen
      </Button>

      {/* Link to Smart Home Shop */}
      <Card className="glass-card border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Kompatible Kameras ansehen</p>
              <p className="text-xs text-muted-foreground">
                IP-Kameras von Amcrest & Reolink, die direkt mit Ihrem Dashboard funktionieren
              </p>
            </div>
            <Button size="sm" onClick={() => navigate('/portal/services/smart-home')}>
              <ArrowRight className="h-4 w-4 mr-1" />
              Zum Shop
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requirements info */}
      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Voraussetzungen</p>
          <ul className="list-disc list-inside space-y-1">
            <li>IP-Kamera mit HTTP-Snapshot-URL (Amcrest, Reolink)</li>
            <li>Öffentliche Erreichbarkeit via Port-Forwarding oder DynDNS</li>
            <li>HTTP Basic Auth Zugangsdaten der Kamera</li>
          </ul>
        </CardContent>
      </Card>

      {/* Add dialog */}
      <AddCameraDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAdd}
        isLoading={addCamera.isPending}
        mode="add"
      />

      {/* Edit dialog */}
      {editCamera && (
        <AddCameraDialog
          open={!!editCamera}
          onOpenChange={(open) => { if (!open) setEditCamera(null); }}
          onSubmit={handleEdit}
          isLoading={updateCamera.isPending}
          initialData={{
            name: editCamera.name,
            snapshot_url: editCamera.snapshot_url,
            auth_user: editCamera.auth_user ?? '',
            auth_pass: editCamera.auth_pass ?? '',
            refresh_interval_sec: editCamera.refresh_interval_sec,
          }}
          mode="edit"
        />
      )}
    </PageShell>
  );
}
