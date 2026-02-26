/**
 * PMProfil — Provider-Werbeprofil (MOD-22)
 * Editierbar: Bilder, Beschreibung, Kontakt/Öffnungszeiten
 * Read-Only: Services + Preise (aus PMLeistungen)
 */
import { useState, useRef, useEffect } from 'react';
import { Save, FileText, Phone, Tag, Euro, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { RecordCardGallery } from '@/components/shared/RecordCardGallery';
import { useMyProvider, useProviderServices } from '@/hooks/usePetBookings';
import type { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DEMO_PM_GALLERY_IMAGES } from '@/engines/demoData/petManagerDemo';
import { useImageSlotUpload } from '@/hooks/useImageSlotUpload';
import { UPLOAD_BUCKET } from '@/config/storageManifest';
import { ImageSlotGrid, type ImageSlot } from '@/components/shared/ImageSlotGrid';
const FACILITY_TYPES: Record<string, string> = {
  home_based: 'Heimbasiert',
  dedicated_facility: 'Eigene Einrichtung',
  mobile: 'Mobil',
  veterinary_clinic: 'Tierklinik',
  grooming_salon: 'Pflegesalon',
};

const PRICE_TYPE_LABELS: Record<string, string> = {
  fixed: 'Festpreis', hourly: 'Pro Stunde', daily: 'Pro Tag',
  per_session: 'Pro Sitzung', on_request: 'Auf Anfrage',
};

const CATEGORY_LABELS: Record<string, string> = {
  grooming: 'Pflege', boarding: 'Pension', walking: 'Gassi', training: 'Training',
  veterinary: 'Tierarzt', sitting: 'Betreuung', daycare: 'Tagesbetreuung',
  transport: 'Transport', nutrition: 'Ernährung', other: 'Sonstiges',
};

const DAY_LABELS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

type OperatingHours = Record<string, { open: string; close: string; closed?: boolean }>;

export default function PMProfil() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const { data: rawProvider, isLoading } = useMyProvider();
  // Cast to full DB row type for fields not in the hook's PetProvider interface
  const provider = rawProvider as Tables<'pet_providers'> | null;
  const { data: services = [] } = useProviderServices(provider?.id);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [pendingPublishState, setPendingPublishState] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<{
    company_name: string;
    bio: string;
    facility_type: string;
    address: string;
    phone: string;
    email: string;
    operating_hours: OperatingHours;
  } | null>(null);

  // Initialize form from provider data
  const getForm = () => {
    if (form) return form;
    if (!provider) return null;
    const defaultHours: OperatingHours = {};
    DAY_LABELS.forEach((_, i) => {
      const key = String(i);
      const existing = (provider.operating_hours as OperatingHours)?.[key];
      defaultHours[key] = existing || { open: '08:00', close: '18:00', closed: true };
    });
    return {
      company_name: provider.company_name || '',
      bio: provider.bio || '',
      facility_type: provider.facility_type || 'home_based',
      address: provider.address || '',
      phone: provider.phone || '',
      email: provider.email || '',
      operating_hours: defaultHours,
    };
  };

  const currentForm = getForm();

  const handleSave = async () => {
    if (!provider || !currentForm) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pet_providers')
        .update({
          company_name: currentForm.company_name,
          bio: currentForm.bio,
          facility_type: currentForm.facility_type,
          address: currentForm.address,
          phone: currentForm.phone,
          email: currentForm.email,
          operating_hours: currentForm.operating_hours as any,
        })
        .eq('id', provider.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['my_pet_provider'] });
      setForm(null);
      toast.success('Profil gespeichert');
    } catch (e: any) {
      toast.error('Fehler beim Speichern: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    const f = currentForm!;
    setForm({ ...f, [key]: value });
  };

  const updateHours = (dayIndex: number, field: string, value: string | boolean) => {
    const f = currentForm!;
    const hours = { ...f.operating_hours };
    hours[String(dayIndex)] = { ...hours[String(dayIndex)], [field]: value };
    setForm({ ...f, operating_hours: hours });
  };

  const activeServices = services.filter((s: any) => s.is_active);

  const dbPhotos: string[] = (provider?.gallery_images as string[]) || [];
  const isUsingDemo = dbPhotos.length === 0;
  const galleryPaths: string[] = isUsingDemo ? [...DEMO_PM_GALLERY_IMAGES] : dbPhotos;

  // Resolve storage paths to signed URLs for display
  const [resolvedGalleryUrls, setResolvedGalleryUrls] = useState<Record<string, string>>({});

  const galleryImageUpload = useImageSlotUpload({
    moduleCode: 'MOD-22',
    entityId: provider?.id || '',
    tenantId: activeTenantId || '',
    subPath: 'gallery',
  });

  useEffect(() => {
    const resolvePaths = async () => {
      const urls: Record<string, string> = {};
      for (let i = 0; i < galleryPaths.length; i++) {
        const path = galleryPaths[i];
        const slotKey = `gallery_${i}`;
        // Demo paths start with /demo or https, real paths don't
        if (path.startsWith('http') || path.startsWith('/')) {
          urls[slotKey] = path;
        } else {
          const url = await galleryImageUpload.getSignedUrl(path);
          if (url) urls[slotKey] = url;
        }
      }
      setResolvedGalleryUrls(urls);
    };
    resolvePaths();
  }, [galleryPaths.join(',')]);

  const GALLERY_SLOTS: ImageSlot[] = Array.from({ length: 4 }, (_, i) => ({
    key: `gallery_${i}`,
    label: i === 0 ? 'Cover' : `Bild ${i + 1}`,
  }));

  const handleGallerySlotUpload = async (slotKey: string, file: File) => {
    if (!provider || !activeTenantId) return;
    const storagePath = await galleryImageUpload.uploadToSlot(slotKey, file);
    if (!storagePath) return;

    // Build updated paths array (storage paths, not URLs)
    const newPaths = [...(isUsingDemo ? [] : dbPhotos)];
    const slotIndex = parseInt(slotKey.replace('gallery_', ''));
    // Extend array if needed
    while (newPaths.length <= slotIndex) newPaths.push('');
    newPaths[slotIndex] = storagePath;

    const { error } = await supabase
      .from('pet_providers')
      .update({
        gallery_images: newPaths,
        cover_image_url: newPaths[0] || storagePath,
      })
      .eq('id', provider.id);
    if (error) {
      toast.error('Fehler beim Speichern: ' + error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['my_pet_provider'] });
    // Update local display URL
    const signedUrl = await galleryImageUpload.getSignedUrl(storagePath);
    if (signedUrl) {
      setResolvedGalleryUrls(prev => ({ ...prev, [slotKey]: signedUrl }));
    }
  };

  const handleTogglePublish = (checked: boolean) => {
    setPendingPublishState(checked);
    setShowPublishDialog(true);
  };

  const confirmPublish = async () => {
    if (!provider) return;
    setPublishing(true);
    try {
      const { error } = await supabase
        .from('pet_providers')
        .update({ is_published: pendingPublishState } as any)
        .eq('id', provider.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['my_pet_provider'] });
      toast.success(pendingPublishState ? 'Profil veröffentlicht' : 'Profil deaktiviert');
    } catch (e: any) {
      toast.error('Fehler: ' + e.message);
    } finally {
      setPublishing(false);
      setShowPublishDialog(false);
    }
  };

  // Legacy handlePhotoUpload removed — now uses handleGallerySlotUpload via ImageSlotGrid

  if (isLoading) {
    return (
      <PageShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageShell>
    );
  }

  if (!provider) {
    return (
      <PageShell>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Kein Provider-Profil gefunden. Bitte wenden Sie sich an den Administrator.
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!currentForm) return null;

  return (
    <PageShell>
      {/* ModulePageHeader — CI-Standard */}
      <ModulePageHeader
        title="Profil"
        description="Dein öffentliches Profil auf der Lennox & Friends Website"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={!!(provider as any).is_published}
                onCheckedChange={handleTogglePublish}
                disabled={publishing}
              />
              <Badge variant={(provider as any).is_published ? 'default' : 'outline'} className="text-xs">
                {(provider as any).is_published ? 'Live' : 'Entwurf'}
              </Badge>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`/website/tierservice/partner/${provider.id}`} target="_blank" rel="noopener">
                <ExternalLink className="h-4 w-4 mr-1" /> Vorschau
              </a>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form}>
              <Save className="h-4 w-4 mr-1" /> {saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        }
      />

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingPublishState ? 'Profil veröffentlichen?' : 'Profil deaktivieren?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPublishState
                ? 'Ihr Profil wird auf der Lennox & Friends Website veröffentlicht und ist für potenzielle Kunden sichtbar. Fortfahren?'
                : 'Ihr Profil wird von der Lennox & Friends Website entfernt und ist nicht mehr öffentlich sichtbar.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish} disabled={publishing}>
              {publishing ? 'Wird gespeichert...' : 'Bestätigen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 1. Bilder — ImageSlotGrid mit Drag & Drop */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Bilder</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageSlotGrid
            slots={GALLERY_SLOTS}
            images={resolvedGalleryUrls}
            onUpload={handleGallerySlotUpload}
            uploadingSlot={galleryImageUpload.uploadingSlot}
            columns={4}
            slotHeight={140}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Bilder per Drag & Drop oder Klick hochladen. Das erste Bild wird als Cover verwendet.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" /> Beschreibung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="company_name">Firmenname</Label>
            <Input
              id="company_name"
              value={currentForm.company_name}
              onChange={(e) => updateField('company_name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio / Beschreibung</Label>
            <Textarea
              id="bio"
              value={currentForm.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              rows={4}
              placeholder="Erzählen Sie potenziellen Kunden etwas über Ihren Service..."
            />
          </div>
          <div>
            <Label htmlFor="facility_type">Einrichtungstyp</Label>
            <Select value={currentForm.facility_type} onValueChange={(v) => updateField('facility_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(FACILITY_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 3. Kontakt / Ansprechpartner */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4" /> Kontakt & Öffnungszeiten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" value={currentForm.address} onChange={(e) => updateField('address', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" value={currentForm.phone} onChange={(e) => updateField('phone', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" value={currentForm.email} onChange={(e) => updateField('email', e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Öffnungszeiten</Label>
            <div className="space-y-1.5">
              {DAY_LABELS.map((day, i) => {
                const h = currentForm.operating_hours[String(i)] || { open: '08:00', close: '18:00', closed: true };
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-24 text-muted-foreground">{day}</span>
                    {h.closed ? (
                      <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => updateHours(i, 'closed', false)}>
                        Geschlossen
                      </Badge>
                    ) : (
                      <>
                        <Input
                          type="time"
                          value={h.open}
                          onChange={(e) => updateHours(i, 'open', e.target.value)}
                          className="w-28 h-7 text-xs"
                        />
                        <span>–</span>
                        <Input
                          type="time"
                          value={h.close}
                          onChange={(e) => updateHours(i, 'close', e.target.value)}
                          className="w-28 h-7 text-xs"
                        />
                        <X className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" onClick={() => updateHours(i, 'closed', true)} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Angebotene Services (Read-Only) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Tag className="h-4 w-4" /> Angebotene Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine aktiven Services. Services werden unter <strong>Leistungen</strong> verwaltet.</p>
          ) : (
            <div className="space-y-2">
              {activeServices.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div>
                    <span className="text-sm font-medium">{s.title}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{CATEGORY_LABELS[s.category] || s.category}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{s.duration_minutes} Min.</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">Services werden unter „Leistungen" verwaltet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Preise (Read-Only) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Euro className="h-4 w-4" /> Preise
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Preise vorhanden — definieren Sie Services unter Leistungen.</p>
          ) : (
            <div className="space-y-1.5">
              {activeServices.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-sm">{s.title}</span>
                  <div className="text-sm font-medium">
                    {s.price_type === 'on_request' ? (
                      <span className="text-muted-foreground">Auf Anfrage</span>
                    ) : (
                      <>
                        {(s.price_cents / 100).toFixed(2)} €
                        <span className="text-xs text-muted-foreground ml-1">
                          {PRICE_TYPE_LABELS[s.price_type] || s.price_type}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">Preise werden automatisch aus Leistungen übernommen.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
