

# TLC + ImmobilienScout24 Vermietung — Komplettanalyse

## 1. TLC-Struktur (TenancyTab.tsx — 920 Zeilen)

Die TenancyTab ist die zentrale Orchestrierung fuer Mietverwaltung in MOD-04. Sie rendert Mietvertraege als inline-editierbare Cards und darunter 4 TLC-Kategorien mit 17 Sektionen:

```text
TenancyTab
├── Header: "Neuen Vertrag anlegen"
├── Active Leases (inline-editable Cards)
│   ├── Vertragsart, Mietmodell
│   ├── Kaltmiete, NK, Heizkosten → Warmmiete (computed)
│   ├── Laufzeit (Start/Ende)
│   ├── Kaution + Zinsgutschrift (ENG-TLC)
│   └── Actions: Aktivieren, Kuendigung, Mieterhoehung, Abmahnung
├── Historische Vertraege (Collapsible)
└── TLC Lifecycle-Management
    ├── 📋 Kernfunktionen
    │   ├── Events (TLCEventsSection)
    │   ├── Tasks (TLCTasksSection)
    │   ├── Deadlines (TLCDeadlinesSection)
    │   └── Zaehlerstaende (TLCMeterSection)
    ├── 📝 Vertrag & Uebergabe          ← IS24 HIER
    │   ├── Vermietungsinserat (TLCRentalListingSection) ← NEU
    │   ├── Mietvertrag (TLCContractSection)
    │   ├── Uebergabe (TLCHandoverSection)
    │   └── Bewerber (TLCApplicantSection)
    ├── 💶 Finanzen
    │   ├── Zahlungsplan (TLCPaymentPlanSection)
    │   ├── Mietminderung (TLCRentReductionSection)
    │   ├── NK-Vorauszahlung (TLCPrepaymentSection)
    │   ├── 3-Jahres-Check (TLCThreeYearCheckSection)
    │   └── Rechnungen (TLCInvoiceSection)
    └── 🏢 Verwaltung
        ├── Kommunikation (TLCCommunicationSection)
        ├── Maengel (TLCDefectSection)
        ├── Dienstleister (TLCServiceProviderSection)
        └── Versicherung (TLCInsuranceSection)
```

## 2. IS24-Integration Vermietung — Status

### Was gebaut ist (funktional)

| Komponente | Status | Detail |
|------------|--------|--------|
| `TLCRentalListingSection.tsx` | Gebaut | 422 Zeilen, Collapsible in Kategorie 2 |
| `sot-is24-gateway` Edge Function | Deployed | 651 Zeilen, OAuth 1.0a, 4 Actions |
| `rental_listings` Tabelle | Vorhanden | 18 Spalten inkl. cold_rent, warm_rent, pets_allowed |
| `rental_publications` Tabelle | Vorhanden | 12 Spalten, Unique auf (rental_listing_id, channel) |
| Secrets | Konfiguriert | IS24_CONSUMER_KEY, IS24_CONSUMER_SECRET, Sandbox User/PW |
| `IS24PublicationStatus.tsx` (Verkauf) | Gebaut | 149 Zeilen, in ExposeDetail eingebunden |

### Kritische Bugs (Edge Function ↔ DB Mismatch)

**BUG 1 — `metadata` Spalte fehlt in `rental_publications`:**
Die Edge Function schreibt `metadata: { is24_status, is24_response, object_type }` in `rental_publications` (Z. 443-455). Diese Spalte existiert aber **nicht** in der Tabelle. Das `upsert` wird **silent fail** oder den ganzen Insert blockieren.

**BUG 2 — `removed_at` Spalte fehlt in `rental_publications`:**
Bei `deactivate_listing` schreibt die Edge Function `removed_at: new Date().toISOString()` (Z. 596). Diese Spalte fehlt ebenfalls in `rental_publications` (existiert nur in `listing_publications`).

**BUG 3 — `tenant_id` wird in `rental_publications` geschrieben, aber Tabelle hat das Feld:**
Das ist korrekt — `tenant_id` existiert. Kein Bug.

