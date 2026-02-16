

# Fahrzeugakte: Versicherung entfernen, Service/Werkstatt-Flow hinzufuegen

## Uebersicht

Die Fahrzeugakte in `CarsFahrzeuge.tsx` wird ueberarbeitet:
1. Versicherungs-Sektion wird komplett entfernt
2. Neuer Inline-Bereich "Service / Werkstatt" wird eingefuegt (zwischen Basisdaten und Schaeden)
3. Basisdaten bleiben teilbefuellbar (ist bereits so implementiert)

## A) Versicherung bereinigen

### Entfernen aus `CarsFahrzeuge.tsx`
- **Zeilen 112-130**: `DEMO_INSURANCES` und `INSURANCE_FIELD_LABELS` Konstanten loeschen
- **Zeilen 418-429**: `EditableAkteSection` fuer "Versicherung" + Separator entfernen
- **Zeile 310**: `MiniInfo` mit "Vers. Aktiv" im Widget-Grid aendern zu "Service" mit Wrench-Icon
- **Import**: `ShieldCheck` entfernen (wird nicht mehr gebraucht im Akte-Bereich)
- Optional: Einen simplen Deep-Link-Button "Versicherung verwalten -> /portal/finanzanalyse" als Hinweis einfuegen

### Entfernen aus `VehicleDetailPage.tsx`
- **Zeilen 56-60**: `coverageLabels` entfernen
- **Zeilen 157-171**: `insurances` Query entfernen
- **Zeilen 292-295**: Versicherungen-Tab-Trigger entfernen
- **Zeilen 389-446**: Versicherungen-TabContent komplett entfernen
- **Zeile 33**: `InsuranceCreateDialog` Import entfernen
- **Zeile 121**: `insuranceDialogOpen` State entfernen
- **Zeile 24**: `ShieldCheck` Import entfernen (falls nicht anderweitig genutzt)

### Dateien loeschen (optional, da nicht mehr referenziert)
- `InsuranceCreateDialog.tsx` — wird nicht mehr gebraucht
- `CarsVersicherungen.tsx` — wird nicht mehr gebraucht
- Export-Eintraege aus `index.ts` bereinigen

## B) Basisdaten (bereits teilbefuellbar)

Die aktuelle Implementierung zeigt fehlende Werte bereits als "—" an und speichert per Einzel-Feld-Update. Keine Aenderung noetig.

## C) Service / Werkstatt — Neuer Inline-Flow

### Datenmodell: Tabelle `car_service_requests`

```sql
CREATE TABLE public.car_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.cars_vehicles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  tenant_id uuid NOT NULL,
  partner text DEFAULT 'fairgarage',
  zip text,
  radius_km int DEFAULT 20,
  service_type text NOT NULL,
  problem_note text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','comparison_shown','workshop_selected','booking_requested','booked','rejected','cancelled')),
  selected_workshop_name text,
  selected_workshop_id text,
  distance_km numeric,
  quoted_price_min numeric,
  quoted_price_max numeric,
  next_available_at timestamptz,
  appointment_at timestamptz,
  contact_email text,
  contact_phone text,
  confirmed_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.car_service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own service requests"
  ON public.car_service_requests
  FOR ALL
  USING (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()));
```

### UI-Implementierung: Neue Komponente `CarServiceFlow`

Wird als eigene Komponente erstellt und in die Fahrzeugakte zwischen Basisdaten und Schaeden eingefuegt.

**Schritt C1 — Leistung waehlen:**
- Cards/Chips fuer 9 Service-Typen: Inspektion, HU/AU, Oelwechsel, Bremsen, Reifenwechsel, Diagnose, Reparatur allgemein, Klimaservice, Unfall/Glas
- Optional: Textarea "Problem / Hinweis"
- CTA: "Preisvergleich anzeigen"

**Schritt C2 — PLZ pruefen (Inline-Fallback):**
- Wenn PLZ im Fahrzeug (holder_address) nicht extrahierbar: kleines Inline-Eingabefeld
- Optional: Radius-Slider (Default 20 km)
- Automatisch weiter wenn PLZ vorhanden

**Schritt C3 — Preisvergleich (Demo-Mock):**
- 4 Mock-Werkstaetten, deterministisch generiert aus zip + service_type
- Jede Card: Name, Entfernung, Preis (Spanne), naechster Termin, Badges
- Secondary: "Echten Vergleich bei FairGarage oeffnen" (Deep-Link)

**Schritt C4 — Werkstatt waehlen:**
- Klick markiert Card, speichert Auswahl
- Oeffnet automatisch Terminblock darunter

**Schritt C5 — Terminbuchung:**
- Prefill-Felder: Datum (Date-Picker), Telefon, E-Mail, Notiz
- CTA: "Termin anfragen"

**Schritt C6 — Buchungsbestaetigung (Demo):**
- Status-Card "Ausstehend"
- Demo-Buttons: "Bestaetigen" / "Ablehnen"
- Bei Bestaetigung: Termin-Zusammenfassung
- Bei Ablehnung: "Neue Werkstatt waehlen" scrollt zurueck

### Mock-Werkstatt-Generator

Deterministische Funktion `generateMockWorkshops(zip, serviceType)` die aus dem Hash von zip+serviceType stabile Ergebnisse liefert:

```text
Werkstatt-Pool:
- "AutoPlus Werkstatt" | 2,3 km | 189-249 EUR
- "Meisterbetrieb Schmidt" | 4,7 km | 159-199 EUR
- "FairRepair Zentrum" | 6,1 km | 209-279 EUR
- "KFZ-Technik Mueller" | 8,4 km | 145-189 EUR
```

### FairGarage Deep-Link Builder

```typescript
function buildWorkshopPartnerUrl(request: ServiceRequest): string {
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
```

## D) Event Ledger

Nutzt den bestehenden `useDataEventLedger` Hook:

| Event | Direction | Wann |
|---|---|---|
| CAR_SERVICE_REQUEST_CREATED | mutate | Service-Request angelegt |
| CAR_SERVICE_COMPARISON_SHOWN | mutate | Vergleich angezeigt |
| CAR_SERVICE_WORKSHOP_SELECTED | mutate | Werkstatt gewaehlt |
| CAR_SERVICE_BOOKING_REQUESTED | mutate | Termin angefragt |
| CAR_SERVICE_BOOKING_CONFIRMED | mutate | Termin bestaetigt (Demo) |
| CAR_SERVICE_BOOKING_REJECTED | mutate | Termin abgelehnt (Demo) |

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/portal/cars/CarsFahrzeuge.tsx` | Versicherung entfernen, Service-Flow einfuegen |
| `src/components/portal/cars/CarServiceFlow.tsx` | **NEU** — Inline Service/Werkstatt Komponente |
| `src/components/portal/cars/VehicleDetailPage.tsx` | Versicherungs-Tab entfernen |
| `src/components/portal/cars/index.ts` | Exports bereinigen |
| DB-Migration | Tabelle `car_service_requests` erstellen |

