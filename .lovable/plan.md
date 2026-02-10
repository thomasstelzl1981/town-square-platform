
# MOD-20 MIETY — Zuhause-Akte (Dossier) + Sichtbarkeits-Upgrade

## Ueberblick

MIETY wird von 6 leeren "Blueprint"-Kacheln zu einem echten Zuhause-Dossier-System umgebaut. Nach dem Anlegen eines Zuhause-Objekts sieht der Nutzer sofort eine befuellte Akte mit Dokumentenbaum, Sections, Quick Actions und Fortschrittsanzeigen — nie eine leere Seite.

## 1. Datenbank-Migration

### Tabelle: `miety_homes` (Zuhause-Objekte)

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK organizations | Mandant |
| `user_id` | uuid | Ersteller |
| `name` | text | Freitext ("Mein Zuhause") |
| `address` | text | Strasse |
| `address_house_no` | text | Hausnummer |
| `zip` | text | PLZ |
| `city` | text | Stadt |
| `ownership_type` | text | 'eigentum' oder 'miete' |
| `property_type` | text | 'wohnung', 'haus', 'zimmer' |
| `area_sqm` | numeric | Wohnflaeche |
| `rooms_count` | numeric | Zimmeranzahl |
| `move_in_date` | date | Einzugsdatum |
| `notes` | text | Notizen |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### Tabelle: `miety_contracts` (Vertraege am Zuhause)

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `home_id` | uuid FK miety_homes CASCADE | |
| `tenant_id` | uuid FK organizations | |
| `category` | text | 'strom', 'gas', 'wasser', 'internet', 'hausrat', 'haftpflicht', 'miete', 'sonstige' |
| `provider_name` | text | Anbietername |
| `contract_number` | text | Vertragsnummer |
| `monthly_cost` | numeric | Monatliche Kosten |
| `start_date` | date | Vertragsbeginn |
| `end_date` | date | Vertragsende |
| `cancellation_date` | date | Kuendigungsfrist |
| `notes` | text | |
| `created_at` | timestamptz | |

### Tabelle: `miety_meter_readings` (Zaehlerstaende)

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `home_id` | uuid FK miety_homes CASCADE | |
| `tenant_id` | uuid FK organizations | |
| `meter_type` | text | 'strom', 'gas', 'wasser', 'heizung' |
| `reading_value` | numeric | Zaehlerstand |
| `reading_date` | date | Ablesedatum |
| `notes` | text | |
| `created_at` | timestamptz | |

RLS-Policies: Alle 3 Tabellen mit tenant-basiertem Zugriff (SELECT/INSERT/UPDATE/DELETE via `auth.uid()` gegen `user_roles`).

## 2. Manifest-Erweiterung

`routesManifest.ts` — MOD-20 bekommt `dynamic_routes`:

```
dynamic_routes: [
  { path: "zuhause/:homeId", component: "MietyHomeDossier", title: "Zuhause-Akte", dynamic: true },
],
```

## 3. Routing (ManifestRouter.tsx)

- Lazy-Import fuer `MietyHomeDossier`
- Registrierung in `portalDynamicComponentMap`
- Route: `/portal/miety/zuhause/:homeId`

## 4. UebersichtTile → Zuhause-Liste + Create

Die bestehende `UebersichtTile` wird von einer leeren EmptyState-Seite zu einer funktionalen Startseite:

**Wenn keine Homes existieren:**
- Einladender Empty State mit "Zuhause anlegen" CTA
- Inline-Formular (kein Popup): Name, Adresse, Typ (Eigentum/Miete), Wohnflaeche

**Wenn Homes existieren:**
- Card-Grid mit allen angelegten Zuhause-Objekten
- Jede Card zeigt: Adresse, Badges (Eigentum/Miete), Mini-Fortschritt, "Akte oeffnen" Button
- "Weiteres Zuhause anlegen" Button

**Nach Create:** Redirect auf `/portal/miety/zuhause/:homeId` (die Dossier-Ansicht)

## 5. MietyHomeDossier — Die Hauptansicht (KERN)

### Layout: 2-Spalten Desktop

```text
+----------------------------+--------------------------------------+
| DOKUMENTENBAUM (links)     | AKTE-INHALT (rechts)                 |
|                            |                                      |
| MOD_20/                    | [Header: Adresse + Badges + CTAs]    |
|   01_Vertraege/            |                                      |
|   02_Zaehler/              | [Accordion Sections]                 |
|   03_Versicherungen/       |   A) Ueberblick (Next Steps)         |
|   04_Versorgung/           |   B) Vertraege                       |
|   05_Kommunikation/        |   C) Zaehler & Staende               |
|   06_Sonstiges/            |   D) Versicherungen                  |
|                            |   E) Versorger                       |
| [Upload in Ordner]         |   F) Kommunikation (Platzhalter)     |
|                            |   G) Services (Platzhalter)          |
+----------------------------+--------------------------------------+
```

### 5.1 Header

- Titel: "Zuhause-Akte" + Kurzadresse (Strasse Hausnr, PLZ Stadt)
- Badges: Eigentum/Miete, Wohnflaeche
- 3 Quick Action Buttons (oeffnen jeweils einen **DetailDrawer** rechts, kein Popup):
  - "Dokument hochladen"
  - "Vertrag anlegen"
  - "Zaehlerstand eintragen"

### 5.2 Linke Spalte: Dokumentenbaum

