

# Phasenweiser Implementierungsplan: PET-Vertical

## Uebersicht

27 Backlog-Items in 6 Phasen. Jede Phase wird einzeln freigegeben und implementiert. Bestehende Tabellen: `pet_invoices` (ohne `tenant_id`!), `pet_invoice_items`. Alle anderen Tabellen muessen neu erstellt werden.

---

## Phase 1: Datenmodell und Tier-Akten (7 Items)

**Ziel:** DB-Fundament + erste sichtbare UI mit Demo-Daten.

### Schritt 1.1 — Datenbank-Migration (PET-001 bis PET-004)

4 neue Tabellen in einer Migration:

| Tabelle | Wichtigste Spalten | RLS |
|---------|-------------------|-----|
| `pets` | tenant_id (NOT NULL), owner_user_id, name, species (enum), breed, gender, birth_date, weight_kg, chip_number, photo_url, allergies (text[]), neutered, vet_name, insurance_provider, insurance_policy_no | tenant_id-basiert |
| `pet_vaccinations` | pet_id (FK), tenant_id, vaccination_type, vaccine_name, administered_at, next_due_at, vet_name, batch_number, document_node_id | tenant_id-basiert |
| `pet_providers` | tenant_id, user_id (FK profiles), company_name, provider_type (enum), status (pending/active/suspended), verified_at, rating_avg, bio, operating_hours (jsonb) | tenant_id + public read fuer verified |
| `pet_services` | provider_id (FK), tenant_id, title, category (enum), duration_minutes, price_cents, price_type (enum), species_allowed (text[]), is_active | tenant_id-basiert |

Indexes: Composite `(tenant_id, created_at)` auf jede Tabelle.

### Schritt 1.2 — Demo-Daten (PET-005)

Demo-Engine-Eintrag in `demoDataManifest.ts` mit festen UUIDs:
- **Luna**: Golden Retriever, weiblich, geb. 2023-04-15, Chip DE123456789, 28kg
- **Bello**: Dackel, maennlich, geb. 2021-09-01, Chip DE987654321, 9kg
- Beide: `tenant_id = DEV_TENANT_UUID` (`a0000000-0000-4000-a000-000000000001`)
- Je 2-3 Impfhistorien-Eintraege (Tollwut, Staupe, Leptospirose)

Seed via SQL-Migration oder Golden-Path-Seed-Funktion.

### Schritt 1.3 — RecordCard UI (PET-006)

**`PetsMeineTiere.tsx`** umbauen:
- RecordCard-Grid (bestehendes Pattern aus Stammdaten/Personen)
- Geschlossener Zustand: Foto-Kachel links (w-1/2, aspect-[4/5]), Name/Rasse/Alter rechts
- Klick oeffnet `/portal/pets/:petId`

**`PetDetailPage.tsx`** ausbauen:
- Offener RecordCard-Zustand mit allen Feldern
- Impfhistorie-Sektion (Tabelle mit naechster Faelligkeit)
- Foto-Upload-Zone (Drag-and-Drop, ersetzt ehem. Fotoalbum)
- Integrierter DMS-Tree (entity_type='pet')

### Schritt 1.4 — DMS-Ordnerstruktur (PET-007)

Bei Tier-Anlage automatisch `storage_nodes` Ordner erstellen:
- `01_Impfpass`, `02_Tierarzt`, `03_Versicherung`, `04_Fotos`, `05_Sonstiges`

---

## Phase 2: Service-Katalog und Buchungssystem (7 Items)

**Ziel:** Kompletter Buchungsflow von Client zu Provider.

### Schritt 2.1 — Datenbank (PET-010 bis PET-012)

3 neue Tabellen:

| Tabelle | Zweck |
|---------|-------|
| `pet_bookings` | Status-Maschine: requested -> confirmed -> in_progress -> completed/cancelled/no_show. FKs zu pets, pet_services, pet_providers. |
| `pet_provider_availability` | Wochentag-Slots (day_of_week, start_time, end_time, max_bookings) |
| `pet_provider_blocked_dates` | Urlaub/Sperrzeiten (blocked_date, reason) |

