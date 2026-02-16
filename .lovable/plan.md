

# PET Vertical — Erweiterung: Zahlungs- und Rechnungsmodul (Zone 2 Manager)

## Kontext

Jeder Franchise-Partner (Provider) betreibt sein eigenes Geschaeft und braucht daher einen eigenen Zahlungs- und Rechnungsflow. Der Kunde bezahlt den Provider direkt — nicht die Plattform. Zone 1 behaelt die Uebersicht, greift aber nicht in den Zahlungsverkehr ein.

## Architektur-Entscheidung

```text
+-- Zone 1 (Lennox Desk) ----------------------------+
|  Sieht: Umsatz-Aggregat pro Provider, offene       |
|  Forderungen, Franchise-Gebuehren (spaeter)        |
+-----------------------------------------------------+
          |
+-- Zone 2 Manager (Pet Manager) --------------------+
|  NEUER Tile: "Zahlungen & Rechnungen"               |
|  /portal/petmanager/zahlungen                       |
|                                                      |
|  - Rechnung pro Buchung erstellen                    |
|  - Zahlungsstatus tracken (offen/bezahlt/ueberfaellig)|
|  - Rechnungs-PDF generieren                          |
|  - Offene-Posten-Liste                               |
+-----------------------------------------------------+
          |
+-- Zone 2 Client (Pets) ----------------------------+
|  Sieht: eigene Rechnungen + Zahlungsstatus          |
|  unter /portal/pets/buchungen (inline)               |
+-----------------------------------------------------+
```

## Datenbank-Erweiterung (2 neue Tabellen)

### `pet_invoices` — Rechnungen pro Buchung
- `id` UUID PK
- `invoice_number` TEXT UNIQUE (auto-generiert, z.B. "INV-2026-00001")
- `booking_id` UUID FK -> pet_bookings
- `provider_id` UUID FK -> pet_providers
- `customer_id` UUID FK -> pet_customers
- `amount_cents` INT (Gesamtbetrag)
- `tax_rate` NUMERIC DEFAULT 19.0 (USt-Satz)
- `tax_cents` INT (berechneter Steuerbetrag)
- `net_cents` INT (Nettobetrag)
- `status` TEXT: draft / sent / paid / overdue / cancelled
- `due_date` DATE
- `paid_at` TIMESTAMPTZ
- `payment_method` TEXT (bar/ueberweisung/paypal/stripe)
- `notes` TEXT
- `pdf_url` TEXT (Storage-Link zur generierten PDF)
- `created_at`, `updated_at`

### `pet_invoice_items` — Rechnungspositionen
- `id` UUID PK
- `invoice_id` UUID FK -> pet_invoices
- `description` TEXT (z.B. "Tagesbetreuung Balu — 15.03.2026")
- `quantity` INT DEFAULT 1
- `unit_price_cents` INT
- `total_cents` INT
- `sort_order` INT

### Rechnungsnummer-Sequenz
- DB-Funktion `generate_pet_invoice_number()` erzeugt fortlaufende Nummern im Format `INV-YYYY-NNNNN`
- BEFORE INSERT Trigger auf `pet_invoices`

### RLS Policies
- `pet_invoices`: Provider sieht eigene (provider_id match); Client sieht eigene (customer_id match); platform_admin full access
- `pet_invoice_items`: Zugriff ueber JOIN mit pet_invoices (gleiche Logik)

## Menustruktur-Anpassung

### Zone 2 Manager — Pet Manager (5 statt 4 Tiles)

| Nr | Menuepunkt | Route |
|----|------------|-------|
| 1 | Kalender und Buchungen | `/portal/petmanager/buchungen` |
| 2 | Leistungen und Verfuegbarkeit | `/portal/petmanager/leistungen` |
| 3 | **Zahlungen und Rechnungen** | `/portal/petmanager/zahlungen` |
| 4 | Kunden und Tiere | `/portal/petmanager/kunden` |
| 5 | Uebersicht | `/portal/petmanager/uebersicht` |

### Zone 2 Client — Pets (unveraendert, 4 Tiles)
Rechnungen werden inline im Tile "Buchen und Buchungen" angezeigt (Accordion pro Buchung zeigt Rechnungsstatus + PDF-Download).

## Neue Dateien

| Datei | Beschreibung |
|-------|-------------|
| `src/pages/portal/petmanager/PMZahlungen.tsx` | Offene-Posten-Liste, Rechnung erstellen, Status aendern, PDF-Download |

## Geaenderte Dateien

| Datei | Aenderung |
|-------|-----------|
| `routesManifest.ts` | Neuer Tile "zahlungen" im Pet Manager Modul |
| `ManifestRouter.tsx` | Lazy Import fuer PMZahlungen |
| `PetsBuchungen.tsx` | Rechnungsstatus-Badge + PDF-Link pro Buchung (Client-Sicht) |
| `PMUebersicht.tsx` | KPI "Offene Forderungen" und "Umsatz Monat" aus pet_invoices |

## Rechnungs-Flow

```text
1. Buchung wird abgeschlossen     -> Status: completed
   (Pet Manager)
                                     |
2. Manager erstellt Rechnung       -> Invoice Status: draft
   (/portal/petmanager/zahlungen)    Positionen werden aus Service-Preis vorbefuellt
                                     |
3. Manager versendet Rechnung      -> Invoice Status: sent
   (PDF wird generiert + gespeichert) Client sieht Rechnung in Buchungsdetails
                                     |
4. Zahlung eingeht                 -> Invoice Status: paid
   (Manager markiert manuell)        paid_at wird gesetzt
                                     |
   ODER: Faelligkeit ueberschritten -> Invoice Status: overdue
   (ggf. automatisch per Cron)
```

Phase 1 ist rein manuell (Provider markiert Zahlung). Spaetere Phasen koennen Stripe Connect oder andere Payment-Provider integrieren, sodass Kunden direkt online bezahlen.

## Einordnung im Backlog

| ID | Severity | Titel |
|----|----------|-------|
| PET-044 | P1 | DB-Migration: pet_invoices + pet_invoice_items + Sequenz |
| PET-045 | P1 | PMZahlungen.tsx: Offene-Posten + Rechnung erstellen |
| PET-046 | P2 | Rechnungs-PDF Generierung (jsPDF, bereits im Projekt) |
| PET-047 | P2 | Client-Sicht: Rechnungsstatus in Buchungsdetails |
| PET-048 | P3 | Auto-Overdue Erkennung (Cron/Trigger) |

## Implementierungsreihenfolge

Wird in die bestehende Phase 6 (Zone 2 Manager) eingebettet:
1. DB-Migration (pet_invoices, pet_invoice_items, Trigger, RLS) — zusammen mit PH-01
2. Manifest: Neuer Tile in Pet Manager — zusammen mit PH-02
3. PMZahlungen.tsx UI — nach PMBuchungen.tsx (Phase 6)
4. Client-Integration in PetsBuchungen.tsx — nach Phase 5
5. PDF-Generierung — nutzt bestehendes jsPDF (bereits als Dependency vorhanden)

