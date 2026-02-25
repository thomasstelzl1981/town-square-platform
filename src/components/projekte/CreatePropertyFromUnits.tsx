/**
 * Create Property Records (Immobilienakten) from dev_project_units
 * MOD-13 PROJEKTE — Phase 2: Bulk-Erstellung
 * 
 * Creates properties + DMS folders for each unit that doesn't have a property_id yet.
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { DevProjectUnit } from '@/types/projekte';

interface CreatePropertyFromUnitsProps {
  projectId: string;
  projectName: string;
  projectAddress: string;
  projectCity: string;
  projectPostalCode?: string;
  projectYearBuilt?: number;
  projectData?: {
    full_description?: string;
    location_description?: string;
    features?: string[];
    energy_cert_type?: string;
    energy_cert_value?: number;
    energy_class?: string;
    heating_type?: string;
    energy_source?: string;
    renovation_year?: number;
    parking_type?: string;
  };
  units: DevProjectUnit[];
}

// Standard DMS folder structure for a property (MOD-04 pattern)
const PROPERTY_DMS_FOLDERS = [
  '01_expose',
  '02_grundrisse',
  '03_fotos',
  '04_mietvertrag',
  '05_hausgeld',
  '06_protokolle',
  '07_versicherung',
  '99_sonstiges',
];

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

  const handleCreate = async () => {
    if (!tenantId || !projectId) return;
    setIsCreating(true);
    setProgress(0);
    setCreatedCount(0);

    let created = 0;
    const total = unitsWithoutProperty.length;

    try {
      for (const unit of unitsWithoutProperty) {
        // 1. Create property record
        const publicId = `SOT-I-${unit.unit_number.replace(/[^a-zA-Z0-9-]/g, '')}`;
        const { data: newProperty, error: propError } = await supabase
          .from('properties')
          .insert({
            tenant_id: tenantId,
            public_id: publicId,
            code: unit.unit_number,
            address: projectAddress,
            city: projectCity,
            postal_code: projectPostalCode || null,
            property_type: 'wohnung',
            usage_type: 'wohnen',
            total_area_sqm: unit.area_sqm || null,
            purchase_price: unit.list_price || null,
            year_built: projectYearBuilt || null,
            // Extended fields from project-level exposé data
            description: projectData?.full_description || null,
            heating_type: projectData?.heating_type || null,
            energy_source: projectData?.energy_source || null,
            renovation_year: projectData?.renovation_year || null,
            status: 'active',
            is_demo: false,
          })
          .select('id')
          .single();

        if (propError || !newProperty) {
          console.error(`Property creation failed for ${unit.unit_number}:`, propError);
          continue;
        }

        // 2. Link property back to dev_project_unit
        await supabase
          .from('dev_project_units')
          .update({ property_id: newProperty.id })
          .eq('id', unit.id);

        // 3. Create DMS folder structure for property (MOD_04 pattern)
        const { data: rootFolder } = await supabase
          .from('storage_nodes')
          .insert({
            tenant_id: tenantId,
            name: `${unit.unit_number} — ${projectName}`,
            node_type: 'folder',
            module_code: 'MOD-04',
            entity_id: newProperty.id,
            parent_id: null,
          })
          .select('id')
          .single();

        if (rootFolder) {
          const folderInserts = PROPERTY_DMS_FOLDERS.map(name => ({
            tenant_id: tenantId,
            name,
            node_type: 'folder' as const,
            module_code: 'MOD-04',
            entity_id: newProperty.id,
            parent_id: rootFolder.id,
          }));
          await supabase.from('storage_nodes').insert(folderInserts);
        }

        created++;
        setCreatedCount(created);
        setProgress(Math.round((created / total) * 100));
      }

      toast.success(`${created} Immobilienakten erstellt`, {
        description: `Für "${projectName}" wurden ${created} Akten mit DMS-Ordnern angelegt.`,
      });

      // Invalidate queries to refresh UI
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
