/**
 * Miety Portal Page (MOD-20) — Zuhause: Widget-Grid mit Drag & Drop
 * 
 * Alle Elemente sind individuelle Widgets im WidgetCell-Format.
 * User kann per "+" neue Objekte, Kameras und Verträge hinzufügen.
 */

import { useState, useCallback } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { SortableWidget } from '@/components/dashboard/SortableWidget';
import { useZuhauseWidgets } from './miety/hooks/useZuhauseWidgets';
import { HomeAddressWidget } from './miety/widgets/HomeAddressWidget';
import { StreetViewWidget } from './miety/widgets/StreetViewWidget';
import { SatelliteWidget } from './miety/widgets/SatelliteWidget';
import { CameraWidget } from './miety/widgets/CameraWidget';
import { ServiceWidget } from './miety/widgets/ServiceWidget';
import { ContractWidget } from './miety/widgets/ContractWidget';
import { AddWidgetMenu } from './miety/widgets/AddWidgetMenu';
import { MietyCreateHomeForm } from './miety/components/MietyCreateHomeForm';
import { ContractDrawer } from './miety/components/ContractDrawer';
import { AddCameraDialog } from '@/components/miety/AddCameraDialog';
import { CameraSetupWizard } from './miety/widgets/CameraSetupWizard';
import MietyHomeDossierInline from './miety/MietyHomeDossierInline';
import { useCameras } from '@/hooks/useCameras';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData/engine';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Plus } from 'lucide-react';
import type { CameraFormData } from '@/hooks/useCameras';