Nutzt das bestehende `storage_nodes`-System. Beim Erstellen eines Homes werden automatisch die Ordner unter `MOD_20/{homeId}/` angelegt:
- 01_Vertraege
- 02_Zaehler
- 03_Versicherungen
- 04_Versorgung
- 05_Kommunikation
- 06_Sonstiges

Darstellung als einfacher Tree (Expand/Collapse), analog zur DMS StorageTab-Logik. Klick auf Ordner zeigt Dokumente rechts.

### 5.3 Rechte Spalte: Accordion-Sections

Jede Section als Accordion-Item (`@radix-ui/react-accordion`):

**A) Ueberblick**
- Next-Steps Checkliste (6 Items): Vertrag hinterlegen, Zaehlerstand erfassen, Versicherung pruefen, Versorger eintragen, Dokument hochladen, Profil vervollstaendigen
- Fortschrittsbalken ("2/6 erledigt")
- Letzte 3 Dokumente (oder Platzhalter)

**B) Vertraege**
- Karten-Grid der `miety_contracts` (gefiltert nach home_id)
- Empty State: 3 Platzhalter-Karten (Stromvertrag, Hausrat, Internet) mit "+ Anlegen" CTA
- CTA: "Vertrag anlegen" → oeffnet DetailDrawer

**C) Zaehler & Staende**
- Kacheln pro meter_type mit letztem Stand + Datum
- Empty State: 4 Platzhalter (Strom, Gas, Wasser, Heizung) mit "Erfassen" CTA
- CTA: "Zaehlerstand eintragen" → oeffnet DetailDrawer

**D) Versicherungen**
- Gefiltert aus `miety_contracts` wo category IN ('hausrat', 'haftpflicht')
- Karten mit Status-Badge (aktiv/ablaufend)

**E) Versorger**
- Gefiltert aus `miety_contracts` wo category IN ('strom', 'gas', 'wasser', 'internet')
- Karten mit Anbieter + Kosten

**F) Kommunikation** — Platzhalter-Section ("Kommt bald")

**G) Services** — Platzhalter-Section mit Teaser-Kacheln (Strom vergleichen, etc.)

### 5.4 Quick Action Drawers

Alle 3 Quick Actions nutzen den bestehenden `DetailDrawer` (Sheet-basiert, rechts einfahrend):

- **Dokument hochladen:** Ordner-Auswahl + Drag&Drop Upload
- **Vertrag anlegen:** Formular (Kategorie, Anbieter, Kosten, Laufzeit) → INSERT in `miety_contracts`
- **Zaehlerstand erfassen:** Formular (Typ, Wert, Datum) → INSERT in `miety_meter_readings`

## 6. Weitere Tiles anpassen

Die 5 restlichen Tiles (Dokumente, Kommunikation, Zaehlerstaende, Versorgung, Versicherungen) werden von leeren Blueprint-Kacheln zu sinnvollen Weiterleitungen:

- Jede Tile zeigt eine Zusammenfassung der entsprechenden Section ueber ALLE Homes hinweg
- Primaeraktion: "Zur Akte" → navigiert zum jeweiligen Home-Dossier

## 7. Dateien-Uebersicht

| Datei | Aenderung |
|---|---|
| SQL Migration | 3 neue Tabellen + RLS |
| `src/manifests/routesManifest.ts` | `dynamic_routes` fuer MOD-20 |
| `src/router/ManifestRouter.tsx` | Lazy-Import + Map-Eintrag fuer MietyHomeDossier |
| `src/pages/portal/MietyPortalPage.tsx` | UebersichtTile komplett neu (Home-Liste + Create) |
| `src/pages/portal/miety/MietyHomeDossier.tsx` | **NEU** — 2-Spalten Dossier mit Tree + Accordion |
| `src/pages/portal/miety/components/MietyDossierHeader.tsx` | **NEU** — Header mit Badges + Quick Actions |
| `src/pages/portal/miety/components/MietyDocTree.tsx` | **NEU** — Dokumentenbaum (storage_nodes) |
| `src/pages/portal/miety/components/MietyOverviewSection.tsx` | **NEU** — Next Steps + Progress |
| `src/pages/portal/miety/components/MietyContractsSection.tsx` | **NEU** — Vertraege CRUD |
| `src/pages/portal/miety/components/MietyMeterSection.tsx` | **NEU** — Zaehlerstaende CRUD |
| `src/pages/portal/miety/components/MietyCreateHomeForm.tsx` | **NEU** — Inline-Formular |
| `src/pages/portal/miety/components/ContractDrawer.tsx` | **NEU** — Vertrag-anlegen Drawer |
| `src/pages/portal/miety/components/MeterReadingDrawer.tsx` | **NEU** — Zaehlerstand Drawer |
| `src/pages/portal/miety/components/UploadDrawer.tsx` | **NEU** — Upload Drawer |

## 8. Wiederverwendete Komponenten

- `DetailDrawer` (shared) — fuer alle Quick-Action Panels
- `storage_nodes` Query-Pattern (aus StorageTab) — fuer den Dokumentenbaum
- `DossierHeader`-Konzept (aus Immobilienakte) — adaptiert fuer Zuhause
- `Accordion` (Radix) — fuer Sections
- `EmptyState`, `LoadingState` (shared) — fuer Empty/Loading States
- `glass-card` Pattern — fuer Kacheln
- `useAuth()` + `activeTenantId` — fuer alle DB-Queries
