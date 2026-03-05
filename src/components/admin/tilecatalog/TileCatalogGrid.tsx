/**
 * TileCatalogGrid — Card grid showing all tiles from tile_catalog
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/integrations/supabase/types';
import {
  Building2, ShoppingCart, Users, FolderOpen, Mail, Wrench, Settings, LayoutGrid,
} from 'lucide-react';

type TileCatalog = Tables<'tile_catalog'>;

interface SubTile {
  title: string;
  route: string;
  icon_key: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'building-2': Building2, 'shopping-cart': ShoppingCart, 'users': Users,
  'folder-open': FolderOpen, 'mail': Mail, 'wrench': Wrench,
  'settings': Settings, 'layout-grid': LayoutGrid,
};

function getIcon(iconKey: string) {
  const Icon = ICON_MAP[iconKey] || LayoutGrid;
  return <Icon className="h-5 w-5" />;
}

interface TileCatalogGridProps {
  tiles: TileCatalog[];
  getActivationCount: (tileCode: string) => number;
}

export function TileCatalogGrid({ tiles, getActivationCount }: TileCatalogGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tiles.map(tile => {
        const subTiles = (tile.sub_tiles as unknown as SubTile[]) || [];
        return (
          <Card key={tile.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">{getIcon(tile.icon_key)}</div>
                <div>
                  <CardTitle className="text-lg">{tile.title}</CardTitle>
                  <CardDescription className="text-xs">{tile.tile_code}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{tile.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hauptroute:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{tile.main_tile_route}</code>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Sub-Tiles:</span>
                <div className="grid grid-cols-2 gap-1">
                  {subTiles.map((st, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs justify-center">{st.title}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant={tile.is_active ? 'default' : 'secondary'}>{tile.is_active ? 'Aktiv' : 'Inaktiv'}</Badge>
                <span className="text-sm text-muted-foreground">{getActivationCount(tile.tile_code)} Tenants</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
