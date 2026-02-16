/**
 * CarServiceFlow — Inline 6-step service/workshop booking flow (Demo with FairGarage deep-link)
 */
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDataEventLedger } from '@/hooks/useDataEventLedger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Wrench, Search, MapPin, Star, Clock, Phone, Mail, CalendarDays,
  CheckCircle2, XCircle, ExternalLink, ChevronRight, RotateCcw, Award, Zap
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────

interface ServiceRequest {
  id: string;
  vehicle_id: string;
  zip: string;
  service_type: string;
  problem_note?: string;
  status: string;
  selected_workshop_name?: string;
  selected_workshop_id?: string;
  distance_km?: number;
  quoted_price_min?: number;
  quoted_price_max?: number;
  appointment_at?: string;
  contact_email?: string;
  contact_phone?: string;
  confirmed_at?: string;
  rejection_reason?: string;
}

interface MockWorkshop {
  id: string;
  name: string;
  distance_km: number;
  price_min: number;
  price_max: number;
  next_available: string;
  badge?: string;
  rating: number;
}

// ── Constants ────────────────────────────────────────────────────

const SERVICE_TYPES = [
  { key: 'inspektion', label: 'Inspektion', emoji: '🔧' },
  { key: 'hu_au', label: 'HU/AU', emoji: '📋' },
  { key: 'oelwechsel', label: 'Ölwechsel', emoji: '🛢️' },
  { key: 'bremsen', label: 'Bremsen', emoji: '🛑' },
  { key: 'reifenwechsel', label: 'Reifenwechsel', emoji: '🔄' },
  { key: 'diagnose', label: 'Diagnose', emoji: '🔍' },
  { key: 'reparatur', label: 'Reparatur allg.', emoji: '⚙️' },
  { key: 'klima', label: 'Klimaservice', emoji: '❄️' },
  { key: 'unfall_glas', label: 'Unfall/Glas', emoji: '💥' },
];

// ── Mock workshop generator (deterministic) ──────────────────────

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateMockWorkshops(zip: string, serviceType: string): MockWorkshop[] {
  const seed = simpleHash(`${zip}-${serviceType}`);
  const pool = [
    { name: 'AutoPlus Werkstatt', baseDistance: 2.3, baseMin: 189, baseMax: 249 },
    { name: 'Meisterbetrieb Schmidt', baseDistance: 4.7, baseMin: 159, baseMax: 199 },
    { name: 'FairRepair Zentrum', baseDistance: 6.1, baseMin: 209, baseMax: 279 },
    { name: 'KFZ-Technik Müller', baseDistance: 8.4, baseMin: 145, baseMax: 189 },
  ];

  const days = [2, 3, 5, 7];
  const now = new Date();

  return pool.map((w, i) => {
    const variance = ((seed + i * 17) % 30) - 15;
    const priceMin = w.baseMin + variance;
    const priceMax = w.baseMax + variance;
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + days[(seed + i) % days.length]);

    return {
      id: `mock-ws-${i}`,
      name: w.name,
      distance_km: +(w.baseDistance + ((seed + i) % 20) / 10).toFixed(1),
      price_min: priceMin,
      price_max: priceMax,
      next_available: nextDate.toISOString(),
      rating: +(3.8 + ((seed + i) % 13) / 10).toFixed(1),
      badge: i === 0 ? 'Top Preis' : i === 1 ? 'Schnellster Termin' : undefined,
    };
  });
}

function buildWorkshopPartnerUrl(request: { id: string; zip: string; service_type: string }): string {
  const params = new URLSearchParams({
    utm_source: 'sot',
    utm_medium: 'car_dossier',
    utm_campaign: 'service_booking',
    ref: request.id,
    zip: request.zip,
    service: request.service_type,
  });
  return `https://www.fairgarage.com/?${params}`;
}

// ── Component ────────────────────────────────────────────────────

