import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubTile {
  title: string;
  route: string;
}

interface ModuleTileData {
  tile_code: string;
  title: string;
  description: string | null;
  main_tile_route: string;
  sub_tiles: SubTile[];
}

export function useModuleTiles(tileCode: string) {
  const [data, setData] = useState<ModuleTileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchModule() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as any;
        const { data: tile, error: fetchError } = await client
          .from('tile_catalog')
          .select('tile_code, title, description, main_tile_route, sub_tiles')
          .eq('tile_code', tileCode)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (tile) {
          let subTiles: SubTile[] = [];
          if (tile.sub_tiles) {
            if (Array.isArray(tile.sub_tiles)) {
              subTiles = tile.sub_tiles as SubTile[];
            } else if (typeof tile.sub_tiles === 'string') {
              try {
                subTiles = JSON.parse(tile.sub_tiles);
              } catch {
                subTiles = [];
              }
            }
          }

          setData({
            tile_code: tile.tile_code,
            title: tile.title,
            description: tile.description,
            main_tile_route: tile.main_tile_route,
            sub_tiles: subTiles
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchModule();
  }, [tileCode]);

  return { data, isLoading, error };
}
