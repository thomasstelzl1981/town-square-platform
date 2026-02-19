

# Lead Manager (MOD-10) — Saubere Architektur mit Brand-Untermenuepunkten

## Neue Struktur

Statt alles in eine einzige Inline-Seite zu quetschen, bekommt MOD-10 **5 Tiles** als Untermenuepunkte:

```text
Lead Manager
  ├── Kampagnen      ← Kampagnen erstellen, buchen, veroeffentlichen, Leads sehen
  ├── Kaufy          ← Content-Werkstatt: 4 Vorlagen fuer Kaufy
  ├── FutureRoom     ← Content-Werkstatt: 4 Vorlagen fuer FutureRoom
  ├── Acquiary       ← Content-Werkstatt: 4 Vorlagen fuer Acquiary
  └── Projekte       ← Content-Werkstatt: Vorlagen fuer eigene Projekte
```

### Trennung der Verantwortlichkeiten

**Brand-Seiten (Kaufy, FutureRoom, Acquiary, Projekte):**
- Hier wird der Content vorbereitet: Texte, Bilder, Captions, CTAs
- Templates werden in `social_templates` gespeichert (DB-gestuetzt)
- Jede Seite zeigt die 4 Templates der jeweiligen Brand als grosse, editierbare Karten
- Man kann eigene Bilder hochladen, Texte anpassen, Templates aktivieren/deaktivieren
- Alles wird persistent in der DB gespeichert

**Kampagnen-Seite:**
- KPI-Uebersicht (echte Daten aus `social_mandates` / `social_leads`)
- Liste bestehender Kampagnen
- Neue Kampagne erstellen: Brand waehlen → fertige Templates aus DB laden → Budget/Laufzeit festlegen → Beauftragen
- Lead-Inbox mit Status-Tracking

## Detaillierte UI je Seite

### Kampagnen-Seite (`/portal/lead-manager/kampagnen`)

```text
+====================================================================+
| KPIs: Ausgaben | Leads | CPL | Aktive Kampagnen                   |
+====================================================================+

+-- Meine Kampagnen (aus social_mandates) --+
| Wenn leer: "Erstellen Sie Ihre erste Kampagne."                    |
| Wenn gefuellt: Kampagnen-Liste mit Status, Budget, Inline-Detail   |
+--------------------------------------------------------------------+

+-- Neue Kampagne --+
| Schritt 1: Brand waehlen (grosse Karten: Kaufy / FR / Acquiary)   |
|            + "Mein Projekt" + "Eigene Kampagne"                    |
| Schritt 2: Template-Vorlagen auswaehlen                            |
|            (aus social_templates geladen — was auf der Brand-Seite  |
|             vorbereitet wurde, erscheint hier als Auswahl-Karte)   |
| Schritt 3: Kampagnen-Details (Name, Budget, Laufzeit, Regionen)   |
| Schritt 4: Personalisierung (Portrait, Name, Claim)               |
| Schritt 5: Zusammenfassung + Beauftragen                          |
+--------------------------------------------------------------------+

+-- Meine Leads (aus social_leads) --+
| Filter nach Status | Inline-Detail bei Klick                      |
+--------------------------------------------------------------------+
```

### Brand-Seite (z.B. `/portal/lead-manager/kaufy`)

```text
+====================================================================+
| Kaufy — Anzeigenvorlagen                                           |
| "Bereiten Sie hier Ihre Werbeinhalte fuer Kaufy vor.               |
|  Diese Vorlagen stehen Ihnen bei der Kampagnenerstellung            |
|  zur Verfuegung."                                                   |
+====================================================================+

+---------------------------+ +---------------------------+
| [Kaufy-Gradient 250px]   | | [Kaufy-Gradient 250px]    |
| Bild-Upload-Bereich      | | Bild-Upload-Bereich       |
| [Bild hochladen]         | | [Bild hochladen]          |
|                           | |                           |
| Rendite-Highlight         | | Objekt-Showcase           |
| "Renditezahlen und Fakten | | "Immobilien praesentieren  |
|  im Fokus."               | |  mit Standortvorteilen."  |
|                           | |                           |
| Anzeigentext:             | | Anzeigentext:              |
| [Bis zu 5,2% Mietrendite | | [Neubauwohnungen ab       |
|  — Kapitalanlagen in      | |  289.000 EUR — bezugs-    |
|  Toplagen_______________] | |  fertig 2026____________] |
|                           | |                           |
| Call-to-Action:           | | Call-to-Action:            |
| [Jetzt Objekte entdecken] | | [Expose anfordern________]|
|                           | |                           |
| [Speichern]    [Aktiv: ✓] | | [Speichern]    [Aktiv: ✓] |
+---------------------------+ +---------------------------+

+---------------------------+ +---------------------------+
| Berater-Portrait          | | Testimonial               |
| (gleiche Struktur)        | | (gleiche Struktur)        |
+---------------------------+ +---------------------------+
```

Jede Brand-Seite hat also 4 grosse Template-Karten im 2-Spalten-Grid. Jede Karte:
- 250px Gradient-Header mit Bild-Upload (Dropzone)
- Template-Name und Beschreibung
- Editierbare Felder: Anzeigentext (Textarea) und CTA (Input)
- Speichern-Button (schreibt in `social_templates`)
- Aktiv-Toggle (nur aktive Templates erscheinen in der Kampagnen-Auswahl)

### Projekte-Seite (`/portal/lead-manager/projekte`)