interface CarServiceFlowProps {
  vehicleId: string;
  holderAddress?: string;
  isDemo?: boolean;
}

export function CarServiceFlow({ vehicleId, holderAddress, isDemo }: CarServiceFlowProps) {
  const { activeTenantId } = useAuth();
  const { logEvent } = useDataEventLedger();
  const comparisonRef = useRef<HTMLDivElement>(null);

  // State
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [problemNote, setProblemNote] = useState('');
  const [zip, setZip] = useState(() => {
    // Try to extract PLZ from holder_address
    const match = holderAddress?.match(/\b(\d{5})\b/);
    return match ? match[1] : '';
  });
  const [radiusKm, setRadiusKm] = useState(20);
  const [workshops, setWorkshops] = useState<MockWorkshop[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<MockWorkshop | null>(null);
  const [request, setRequest] = useState<ServiceRequest | null>(null);

  // Booking fields
  const [appointmentDate, setAppointmentDate] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [bookingNote, setBookingNote] = useState('');

  // Status tracking
  const [flowStatus, setFlowStatus] = useState<string>('idle'); // idle, comparison_shown, workshop_selected, booking_requested, booked, rejected

  const [isSaving, setIsSaving] = useState(false);

  // ── Step C1+C2: Show comparison ────────────────────────────────
  const handleShowComparison = useCallback(async () => {
    if (!serviceType) { toast.error('Bitte Leistung wählen'); return; }
    if (!zip || zip.length !== 5) { toast.error('Bitte gültige PLZ eingeben'); return; }

    setIsSaving(true);
    try {
      const mockWorkshops = generateMockWorkshops(zip, serviceType);
      setWorkshops(mockWorkshops);
      setFlowStatus('comparison_shown');

      // Persist request
      if (activeTenantId && !isDemo) {
        const { data, error } = await supabase.from('car_service_requests' as any).insert({
          vehicle_id: vehicleId,
          tenant_id: activeTenantId,
          zip,
          radius_km: radiusKm,
          service_type: serviceType,
          problem_note: problemNote || null,
          status: 'comparison_shown',
        }).select('id').single();
        if (error) throw error;
        setRequest({
          id: (data as any).id,
          vehicle_id: vehicleId,
          zip,
          service_type: serviceType,
          problem_note: problemNote,
          status: 'comparison_shown',
        });
        logEvent({ eventType: 'CAR_SERVICE_REQUEST_CREATED', direction: 'mutate', entityType: 'car_service_request', entityId: (data as any).id });
        logEvent({ eventType: 'CAR_SERVICE_COMPARISON_SHOWN', direction: 'mutate', entityType: 'car_service_request', entityId: (data as any).id });
      } else {
        setRequest({
          id: `demo-sr-${Date.now()}`,
          vehicle_id: vehicleId,
          zip,
          service_type: serviceType,
          problem_note: problemNote,
          status: 'comparison_shown',
        });
      }

      setTimeout(() => comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Erstellen');
    } finally {
      setIsSaving(false);
    }
  }, [serviceType, zip, radiusKm, problemNote, vehicleId, activeTenantId, isDemo, logEvent]);

  // ── Step C4: Select workshop ───────────────────────────────────
  const handleSelectWorkshop = useCallback(async (workshop: MockWorkshop) => {
    setSelectedWorkshop(workshop);
    setFlowStatus('workshop_selected');

    if (request && activeTenantId && !isDemo) {
      await supabase.from('car_service_requests' as any).update({
        status: 'workshop_selected',
        selected_workshop_name: workshop.name,
        selected_workshop_id: workshop.id,
        distance_km: workshop.distance_km,
        quoted_price_min: workshop.price_min,
        quoted_price_max: workshop.price_max,
        next_available_at: workshop.next_available,
      }).eq('id', request.id);
      logEvent({ eventType: 'CAR_SERVICE_WORKSHOP_SELECTED', direction: 'mutate', entityType: 'car_service_request', entityId: request.id });
    }
  }, [request, activeTenantId, isDemo, logEvent]);

  // ── Step C5: Request booking ───────────────────────────────────
  const handleRequestBooking = useCallback(async () => {
    setFlowStatus('booking_requested');
    if (request && activeTenantId && !isDemo) {
      await supabase.from('car_service_requests' as any).update({
        status: 'booking_requested',
        appointment_at: appointmentDate || null,
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
      }).eq('id', request.id);
      logEvent({ eventType: 'CAR_SERVICE_BOOKING_REQUESTED', direction: 'mutate', entityType: 'car_service_request', entityId: request.id });
    }
    toast.success('Terminanfrage gesendet');
  }, [request, appointmentDate, contactPhone, contactEmail, activeTenantId, isDemo, logEvent]);

  // ── Step C6: Confirm / Reject (Demo) ───────────────────────────
  const handleConfirm = useCallback(async () => {
    setFlowStatus('booked');
    if (request && activeTenantId && !isDemo) {
      await supabase.from('car_service_requests' as any).update({
        status: 'booked',
        confirmed_at: new Date().toISOString(),
      }).eq('id', request.id);
      logEvent({ eventType: 'CAR_SERVICE_BOOKING_CONFIRMED', direction: 'mutate', entityType: 'car_service_request', entityId: request.id });
    }
    toast.success('Termin bestätigt!');
  }, [request, activeTenantId, isDemo, logEvent]);

  const handleReject = useCallback(async () => {
    setFlowStatus('rejected');
    if (request && activeTenantId && !isDemo) {
      await supabase.from('car_service_requests' as any).update({
        status: 'rejected',
        rejection_reason: 'Demo-Ablehnung',
      }).eq('id', request.id);
      logEvent({ eventType: 'CAR_SERVICE_BOOKING_REJECTED', direction: 'mutate', entityType: 'car_service_request', entityId: request.id });
    }
    toast.info('Termin abgelehnt');
  }, [request, activeTenantId, isDemo, logEvent]);

  const handleReset = useCallback(() => {
    setSelectedWorkshop(null);
    setFlowStatus('comparison_shown');
    setTimeout(() => comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm uppercase tracking-wide">Service / Werkstatt</h3>
      </div>

      {/* ── C1: Leistung wählen ────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Welche Leistung benötigen Sie?</p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_TYPES.map((st) => (
            <button
              key={st.key}
              onClick={() => setServiceType(st.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                serviceType === st.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/40 text-foreground border-border/50 hover:border-primary/30 hover:bg-muted/60"
              )}
            >
              {st.emoji} {st.label}
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Problem / Hinweis (optional)"
          value={problemNote}
          onChange={(e) => setProblemNote(e.target.value)}
          className="min-h-[60px] text-sm"
        />
      </div>

      {/* ── C2: PLZ prüfen (Inline-Fallback) ──────────────────── */}
      {serviceType && (
        <div className="flex items-end gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
          <div className="space-y-1 flex-1 max-w-[120px]">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> PLZ
            </Label>
            <Input
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="80802"
              className="h-8 text-sm font-mono"
              maxLength={5}
            />
          </div>
          <div className="space-y-1 w-[100px]">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Radius</Label>
            <Input
              type="number"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value) || 20)}
              className="h-8 text-sm"
              min={5}
              max={100}
            />
          </div>
          <Button
            size="sm"
            onClick={handleShowComparison}
            disabled={!serviceType || !zip || zip.length !== 5 || isSaving}
            className="gap-1.5"
          >
            <Search className="h-3.5 w-3.5" />
            Preisvergleich
          </Button>
        </div>
      )}

      {/* ── C3: Preisvergleich (Mock) ─────────────────────────── */}
      {flowStatus !== 'idle' && workshops.length > 0 && (
        <div ref={comparisonRef} className="space-y-3">
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {workshops.length} Werkstätten gefunden für PLZ {zip}
            </p>
            {request && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                onClick={() => window.open(buildWorkshopPartnerUrl(request), '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
                FairGarage öffnen
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {workshops.map((ws) => {
              const isSelected = selectedWorkshop?.id === ws.id;
              return (
                <div
                  key={ws.id}
                  onClick={() => handleSelectWorkshop(ws)}
                  className={cn(
                    "relative p-4 rounded-xl border cursor-pointer transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-border/50 bg-card hover:border-primary/30 hover:shadow-sm"
                  )}
                >
                  {ws.badge && (
                    <Badge className="absolute -top-2 right-3 text-[9px] bg-amber-500/90 text-white border-0">
                      {ws.badge === 'Top Preis' ? <Award className="h-2.5 w-2.5 mr-0.5" /> : <Zap className="h-2.5 w-2.5 mr-0.5" />}
                      {ws.badge}
                    </Badge>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{ws.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {ws.distance_km} km</span>
                        <span>⭐ {ws.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-primary">{ws.price_min}–{ws.price_max} €</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                        <Clock className="h-3 w-3" /> {formatDate(ws.next_available)}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Ausgewählt
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── C5: Terminbuchung ─────────────────────────────────── */}
      {flowStatus === 'workshop_selected' && selectedWorkshop && (
        <div className="space-y-3 p-4 rounded-xl bg-muted/10 border border-border/30">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Termin bei {selectedWorkshop.name}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Wunschtermin</Label>
              <Input
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" /> Telefon
              </Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+49 123 456789"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> E-Mail
              </Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="max@beispiel.de"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Notiz an Werkstatt</Label>
              <Input
                value={bookingNote}
                onChange={(e) => setBookingNote(e.target.value)}
                placeholder="Optional..."
                className="h-8 text-sm"
              />
            </div>
          </div>
          <Button size="sm" onClick={handleRequestBooking} className="gap-1.5 w-full sm:w-auto">
            <ChevronRight className="h-3.5 w-3.5" />
            Termin anfragen
          </Button>
        </div>
      )}

      {/* ── C6: Buchungsbestätigung (Demo) ────────────────────── */}
      {flowStatus === 'booking_requested' && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h4 className="font-semibold text-sm">Anfrage gesendet — warten auf Bestätigung</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Werkstatt: {selectedWorkshop?.name} · {selectedWorkshop?.price_min}–{selectedWorkshop?.price_max} €
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={handleConfirm} className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Bestätigen
            </Button>
            <Button size="sm" variant="outline" onClick={handleReject} className="gap-1">
              <XCircle className="h-3.5 w-3.5" /> Ablehnen
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground italic">Demo-Modus: In Produktion wird die Werkstatt bestätigen.</p>
        </div>
      )}

      {flowStatus === 'booked' && (
        <div className="p-4 rounded-xl border border-status-success/30 bg-status-success/5 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-status-success" />
            <h4 className="font-semibold text-sm text-status-success">Termin bestätigt</h4>
          </div>
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Werkstatt:</span> {selectedWorkshop?.name}</p>
            <p><span className="text-muted-foreground">Entfernung:</span> {selectedWorkshop?.distance_km} km</p>
            <p><span className="text-muted-foreground">Preis:</span> {selectedWorkshop?.price_min}–{selectedWorkshop?.price_max} €</p>
            {appointmentDate && <p><span className="text-muted-foreground">Termin:</span> {new Date(appointmentDate).toLocaleString('de-DE')}</p>}
          </div>
        </div>
      )}

      {flowStatus === 'rejected' && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-2">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <h4 className="font-semibold text-sm">Termin abgelehnt</h4>
          </div>
          <Button size="sm" variant="outline" onClick={handleReset} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" /> Neue Werkstatt wählen
          </Button>
        </div>
      )}
    </div>
  );
}
