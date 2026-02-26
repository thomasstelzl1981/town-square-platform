/**
 * CameraWidget — Live-Snapshot einer IP-Kamera als Widget (aspect-square)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useCameraSnapshot } from '@/hooks/useCameras';

interface CameraWidgetProps {
  camera: any;
  onEdit: (camera: any) => void;
  onDelete: (id: string) => void;
}

export function CameraWidget({ camera, onEdit, onDelete }: CameraWidgetProps) {
  const { snapshotUrl, status, refresh } = useCameraSnapshot(camera.id, camera.refresh_interval_sec);

  return (
    <Card className="glass-card overflow-hidden h-full flex flex-col">
      {/* Snapshot area */}
      <div className="relative flex-1 bg-muted flex items-center justify-center min-h-0">
        {status === 'loading' && <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />}
        {status === 'online' && snapshotUrl && (
          <img src={snapshotUrl} alt={camera.name} className="w-full h-full object-cover absolute inset-0" />
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
        <div className="absolute top-2 left-2">
          <Badge
            variant={status === 'online' ? 'default' : 'secondary'}
            className={status === 'online' ? 'bg-green-600 text-white text-[10px]' : 'text-[10px]'}
          >
            {status === 'online' ? '● Live' : status === 'loading' ? '…' : '○ Offline'}
          </Badge>
        </div>
      </div>

      {/* Info bar */}
      <CardContent className="p-3 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{camera.name}</p>
          <p className="text-[11px] text-muted-foreground">Alle {camera.refresh_interval_sec}s</p>
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
      </CardContent>
    </Card>
  );
}