Zeigt die eigenen Projekte aus `dev_projects`. Bei Klick auf ein Projekt werden projekt-spezifische Templates angezeigt (Projekt-Showcase, Preis-Highlight, Standort, Verfuegbarkeit), die automatisch mit Projektdaten vorbefuellt sind.

## Technische Umsetzung

### 1. DB-Migration: 12 Templates seeden

12 Datensaetze in `social_templates` (je 4 pro Brand), mit `editable_fields_schema` das Default-Texte enthaelt. Die Templates gehoeren einem System-Tenant oder werden beim ersten Zugriff pro Tenant kopiert.

Da `social_templates` ein `tenant_id` hat (NOT NULL), werden die Templates **pro Tenant beim ersten Zugriff** automatisch erstellt (Lazy Seeding via Edge Function oder Client-Logik).

### 2. Manifest: MOD-10 auf 5 Tiles erweitern

```text
"MOD-10": {
  name: "Lead Manager",
  base: "lead-manager",
  icon: "Megaphone",
  tiles: [
    { path: "kampagnen", component: "LeadManagerKampagnen", title: "Kampagnen", default: true },
    { path: "kaufy", component: "LeadManagerBrand", title: "Kaufy" },
    { path: "futureroom", component: "LeadManagerBrand", title: "FutureRoom" },
    { path: "acquiary", component: "LeadManagerBrand", title: "Acquiary" },
    { path: "projekte", component: "LeadManagerProjekte", title: "Projekte" },
  ],
}
```

### 3. Neue Dateien

| Datei | Beschreibung |
|-------|-------------|
| `src/pages/portal/lead-manager/LeadManagerKampagnen.tsx` | Hauptseite: KPIs, Kampagnenliste, Kampagne erstellen (Templates aus DB laden), Lead-Inbox |
| `src/pages/portal/lead-manager/LeadManagerBrand.tsx` | Wiederverwendbare Brand-Content-Seite. Erkennt anhand der Route (kaufy/futureroom/acquiary), welche Templates geladen werden. 4 grosse editierbare Template-Karten |
| `src/pages/portal/lead-manager/LeadManagerProjekte.tsx` | Projekt-Auswahl + projekt-spezifische Templates |
| `src/pages/portal/lead-manager/TemplateCard.tsx` | Wiederverwendbare Template-Karte (250px Gradient, Upload, editierbare Felder, Speichern) |

### 4. Bestehende Datei loeschen/ersetzen

`LeadManagerInline.tsx` wird durch `LeadManagerKampagnen.tsx` ersetzt. Alle hardcoded Demo-Daten, Asset-Imports und Fake-Konstanten werden komplett entfernt.

### 5. Template-Seeding Logik

Beim Laden einer Brand-Seite prueft ein `useEffect`:
- Gibt es bereits Templates fuer diesen Tenant + Brand in `social_templates`?
- Falls nein: 4 Default-Templates automatisch anlegen (mit den vordefinierten Texten)
- Falls ja: Aus DB laden und anzeigen

So hat jeder Tenant seine eigenen editierbaren Kopien.

### 6. Kampagnen-Seite: Template-Auswahl

In Schritt 2 der Kampagnenerstellung:
- Templates werden via `useQuery` aus `social_templates` geladen (nur aktive, passend zur gewaehlten Brand)
- Jedes Template wird als Vorschaukarte angezeigt (mit dem gespeicherten Bild, Text, CTA)
- Der User klickt Templates an/ab (Checkbox-Logik)
- Beim Beauftragen werden die gewaehlten Template-IDs an die Edge Function uebergeben

### 7. Dateiaenderungen Zusammenfassung

| Datei | Aktion |
|-------|--------|
| `src/manifests/routesManifest.ts` | MOD-10 Tiles: 1 → 5 |
| `src/pages/portal/lead-manager/LeadManagerKampagnen.tsx` | Neu: Kampagnen-Hauptseite |
| `src/pages/portal/lead-manager/LeadManagerBrand.tsx` | Neu: Brand-Content-Werkstatt |
| `src/pages/portal/lead-manager/LeadManagerProjekte.tsx` | Neu: Projekt-Templates |
| `src/pages/portal/lead-manager/TemplateCard.tsx` | Neu: Wiederverwendbare Template-Karte |
| `src/pages/portal/lead-manager/LeadManagerInline.tsx` | Entfernen (durch LeadManagerKampagnen ersetzt) |
| `src/pages/portal/lead-manager/LeadManagerPage.tsx` | Routing anpassen |
| `src/pages/portal/projekte/ProjekteLeadManager.tsx` | Auf neue Komponente verweisen |
| `src/assets/templates/*.jpg` | 4 Fake-Bilder entfernen |
| `artifacts/audit/zone2_modules.json` | MOD-10 tile_count: 1 → 5, total_tiles anpassen |
| DB-Migration | Lazy-Seeding-Logik oder Edge Function |

### 8. Umsetzungsreihenfolge

1. Manifest aktualisieren (5 Tiles)
2. `TemplateCard.tsx` bauen (wiederverwendbar)
3. `LeadManagerBrand.tsx` bauen (Templates laden/erstellen/bearbeiten)
4. `LeadManagerProjekte.tsx` bauen
5. `LeadManagerKampagnen.tsx` bauen (ohne Demo-Daten, nur echte DB-Abfragen)
6. `LeadManagerInline.tsx` und Fake-Assets entfernen
7. Routing in `LeadManagerPage.tsx` anpassen
8. Audit-Katalog aktualisieren

