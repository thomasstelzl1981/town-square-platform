

# E-Mail-Inbound-Flow + Zone 1 Acquiary Restructuring + Objekt-Datenbank

## Ueberblick

Drei zusammenhaengende Arbeitsbereiche:

1. **E-Mail-Inbound-Flow komplettieren** (acq_inbound_messages → acq_offers Konvertierung)
2. **Zone 1 Acquiary Submenue umstrukturieren** (Dashboard, Kontakte, Datenbank, Routing)
3. **Zentrale Objekt-Datenbank** mit intelligenter Suche (Zone 1 + Zone 2 MOD-12)

---

## 1. E-Mail-Inbound-Flow komplettieren

### Ist-Zustand

Die Backend-Function `sot-acq-inbound-webhook` existiert und funktioniert:
- Empfaengt Resend-Webhooks
- Routet per Token/E-Mail-Match/Thread-Match
- Speichert in `acq_inbound_messages` mit `needs_routing` Flag
- Speichert Attachments im Storage (`acq-documents/inbound/...`)

**Was fehlt:** Die Konvertierung von `acq_inbound_messages` → `acq_offers`. Eingehende E-Mails landen zwar in der Datenbank, erzeugen aber keine Offer-Eintraege.

### Aenderungen

**Backend-Function erweitern** (`sot-acq-inbound-webhook/index.ts`):
- Nach erfolgreichem Routing (mandateId vorhanden + needsRouting = false): Automatisch einen `acq_offers`-Eintrag mit `source_type: 'inbound_email'` und `source_inbound_id` erstellen
- Betreff und Body als Basis fuer Titel/Beschreibung
- Attachments (PDFs) als `acq_offer_documents` verlinken
- Optional: KI-Extraktion (`sot-acq-offer-extract`) anstoßen wenn PDF-Attachment vorhanden

**NeedsRouting-UI komplettieren** (`AcquiaryNeedsRouting.tsx`):
- Die bestehende Zuordnungs-Mutation (aktuell STUB) wird implementiert
- Nach Zuordnung: ebenfalls automatisch `acq_offers`-Eintrag erstellen
- `routed_at` Timestamp und `needs_routing = false` setzen

## 2. Zone 1 Acquiary Submenue umstrukturieren

### Ist-Zustand (7 Tabs)

```text
Inbox | Zuweisung | Mandate | Objekteingang | Audit | Routing | Monitor
```

### Neue Struktur (6 Tabs)

```text
Dashboard | Kontakte | Datenbank | Mandate | Routing | Monitor
```

| Neuer Tab | Beschreibung | Basis |
|-----------|-------------|-------|
| **Dashboard** | Uebersicht mit KPIs, Inbox-Zaehler, neue Mandate | Zusammenfuehrung aus aktuellem "Inbox" + "Monitoring" |
| **Kontakte** | Alle Kontakte aus `contact_staging` + `contacts` ueber alle Mandate aggregiert | Neue Seite |
| **Datenbank** | Alle Objekte (`acq_offers`) aller Mandate mit intelligenter Suche | Erweiterung von "Objekteingang" |
| **Mandate** | Mandatsueberischt (bleibt) | Unveraendert |
| **Routing** | Ungeroutete E-Mails (bleibt, Mutation wird implementiert) | Kleine Erweiterung |
| **Monitor** | Audit + KPIs (zusammengefuehrt) | Zusammenfuehrung Audit + Monitoring |

### Technische Umsetzung

**Datei `src/pages/admin/Acquiary.tsx`:**
- Tabs von 7 auf 6 reduzieren
- Neue Lazy-Imports fuer `AcquiaryKontakte` und `AcquiaryDatenbank`
- "Inbox" und "Monitoring" werden in "Dashboard" zusammengefuehrt
- "Audit" wird unter "Monitor" mit integriert
- "Objekteingang" wird zu "Datenbank" umbenannt und erweitert

**Neue Datei `src/pages/admin/acquiary/AcquiaryKontakte.tsx`:**
- Aggregierte Kontakt-Tabelle ueber alle Mandate
- Quellen: `contact_staging` (alle Mandate) + `contacts` (globales Kontaktbuch)
- Filter: Nach Mandat, Status (pending/approved/rejected), Quelle (Apollo/Import/manuell)
- CI-konforme Tabelle mit `TABLE.*` Klassen

**Neue Datei `src/pages/admin/acquiary/AcquiaryDatenbank.tsx`:**
- Ersetzt und erweitert `AcquiaryObjekteingang.tsx`
- Alle `acq_offers` ueber alle Mandate und alle Akquise-Manager
- Intelligente Suche (siehe Abschnitt 3)
- KPI-Karten: Gesamt, Neu, In Analyse, Analysiert

