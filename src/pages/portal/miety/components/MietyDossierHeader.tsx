/**
 * MietyDossierHeader — Header with address, badges, quick actions
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Gauge, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MietyHome {
  id: string;
  name: string;
  address: string | null;
  address_house_no: string | null;
  zip: string | null;
  city: string | null;
  ownership_type: string;
  property_type: string;
  area_sqm: number | null;
}

interface MietyDossierHeaderProps {
  home: MietyHome;
  onOpenContractDrawer: () => void;
  onOpenMeterDrawer: () => void;
  onOpenUploadDrawer: () => void;
}

export function MietyDossierHeader({ home, onOpenContractDrawer, onOpenMeterDrawer, onOpenUploadDrawer }: MietyDossierHeaderProps) {
  const navigate = useNavigate();
  const shortAddress = [home.address, home.address_house_no].filter(Boolean).join(' ');
  const cityLine = [home.zip, home.city].filter(Boolean).join(' ');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/immobilien/zuhause/uebersicht')} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">Zuhause-Akte</h1>
          <p className="text-sm text-muted-foreground truncate">
            {shortAddress}{cityLine ? `, ${cityLine}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant="secondary" className="text-xs">
            {home.ownership_type === 'eigentum' ? 'Eigentum' : 'Miete'}
          </Badge>
          {home.area_sqm && (
            <Badge variant="outline" className="text-xs">{home.area_sqm} m²</Badge>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={onOpenUploadDrawer}>
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Dokument hochladen
        </Button>
        <Button size="sm" variant="outline" onClick={onOpenContractDrawer}>
          <FileText className="h-3.5 w-3.5 mr-1.5" />
          Vertrag anlegen
        </Button>
        <Button size="sm" variant="outline" onClick={onOpenMeterDrawer}>
          <Gauge className="h-3.5 w-3.5 mr-1.5" />
          Zählerstand eintragen
        </Button>
      </div>
    </div>
  );
}
