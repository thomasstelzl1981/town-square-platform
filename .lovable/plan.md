

# MOD-10 Lead Manager: Inline-Umbau + Projekt-Kampagnen fuer MOD-13

## Ueberblick

Der Lead Manager (MOD-10) wird von 6 separaten Seiten zu **einer einzigen Inline-Seite** zusammengefuehrt. Zusaetzlich erhaelt MOD-13 (Projektmanager) einen eigenen "Lead Manager"-Tile, ueber den der Projektmanager Kampagnen **fuer seine angelegten Projekte** starten kann.

## Kernlogik: Projekt-Kampagnen

Der Projektmanager hat Projekte in `dev_projects` angelegt. Wenn er eine Lead-Kampagne startet, waehlt er nicht eine feste Firmen-Brand (Kaufy, FutureRoom etc.), sondern **eines seiner eigenen Projekte** als Kampagnenkontext. Die Projektdaten (Name, Ort, Preisrange, Einheitentypen) fliessen automatisch in die Personalisierung und Template-Texte ein.

## Inline-Flow Skizze (eine Seite, von oben nach unten)

```text
/portal/lead-manager  (oder /portal/projekte/lead-manager fuer MOD-13)
+====================================================================+
|  ModulePageHeader: LEAD MANAGER                                    |
|  "Kampagnen planen, Leads verwalten"                               |
+====================================================================+

+--------------------------------------------------------------------+
| KACHEL 1: UEBERSICHT (KPIs)                                       |
|                                                                    |
|  +------------+ +----------------+ +--------+ +-----------------+  |
|  | Ausgaben   | | Leads generiert| | CPL    | | Aktive Kampagnen|  |
|  | 12.500 EUR | | 47             | | 266 EUR| | 3               |  |
|  +------------+ +----------------+ +--------+ +-----------------+  |
|                                                                    |
|  Filter: [Alle] [Kaufy] [FutureRoom] [Acquiary] [Projekte]        |
+--------------------------------------------------------------------+

+--------------------------------------------------------------------+
| KACHEL 2: MEINE KAMPAGNEN (Liste)                                  |
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | [Kaufy] Kampagne #1         Budget: 2.500 EUR     [Live]     |  |
|  | 01.03 - 31.03.2026  |  Muenchen, Berlin                     |  |
|  +--------------------------------------------------------------+  |
|  | [Projekt: Residenz am Park] Kampagne #2  5.000 EUR [Eingereicht]|
|  | 15.03 - 15.04.2026  |  Muenchen                              |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  Klick -> Inline-Detail klappt auf (Status, Creatives, Leads)      |
|  Wenn leer: EmptyState "Noch keine Kampagnen"                      |
+--------------------------------------------------------------------+

+--------------------------------------------------------------------+
| KACHEL 3: NEUE KAMPAGNE PLANEN (Step-by-Step, immer sichtbar)      |
|                                                                    |
|  SCHRITT 3a: Kontext waehlen                                       |
|  +--------------------------------------------------------------+  |
|  | Was moechten Sie bewerben?                                    |  |
|  |                                                               |  |
|  | [Kaufy] [FutureRoom] [Acquiary] [Lennox & Friends]            |  |
|  |                                                               |  |
|  | --- oder ---                                                  |  |
|  |                                                               |  |
|  | [v Mein Projekt waehlen]                                      |  |
|  |   > Residenz am Park (Muenchen, 24 Einheiten)                 |  |
|  |   > Sonnenhof Bogenhausen (Muenchen, 12 Einheiten)            |  |
|  |   > Parkvillen Gruenwald (Gruenwald, 6 Einheiten)             |  |
|  |                                                               |  |
|  | Gewaehlt: [Residenz am Park - Muenchen]                       |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  SCHRITT 3b: Kampagnen-Parameter                                   |
|  +--------------------------------------------------------------+  |
|  | Ziel: Lead-Generierung     | Plattform: Facebook + Instagram |  |
|  | Laufzeit: [01.03] - [31.03]| Budget: [5.000] EUR             |  |
|  | Regionen: [Muenchen] (vorbefuellt aus Projekt)                |  |
|  | Zielgruppe: [Kapitalanlage] [Eigennutz] [Vermietung]          |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  SCHRITT 3c: Template-Slots (5 CI Templates)                       |
|  +--------------------------------------------------------------+  |
|  | Bei Brand: Standard-Templates (Rendite, Portrait, etc.)       |  |
|  | Bei Projekt: Projekt-spezifische Templates:                   |  |
|  |                                                               |  |
|  | [T1: Projekt-Showcase]    Projektname + Ort + Visualisierung  |  |
|  | [T2: Berater-Portrait]    Ihr Name + Region + Erfahrung       |  |
|  | [T3: Preis-Highlight]     Preisrange + Einheitentypen         |  |
|  | [T4: Standort-Highlight]  Lage + Infrastruktur + Karte        |  |
|  | [T5: Verfuegbarkeit]      X von Y Einheiten verfuegbar        |  |
|  |                                                               |  |
|  | Gewaehlt: 3/5 Slots                                           |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  SCHRITT 3d: Personalisierung                                      |
|  +--------------------------------------------------------------+  |
|  | Beraterportrait: [Upload]   | Name: [Max Mustermann]         |  |
|  | Region: [Muenchen] (auto)   | Claim: [Ihr Projektexperte]    |  |
|  |                                                               |  |
|  | Bei Projekt automatisch vorbefuellt:                           |  |
|  | Projektname: Residenz am Park                                 |  |
|  | Standort: Muenchen                                            |  |
|  | Preisrange: ab 289.000 EUR                                    |  |
|  | Einheiten: 24 (18 frei, 4 reserviert, 2 verkauft)             |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  SCHRITT 3e: Creatives generieren                                  |
|  +--------------------------------------------------------------+  |
|  | [Button: Generieren (3 Slots)]                                |  |
|  |                                                               |  |
|  | T1: Projekt-Showcase  [Slide 1][Slide 2][Slide 3][Slide 4]    |  |
|  |     Caption: "Residenz am Park — ab 289.000 EUR"              |  |
|  |     CTA: "Jetzt Exposé anfordern"                             |  |
|  | T3: Preis-Highlight   [Slide 1][Slide 2][Slide 3][Slide 4]    |  |
|  |     Caption: "24 Wohneinheiten — 18 noch verfuegbar"          |  |
|  |     CTA: "Einheiten entdecken"                                |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  SCHRITT 3f: Zusammenfassung + Beauftragen                         |
|  +--------------------------------------------------------------+  |
|  | Kontext: Residenz am Park  | Budget: 5.000 EUR               |  |
|  | Laufzeit: 01.03-31.03      | Templates: 3 Slots              |  |
|  | Leistungsumfang:                                              |  |
|  |   - 3 Slideshow-Anzeigen                                     |  |
|  |   - Veroeffentlichung ueber zentralen Meta-Account            |  |
|  |   - Lead-Erfassung + automatische Zuordnung                   |  |
|  |   - Performance-Dashboard                                     |  |
|  |                                                               |  |
|  | [======= Beauftragen - 5.000 EUR =======]                     |  |
|  +--------------------------------------------------------------+  |
+--------------------------------------------------------------------+

+--------------------------------------------------------------------+
| KACHEL 4: MEINE LEADS (Liste mit Inline-Detail)                    |
|                                                                    |
|  Filter: [Status v] [Brand/Projekt v]                              |
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | [o] Max Mueller  |  12.03.2026  |  Kaufy      |  [Neu]       |  |
|  +--------------------------------------------------------------+  |
|  | [o] Anna Schmidt |  14.03.2026  |  Residenz.. |  [Kontaktiert]|  |
|  +--------------------------------------------------------------+  |
|     v Inline-Detail (aufgeklappt):                                  |
|     +----------------------------------------------------------+   |
|     | Name: Anna Schmidt    | E-Mail: anna@example.de          |   |
|     | Telefon: 0171-...     | Projekt: Residenz am Park         |   |
|     | Status: [v Kontaktiert]                                   |   |
|     | Notizen: [___________________________]                    |   |
|     +----------------------------------------------------------+   |
|                                                                    |
|  Wenn leer: EmptyState "Noch keine Leads"                          |
+--------------------------------------------------------------------+
```

