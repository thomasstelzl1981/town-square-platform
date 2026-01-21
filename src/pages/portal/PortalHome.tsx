import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';

interface SubTile {
  title: string;
  route: string;
  icon_key: string;
}

interface TileData {
  tile_code: string;
  title: string;
  icon_key: string;
  main_tile_route: string;
  sub_tiles: SubTile[];
}

function getIcon(iconKey: string) {
  const iconMap: Record<string, any> = {
    'building-2': Icons.Building2,
    'shopping-cart': Icons.ShoppingCart,
    'users': Icons.Users,
    'folder-open': Icons.FolderOpen,
    'mail': Icons.Mail,
    'wrench': Icons.Wrench,
    'settings': Icons.Settings,
    'home': Icons.Home,
    'trending-up': Icons.TrendingUp,
    'file-text': Icons.FileText,
    'file-plus': Icons.FilePlus,
    'calendar-check': Icons.CalendarCheck,
    'git-branch': Icons.GitBranch,
    'check-circle': Icons.CheckCircle,
    'file-signature': Icons.FileSignature,
    'message-circle': Icons.MessageCircle,
    'help-circle': Icons.HelpCircle,
    'folder': Icons.Folder,
    'archive': Icons.Archive,
    'share-2': Icons.Share2,
    'search': Icons.Search,
    'inbox': Icons.Inbox,
    'send': Icons.Send,
    'megaphone': Icons.Megaphone,
    'layout': Icons.Layout,
    'check-square': Icons.CheckSquare,
    'ticket': Icons.Ticket,
    'calendar': Icons.Calendar,
    'user': Icons.User,
    'bell': Icons.Bell,
    'plug': Icons.Plug,
    'shield': Icons.Shield,
  };
  const Icon = iconMap[iconKey] || Icons.LayoutGrid;
  return Icon;
}

export default function PortalHome() {
  const { activeOrganization, profile } = useAuth();
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeOrganization?.id) {
      fetchActiveTiles();
    }
  }, [activeOrganization?.id]);

  async function fetchActiveTiles() {
    setLoading(true);
    try {
      // Get activated tiles for this tenant
      const { data: activations } = await supabase
        .from('tenant_tile_activation')
        .select('tile_code')
        .eq('tenant_id', activeOrganization!.id)
        .eq('status', 'active');

      if (!activations || activations.length === 0) {
        setTiles([]);
        setLoading(false);
        return;
      }

      const tileCodes = activations.map(a => a.tile_code);

      // Get tile details
      const { data: tileData } = await supabase
        .from('tile_catalog')
        .select('*')
        .in('tile_code', tileCodes)
        .eq('is_active', true)
        .order('display_order');

      setTiles((tileData || []).map(t => ({
        tile_code: t.tile_code,
        title: t.title,
        icon_key: t.icon_key,
        main_tile_route: t.main_tile_route,
        sub_tiles: (t.sub_tiles as unknown as SubTile[]) || [],
      })));
    } catch (error) {
      console.error('Error fetching tiles:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Willkommen{profile?.display_name ? `, ${profile.display_name}` : ''}
        </h1>
        <p className="text-muted-foreground">{activeOrganization?.name}</p>
      </div>

      {/* Tile Grid - iOS Style */}
      {tiles.length === 0 ? (
        <Card className="p-12 text-center">
          <Icons.LayoutGrid className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">Keine Module aktiviert</p>
          <p className="text-sm text-muted-foreground">
            Kontaktiere deinen Administrator
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tiles.map(tile => {
            const MainIcon = getIcon(tile.icon_key);
            return (
              <Card key={tile.tile_code} className="overflow-hidden">
                {/* Main Tile */}
                <Link
                  to={tile.main_tile_route}
                  className="block p-6 bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-xl text-primary-foreground">
                      <MainIcon className="h-6 w-6" />
                    </div>
                    <span className="text-lg font-semibold">{tile.title}</span>
                  </div>
                </Link>
                
                {/* Sub-tiles Grid */}
                <div className="grid grid-cols-2 divide-x divide-y divide-border">
                  {tile.sub_tiles.map((sub, idx) => {
                    const SubIcon = getIcon(sub.icon_key);
                    return (
                      <Link
                        key={idx}
                        to={sub.route}
                        className="p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors text-center"
                      >
                        <SubIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs font-medium">{sub.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
