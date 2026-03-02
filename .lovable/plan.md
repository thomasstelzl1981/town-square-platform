

## Zielbild: Pet Service Lifecycle Controller (ENG-PLC) — Gesamtkonzept

### Problem: Der aktuelle Flow ist falsch

Der jetzige Flow geht über eine Z1-Zuweisung (Lead-Qualifizierung → Zuweisung an Provider), analog zum Immobilien-/Finanzierungsprozess. Das ist falsch. Der Pet Service ist ein **Marktplatz-Modell**: der Kunde sucht selbst, wählt selbst, bucht selbst und zahlt eine Plattformgebühr direkt.

### Korrekter Flow (Zielbild)

```text
PHASE 1: SUCHE & AUSWAHL                     PHASE 2: BUCHUNG & ANZAHLUNG
═══════════════════════                       ═══════════════════════════
Kunde (Z3 oder Z2/MOD-05)                    Kunde
  │                                              │
  ├─ Suche nach PLZ/Ort/Service                  ├─ Wählt Service + Zeitraum
  ├─ Sieht Provider-Profil + Bewertungen         ├─ Zahlt 7,5% Anzahlung (Plattformgebühr)
  └─ Wählt Provider                              │   └─ Nicht erstattbar, auch bei Storno
                                                 ├─ Buchung wird erstellt → Status: "deposit_paid"
                                                 └─ Provider wird benachrichtigt

PHASE 3: PROVIDER-BESTÄTIGUNG                PHASE 4: DURCHFÜHRUNG & ABSCHLUSS
═══════════════════════════════               ══════════════════════════════════
Provider (Z2/MOD-22)                          Provider (Z2/MOD-22)
  │                                              │
  ├─ Sieht neue Buchungsanfrage                  ├─ Check-In (Tier angenommen)
  ├─ Bestätigt oder lehnt ab                     ├─ Check-Out (Tier zurückgegeben)
  │   ├─ Bestätigt → Status: "confirmed"         ├─ Restbetrag wird fällig
  │   └─ Ablehnt → Plattformgebühr BLEIBT        └─ Bewertung durch Kunden
  └─ Direkter Kontakt mit Kunde

PHASE 5: ABRECHNUNG                           ZONE 1: GOVERNANCE (read-only)
═══════════════                               ═══════════════════════════════
Automatisch                                   Pet Desk
  │                                              │
  ├─ Plattformgebühr (7,5%) bereits kassiert     ├─ Monitoring aller Buchungen
  ├─ Restbetrag direkt zwischen                  ├─ Provider-Verifizierung
  │   Kunde ↔ Provider                           ├─ Stuck-Detection (SLA-Überschreitung)
  └─ Provision-Settlement via Z1                 └─ Dispute-Management
```

### Kernunterschiede zu FLC/SLC

| Aspekt | FLC (Finanzierung) | SLC (Verkauf) | PLC (Pet Service) |
|--------|-------------------|---------------|-------------------|
| Vermittlung | Z1 weist Manager zu | Z1 orchestriert Listing | Kunde wählt selbst (Marktplatz) |
| Plattformgebühr | 25% Success Fee | 25% Success Fee | **7,5% Anzahlung (upfront, non-refundable)** |
| Zahlungszeitpunkt | Nach Auszahlung | Nach Notartermin | **Vor Buchungsbestätigung** |
| Z1-Rolle | Aktiver Orchestrator | Aktiver Orchestrator | **Passiver Monitor** |
| Kundenkontakt | Über Manager | Über Makler | **Direkt mit Provider** |

### Technischer Plan

#### 1. ENG-PLC Engine (neu: `src/engines/plc/`)

**`spec.ts`** — 10 Phasen:

```
search_initiated → provider_selected → deposit_requested → deposit_paid →
provider_confirmed → checked_in → checked_out → settlement →
closed_completed | closed_cancelled
```

**`engine.ts`** — Pure Functions:
- `computePLCPhase()` — Phase aus Events berechnen
- `calculateDeposit(priceCents)` — 7,5% Anzahlung berechnen
- `isValidTransition()` — Phase-Validierung
- `getStuckThresholds()` — SLA-Schwellenwerte (z.B. 48h für Provider-Bestätigung)

#### 2. DB-Tabellen (Migration)

**`pet_service_cases`** — Zentraler Case-Tracker (analog zu `sales_cases` / `finance_mandates`):
- id, customer_user_id, provider_id, service_id, booking_id
- phase (PLC enum), phase_entered_at
- deposit_cents, deposit_paid_at, total_price_cents
- stripe_payment_intent_id (für Anzahlung)