**BUG 4 — Channel-Typ Mismatch:**
`listing_publications.channel` ist ein **ENUM** (`kaufy`, `scout24`, `kleinanzeigen`, `partner_network`). `rental_publications.channel` ist **plain TEXT**. Funktional OK, aber inkonsistent.

### UI/UX-Analyse der TLCRentalListingSection

**Staerken:**
- Sauberes Collapsible-Pattern innerhalb Kategorie 2
- Status-Icon im Trigger (gruen/gelb/rot/grau) — gutes visuelles Feedback
- Mietdaten (Kaltmiete, Warmmiete) werden aus dem aktiven Lease vorbefuellt
- IS24-Buchungsbutton mit Credit-Hinweis ("2 Credits")
- Deaktivierungs-Option vorhanden

**Schwaechen:**
1. **Fehlende `postalCode`-Weitergabe:** TenancyTab Z. 797-806 setzt `propertyCity` aus `propertyAddress.split(',').pop()` — das ist fragil und verliert die PLZ. Das `postalCode`-Prop wird **nicht** uebergeben, obwohl die Komponente es akzeptiert.
2. **Kein `yearBuilt`-Prop:** Wird nicht aus der Property geladen und nicht uebergeben. IS24 braucht `yearConstructed`.
3. **Kein Error-Feedback bei Credit-Mangel:** Wenn 402 zurueckkommt, zeigt `toast.error` nur die Fehlermeldung — kein expliziter Hinweis auf fehlende Credits mit Link zur Aufladung.
4. **Kein Confirmation-Dialog vor Buchung:** "Auf IS24 buchen (2 Credits)" fuehrt sofort die Mutation aus — bei einer kostenpflichtigen Aktion sollte ein Bestaetignungsdialog kommen.
5. **Formular ist immer sichtbar:** Die Inserats-Felder sind immer editierbar, auch wenn bereits auf IS24 aktiv. Aenderungen am Formular aktualisieren aber NICHT automatisch die IS24-Anzeige.

## 3. Bereinigungsplan

### DB-Migration (2 fehlende Spalten)

```sql
ALTER TABLE rental_publications 
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS removed_at timestamptz;
```

### TenancyTab: Props-Korrektur

Property-Daten vollstaendig laden (`year_built`, `postal_code`) und an `TLCRentalListingSection` weiterreichen:
- `postalCode` aus `propData.postal_code`
- `yearBuilt` aus Property-Daten (muss noch abgefragt werden — `properties.year_built` oder aehnlich)

### TLCRentalListingSection: UX-Verbesserungen

1. **Bestaetignungsdialog** vor kostenpflichtiger IS24-Buchung (AlertDialog mit "2 Credits werden abgezogen")
2. **Credit-Mangel-Handling:** Bei 402-Response expliziten Hinweis "Nicht genuegend Credits" mit Verweis auf Abrechnungs-Tab
3. **Formular-Lock:** Wenn IS24 aktiv, Formularfelder readonly setzen und "Aktualisieren auf IS24"-Button anzeigen (der `update_listing` aufruft)
4. **PostalCode + YearBuilt** korrekt uebergeben

### Edge Function: Minor Fix

Keine Aenderung noetig — die Edge Function selbst ist korrekt gebaut. Die `metadata`/`removed_at`-Fehler kommen vom fehlenden DB-Schema, nicht von der Funktionslogik.

## 4. Umsetzungsschritte

| # | Was | Dateien |
|---|-----|---------|
| 1 | DB-Migration: `metadata` + `removed_at` Spalten | SQL Migration |
| 2 | TenancyTab: `postalCode` + `yearBuilt` Props ergaenzen | `TenancyTab.tsx` |
| 3 | TLCRentalListingSection: Confirmation-Dialog + Credit-Error + Formular-Lock | `TLCRentalListingSection.tsx` |
| 4 | Virtueller E2E-Test via Edge Function curl | Sandbox-Validierung |