### Schritt 2.2 — MOD-22 Leistungen-Tab (PET-013)

`PMLeistungen.tsx`: Provider verwaltet eigene Services (CRUD-Formular mit Titel, Kategorie, Dauer, Preis, erlaubte Tierarten).

### Schritt 2.3 — MOD-22 Kalender-Tab (PET-014)

`PMBuchungen.tsx`: Wochenkalender mit Buchungen, Verfuegbarkeits-Editor, Buchungsanfragen annehmen/ablehnen.

### Schritt 2.4 — MOD-05 Shop-Tab (PET-015)

`PetsShop.tsx`: Services browsen (gefiltert nach Tierart), Tier auswaehlen, Datum/Zeit waehlen, Buchung absenden.

### Schritt 2.5 — MOD-05 Mein Bereich (PET-016)

`PetsMeinBereich.tsx`: Aktive Buchungen, Buchungshistorie mit Status-Badges.

---

## Phase 3: Rechnungs- und Zahlungsflow (4 Items)

**Ziel:** Provider erstellt Rechnung, Kunde sieht und bezahlt.

### Schritt 3.1 — DB-Erweiterung (PET-020)

`pet_invoices` um `tenant_id` (NOT NULL) erweitern + RLS-Policies. FK-Constraints zu `pet_bookings` und `pet_providers` validieren.

### Schritt 3.2 — MOD-22 Finanzen (PET-021, PET-023)

`PMFinanzen.tsx`: Rechnung aus abgeschlossener Buchung generieren, PDF-Export (jsPDF), Rechnungsliste mit Status. Umsatz-Dashboard (Recharts).

### Schritt 3.3 — MOD-05 Mein Bereich erweitern (PET-022)

Rechnungseingang mit PDF-Download und Zahlungsstatus in `PetsMeinBereich.tsx`.

---

## Phase 4: Caring und Pflege-Kalender (4 Items)

**Ziel:** Pflege-Tracking fuer Fuetterung, Medikamente, Tierarzt-Termine.

### Schritt 4.1 — DB (PET-030)

Tabelle `pet_caring_events` (event_type enum, recurring_interval_days, reminder_enabled).

### Schritt 4.2 — MOD-05 Caring-Tab (PET-031)

`PetsCaring.tsx`: Oben 4 CI-Widgets im WidgetGrid:

| Widget | Icon | Beschreibung |
|--------|------|-------------|
| Gassi-Service | Footprints | Dog-Walking buchen |
| Tagesstaette | Sun | Tagesbetreuung buchen |
| Pension | Home | Mehrtaegige Unterbringung buchen |
| Hundefriseur | Scissors | Grooming-Termin buchen |

Klick oeffnet Buchungskalender inline (Datumsauswahl, Tier-Selektor, Zeitslots, `useCreateBooking`). Darunter bestehender Pflege-Kalender mit Events und ueberfaelligen Eintraegen.

### Schritt 4.3 — Tier-Akte Pflege-Sektion (PET-032)

Pflege-Timeline in `PetDetailPage.tsx`. Neue Sektion "Lennox Tracker" (Kartenplatzhalter + Status, falls Tracker zugeordnet).

### Schritt 4.4 — Erinnerungen (PET-033)

Toast-Hinweise bei faelligen Pflege-Events.

---

## Phase 5: Zone 1 Governance und Monitoring (5 Items)

**Ziel:** Admin-Desk mit echten Daten.

### Schritt 5.1 — Dashboard KPIs (PET-040)

`PetmanagerDesk.tsx`: Live-Daten statt hardcoded (Provider-Count, Umsatz, Buchungen).

### Schritt 5.2 — Provider-Verwaltung (PET-041)

`PetmanagerProvider.tsx`: Tabelle mit Verifizierungs-Workflow (pending -> verified).

### Schritt 5.3 — Finanz-Governance (PET-042)

