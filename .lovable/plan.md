

# Lennox & Friends — Vollständiger Projekt-Plan

## IST-Analyse

### Was existiert bereits

**Engine (ENG-PLC)**
- `src/engines/plc/spec.ts` — 11 Phasen, Event-Types, SLA-Thresholds, Deposit-Berechnung (7,5%), Interfaces komplett
- `src/engines/plc/engine.ts` — Reine Funktionen: `calculatePLCDeposit`, `computePLCPhase`, `isPLCStuck`, `computePLCState`, `getNextActions`

**Datenbank**
- `pet_service_cases` + `pet_lifecycle_events` — PLC-Backbone-Tabellen existieren
- Legacy-Tabellen parallel aktiv: `pet_z1_booking_requests`, `pet_bookings`, `pet_z1_customers`, `pet_z1_pets`
- Provider-Infrastruktur: `pet_providers`, `pet_services`, `pet_provider_availability`, `pet_provider_blocked_dates`, `pet_rooms`, `pet_staff`
- Kunden-Infrastruktur: `pet_customers`, `pets`, `pet_invoices`

**Edge Functions**
- `sot-pet-deposit-checkout` — Stripe Checkout Session erstellen (fertig, wartet auf Webhook-Secret)
- `sot-pet-deposit-webhook` — Stripe Webhook Handler (fertig, wartet auf Secret)
- `sot-pet-profile-init` — Provider-Profil initialisieren

**Zone 3 (Lennox Website)**
- `LennoxStartseite` — Landing Page
- `LennoxPartnerProfil` — Provider-Profil + Booking (schreibt noch in `pet_z1_booking_requests` Legacy-Tabelle)
- `LennoxMeinBereich` — Kundenbereich mit Tiere + Buchungsstatus (liest aus `pet_z1_booking_requests`)
- `LennoxShop`, `LennoxKontakt`, `LennoxFAQ`, `LennoxRatgeber` etc.

**Zone 2 — MOD-22 (Pet Manager / Provider-Sicht)**
- `PMDashboard` — KPIs, Kapazität, eingehende Anfragen (liest aus `pet_z1_booking_requests`)
- `PMProfil`, `PMPension`, `PMServices`, `PMPersonal`, `PMKalender`, `PMLeistungen`, `PMKunden`, `PMFinanzen`, `PMBuchungen`

**Zone 2 — MOD-05 (Caring / Kunden-Sicht)**
- `CaringProviderDetail` — Provider-Dossier mit Kalender + Buchung (schreibt in `pet_bookings`)

### Was fehlt / Problem

1. **Zwei parallele Buchungssysteme**: Z3 schreibt in `pet_z1_booking_requests`, Z2/MOD-05 schreibt in `pet_bookings` — keins nutzt `pet_service_cases`
2. **PLC-Engine nicht verdrahtet**: Engine existiert nur als pure Functions, wird nirgends im UI verwendet
3. **Stripe zurückgestellt**: Deposit-Flow parkt, 7,5%-Anzahlung wird vorerst nicht erzwungen
4. **Z1 Pet Desk** nutzt Legacy-Tabellen (`pet_z1_booking_requests`)

---

## Zielbild

```text
┌────────────────────────────────────────────────────────┐
│                  PET SERVICE CASE                      │
│           (pet_service_cases = SSOT)                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Z3 Lennox Website                                     │
│  └─ LennoxPartnerProfil → INSERT pet_service_cases     │
│  └─ LennoxMeinBereich   → SELECT pet_service_cases     │
│                                                        │
│  Z2 MOD-05 (Caring/Kunden-Portal)                      │
│  └─ CaringProviderDetail → INSERT pet_service_cases    │
│  └─ PetsMeinBereich      → SELECT pet_service_cases    │
│                                                        │
│  Z2 MOD-22 (Pet Manager/Provider-Portal)               │
│  └─ PMDashboard          → SELECT pet_service_cases    │
│  └─ PMBuchungen          → UPDATE pet_service_cases    │
│     (confirm/decline/check-in/check-out/settle)        │
│                                                        │
│  Z1 Pet Desk (Admin/Monitoring)                        │
│  └─ PetDeskVorgaenge     → SELECT pet_service_cases    │
│     (passive SLA-Überwachung, stuck-detection)         │
│                                                        │
│  pet_lifecycle_events = Eventlog zu jedem Case         │
│                                                        │
│  Stripe: zurückgestellt (Phase deposit_requested →     │
│          deposit_paid wird vorerst übersprungen)       │
└────────────────────────────────────────────────────────┘
```

