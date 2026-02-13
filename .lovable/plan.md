

# UI-Korrektur: Einheitliches Scroll-Layout fuer MOD-21 + MOD-14

## Problem

Beide Module verletzen das systemweite "Golden Path Interaction Standard":

**MOD-21 (Website Builder):**
- Hat 4 separate Routen (Websites, Design, SEO, Vertrag) mit Subbar-Navigation
- User muss zwischen Tabs hin- und herklicken statt alles auf einer Seite zu sehen
- Kein Demo-Widget zur Orientierung

**MOD-14 (Recherche):**
- Grundstruktur ist korrekt (Widget-Grid + Inline-Flow)
- Aber: es fehlt `ModulePageHeader` mit CI-konformer Ueberschrift
- Es fehlt ein Demo-Widget als Orientierungshilfe
- Nutzt nicht `WidgetGrid`/`WidgetCell` aus dem Design-Manifest

---

## Ziel-Layout (beide Module identisch)

```text
┌──────────────────────────────────────────────┐
│  MODULNAME (UPPERCASE, bold, tracking-tight) │
│  Beschreibung in Muted                       │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐        │
│  │DEMO │  │Fall │  │Fall │  │ +   │        │
│  │(hart│  │  1  │  │  2  │  │Neu  │        │
│  │codet│  │     │  │     │  │     │        │
│  └─────┘  └─────┘  └─────┘  └─────┘        │
│                                              │
│  ─── Inline-Detail aktiver Fall ───          │
│  Design-Template / Branding                  │
│  SEO-Einstellungen                           │
│  Editor (Sections)                           │
│  Vertrag / Versionshistorie                  │
│  Publish-Button                              │
│                                              │
│  (alles scrollbar, kein Tab-Wechsel)         │
└──────────────────────────────────────────────┘
```

---

## MOD-21 Website Builder — Umbau

### Was sich aendert

| Vorher | Nachher |
|--------|---------|
| 4 Routen (Websites/Design/SEO/Vertrag) mit Subbar | 1 Seite, alles vertikal scrollbar |
| `WebsiteBuilderPage.tsx` mit Routes | Einfache Komponente ohne Routes |
| Separate WBDesign.tsx, WBSeo.tsx, WBVertrag.tsx | Inline-Sektionen im Hauptflow |
| Kein Demo-Widget | Erstes Widget = Demo (hartcodiert) |
| "+Neue Website" als Button | "+Neue Website" als WidgetCell im Grid |

### Neue Struktur von WebsiteBuilderPage.tsx

Eine einzige Seite mit:
1. `ModulePageHeader` — "WEBSITE BUILDER" + Beschreibung
2. `WidgetGrid` mit `WidgetCell`:
   - Position 0: **Demo-Widget** (hartcodiert, zeigt Beispiel-Website "Muster GmbH", Status "Demo", nicht editierbar, dient zur Orientierung)
   - Position 1-N: Echte Website-Widgets (Name, Status-Badge, Template-Name)
   - Letzte Position: **CTA-Widget "+Neue Website"**
3. Wenn ein Widget aktiv ist: Inline-Flow darunter mit allen Sektionen:
   - Sektion "Design" (Template-Picker + Branding-Felder, aus WBDesign.tsx extrahiert)
   - Sektion "SEO" (Meta-Daten, aus WBSeo.tsx extrahiert)
   - Sektion "Editor" (Section-Stack mit Live-Preview, aus WBEditor.tsx)
   - Sektion "Vertrag + Versionen" (Vertragsstatus + Versionshistorie, aus WBVertrag.tsx)
   - Publish-Bar (sticky oder am Ende)

### Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/WebsiteBuilderPage.tsx` | Komplett neu: Keine Routes mehr, eine scrollbare Seite mit WidgetGrid + Inline-Flow |
| `src/pages/portal/website-builder/WBWebsites.tsx` | Wird aufgeloest — Widget-Erstellung und Grid wandern in WebsiteBuilderPage |
| `src/pages/portal/website-builder/WBDesign.tsx` | Wird zu Inline-Sektion (exportiert als Komponente ohne eigene PageShell) |
| `src/pages/portal/website-builder/WBSeo.tsx` | Wird zu Inline-Sektion |
| `src/pages/portal/website-builder/WBVertrag.tsx` | Wird zu Inline-Sektion |
| `src/pages/portal/website-builder/WBEditor.tsx` | Bleibt als Kern-Komponente, wird inline eingebettet |
| `src/manifests/routesManifest.ts` | MOD-21 tiles entfernen, nur noch eine Route |

### Demo-Widget (hartcodiert)

```text
{
  name: "Muster GmbH",
  slug: "muster-gmbh",
  status: "demo",
  template: "Modern",
  description: "So sieht ein fertiger Website-Auftrag aus"
}
```

Klick auf Demo-Widget oeffnet den Inline-Flow mit vorausgefuellten Demo-Daten (alle Felder disabled), damit der User sieht, wie ein vollstaendiger Prozess aussieht.

---

## MOD-14 Recherche — Korrektur

### Was sich aendert

| Vorher | Nachher |
|--------|---------|
| Kein `ModulePageHeader` | CI-konformer Header "RECHERCHE" + Beschreibung |
| Ad-hoc Grid-Klassen | `WidgetGrid` + `WidgetCell` aus Design-Manifest |
| Kein Demo-Widget | Erstes Widget = Demo-Rechercheauftrag (hartcodiert) |

### Aenderungen an ResearchTab.tsx

1. `ModulePageHeader` hinzufuegen: Titel "RECHERCHE", Beschreibung "Asynchrone Lead-Engine — Rechercheauftraege anlegen, durchfuehren und Kontakte uebernehmen."
2. Grid umstellen auf `WidgetGrid` + `WidgetCell`
3. Demo-Widget als erstes Widget einfuegen:
   - Titel: "Demo: Hausverwaltungen NRW"
   - Status: "demo" (eigenes Badge)
   - Zeigt exemplarisch, wie ein abgeschlossener Auftrag aussieht
   - Klick oeffnet den Inline-Flow mit Demo-Daten (read-only)
4. ResearchOrderCreateWidget und ResearchOrderWidget in `WidgetCell` wrappen

---

## Auswirkung auf andere Module

Dieses Pattern muss spaeter auch auf alle anderen Service-Module angewendet werden. Dieser Schritt korrigiert nur MOD-21 und MOD-14 als Referenz-Implementierung.