## Technische Umsetzung

### 1. DB-Migration: `project_id` auf `social_mandates`

```sql
ALTER TABLE public.social_mandates
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.dev_projects(id);
CREATE INDEX idx_social_mandates_project ON public.social_mandates(project_id);
```

- `project_id` ist NULL bei Brand-Kampagnen (Kaufy, FutureRoom etc.)
- `project_id` ist gefuellt bei Projekt-Kampagnen aus MOD-13
- Wenn `project_id` gesetzt, wird `brand_context` auf `'project'` gesetzt

### 2. Neue Datei: `LeadManagerInline.tsx`

Ersetzt die bisherigen 6 Einzelseiten durch eine einzige Inline-Seite mit 4 Kacheln (Cards). Akzeptiert optionale Props:

```text
Props:
  projectFilter?: string   — Wenn gesetzt, zeigt nur Kampagnen/Leads dieses Projekts
  contextMode?: 'brand' | 'project' | 'all'  — Steuert Kontext-Auswahl in Kachel 3
```

Kachel 1 = KPI-Logik aus `LeadManagerUebersicht.tsx`
Kachel 2 = Kampagnenliste aus `LeadManagerKampagnen.tsx` (mit Inline-Detail statt Navigation)
Kachel 3 = Kampagnen-Planung aus `LeadManagerStudioPlanen.tsx` + Summary aus `LeadManagerStudioSummary.tsx` (zusammengefuehrt, kein Seitenwechsel)
Kachel 4 = Lead-Liste aus `LeadManagerLeads.tsx` (bereits Inline-Detail)