`PetmanagerFinanzen.tsx`: Aggregierte Umsatzzahlen nach Provider.

### Schritt 5.4 — Service-Moderation (PET-043)

`PetmanagerServices.tsx`: Freigabe/Ablehnung neuer Services.

### Schritt 5.5 — Monitor (PET-044)

`PetmanagerMonitor.tsx`: Audit-Trail, Stornoquote, Anomalie-Alerts.

---

## Phase 6: Golden Path, Lennox Tracker und Integration (6 Items)

**Ziel:** Cross-Modul-Verknuepfungen, Lennox White-Label und Dokumentation.

- GP-PETS Prozess in `goldenPathProcesses.ts` vervollstaendigen (PET-050)
- DMS-Integration: Tier-Dokumente im MOD-03 sichtbar (PET-051)
- Versicherungs-Referenz in insurance_contracts (PET-052)
- Lennox Tracker API-Integration: Edge Function fuer Live-GPS-Daten, `lennox_tracker_id` Feld in `pets`-Tabelle (PET-055)
- Specs aktualisieren: mod-05_pets.md und mod-22_petmanager.md (PET-053, PET-054)

---

## UI-Redesign: MOD-05 Widget-Navigation (alle Tabs)

### Tab 1: Meine Tiere

RecordCard-Klick oeffnet Tier-Akte **inline** (openPetId-Toggle) statt Navigation. Akte rendert unterhalb des Grids: Stammdaten, Impfhistorie, Pflege-Timeline, DMS-Tree, Lennox-Tracker-Sektion (Platzhalter).

### Tab 2: Caring — 4 CI-Widgets

| Widget | Icon |
|--------|------|
| Gassi-Service | Footprints |
| Tagesstaette | Sun |
| Pension | Home |
| Hundefriseur | Scissors |

Klick oeffnet Buchungskalender inline. Darunter Pflege-Kalender.

### Tab 3: Shop (vorher "Shop & Services") — 4 CI-Widgets

| Widget | Beschreibung |
|--------|-------------|
| Unser Shop | Eigener Katalog (Zone-1 verwaltete Produkte + Services) |
| Lennox Tracker | Eigenes White-Label GPS-Tracking-Produkt bestellen, Abo verwalten |
| Zooplus | Affiliate-Partner |
| Fressnapf | Affiliate-Partner |

**Hinweis:** Der Shop enthaelt KEINE Service-Buchungen (kein Grooming etc.) — diese werden ausschliesslich ueber den Caring-Tab gebucht. Der Lennox Tracker ist ein reines Produktangebot (Bestellung + Abo). Die Tieranzeige mit Live-GPS-Daten erfolgt in der Tierakte unter "Meine Tiere".

### Tab 4: Mein Bereich — 4 CI-Widgets

| Widget | Inhalt |
|--------|--------|
| Profil und Einstellungen | Kundendaten, Adressen, Shortcut zu "Tiere verwalten" |
| Meine Bestellungen | Shop-Bestellungen (inkl. Lennox Tracker) + Affiliate-Clicks/History |
| Meine Buchungen | Status, Aenderungen, Storno |
| Rechnungen und Zahlungen | Anzahlungen, Belege, Rechnungsuebersicht |

### Gemeinsames Widget-Pattern

Caring, Shop und Mein Bereich nutzen identisches Muster: `WidgetGrid` (variant="widget") mit 4 quadratischen CI-Kacheln (teal-Glow), `activeWidget`-State toggelt Inline-Content darunter.

---

## Zusammenfassung

| Kennzahl | Wert |
|----------|------|
| Gesamt-Items | 28 |
| Neue DB-Tabellen | 8 |
| Bestehende DB-Tabellen | 2 (pet_invoices, pet_invoice_items — werden erweitert) |
| Naechster Schritt | Phase 1 implementieren (nach Freigabe) |

**Empfehlung:** Phase 1 zuerst implementieren — sie legt das gesamte DB-Fundament und liefert die erste sichtbare UI mit den Demo-Tieren Luna und Bello.