**`pet_lifecycle_events`** — Event-Ledger (analog zu `sales_lifecycle_events`):
- case_id, event_type, actor_id, actor_type, old_phase, new_phase, payload

#### 3. Anzahlungs-Flow (7,5% Plattformgebühr)

- Kunde wählt Service → System berechnet 7,5% vom Servicepreis
- Stripe Checkout Session (oder Payment Intent) wird erstellt
- Nach erfolgreicher Zahlung → Buchung wird mit Status `deposit_paid` erstellt
- Webhook bestätigt Zahlung → Event `deposit.confirmed` ins Ledger
- **Nicht erstattbar** — bei Storno durch Kunden ODER Ablehnung durch Provider
- Die Zone-3-Booking-UI (LennoxPartnerProfil) und Zone-2-Caring-UI (PetsCaring/CaringProviderDetail) zeigen den Betrag klar an: "7,5% Plattformgebühr — nicht erstattungsfähig"

#### 4. Flow-Reparatur: Was sich ändert

**Zone 3 (Lennox Website) — `LennoxPartnerProfil.tsx`:**
- BookingBlock: Statt `pet_z1_booking_requests` → `pet_service_cases` mit Stripe-Anzahlung
- Klarer Hinweis: "7,5% Plattformgebühr (nicht erstattbar)"
- Nach Zahlung: Case erstellt, Provider benachrichtigt

**Zone 2 MOD-05 (Caring) — `PetsCaring.tsx` + `CaringProviderDetail.tsx`:**
- Gleicher Buchungs-Flow wie Z3, aber für eingeloggte Portal-User
- Anzahlung über denselben Stripe-Flow

**Zone 2 MOD-22 (Pet Manager) — `PMBuchungen.tsx`:**
- Zeigt eingehende Buchungen (nur `deposit_paid` → also bereits bezahlt)
- Provider kann bestätigen/ablehnen (Ablehnung gibt Gebühr NICHT zurück)
- Check-In / Check-Out wie bisher

**Zone 1 Pet Desk — `PetDeskVorgaenge.tsx`:**
- Wird zum **Monitor-Dashboard**: alle Cases, alle Phasen, Stuck-Detection
- Kein aktives "Zuweisen" mehr — das macht der Kunde selbst
- Lead-Qualifizierung bleibt für organische Leads die nicht über Buchung kommen

#### 5. Was wird entfernt/umgebaut

- `pet_z1_booking_requests` bleibt für Legacy-Daten, aber neue Buchungen laufen über `pet_service_cases`
- Z1-Zuweisungs-Flow in `PetDeskVorgaenge.tsx` wird auf "Monitor" umgebaut
- Die "5€ Anzahlung" im aktuellen BookingBlock wird zu "7,5% Plattformgebühr"

#### 6. Demo-Daten Cleanup

- Die 3 bestehenden Demo-Kunden (Sabine Berger, Thomas Richter, Claudia Stein) werden per SQL DELETE entfernt
- Neue Demo-Cases werden bei Bedarf über die Demo Seed Engine mit korrektem PLC-Flow angelegt

### Betroffene Dateien

**Neu erstellen:**
- `src/engines/plc/spec.ts` — PLC Phasen, Types, Constants
- `src/engines/plc/engine.ts` — Pure Functions
- DB-Migration: `pet_service_cases` + `pet_lifecycle_events` Tabellen

**Umbauen:**
- `src/pages/zone3/lennox/LennoxPartnerProfil.tsx` — BookingBlock → Stripe-Anzahlung + pet_service_cases
- `src/pages/portal/petmanager/PMBuchungen.tsx` — Cases statt booking_requests
- `src/pages/admin/petmanager/PetDeskVorgaenge.tsx` — Monitor statt Zuweiser
- `src/hooks/usePetBookings.ts` — PLC-Case-Hooks hinzufügen
- `src/engines/index.ts` — PLC exportieren
- `spec/current/06_engines/ENGINE_REGISTRY.md` — ENG-PLC registrieren

**Stripe-Integration:**
- Stripe muss enabled sein für den Anzahlungs-Flow
- Edge Function `sot-pet-deposit-checkout` für Stripe Checkout Session
- Webhook-Handler für `checkout.session.completed`

### Voraussetzung

Stripe muss auf dem Projekt aktiviert werden, bevor der Anzahlungs-Flow implementiert werden kann. Der Gesamtplan kann in Wellen umgesetzt werden:

- **Welle 1:** ENG-PLC Engine + DB-Tabellen + Demo-Cleanup
- **Welle 2:** Stripe-Anzahlungs-Flow + UI-Umbau
- **Welle 3:** Z1-Monitor + Stuck-Detection CRON