**Vereinfachter Flow ohne Stripe:**
`provider_selected → provider_confirmed → checked_in → checked_out → settlement → closed_completed`

---

## Phasenplan

### Phase 1 — Hook + Case-Erstellung (Foundation)

**Ziel:** Zentraler `usePetServiceCases` Hook, der CRUD auf `pet_service_cases` kapselt und PLC-Events loggt.

- Neuen Hook `src/hooks/usePetServiceCases.ts` erstellen
  - `useCreateCase()` — Insert in `pet_service_cases` + Event `provider.selected` in `pet_lifecycle_events`
  - `useCasesForProvider(providerId)` — Cases für Provider laden
  - `useCasesForCustomer(userId)` — Cases für Kunden laden
  - `useTransitionCase(caseId, eventType)` — Phase-Transition mit Validierung via `isValidPLCTransition`
- Hook nutzt `computePLCState` aus Engine für UI-ready State

### Phase 2 — Zone 3 Umstellung (Lennox Website)

**Ziel:** Buchung über `pet_service_cases` statt `pet_z1_booking_requests`.

- `LennoxPartnerProfil.tsx` — BookingBlock schreibt in `pet_service_cases` via `useCreateCase`
  - Deposit-Felder werden mit 0 befüllt (Stripe zurückgestellt)
  - Phase startet bei `provider_selected` (kein Deposit-Gate)
- `LennoxMeinBereich.tsx` — Buchungsstatus liest aus `pet_service_cases` statt `pet_z1_booking_requests`
  - PLC-Phasen-Labels aus Engine anzeigen

### Phase 3 — Zone 2 MOD-22 Umstellung (Provider-Sicht)

**Ziel:** Provider verwaltet Cases über PLC-Lifecycle.

- `PMDashboard.tsx` — Eingehende Anfragen aus `pet_service_cases` (Phase `provider_selected`) statt `pet_z1_booking_requests`
  - Confirm → Phase `provider_confirmed`, Decline → Phase `provider_declined`
  - KPIs aus Cases berechnen
- `PMBuchungen.tsx` — Alle Cases mit Lifecycle-Aktionen:
  - Check-in, Check-out, Settlement-Buttons je nach Phase
  - PLC-Phasen-Progress-Anzeige via `computePLCState`

### Phase 4 — Zone 2 MOD-05 Umstellung (Kunden-Sicht)

**Ziel:** Kunden-Buchung im Portal nutzt `pet_service_cases`.

- `CaringProviderDetail.tsx` — Booking-Submit schreibt in `pet_service_cases` via `useCreateCase` statt `pet_bookings`
- Buchungsstatus-Anzeige mit PLC-Phasen

### Phase 5 — Zone 1 Pet Desk Umstellung (Admin)

**Ziel:** Monitoring-Dashboard liest aus Cases.

- `PetDeskVorgaenge.tsx` — Cases mit stuck-detection anzeigen
- SLA-Ampeln basierend auf `isPLCStuck` aus Engine

### Phase 6 — Cleanup

- Legacy-Queries auf `pet_z1_booking_requests` entfernen
- Golden Path `GP_PET.ts` auf `pet_service_cases` umstellen
- Demo-Daten für `pet_service_cases` in Seed Engine aufnehmen

---

## Technische Details

**Stripe-Handling (zurückgestellt):**
Der PLC-Flow überspringt vorerst die Phasen `deposit_requested` und `deposit_paid`. Cases starten direkt in `provider_selected`. Die Engine-Spec bleibt unverändert — wenn Stripe nachgeliefert wird, werden diese Phasen einfach wieder aktiviert.

**RLS-Policy für `pet_service_cases`:**
- Provider sehen Cases mit `provider_id` = eigener Provider
- Kunden sehen Cases mit `customer_user_id` = `auth.uid()`
- Admins sehen alle (via `has_role`)

**Freeze-Status:** MOD-22 ist `frozen: false`, alle Änderungen sind erlaubt.

**Keine Engine-Änderungen nötig:** `src/engines/plc/spec.ts` und `engine.ts` bleiben unverändert — sie sind bereits vollständig.

