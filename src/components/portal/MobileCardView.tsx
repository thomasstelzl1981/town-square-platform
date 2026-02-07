/**
 * MOBILE CARD VIEW — Card-based navigation for mobile
 * 
 * Area View: Shows 5 module cards for active area
 * Module View: Shows 4-6 tile cards for selected module
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { useAuth } from '@/contexts/AuthContext';
import { areaConfig, getModuleDisplayLabel } from '@/manifests/areaConfig';
import { getModulesSorted, getTileFullPath, ModuleDefinition } from '@/manifests/routesManifest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft,
  Users,
  Sparkles,
  FolderOpen,
  Building2,
  FileText,
  Tag,
  Landmark,
  Search,
  Handshake,
  Target,
  Briefcase,
  FolderKanban,
  Mail,
  GraduationCap,
  Wrench,
  Car,
  LineChart,
  Sun,
  LucideIcon
} from 'lucide-react';

// Icon mapping for modules
const iconMap: Record<string, LucideIcon> = {
  'Users': Users,
  'Sparkles': Sparkles,
  'FolderOpen': FolderOpen,
  'Building2': Building2,
  'FileText': FileText,
  'Tag': Tag,
  'Landmark': Landmark,
  'Search': Search,
  'Handshake': Handshake,
  'Target': Target,
  'Briefcase': Briefcase,
  'FolderKanban': FolderKanban,
  'Mail': Mail,
  'GraduationCap': GraduationCap,
  'Wrench': Wrench,
  'Car': Car,
  'LineChart': LineChart,
  'Sun': Sun,
};

interface ModuleWithMeta {
  code: string;
  module: ModuleDefinition;
  displayLabel: string;
}

export function MobileCardView() {
  const navigate = useNavigate();
  const { activeArea, mobileNavView, setMobileNavView, selectedMobileModule, setSelectedMobileModule } = usePortalLayout();
  const { isDevelopmentMode } = useAuth();

  // Build module data from manifest
  const allModules = useMemo(() => {
    return getModulesSorted().map(({ code, module }) => ({
      code,
      module,
      displayLabel: getModuleDisplayLabel(code, module.name),
    }));
  }, []);

  // Get modules for active area
  const areaModules = useMemo(() => {
    const areaConfig_ = areaConfig.find(a => a.key === activeArea);
    if (!areaConfig_) return [];
    return areaConfig_.modules
      .map(code => allModules.find(m => m.code === code))
      .filter((m): m is ModuleWithMeta => m !== undefined);
  }, [activeArea, allModules]);

  // Get selected module
  const selectedModule = useMemo(() => {
    if (!selectedMobileModule) return null;
    return allModules.find(m => m.code === selectedMobileModule) || null;
  }, [selectedMobileModule, allModules]);

  // Handle module card click
  const handleModuleClick = (moduleData: ModuleWithMeta) => {
    setSelectedMobileModule(moduleData.code);
    setMobileNavView('tiles');
  };

  // Handle tile card click
  const handleTileClick = (moduleBase: string, tilePath: string) => {
    const route = getTileFullPath(moduleBase, tilePath);
    navigate(route);
  };

  // Handle back button
  const handleBack = () => {
    if (mobileNavView === 'tiles') {
      setMobileNavView('modules');
      setSelectedMobileModule(null);
    } else {
      setMobileNavView('areas');
    }
  };

  // Get area label
  const areaLabel = areaConfig.find(a => a.key === activeArea)?.label || activeArea;

  // Tile View: Show tile cards for selected module
  if (mobileNavView === 'tiles' && selectedModule) {
    return (
      <div className="p-4">
        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold">{selectedModule.displayLabel}</h2>
            <p className="text-xs text-muted-foreground">{areaLabel}</p>
          </div>
        </div>

        {/* Tile cards */}
        <div className="grid grid-cols-2 gap-3">
          {selectedModule.module.tiles.map((tile) => (
            <Card 
              key={tile.path}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md active:scale-[0.98]',
                tile.premium && 'border-warning/30'
              )}
              onClick={() => handleTileClick(selectedModule.module.base, tile.path)}
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {tile.title}
                  {tile.premium && <span className="text-warning text-xs">★</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-xs">
                  Tippen zum Öffnen
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Module View: Show module cards for active area
  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{areaLabel}</h2>
        <p className="text-sm text-muted-foreground">Wähle ein Modul</p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 gap-3">
        {areaModules.map(({ code, module, displayLabel }) => {
          const Icon = iconMap[module.icon] || Briefcase;
          const requiresActivation = module.visibility.requires_activation && !isDevelopmentMode;
          
          return (
            <Card 
              key={code}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md active:scale-[0.99]',
                requiresActivation && 'opacity-50'
              )}
              onClick={() => handleModuleClick({ code, module, displayLabel })}
            >
              <CardHeader className="p-4 flex-row items-center gap-4 space-y-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{displayLabel}</CardTitle>
                  <CardDescription className="text-xs">
                    {module.tiles.length} Bereiche
                    {requiresActivation && ' • Aktivierung erforderlich'}
                  </CardDescription>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180" />
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
