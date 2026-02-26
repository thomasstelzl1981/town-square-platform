/**
 * Create Property Records (Immobilienakten) from dev_project_units
 * MOD-13 PROJEKTE — Phase 2: Bulk-Erstellung
 * 
 * Uses shared helper createPropertyFromUnit for complete property creation
 * (all financial + energy fields, DMS folders, property_accounting).
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Building2, Loader2, CheckCircle2, FolderOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { DevProjectUnit } from '@/types/projekte';
import { createPropertyFromUnit, type ProjectContext, type UnitData } from '@/lib/createPropertyFromUnit';

interface CreatePropertyFromUnitsProps {
  projectId: string;
  projectName: string;
  projectAddress: string;
  projectCity: string;
  projectPostalCode?: string;
  projectYearBuilt?: number;
  projectData?: ProjectContext['projectData'];
  units: DevProjectUnit[];
}

export function CreatePropertyFromUnits({
  projectId,
  projectName,
  projectAddress,
  projectCity,
  projectPostalCode,
  projectYearBuilt,
  projectData,
  units,
}: CreatePropertyFromUnitsProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = profile?.active_tenant_id;

  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);

  const unitsWithoutProperty = units.filter(u => !u.property_id);
  const hasUnitsToProcess = unitsWithoutProperty.length > 0;

  if (!hasUnitsToProcess) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        Alle Einheiten haben Immobilienakten
      </div>
    );
  }

  const context: ProjectContext = {
    projectId,
    projectName,
    projectAddress,
    projectCity,
    projectPostalCode,
    projectYearBuilt,
    projectData,
  };

  const handleCreate = async () => {
    if (!tenantId || !projectId) return;
    setIsCreating(true);
    setProgress(0);
    setCreatedCount(0);

    let created = 0;
    const total = unitsWithoutProperty.length;

    try {
      for (const unit of unitsWithoutProperty) {
        const unitData: UnitData = {
          id: unit.id,
          unit_number: unit.unit_number,
          area_sqm: unit.area_sqm,
          list_price: unit.list_price,
          rent_net: unit.rent_net,
          current_rent: unit.current_rent,
          hausgeld: unit.hausgeld,
          rooms: (unit as any).rooms ?? null,
          floor: (unit as any).floor ?? null,
          unit_id: unit.unit_id,
          weg: (unit as any).weg ?? null,
        };

        const result = await createPropertyFromUnit(tenantId, unitData, context);

        if (result.success) {
          created++;
        } else {
          console.error(`Property creation failed for ${unit.unit_number}:`, 'error' in result ? result.error : 'Unknown');
        }

        setCreatedCount(created);
        setProgress(Math.round((created / total) * 100));
      }

      toast.success(`${created} Immobilienakten erstellt`, {
        description: `Für "${projectName}" wurden ${created} Akten mit DMS-Ordnern angelegt.`,
      });

      queryClient.invalidateQueries({ queryKey: ['dev-project-units', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    } catch (err) {
      console.error('Bulk property creation error:', err);
      toast.error('Fehler bei der Akten-Erstellung', {
        description: err instanceof Error ? err.message : 'Unbekannter Fehler',
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isCreating) {
    return (
      <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="font-medium text-sm">Immobilienakten werden erstellt...</p>
            <p className="text-xs text-muted-foreground">{createdCount} von {unitsWithoutProperty.length} Akten</p>
          </div>
          <Badge variant="outline">{progress}%</Badge>
        </div>
        <Progress value={progress} />
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FolderOpen className="h-4 w-4" />
          Immobilienakten erstellen
          <Badge variant="secondary" className="ml-1">{unitsWithoutProperty.length}</Badge>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Immobilienakten erstellen
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Für <strong>{unitsWithoutProperty.length} Einheiten</strong> in "{projectName}" 
              werden Immobilienakten (Properties) mit vollständiger DMS-Ordnerstruktur angelegt.
            </p>
            <p className="text-xs">
              Jede Akte erhält: Exposé-, Grundriss-, Foto-, Mietvertrag-, Hausgeld-, Protokoll-, 
              Versicherungs- und Sonstige-Ordner.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleCreate} className="gap-2">
            <Building2 className="h-4 w-4" />
            {unitsWithoutProperty.length} Akten erstellen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