export default function MietyPortalPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-ZUHAUSE');

  const {
    allWidgets,
    visibleWidgetIds,
    order,
    updateOrder,
    hideWidget,
    showWidget,
    hiddenIds,
    getWidget,
    homes,
  } = useZuhauseWidgets();

  const { addCamera, updateCamera, deleteCamera } = useCameras();

  // Profile for name display
  const { data: profile } = useQuery({
    queryKey: ['profile-for-miety', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });
  const profileName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');

  // UI state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHome, setEditingHome] = useState<any>(null);
  const [openDossierId, setOpenDossierId] = useState<string | null>(null);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [showCameraWizard, setShowCameraWizard] = useState(false);
  const [editCamera, setEditCamera] = useState<any>(null);
  const [contractDrawerOpen, setContractDrawerOpen] = useState(false);
  const [contractCategory, setContractCategory] = useState('strom');
  const [deletingHomeId, setDeletingHomeId] = useState<string | null>(null);

  // Delete home
  const deleteHomeMutation = useMutation({
    mutationFn: async (homeId: string) => {
      setDeletingHomeId(homeId);
      await supabase.from('miety_contracts').delete().eq('home_id', homeId);
      await supabase.from('miety_meter_readings').delete().eq('home_id', homeId);
      await supabase.from('miety_loans').delete().eq('home_id', homeId);
      const { error } = await supabase.from('miety_homes').delete().eq('id', homeId);
      if (error) throw error;
    },
    onSuccess: () => {
      setDeletingHomeId(null);
      toast.success('Objekt gelöscht');
      queryClient.invalidateQueries({ queryKey: ['miety-homes'] });
    },
    onError: (err: Error) => {
      setDeletingHomeId(null);
      toast.error(`Fehler: ${err.message}`);
    },
  });

  // Camera handlers
  const handleAddCamera = (data: CameraFormData) => {
    addCamera.mutate(data, { onSuccess: () => setCameraDialogOpen(false) });
  };
  const handleWizardComplete = (data: CameraFormData) => {
    addCamera.mutate(data, { onSuccess: () => setShowCameraWizard(false) });
  };
  const handleEditCamera = (data: CameraFormData) => {
    if (!editCamera) return;
    updateCamera.mutate({ id: editCamera.id, ...data }, { onSuccess: () => setEditCamera(null) });
  };
  const handleDeleteCamera = (id: string) => {
    if (confirm('Kamera wirklich löschen?')) deleteCamera.mutate(id);
  };

  // Contract handler
  const handleAddContract = (category: string) => {
    if (homes.length === 0) { setShowCreateForm(true); return; }
    setContractCategory(category);
    setContractDrawerOpen(true);
  };

  // Render widget by ID
  const renderWidget = useCallback((widgetId: string) => {
    const def = getWidget(widgetId);
    if (!def) return null;

    // Filter demo items when demo is off
    if (!demoEnabled && def.entityId && isDemoId(def.entityId)) return null;

    switch (def.type) {
      case 'home-address':
        return (
          <HomeAddressWidget
            home={def.meta}
            profileName={profileName}
            onEdit={setEditingHome}
            onDelete={(id) => deleteHomeMutation.mutate(id)}
            onOpen={(id) => setOpenDossierId(prev => prev === id ? null : id)}
            isOpen={openDossierId === def.entityId}
            isDeleting={deletingHomeId === def.entityId}
          />
        );
      case 'home-streetview':
        return <StreetViewWidget home={def.meta} />;
      case 'home-satellite':
        return <SatelliteWidget home={def.meta} />;
      case 'camera':
        return (
          <CameraWidget
            camera={def.meta}
            onEdit={setEditCamera}
            onDelete={handleDeleteCamera}
          />
        );
      case 'service':
        return (
          <ServiceWidget
            serviceId={(def.meta as any)?.serviceId}
            plz={homes[0]?.zip}
          />
        );
      case 'contract':
        return <ContractWidget contract={def.meta} />;
      default:
        return null;
    }
  }, [getWidget, demoEnabled, profileName, openDossierId, deletingHomeId, homes]);

  // Show create form
  if (showCreateForm) return (
    <PageShell>
      <MietyCreateHomeForm onCancel={() => setShowCreateForm(false)} />
    </PageShell>
  );
  if (editingHome) return (
    <PageShell>
      <MietyCreateHomeForm
        onCancel={() => setEditingHome(null)}
        homeId={editingHome.id}
        initialData={{
          name: editingHome.name || '', address: editingHome.address || '',
          houseNo: editingHome.address_house_no || '', zip: editingHome.zip || '',
          city: editingHome.city || '', ownershipType: editingHome.ownership_type || 'miete',
          propertyType: editingHome.property_type || 'wohnung',
          areaSqm: editingHome.area_sqm?.toString() || '', roomsCount: editingHome.rooms_count?.toString() || '',
          constructionYear: editingHome.construction_year?.toString() || '',
          marketValue: editingHome.market_value?.toString() || '',
          floorCount: editingHome.floor_count?.toString() || '',
          bathroomsCount: editingHome.bathrooms_count?.toString() || '',
          heatingType: editingHome.heating_type || '',
          hasGarage: editingHome.has_garage || false,
          hasGarden: editingHome.has_garden || false,
          hasBasement: editingHome.has_basement || false,
          lastRenovationYear: editingHome.last_renovation_year?.toString() || '',
          plotAreaSqm: editingHome.plot_area_sqm?.toString() || '',
        }}
      />
    </PageShell>
  );

  // Empty state
  if (homes.length === 0 && visibleWidgetIds.length <= 2) {
    return (
      <PageShell>
        <ModulePageHeader
          title="Home"
          description="Ihr persönliches Zuhause-Dashboard"
          actions={
            <AddWidgetMenu
              onAddHome={() => setShowCreateForm(true)}
              onAddCamera={() => setShowCameraWizard(true)}
              onAddContract={handleAddContract}
              hiddenWidgetIds={[...hiddenIds]}
              onShowWidget={showWidget}
              allWidgets={allWidgets}
            />
          }
        />
        <Card className="glass-card border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="p-4 rounded-full bg-primary/10 inline-block mb-4">
              <Home className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Zuhause einrichten</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Legen Sie Ihr erstes Objekt an, um Ihr persönliches Dashboard zu starten.
            </p>
            <Button onClick={() => setShowCreateForm(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />Objekt anlegen
            </Button>
          </CardContent>
        </Card>

        <AddCameraDialog open={cameraDialogOpen} onOpenChange={setCameraDialogOpen} onSubmit={handleAddCamera} isLoading={addCamera.isPending} mode="add" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader
        title="Home"
        description="Ihr persönliches Zuhause-Dashboard"
        actions={
          <AddWidgetMenu
            onAddHome={() => setShowCreateForm(true)}
            onAddCamera={() => setShowCameraWizard(true)}
            onAddContract={handleAddContract}
            hiddenWidgetIds={[...hiddenIds]}
            onShowWidget={showWidget}
            allWidgets={allWidgets}
          />
        }
      />

      <DashboardGrid widgetIds={visibleWidgetIds} onReorder={updateOrder}>
        {visibleWidgetIds.map(widgetId => {
          const widget = renderWidget(widgetId);
          if (!widget) return null;
          return (
            <SortableWidget key={widgetId} id={widgetId}>
              <WidgetCell>{widget}</WidgetCell>
            </SortableWidget>
          );
        })}
      </DashboardGrid>

      {/* Inline Camera Wizard */}
      {showCameraWizard && (
        <CameraSetupWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowCameraWizard(false)}
          isLoading={addCamera.isPending}
        />
      )}

      {/* Inline Dossier below grid */}
      {openDossierId && (
        <MietyHomeDossierInline homeId={openDossierId} />
      )}

      {/* Dialogs */}
      <AddCameraDialog
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
        onSubmit={handleAddCamera}
        isLoading={addCamera.isPending}
        mode="add"
      />
      {editCamera && (
        <AddCameraDialog
          open={!!editCamera}
          onOpenChange={(open) => { if (!open) setEditCamera(null); }}
          onSubmit={handleEditCamera}
          isLoading={updateCamera.isPending}
          initialData={{
            name: editCamera.name,
            snapshot_url: editCamera.snapshot_url,
            auth_user: editCamera.auth_user ?? '',
            auth_pass: editCamera.auth_pass ?? '',
            refresh_interval_sec: editCamera.refresh_interval_sec,
          }}
          mode="edit"
        />
      )}
      {homes.length > 0 && (
        <ContractDrawer open={contractDrawerOpen} onOpenChange={setContractDrawerOpen} homeId={homes[0].id} defaultCategory={contractCategory} />
      )}
    </PageShell>
  );
}