**Datei `src/pages/admin/acquiary/AcquiaryDashboard.tsx`** (neu):
- Zusammenfuehrung aus Inbox (neue Mandate) + Monitoring (KPIs)
- Widget-Karten: Neue Mandate, Offene Zuweisungen, Routing-Queue, Pipeline-Volumen
- Quick-Actions: "Mandat zuweisen", "Routing bearbeiten"

## 3. Zentrale Objekt-Datenbank mit intelligenter Suche

### Anforderung

Bei 200+ Angeboten pro Tag braucht der Akquise-Manager eine leistungsfaehige Suche, um passende Objekte fuer seine Kunden zu finden.

### Suchkriterien

Die Suche nutzt die bereits vorhandenen Felder in `acq_offers`:
- **Freitext**: Titel, Adresse, Stadt, Beschreibung
- **Preisspanne**: `price_asking` (von/bis Filter)
- **Region/Stadt**: `city`, `postal_code`, `federal_state`
- **Asset-Typ**: `asset_type` (MFH, ETW, Gewerbe etc.)
- **Flaeche**: `living_area_sqm` (von/bis)
- **Einheiten**: `units_count` (von/bis)
- **Rendite**: `yield_indicated` (Mindestrendite)
- **Status**: `status` (new, analyzed, presented etc.)
- **Quelle**: `source_type` (E-Mail, Upload, manuell)
- **Mandat**: `mandate_id` (Zuordnung)
- **Zeitraum**: `created_at` (Eingangsdatum)

### UI-Komponente: `ObjectSearchPanel`

Eine wiederverwendbare Such-Komponente mit:
- Suchfeld oben (Freitext-Vollsuche)
- Aufklappbare Filter-Sektion (Preis, Region, Typ, Flaeche, Rendite)
- Ergebnis-Zaehler
- Sortierung (Datum, Preis, Rendite, Stadt)

### Einsatz in Zone 1 und Zone 2

**Zone 1** (`AcquiaryDatenbank.tsx`):
- Zeigt ALLE Objekte aller Mandate aller Manager
- Admin-Sicht mit zusaetzlichem Filter "Manager" und "Mandant"

**Zone 2 / MOD-12** (neuer Menuepunkt "Datenbank"):
- Zeigt nur Objekte des eigenen Tenants (RLS-gefiltert)
- Akquise-Manager kann hier nach passenden Objekten fuer seine Kunden suchen
- Neuer Tile in `routesManifest.ts`: `{ path: "datenbank", component: "AkquiseDatenbank", title: "Datenbank" }`

### Technische Umsetzung

**Neue Datei `src/components/akquise/ObjectSearchPanel.tsx`:**
- Wiederverwendbare Such/Filter-Komponente
- Props: `onFilterChange`, `showManagerFilter` (nur Zone 1), `defaultFilters`
- Nutzt lokalen State fuer Filter, gibt structured Query-Object zurueck

**Neue Datei `src/pages/portal/akquise-manager/AkquiseDatenbank.tsx`:**
- Zone 2 Ansicht der Datenbank
- Importiert `ObjectSearchPanel`
- Query auf `acq_offers` mit dynamischen Filtern (RLS sorgt fuer Tenant-Isolation)

**Datei `src/manifests/routesManifest.ts`:**
- MOD-12 Tiles um `{ path: "datenbank", component: "AkquiseDatenbank", title: "Datenbank" }` erweitern

**Datei `src/pages/portal/AkquiseManagerPage.tsx`:**
- Neue Route `datenbank` mit Lazy-Import

---

## Zusammenfassung der Dateien

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/sot-acq-inbound-webhook/index.ts` | Automatische acq_offers-Erstellung bei geroutetem Inbound |
| `src/pages/admin/Acquiary.tsx` | Tab-Struktur von 7 auf 6, neue Imports |
| `src/pages/admin/acquiary/AcquiaryDashboard.tsx` | Neu: Zusammenfuehrung Inbox + Monitoring |
| `src/pages/admin/acquiary/AcquiaryKontakte.tsx` | Neu: Aggregierte Kontakt-Tabelle |
| `src/pages/admin/acquiary/AcquiaryDatenbank.tsx` | Neu: Erweiterte Objekt-Datenbank Zone 1 |
| `src/pages/admin/acquiary/AcquiaryNeedsRouting.tsx` | Routing-Mutation implementieren (STUB entfernen) |
| `src/components/akquise/ObjectSearchPanel.tsx` | Neu: Wiederverwendbare Such-Komponente |
| `src/pages/portal/akquise-manager/AkquiseDatenbank.tsx` | Neu: Zone 2 Datenbank-Ansicht |
| `src/pages/portal/AkquiseManagerPage.tsx` | Neue Route "datenbank" |
| `src/manifests/routesManifest.ts` | MOD-12 um "Datenbank" Tile erweitern |

