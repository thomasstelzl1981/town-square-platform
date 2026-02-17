
# Pet Manager (MOD-22) weiterentwickeln — Lennox & Friends als echter Tenant-Betrieb

## Ausgangslage

**Was existiert:**
- Lennox & Friends ist als `pet_providers` Record in der DB angelegt (aktiv, verifiziert)
- 4 Services: Hundesalon (65 EUR), Gassi (25 EUR), Tagesstaette (35 EUR), Pension (45 EUR)
- Verfuegbarkeit: Mo-Fr 08-12 + 14-18 Uhr (max 8), Sa 09-14 Uhr (max 4)
- MOD-22 hat 4 Tabs: Buchungen, Leistungen, Kunden, Finanzen
- Rechnungssystem (pet_invoices + pet_invoice_items) mit PDF-Export ist vorhanden

**Was fehlt:**
- Kein Dashboard mit Visitenkarte (Manager-Module-Workflow-Pattern)
- Keine Kapazitaetsverwaltung (wie viele Plaetze hat die Einrichtung, wie viele sind belegt)
- Keine Belegungspruefung bei Buchungen (max_bookings wird nicht gegen aktuelle Buchungen abgeglichen)
- `useMyProvider` findet den Provider nur via `user_id` — es fehlt die Verbindung zum eingeloggten User
- Kunden-Tab ist nur Placeholder
- Kein Payment-Flow (kommt spaeter)
- Keine Lexware-Anbindung (kommt spaeter)

---

## Umsetzung in 2 Phasen

### Phase 1: Dashboard + Kapazitaetsverwaltung

**1.1 Neuer Tab "Dashboard" (Default-Tab)**

Neuer Einstiegspunkt `PMDashboard.tsx` nach dem Manager-Module-Workflow-Pattern:

```text
+--------------------------------------------------+
| DASHBOARD_HEADER                                  |
| +------------------------+  +-------------------+ |
| | ManagerVisitenkarte    |  | Kapazitaets-      | |
| | "Lennox & Friends"     |  | Widget            | |
| | Franchise-Partner      |  | 8/12 Plaetze      | |
| | Kontaktdaten           |  | belegt heute      | |
| +------------------------+  +-------------------+ |
+--------------------------------------------------+
| KPI-Leiste                                        |
| [Heute] [Diese Woche] [Offene Anfragen] [Umsatz] |
+--------------------------------------------------+
| Naechste Buchungen (kompakte Liste)               |
+--------------------------------------------------+
```

- `ManagerVisitenkarte`: Zeigt Company-Name, Adresse, Telefon, E-Mail des Providers (nicht des Users — hier wird eine **ProviderVisitenkarte** Variante noetig, die `pet_providers` Daten statt `profile` nutzt)
- Kapazitaets-Widget: Zeigt Tages-Auslastung basierend auf `max_bookings` vs. aktuelle bestaetigte Buchungen
- KPIs: Heutige Buchungen, Wochenauslastung, offene Anfragen, Monatsumsatz

**1.2 DB-Erweiterung: Kapazitaetsfelder**

Neue Spalten auf `pet_providers`:
- `max_daily_capacity` (integer, default 12) — maximale Tagesplaetze insgesamt
- `facility_type` (text, default 'daycare') — Art der Einrichtung (daycare, pension, mobile, salon)

Migration fuer Lennox & Friends: `max_daily_capacity = 12`.

**1.3 Route-Anpassung**

In `PetManagerPage.tsx` und `routesManifest.ts`:
- Neuer Tab "Dashboard" als Default-Route
- Reihenfolge: Dashboard, Buchungen, Leistungen, Kunden, Finanzen

---

### Phase 2: Belegungspruefung bei Buchungen

**2.1 Belegungspruefung-Hook**

Neuer Hook `usePetCapacity`:
- Laedt `max_bookings` aus `pet_provider_availability` fuer den aktuellen Tag/Slot
- Laedt `max_daily_capacity` aus `pet_providers`
- Zaehlt bestaetigte + laufende Buchungen fuer ein Datum
- Gibt zurueck: `{ totalCapacity, bookedToday, availableSlots, isFullyBooked }`

**2.2 Buchungs-Validierung in PMBuchungen**

Beim Annehmen einer Buchung (`requested -> confirmed`):
- Pruefen ob `bookedToday < max_daily_capacity`
- Pruefen ob der spezifische Zeitslot nicht ueberschritten ist (`max_bookings` aus Availability)
- Warnung anzeigen wenn fast voll, Blockierung wenn voll

**2.3 Kunden-Tab aktiv machen**

`PMKunden.tsx` wird vom Placeholder zur funktionalen Seite:
- Listet alle Kunden (distinct `client_user_id` aus `pet_bookings`)
- Zeigt deren Tiere (via `pets` Tabelle, Join ueber Buchungen)
- Kompakte Card-Liste mit Name, Tier, letzte Buchung, Anzahl Buchungen

---

## Technische Details

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/petmanager/PMDashboard.tsx` | NEU — Dashboard mit Visitenkarte + Kapazitaet |
| `src/pages/portal/PetManagerPage.tsx` | Dashboard-Route hinzufuegen als Default |
| `src/manifests/routesManifest.ts` | Dashboard-Tab in MOD-22 Tiles einfuegen |
| `src/hooks/usePetCapacity.ts` | NEU — Kapazitaets- und Belegungs-Hook |
| `src/hooks/usePetBookings.ts` | `useMyProvider` erweitern (tenant-basiert statt user_id) |
| `src/pages/portal/petmanager/PMBuchungen.tsx` | Belegungspruefung vor Annehmen einbauen |
| `src/pages/portal/petmanager/PMKunden.tsx` | Placeholder -> funktionale Kundenliste |
| DB-Migration | `max_daily_capacity` + `facility_type` auf `pet_providers` |

### Provider-Erkennung

Aktuell: `useMyProvider` filtert auf `user_id = auth.uid()`. Fuer Lennox & Friends muss der eingeloggte User als Provider-Betreiber erkannt werden. Loesung: Fallback auf `tenant_id`-basierte Suche — wenn kein Provider mit der eigenen `user_id` gefunden wird, wird der erste aktive Provider des Tenants geladen. Spaeter kann dies ueber eine `provider_members` Tabelle praeziser geloest werden.

### Kapazitaets-Logik

```text
Tages-Kapazitaet = min(
  pet_providers.max_daily_capacity,
  SUM(pet_provider_availability.max_bookings) fuer den Wochentag
)

Belegt heute = COUNT(pet_bookings WHERE scheduled_date = today 
  AND status IN ('confirmed', 'in_progress'))

Verfuegbar = Tages-Kapazitaet - Belegt heute
```

### Was bewusst NICHT in diesem Schritt

- Payment/Stripe-Integration (spaetere Phase)
- Lexware Office API-Anbindung (spaetere Phase)  
- Zone-1-Governance-Orchestrierung fuer Buchungen
- Cross-Tenant-Buchungsflow (Kunde bucht bei Provider)
- Bewertungssystem