### 3. Projekt-Kontext in Kachel 3

Wenn `contextMode` `'project'` oder `'all'` ist:
- Neben den 4 Brand-Badges erscheint ein Separator und ein Select-Dropdown "Mein Projekt waehlen"
- Das Dropdown laedt `dev_projects` des Users via `useDevProjects()` Hook (existiert bereits)
- Bei Projektwahl werden automatisch vorbefuellt:
  - Region aus `dev_projects.city`
  - Personalisierung: Projektname, Ort, Preisrange (aus `dev_project_units` MIN/MAX Preis)
  - Template-Texte passen sich an (projekt-spezifische Captions/CTAs)

### 4. Projekt-spezifische Templates

Bei `brand_context === 'project'` werden statt der Standard-Templates projektspezifische angeboten:

| Slot | Template | Beschreibung |
|------|----------|-------------|
| T1 | Projekt-Showcase | Projektname + Ort + Visualisierung |
| T2 | Berater-Portrait | Persoenliche Vorstellung (wie Standard) |
| T3 | Preis-Highlight | Preisrange + Einheitentypen aus Projektdaten |
| T4 | Standort-Highlight | Lage + Infrastruktur |
| T5 | Verfuegbarkeit | X von Y frei, erzeugt Dringlichkeit |

### 5. LeadManagerPage.tsx vereinfachen

Statt 6 Sub-Routes nur noch:

```text
<Routes>
  <Route index element={<LeadManagerInline />} />
  {/* Legacy-Redirects fuer Bookmarks */}
  <Route path="uebersicht" element={<Navigate to="/portal/lead-manager" replace />} />
  <Route path="kampagnen" element={<Navigate to="/portal/lead-manager" replace />} />
  <Route path="studio/*" element={<Navigate to="/portal/lead-manager" replace />} />
  <Route path="leads" element={<Navigate to="/portal/lead-manager" replace />} />
  <Route path="*" element={<Navigate to="/portal/lead-manager" replace />} />
</Routes>
```

### 6. MOD-13 Integration: Neuer Tile "Lead Manager"

In `routesManifest.ts` unter MOD-13 einen neuen Tile hinzufuegen:

```text
{ path: "lead-manager", component: "ProjekteLeadManager", title: "Lead Manager" }
```

Neue Datei `src/pages/portal/projekte/ProjekteLeadManager.tsx`:
- Rendert `<LeadManagerInline contextMode="project" />`
- Der Projektmanager sieht hier nur Kampagnen/Leads, die mit seinen Projekten verknuepft sind
- Im Kontext-Schritt (3a) werden nur seine eigenen Projekte aus `dev_projects` angezeigt (keine Brand-Auswahl)

### 7. Edge Function Update: `sot-social-mandate-submit`

Erweitern um optionalen `project_id` Parameter:
- Wird in `social_mandates.project_id` gespeichert
- `brand_context` wird auf `'project'` gesetzt wenn `project_id` vorhanden

### 8. Routing + Manifest Updates

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/lead-manager/LeadManagerInline.tsx` | Neu: Einzel-Inline-Seite mit 4 Kacheln |
| `src/pages/portal/LeadManagerPage.tsx` | Vereinfachen auf eine Route + Legacy-Redirects |
| `src/pages/portal/projekte/ProjekteLeadManager.tsx` | Neu: Wrapper fuer MOD-13 |
| `src/manifests/routesManifest.ts` | MOD-13 Tile "Lead Manager" + MOD-10 Tiles bereinigen |
| `src/router/ManifestRouter.tsx` | componentMap: ProjekteLeadManager hinzufuegen |
| `src/pages/portal/ProjektePage.tsx` | Route "lead-manager" hinzufuegen |
| `supabase/functions/sot-social-mandate-submit/index.ts` | `project_id` Parameter |
| Migration SQL | `social_mandates.project_id` Spalte |

Die bisherigen Einzelseiten (`LeadManagerUebersicht`, `LeadManagerKampagnen`, `LeadManagerStudio`, `LeadManagerStudioPlanen`, `LeadManagerStudioSummary`, `LeadManagerLeads`) bleiben als Legacy-Dateien bestehen, werden aber nicht mehr geroutet.

## Umsetzungsreihenfolge

1. DB-Migration: `project_id` Spalte auf `social_mandates`
2. `LeadManagerInline.tsx` bauen (4 Kacheln, alles inline, Step-by-Step)
3. Projekt-Kontext integrieren (dev_projects laden, Templates anpassen)
4. `LeadManagerPage.tsx` vereinfachen
5. `ProjekteLeadManager.tsx` + MOD-13 Routing
6. Edge Function `sot-social-mandate-submit` erweitern
7. ManifestRouter componentMap aktualisieren

