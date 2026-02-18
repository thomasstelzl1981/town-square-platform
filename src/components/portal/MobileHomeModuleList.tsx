/**
 * MobileHomeModuleList — Scrollable module list for the mobile home screen
 * 
 * Reads entries from mobileHomeConfig and renders them as tappable rows.
 * Each row navigates to the corresponding module or tile.
 */

import { useNavigate } from 'react-router-dom';
import { mobileHomeEntries } from '@/config/mobileHomeConfig';
import { getModulesSorted, getTileFullPath } from '@/manifests/routesManifest';
import {
  ChevronRight,
  TrendingUp,
  Building2,
  FileText,
  FolderOpen,
  Inbox,
  ShoppingBag,
  Car,
  PawPrint,
  Landmark,
  Search,
  ListChecks,
  LayoutGrid,
} from 'lucide-react';
import type { ElementType } from 'react';

const iconMap: Record<string, ElementType> = {
  TrendingUp, Building2, FileText, FolderOpen, Inbox,
  ShoppingBag, Car, PawPrint, Landmark,
  Search, ListChecks, LayoutGrid,
};

export function MobileHomeModuleList() {
  const navigate = useNavigate();
  const allModules = getModulesSorted();

  const handleEntryClick = (entry: typeof mobileHomeEntries[number]) => {
    const mod = allModules.find(m => m.code === entry.code);
    if (!mod) return;

    if (entry.type === 'tile' && entry.tile) {
      const tilePath = getTileFullPath(mod.module.base, entry.tile);
      navigate(tilePath);
    } else {
      navigate(`/portal/${mod.module.base}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Module rows */}
      <div className="px-3 pt-3 pb-4 flex flex-col justify-between min-h-full">
        {mobileHomeEntries.map((entry, i) => {
          const Icon = entry.icon ? iconMap[entry.icon] : LayoutGrid;
          return (
            <button
              key={`${entry.code}-${entry.tile || i}`}
              onClick={() => handleEntryClick(entry)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-accent/50 active:scale-[0.98] active:bg-accent"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 shrink-0">
                {Icon && <Icon className="h-4 w-4 text-primary" />}
              </div>
              <span className="flex-1 text-sm font-medium text-foreground">
                {entry.label}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
