/**
 * HomeAddressWidget — Adresskarte als Widget (aspect-square)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight, Pencil } from 'lucide-react';
import { WidgetDeleteOverlay } from '@/components/shared/WidgetDeleteOverlay';
import { DEMO_WIDGET } from '@/config/designManifest';
import { isDemoId } from '@/engines/demoData/engine';
import { cn } from '@/lib/utils';

interface HomeAddressWidgetProps {
  home: any;
  profileName?: string;
  onEdit: (home: any) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
  isOpen?: boolean;
  isDeleting?: boolean;
}

export function HomeAddressWidget({ home, profileName, onEdit, onDelete, onOpen, isOpen, isDeleting }: HomeAddressWidgetProps) {
  const isDemo = isDemoId(home.id);

  return (
    <Card className={cn('glass-card h-full flex flex-col relative group', isDemo && DEMO_WIDGET.CARD)}>
      {!isDemo && (
        <WidgetDeleteOverlay
          title={home.name || 'Objekt'}
          onConfirmDelete={() => onDelete(home.id)}
          isDeleting={!!isDeleting}
        />
      )}
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-2 mb-3">
            {isDemo && <Badge className={DEMO_WIDGET.BADGE + ' text-[10px]'}>DEMO</Badge>}
            <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Mein Objekt</span>
          </div>
          <div className="space-y-1">
            {profileName && <p className="text-lg font-semibold">{profileName}</p>}
            <p className="text-base text-muted-foreground">{[home.address, home.address_house_no].filter(Boolean).join(' ')}</p>
            <p className="text-base text-muted-foreground">{[home.zip, home.city].filter(Boolean).join(' ')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <Badge variant="secondary" className="text-xs">{home.ownership_type === 'eigentum' ? 'Eigentum' : 'Miete'}</Badge>
            {home.property_type && <Badge variant="outline" className="text-xs capitalize">{home.property_type}</Badge>}
            {home.area_sqm && <Badge variant="outline" className="text-xs">{home.area_sqm} m²</Badge>}
            {home.rooms_count && <Badge variant="outline" className="text-xs">{home.rooms_count} Zimmer</Badge>}
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={() => onEdit(home)}>
            <Pencil className="h-3.5 w-3.5 mr-1" />Bearbeiten
          </Button>
          <Button size="sm" onClick={() => onOpen(home.id)}>
            <ArrowRight className="h-4 w-4 mr-1" />{isOpen ? 'Schließen' : 'Dossier'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
